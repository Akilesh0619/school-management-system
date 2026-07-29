/**
 * pages/teacher-attendance.js
 */
var _teachAtt = { classId: '', subjectId: '', date: null };

function renderTeacherAttendance() {
  var el = document.querySelector('.view[data-view="attendance"]');
  if (!el) return;
  var teacher = Auth.currentProfile();
  if (!teacher) return;
  if (!_teachAtt.date) _teachAtt.date = DB.todayISO();

  var classes = DB.all('classes');
  var mySubjects = DB.query('subjects', function (s) { return s.teacherId === teacher.id; });

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap; align-items:flex-end;">
        <div class="field mb-0" style="min-width:180px;"><label>Class *</label><select class="input" id="taClass">
          <option value="">\u2014 Select class \u2014</option>
          ${classes.map(c => `<option value="${c.id}" ${String(_teachAtt.classId) === String(c.id) ? 'selected' : ''}>${DB.classLabel(c)}</option>`).join('')}
        </select></div>
        <div class="field mb-0" style="min-width:180px;"><label>Subject</label><select class="input" id="taSubject">
          <option value="">\u2014 General \u2014</option>
          ${mySubjects.map(s => `<option value="${s.id}" ${String(_teachAtt.subjectId) === String(s.id) ? 'selected' : ''}>${UI.escapeHTML(s.name)}</option>`).join('')}
        </select></div>
        <div class="field mb-0"><label>Date *</label><input class="input" type="date" id="taDate" value="${_teachAtt.date}"></div>
        <button type="button" class="btn btn-primary" id="taLoadBtn">${Icons.html('search', 'icon-sm')} Load students</button>
      </div>
    </div></div>
    <div id="taBody"></div>
  `;

  document.getElementById('taLoadBtn').addEventListener('click', function () {
    _teachAtt.classId = document.getElementById('taClass').value;
    _teachAtt.subjectId = document.getElementById('taSubject').value;
    _teachAtt.date = document.getElementById('taDate').value || DB.todayISO();
    loadAttendanceRoster();
  });

  if (_teachAtt.classId) loadAttendanceRoster();
  else document.getElementById('taBody').innerHTML = `<div class="card"><div class="empty">${Icons.html('attendance')}<p>Select a class and date above to mark attendance.</p></div></div>`;
}

function loadAttendanceRoster() {
  var body = document.getElementById('taBody');
  if (!body) return;
  var students = DB.query('students', function (s) { return String(s.classId) === String(_teachAtt.classId) && s.status === 'active'; })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });

  if (!students.length) {
    body.innerHTML = `<div class="card"><div class="empty">${Icons.html('students')}<p>No active students found in this class.</p></div></div>`;
    return;
  }

  var existingSession = DB.query('attendance', function (a) {
    return String(a.classId) === String(_teachAtt.classId) &&
      String(a.subjectId || '') === String(_teachAtt.subjectId || '') &&
      a.date === _teachAtt.date;
  })[0];
  var existingDetails = {};
  if (existingSession) {
    DB.query('attendanceDetails', function (d) { return d.attendanceId === existingSession.id; }).forEach(function (d) { existingDetails[d.studentId] = d.status; });
  }

  body.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>${students.length} student(s)</h3>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-outline" id="markAllPresent">Mark all present</button>
          <button type="button" class="btn btn-sm btn-outline" id="markAllAbsent">Mark all absent</button>
        </div>
      </div>
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Admission no.</th><th>Name</th><th>Status</th></tr></thead>
        <tbody>
          ${students.map(function (s) {
            var current = existingDetails[s.id] || 'present';
            return `<tr data-student-row="${s.id}">
              <td>${UI.avatarHTML(s.name, s.photo, 'avatar-sm')}</td>
              <td class="cell-primary mono">${s.admissionNo}</td>
              <td>${UI.escapeHTML(s.name)}</td>
              <td><div class="status-picker" data-student="${s.id}">
                ${['present', 'absent', 'late', 'leave'].map(function (st) {
                  var id = 'st-' + s.id + '-' + st;
                  return `<input type="radio" name="status-${s.id}" id="${id}" value="${st}" ${current === st ? 'checked' : ''}>
                    <label for="${id}" class="st-${st}">${UI.capitalize(st)}</label>`;
                }).join('')}
              </div></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
      <div class="card-body">
        <button type="button" class="btn btn-primary" id="taSaveBtn">${Icons.html('check', 'icon-sm')} Save attendance</button>
      </div>
    </div>
  `;

  document.getElementById('markAllPresent').addEventListener('click', function () { setAllStatus('present'); });
  document.getElementById('markAllAbsent').addEventListener('click', function () { setAllStatus('absent'); });

  function setAllStatus(status) {
    students.forEach(function (s) {
      var input = document.getElementById('st-' + s.id + '-' + status);
      if (input) input.checked = true;
    });
  }

  document.getElementById('taSaveBtn').addEventListener('click', function () {
    var teacher = Auth.currentProfile();
    var session = existingSession;
    if (!session) {
      session = DB.insert('attendance', {
        classId: Number(_teachAtt.classId), subjectId: _teachAtt.subjectId ? Number(_teachAtt.subjectId) : null,
        date: _teachAtt.date, markedBy: teacher.id, createdAt: new Date().toISOString()
      });
    }
    students.forEach(function (s) {
      var checked = document.querySelector('input[name="status-' + s.id + '"]:checked');
      var status = checked ? checked.value : 'present';
      var existingDetail = DB.query('attendanceDetails', function (d) { return d.attendanceId === session.id && d.studentId === s.id; })[0];
      if (existingDetail) DB.update('attendanceDetails', existingDetail.id, { status: status });
      else DB.insert('attendanceDetails', { attendanceId: session.id, studentId: s.id, status: status });
    });
    UI.toast('Attendance saved successfully.', 'success');
    loadAttendanceRoster();
  });
}
