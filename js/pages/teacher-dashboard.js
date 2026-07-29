/**
 * pages/teacher-dashboard.js
 */
function renderTeacherDashboard() {
  var el = document.querySelector('.view[data-view="dashboard"]');
  if (!el) return;
  var teacher = Auth.currentProfile();
  if (!teacher) return;

  var todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  var todayClasses = DB.query('timetable', function (t) { return t.teacherId === teacher.id && t.day === todayName; })
    .sort(function (a, b) { return a.period - b.period; });
  var mySubjects = DB.query('subjects', function (s) { return s.teacherId === teacher.id; });
  var classIds = {};
  mySubjects.forEach(function (s) { if (s.classId) classIds[s.classId] = true; });
  DB.query('classes', function (c) { return c.classTeacherId === teacher.id; }).forEach(function (c) { classIds[c.id] = true; });
  var studentCount = DB.query('students', function (s) { return classIds[s.classId]; }).length;
  var notices = DB.query('notices', function (n) { return n.targetRole === 'all' || n.targetRole === 'teacher'; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 5);

  el.innerHTML = `
    <div class="grid grid-stats mb-2">
      <div class="stat-card"><div class="stat-icon pine">${Icons.html('calendar')}</div><div><div class="stat-value">${todayClasses.length}</div><div class="stat-label">Today's classes</div></div></div>
      <div class="stat-card"><div class="stat-icon slate">${Icons.html('subject')}</div><div><div class="stat-value">${mySubjects.length}</div><div class="stat-label">Subjects assigned</div></div></div>
      <div class="stat-card"><div class="stat-icon gold">${Icons.html('students')}</div><div><div class="stat-value">${studentCount}</div><div class="stat-label">Total students</div></div></div>
      <div class="stat-card"><div class="stat-icon crimson">${Icons.html('briefcase')}</div><div><div class="stat-value">${teacher.experienceYears}</div><div class="stat-label">Years experience</div></div></div>
    </div>
    <div class="grid grid-12">
      <div class="col-span-7">
        <div class="card mb-2"><div class="card-head"><h3>Today's classes (${todayName})</h3></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th></tr></thead>
            <tbody>
              ${todayClasses.length ? todayClasses.map(function (t) {
                var cls = DB.find('classes', t.classId);
                var subj = DB.find('subjects', t.subjectId);
                return `<tr><td class="cell-primary">${t.period}</td><td>${t.startTime || '\u2014'} &ndash; ${t.endTime || '\u2014'}</td><td>${cls ? DB.classLabel(cls) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : '\u2014'}</td></tr>`;
              }).join('') : `<tr><td colspan="4"><div class="empty">${Icons.html('calendar')}<p>No classes scheduled today.</p></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
        <div class="card"><div class="card-head"><h3>Quick actions</h3></div><div class="card-body flex gap-2" style="flex-wrap:wrap;">
          <button type="button" class="btn btn-outline" data-view="attendance">${Icons.html('attendance', 'icon-sm')} Mark attendance</button>
          <button type="button" class="btn btn-outline" data-view="marks">${Icons.html('marks', 'icon-sm')} Enter marks</button>
          <button type="button" class="btn btn-outline" data-view="students">${Icons.html('students', 'icon-sm')} View students</button>
        </div></div>
      </div>
      <div class="col-span-5">
        <div class="card mb-2"><div class="card-head"><h3>My subjects</h3></div><div class="card-body">
          ${mySubjects.length ? mySubjects.map(function (s) {
            var cls = DB.find('classes', s.classId);
            return `<div class="flex justify-between items-center mb-1 pb-1" style="border-bottom:1px solid var(--border-soft);">
              <div><div class="text-sm" style="font-weight:600;">${UI.escapeHTML(s.name)}</div><div class="text-xs text-soft">${s.code} &middot; ${cls ? DB.classLabel(cls) : 'All classes'}</div></div>
              <span class="chip">${s.credits} cr</span>
            </div>`;
          }).join('') : `<div class="empty">${Icons.html('subject')}<p>No subjects assigned yet.</p></div>`}
        </div></div>
        <div class="card"><div class="card-head"><h3>Notices</h3></div><div class="card-body">
          ${notices.length ? notices.map(function (n) {
            return `<div class="mb-1 pb-1" style="border-bottom:1px solid var(--border-soft);"><div class="text-sm" style="font-weight:600;">${UI.escapeHTML(n.title)}</div><div class="text-xs text-soft">${UI.dateFmt(n.createdAt)}</div></div>`;
          }).join('') : `<div class="empty">${Icons.html('notice')}<p>No notices.</p></div>`}
        </div></div>
      </div>
    </div>
  `;

  el.querySelectorAll('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.go('#' + btn.getAttribute('data-view')); });
  });
}
