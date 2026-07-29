/**
 * pages/admin-dashboard.js
 */
function renderAdminDashboard() {
  var el = document.querySelector('.view[data-view="dashboard"]');
  if (!el) return;

  var students = DB.query('students', function (s) { return s.status === 'active'; });
  var teachers = DB.query('teachers', function (t) { return t.status === 'active'; });
  var classes = DB.all('classes');
  var payments = DB.all('payments');
  var feeStructures = DB.all('feeStructures');
  var notices = DB.all('notices').sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 5);

  var today = DB.todayISO();
  var todaySessions = DB.query('attendance', function (a) { return a.date === today; }).map(function (a) { return a.id; });
  var todayDetails = DB.query('attendanceDetails', function (d) { return todaySessions.indexOf(d.attendanceId) !== -1; });
  var todayPresent = todayDetails.filter(function (d) { return d.status === 'present'; }).length;
  var attendancePct = todayDetails.length ? Math.round((todayPresent / todayDetails.length) * 1000) / 10 : 0;

  var totalCollected = payments.reduce(function (s, p) { return s + Number(p.amountPaid); }, 0);
  // pending = sum over students of (applicable fee total - amount they've paid), floored at 0
  var pendingTotal = 0;
  students.forEach(function (stu) {
    var due = feeStructures.filter(function (f) { return f.classId == null || f.classId === stu.classId; })
      .reduce(function (s, f) { return s + Number(f.amount); }, 0);
    var paid = payments.filter(function (p) { return p.studentId === stu.id; }).reduce(function (s, p) { return s + Number(p.amountPaid); }, 0);
    pendingTotal += Math.max(due - paid, 0);
  });

  el.innerHTML =
    '<div class="grid grid-stats mb-2">' +
    statCard('pine', 'students', String(students.length), 'Total Students') +
    statCard('slate', 'teacher', String(teachers.length), 'Total Teachers') +
    statCard('gold', 'classes', String(classes.length), 'Total Classes') +
    statCard('pine', 'attendance', attendancePct + '%', "Today's Attendance") +
    statCard('gold', 'wallet', UI.currency(totalCollected), 'Fees Collected') +
    statCard('crimson', 'cash', UI.currency(pendingTotal), 'Pending Fees') +
    '</div>' +
    '<div class="grid grid-12">' +
    '<div class="col-span-8">' +
    '<div class="card mb-2"><div class="card-head"><h3>Weekly attendance trend</h3></div><div class="card-body"><div class="chart-box" id="chartAttendance"></div></div></div>' +
    '<div class="card"><div class="card-head"><h3>Fee collection &middot; last 6 months</h3></div><div class="card-body"><div class="chart-box" id="chartFees"></div></div></div>' +
    '</div>' +
    '<div class="col-span-4">' +
    '<div class="card mb-2"><div class="card-head"><h3>Students by class</h3></div><div class="card-body"><div class="chart-box" id="chartClasses"></div></div></div>' +
    '<div class="card"><div class="card-head"><h3>Recent notices</h3></div><div class="card-body" id="dashNotices"></div></div>' +
    '</div>' +
    '</div>';

  function statCard(color, icon, value, label) {
    return '<div class="stat-card"><div class="stat-icon ' + color + '">' + Icons.html(icon) + '</div>' +
      '<div><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div></div>';
  }

  // ---- attendance trend, last 7 days ----
  var labels = [], data = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var iso = d.toISOString().slice(0, 10);
    var sessions = DB.query('attendance', function (a) { return a.date === iso; }).map(function (a) { return a.id; });
    var details = DB.query('attendanceDetails', function (r) { return sessions.indexOf(r.attendanceId) !== -1; });
    var present = details.filter(function (r) { return r.status === 'present'; }).length;
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    data.push(details.length ? Math.round((present / details.length) * 1000) / 10 : 0);
  }
  UI.lineChart(document.getElementById('chartAttendance'), { labels: labels, data: data, max: 100, color: 'var(--pine)' });

  // ---- fee collection, last 6 months ----
  var feeLabels = [], feeData = [];
  var cursor = new Date();
  for (var m = 5; m >= 0; m--) {
    var dt = new Date(cursor.getFullYear(), cursor.getMonth() - m, 1);
    var y = dt.getFullYear(), mo = dt.getMonth();
    var sum = payments.filter(function (p) {
      var pd = new Date(p.paymentDate);
      return pd.getFullYear() === y && pd.getMonth() === mo;
    }).reduce(function (s, p) { return s + Number(p.amountPaid); }, 0);
    feeLabels.push(dt.toLocaleDateString('en-US', { month: 'short' }));
    feeData.push(sum);
  }
  UI.barChart(document.getElementById('chartFees'), { labels: feeLabels, data: feeData, color: 'var(--gold)', valueFormat: UI.currency });

  // ---- students by class, donut ----
  var segs = classes.map(function (c, i) {
    return { label: c.name + '-' + c.section, value: DB.query('students', function (s) { return s.classId === c.id; }).length, color: UI.PALETTE[i % UI.PALETTE.length] };
  }).filter(function (s) { return s.value > 0; });
  if (segs.length) {
    UI.donutChart(document.getElementById('chartClasses'), segs, { centerLabel: 'students' });
  } else {
    document.getElementById('chartClasses').innerHTML = '<div class="empty">' + Icons.html('students') + '<p>No students yet.</p></div>';
  }

  // ---- recent notices ----
  var noticesEl = document.getElementById('dashNotices');
  if (notices.length) {
    noticesEl.innerHTML = notices.map(function (n) {
      return '<div class="flex gap-2 mb-2" style="align-items:flex-start;">' +
        '<div class="stat-icon pine" style="width:34px;height:34px;">' + Icons.html('notice', 'icon-sm') + '</div>' +
        '<div><div class="text-sm" style="font-weight:600;">' + UI.escapeHTML(n.title) + '</div>' +
        '<div class="text-xs text-soft">' + UI.dateFmt(n.createdAt) + ' &middot; ' + UI.capitalize(n.targetRole) + '</div></div></div>';
    }).join('');
  } else {
    noticesEl.innerHTML = '<div class="empty">' + Icons.html('notice') + '<p>No notices posted yet.</p></div>';
  }
}
