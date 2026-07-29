/**
 * pages/admin-attendance.js
 */
var _attState = { classId: '', from: '', to: '' };

function renderAdminAttendance() {
  var el = document.querySelector('.view[data-view="attendance"]');
  if (!el) return;
  var classes = DB.all('classes');

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap; align-items:flex-end;">
        <div class="field mb-0" style="min-width:180px;"><label>Class</label><select class="input" id="attClass">
          <option value="">All classes</option>
          ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
        </select></div>
        <div class="field mb-0"><label>From</label><input class="input" type="date" id="attFrom"></div>
        <div class="field mb-0"><label>To</label><input class="input" type="date" id="attTo"></div>
        <button type="button" class="btn btn-secondary" id="attFilterBtn">${Icons.html('filter', 'icon-sm')} Filter</button>
        <button type="button" class="btn btn-outline" id="attExportBtn">${Icons.html('download', 'icon-sm')} Export CSV</button>
      </div>
    </div></div>
    <div class="card">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th>Date</th><th>Class</th><th>Marked by</th><th>Present</th><th>Absent</th><th>Late</th><th>Leave</th></tr></thead>
        <tbody id="attTbody"></tbody>
      </table></div>
    </div>
  `;

  document.getElementById('attFilterBtn').addEventListener('click', function () {
    _attState.classId = document.getElementById('attClass').value;
    _attState.from = document.getElementById('attFrom').value;
    _attState.to = document.getElementById('attTo').value;
    refreshAttendanceTable();
  });
  document.getElementById('attExportBtn').addEventListener('click', exportAttendanceCSV);

  refreshAttendanceTable();
}

function filteredAttendanceSessions() {
  return DB.all('attendance').filter(function (a) {
    if (_attState.classId && String(a.classId) !== String(_attState.classId)) return false;
    if (_attState.from && a.date < _attState.from) return false;
    if (_attState.to && a.date > _attState.to) return false;
    return true;
  }).sort(function (a, b) { return b.date.localeCompare(a.date); });
}

function refreshAttendanceTable() {
  var tbody = document.getElementById('attTbody');
  if (!tbody) return;
  var sessions = filteredAttendanceSessions().slice(0, 60);

  if (!sessions.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">${Icons.html('attendance')}<p>No attendance sessions found.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = sessions.map(function (s) {
    var details = DB.query('attendanceDetails', function (d) { return d.attendanceId === s.id; });
    var counts = { present: 0, absent: 0, late: 0, leave: 0 };
    details.forEach(function (d) { counts[d.status] = (counts[d.status] || 0) + 1; });
    var cls = DB.find('classes', s.classId);
    var teacher = DB.find('teachers', s.markedBy);
    return `<tr>
      <td>${UI.dateFmt(s.date)}</td>
      <td>${cls ? DB.classLabel(cls) : '\u2014'}</td>
      <td>${teacher ? UI.escapeHTML(teacher.name) : '\u2014'}</td>
      <td><span class="badge badge-present">${counts.present}</span></td>
      <td><span class="badge badge-absent">${counts.absent}</span></td>
      <td><span class="badge badge-late">${counts.late}</span></td>
      <td><span class="badge badge-leave">${counts.leave}</span></td>
    </tr>`;
  }).join('');
}

function exportAttendanceCSV() {
  var sessions = filteredAttendanceSessions();
  var rows = [];
  sessions.forEach(function (s) {
    var cls = DB.find('classes', s.classId);
    DB.query('attendanceDetails', function (d) { return d.attendanceId === s.id; }).forEach(function (d) {
      var stu = DB.find('students', d.studentId);
      rows.push([s.date, cls ? DB.classLabel(cls) : '', stu ? stu.admissionNo : '', stu ? stu.name : '', d.status]);
    });
  });
  UI.downloadCSV('attendance_report.csv', ['Date', 'Class', 'Admission No', 'Student Name', 'Status'], rows);
  UI.toast('Attendance report downloaded.', 'success');
}
