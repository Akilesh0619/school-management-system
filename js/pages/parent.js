/**
 * pages/parent.js
 * Parent dashboard (list of children) + child detail view + bootstrap.
 * Kept in one file since the parent role's surface area is small.
 */

function renderParentDashboard() {
  var el = document.querySelector('.view[data-view="dashboard"]');
  if (!el) return;
  var parent = Auth.currentProfile();
  if (!parent) return;

  var children = DB.query('students', function (s) { return s.parentId === parent.id; });
  var notices = DB.query('notices', function (n) { return n.targetRole === 'all' || n.targetRole === 'parent'; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 5);

  el.innerHTML = `
    <div class="grid grid-3 mb-2">
      ${children.length ? children.map(function (c) {
        var cls = DB.find('classes', c.classId);
        return `<div class="card"><div class="card-body text-center">
          ${UI.avatarHTML(c.name, c.photo, 'avatar-lg')}
          <h3 style="margin-top:.8rem; margin-bottom:.1rem;">${UI.escapeHTML(c.name)}</h3>
          <p class="text-sm text-soft" style="margin-bottom:.6rem;">${cls ? DB.classLabel(cls) : 'Unassigned class'}</p>
          ${UI.statusBadge(c.status)}
          <div class="mt-2"><button type="button" class="btn btn-primary btn-sm btn-block" data-child="${c.id}">${Icons.html('eye', 'icon-sm')} View details</button></div>
        </div></div>`;
      }).join('') : `<div class="col-span-12"><div class="card"><div class="empty">${Icons.html('family')}<p>No children linked to your account yet. Contact the school administrator.</p></div></div></div>`}
    </div>
    <div class="card"><div class="card-head"><h3>Notices</h3></div><div class="card-body">
      ${notices.length ? notices.map(function (n) {
        return `<div class="flex gap-2 mb-1 pb-1" style="border-bottom:1px solid var(--border-soft); align-items:flex-start;">
          <div class="stat-icon pine" style="width:36px;height:36px;">${Icons.html('notice', 'icon-sm')}</div>
          <div><div class="text-sm" style="font-weight:600;">${UI.escapeHTML(n.title)}</div><div class="text-xs text-soft">${UI.dateFmt(n.createdAt)}</div></div>
        </div>`;
      }).join('') : `<div class="empty">${Icons.html('notice')}<p>No notices.</p></div>`}
    </div></div>
  `;

  el.querySelectorAll('[data-child]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.go('#child/' + btn.getAttribute('data-child')); });
  });
}

