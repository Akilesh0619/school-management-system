/**
 * pages/teacher-students.js
 */
function renderTeacherStudents() {
  var el = document.querySelector('.view[data-view="students"]');
  if (!el) return;
  var teacher = Auth.currentProfile();
  if (!teacher) return;

  var classIds = {};
  DB.query('subjects', function (s) { return s.teacherId === teacher.id; }).forEach(function (s) { if (s.classId) classIds[s.classId] = true; });
  DB.query('classes', function (c) { return c.classTeacherId === teacher.id; }).forEach(function (c) { classIds[c.id] = true; });
  var students = DB.query('students', function (s) { return classIds[s.classId]; }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="search-box">${Icons.html('search')}<input class="input" id="tsSearch" placeholder="Search students..."></div>
    </div></div>
    <div class="card">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Admission no.</th><th>Name</th><th>Class</th><th>Phone</th><th>Email</th></tr></thead>
        <tbody id="tsTbody">
          ${students.length ? students.map(function (s) {
            var cls = DB.find('classes', s.classId);
            return `<tr>
              <td>${UI.avatarHTML(s.name, s.photo, 'avatar-sm')}</td>
              <td class="cell-primary mono">${s.admissionNo}</td>
              <td>${UI.escapeHTML(s.name)}</td>
              <td>${cls ? DB.classLabel(cls) : '\u2014'}</td>
              <td>${UI.escapeHTML(s.phone || '\u2014')}</td>
              <td>${UI.escapeHTML(s.email || '\u2014')}</td>
            </tr>`;
          }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('students')}<p>No students assigned to your classes yet.</p></div></td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;

  document.getElementById('tsSearch').addEventListener('input', function (e) {
    var q = e.target.value.toLowerCase();
    document.querySelectorAll('#tsTbody tr').forEach(function (row) {
      row.style.display = row.textContent.toLowerCase().indexOf(q) === -1 ? 'none' : '';
    });
  });
}
