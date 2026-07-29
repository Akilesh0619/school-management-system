/**
 * pages/student-dashboard.js
 */
function renderStudentDashboard() {
  var el = document.querySelector('.view[data-view="dashboard"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;
  var cls = DB.find('classes', student.classId);

  var attendance = DB.query('attendanceDetails', function (d) { return d.studentId === student.id; });
  var present = attendance.filter(function (d) { return d.status === 'present'; }).length;
  var attendancePct = attendance.length ? Math.round((present / attendance.length) * 1000) / 10 : 0;

  var marks = DB.query('marks', function (m) { return m.studentId === student.id; }).sort(function (a, b) { return new Date(b.enteredAt) - new Date(a.enteredAt); });
  var recentMarks = marks.slice(0, 5);

  var feeStructures = DB.query('feeStructures', function (f) { return f.classId == null || f.classId === student.classId; });
  var totalDue = feeStructures.reduce(function (s, f) { return s + Number(f.amount); }, 0);
  var payments = DB.query('payments', function (p) { return p.studentId === student.id; });
  var totalPaid = payments.reduce(function (s, p) { return s + Number(p.amountPaid); }, 0);
  var pending = Math.max(totalDue - totalPaid, 0);

  var notices = DB.query('notices', function (n) { return n.targetRole === 'all' || n.targetRole === 'student'; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 5);

  var timetableEntries = student.classId ? DB.query('timetable', function (t) { return t.classId === student.classId; }) : [];

  el.innerHTML = `
    <div class="grid grid-stats mb-2">
      <div class="stat-card"><div class="stat-icon pine">${Icons.html('attendance')}</div><div><div class="stat-value">${attendancePct}%</div><div class="stat-label">Attendance</div></div></div>
      <div class="stat-card"><div class="stat-icon slate">${Icons.html('marks')}</div><div><div class="stat-value">${recentMarks.length}</div><div class="stat-label">Recent exams</div></div></div>
      <div class="stat-card"><div class="stat-icon gold">${Icons.html('wallet')}</div><div><div class="stat-value">${UI.currency(totalPaid)}</div><div class="stat-label">Fees paid</div></div></div>
      <div class="stat-card"><div class="stat-icon crimson">${Icons.html('cash')}</div><div><div class="stat-value">${UI.currency(pending)}</div><div class="stat-label">Fees pending</div></div></div>
    </div>
    <div class="grid grid-12">
      <div class="col-span-7">
        <div class="card mb-2"><div class="card-head"><h3>Recent marks</h3><button type="button" class="btn btn-sm btn-outline" data-view="marks">View all</button></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
            <tbody>
              ${recentMarks.length ? recentMarks.map(function (m) {
                var exam = DB.find('exams', m.examId); var subj = DB.find('subjects', m.subjectId);
                return `<tr><td>${exam ? UI.escapeHTML(exam.name) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : '\u2014'}</td><td>${m.marksObtained}/${m.maxMarks}</td><td><span class="chip gold">${m.grade}</span></td></tr>`;
              }).join('') : `<tr><td colspan="4"><div class="empty">${Icons.html('marks')}<p>No marks recorded yet.</p></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
        <div class="card"><div class="card-head"><h3>This week's timetable</h3></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Day</th><th>Periods</th></tr></thead>
            <tbody>
              ${DB.DAYS.map(function (d) {
                var entries = timetableEntries.filter(function (t) { return t.day === d; }).sort(function (a, b) { return a.period - b.period; });
                return `<tr><td class="cell-primary">${d}</td><td>${entries.length ? entries.map(function (e) {
                  var subj = DB.find('subjects', e.subjectId);
                  return `<span class="chip mb-1">P${e.period}: ${subj ? UI.escapeHTML(subj.name) : 'Free'}</span>`;
                }).join(' ') : '<span class="text-soft text-sm">No classes</span>'}</td></tr>`;
              }).join('')}
            </tbody>
          </table></div>
        </div>
      </div>
      <div class="col-span-5">
        <div class="card mb-2"><div class="card-body text-center">
          ${UI.avatarHTML(student.name, student.photo, 'avatar-lg')}
          <h3 style="margin-top:.8rem; margin-bottom:.1rem;">${UI.escapeHTML(student.name)}</h3>
          <p class="text-sm text-soft" style="margin-bottom:.8rem;">${cls ? DB.classLabel(cls) : 'Unassigned class'}</p>
          <button type="button" class="btn btn-outline btn-sm" data-view="reportcard">${Icons.html('fileText', 'icon-sm')} Download report card</button>
        </div></div>
        <div class="card"><div class="card-head"><h3>Notices</h3><button type="button" class="btn btn-sm btn-outline" data-view="notices">View all</button></div>
          <div class="card-body">
            ${notices.length ? notices.map(function (n) {
              return `<div class="mb-1 pb-1" style="border-bottom:1px solid var(--border-soft);"><div class="text-sm" style="font-weight:600;">${UI.escapeHTML(n.title)}</div><div class="text-xs text-soft">${UI.dateFmt(n.createdAt)}</div></div>`;
            }).join('') : `<div class="empty">${Icons.html('notice')}<p>No notices.</p></div>`}
          </div>
        </div>
      </div>
    </div>
  `;

  el.querySelectorAll('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.go('#' + btn.getAttribute('data-view')); });
  });
}