function renderParentChildDetail(params) {
  var el = document.querySelector('.view[data-view="child"]');
  if (!el) return;
  var parent = Auth.currentProfile();
  var studentId = params && params[0] ? Number(params[0]) : null;
  var student = studentId ? DB.find('students', studentId) : null;

  if (!parent || !student || student.parentId !== parent.id) {
    el.innerHTML = `<div class="card"><div class="empty">${Icons.html('alert')}<p>That student isn't linked to your account.</p></div></div>`;
    return;
  }

  var cls = DB.find('classes', student.classId);
  var attendance = DB.query('attendanceDetails', function (d) { return d.studentId === student.id; });
  var present = attendance.filter(function (d) { return d.status === 'present'; }).length;
  var pct = attendance.length ? Math.round((present / attendance.length) * 1000) / 10 : 0;
  var marks = DB.query('marks', function (m) { return m.studentId === student.id; }).sort(function (a, b) { return new Date(b.enteredAt) - new Date(a.enteredAt); });
  var feeStructures = DB.query('feeStructures', function (f) { return f.classId == null || f.classId === student.classId; });
  var totalDue = feeStructures.reduce(function (s, f) { return s + Number(f.amount); }, 0);
  var payments = DB.query('payments', function (p) { return p.studentId === student.id; });
  var totalPaid = payments.reduce(function (s, p) { return s + Number(p.amountPaid); }, 0);
  var entries = student.classId ? DB.query('timetable', function (t) { return t.classId === student.classId; }) : [];
  var grid = {};
  entries.forEach(function (e) { grid[e.day + '-' + e.period] = e; });

  el.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <div class="flex gap-2 items-center">
        ${UI.avatarHTML(student.name, student.photo, 'avatar-md')}
        <div><h3 style="margin-bottom:.1rem;">${UI.escapeHTML(student.name)}</h3><p class="text-sm text-soft mb-0">${cls ? DB.classLabel(cls) : ''} &middot; ${student.admissionNo}</p></div>
      </div>
      <button type="button" class="btn btn-outline btn-sm" id="backToChildren">${Icons.html('arrowLeft', 'icon-sm')} Back</button>
    </div>
    <div class="grid grid-stats mb-2">
      <div class="stat-card"><div class="stat-icon pine">${Icons.html('attendance')}</div><div><div class="stat-value">${pct}%</div><div class="stat-label">Attendance</div></div></div>
      <div class="stat-card"><div class="stat-icon slate">${Icons.html('marks')}</div><div><div class="stat-value">${marks.length}</div><div class="stat-label">Exams recorded</div></div></div>
      <div class="stat-card"><div class="stat-icon gold">${Icons.html('wallet')}</div><div><div class="stat-value">${UI.currency(totalPaid)}</div><div class="stat-label">Fees paid</div></div></div>
      <div class="stat-card"><div class="stat-icon crimson">${Icons.html('cash')}</div><div><div class="stat-value">${UI.currency(Math.max(totalDue - totalPaid, 0))}</div><div class="stat-label">Fees pending</div></div></div>
    </div>
    <div class="grid grid-12">
      <div class="col-span-6">
        <div class="card"><div class="card-head"><h3>Marks</h3></div><div class="table-wrap"><table class="grid">
          <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
          <tbody>
            ${marks.length ? marks.map(function (m) {
              var exam = DB.find('exams', m.examId); var subj = DB.find('subjects', m.subjectId);
              return `<tr><td>${exam ? UI.escapeHTML(exam.name) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : '\u2014'}</td><td>${m.marksObtained}/${m.maxMarks}</td><td><span class="chip gold">${m.grade}</span></td></tr>`;
            }).join('') : `<tr><td colspan="4"><div class="empty">${Icons.html('marks')}<p>No marks recorded yet.</p></div></td></tr>`}
          </tbody>
        </table></div></div>
      </div>
      <div class="col-span-6">
        <div class="card"><div class="card-head"><h3>Weekly timetable</h3></div><div class="table-wrap"><table class="grid" style="text-align:center;">
          <thead><tr><th>P</th>${DB.DAYS.map(d => `<th>${d.slice(0, 3)}</th>`).join('')}</tr></thead>
          <tbody>
            ${[1, 2, 3, 4, 5].map(function (p) {
              return `<tr><td class="cell-primary">${p}</td>${DB.DAYS.map(function (d) {
                var slot = grid[d + '-' + p];
                var subj = slot ? DB.find('subjects', slot.subjectId) : null;
                return `<td>${subj ? `<span class="chip">${subj.code}</span>` : '<span class="text-soft">\u2014</span>'}</td>`;
              }).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table></div></div>
      </div>
    </div>
  `;

  document.getElementById('backToChildren').addEventListener('click', function () { UI.go('#dashboard'); });
}

(function () {
  DB.init();
  var user = Auth.requireRole('parent');
  if (!user) return;

  window.NAV_GROUPS = [
    { label: 'Overview', items: [{ view: 'dashboard', icon: 'dashboard', label: 'Dashboard' }] },
    { label: 'Account', items: [
      { view: 'profile', icon: 'profile', label: 'Profile' },
      { view: 'password', icon: 'lock', label: 'Change Password' }
    ] }
  ];

  Icons.hydrate();
  Shell.build(window.NAV_GROUPS);
  UI.initChrome();

  UI.registerView('dashboard', { title: 'Dashboard', subtitle: "Monitor your children's progress", render: renderParentDashboard });
  UI.registerView('child', { title: 'Child Detail', subtitle: '', render: renderParentChildDetail });
  UI.registerView('profile', { title: 'My Profile', subtitle: 'Manage your account details', render: renderProfileView });
  UI.registerView('password', { title: 'Change Password', subtitle: 'Update your account credentials', render: renderPasswordView });

  UI.initRouter('dashboard');
})();
