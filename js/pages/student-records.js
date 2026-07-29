/**
 * pages/student-records.js
 * The remaining read-only student views, grouped in one file since each is
 * small: attendance history, marks/CGPA, printable report card, fees,
 * timetable, notices.
 */

function renderStudentAttendance() {
  var el = document.querySelector('.view[data-view="attendance"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;

  var records = DB.query('attendanceDetails', function (d) { return d.studentId === student.id; })
    .map(function (d) { return { detail: d, session: DB.find('attendance', d.attendanceId) }; })
    .filter(function (r) { return r.session; })
    .sort(function (a, b) { return b.session.date.localeCompare(a.session.date); });

  var counts = { present: 0, absent: 0, late: 0, leave: 0 };
  records.forEach(function (r) { counts[r.detail.status] = (counts[r.detail.status] || 0) + 1; });
  var pct = records.length ? Math.round((counts.present / records.length) * 1000) / 10 : 0;

  el.innerHTML = `
    <div class="grid grid-stats mb-2">
      <div class="stat-card"><div class="stat-icon pine">${Icons.html('attendance')}</div><div><div class="stat-value">${pct}%</div><div class="stat-label">Overall</div></div></div>
      <div class="stat-card"><div class="stat-icon pine">${Icons.html('checkCircle')}</div><div><div class="stat-value">${counts.present}</div><div class="stat-label">Present</div></div></div>
      <div class="stat-card"><div class="stat-icon crimson">${Icons.html('x')}</div><div><div class="stat-value">${counts.absent}</div><div class="stat-label">Absent</div></div></div>
      <div class="stat-card"><div class="stat-icon gold">${Icons.html('calendar')}</div><div><div class="stat-value">${counts.late}</div><div class="stat-label">Late</div></div></div>
    </div>
    <div class="card"><div class="table-wrap"><table class="grid">
      <thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Status</th></tr></thead>
      <tbody>
        ${records.length ? records.map(function (r) {
          var cls = DB.find('classes', r.session.classId);
          var subj = DB.find('subjects', r.session.subjectId);
          return `<tr><td>${UI.dateFmt(r.session.date)}</td><td>${cls ? DB.classLabel(cls) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : 'General'}</td><td>${UI.statusBadge(r.detail.status)}</td></tr>`;
        }).join('') : `<tr><td colspan="4"><div class="empty">${Icons.html('attendance')}<p>No attendance records yet.</p></div></td></tr>`}
      </tbody>
    </table></div></div>
  `;
}

function studentMarksAndCgpa(student) {
  var marks = DB.query('marks', function (m) { return m.studentId === student.id; }).sort(function (a, b) { return new Date(b.enteredAt) - new Date(a.enteredAt); });
  var cgpa = marks.length ? Math.round((marks.reduce(function (s, m) { return s + DB.gradePoint(m.grade); }, 0) / marks.length) * 100) / 100 : 0;
  return { marks: marks, cgpa: cgpa };
}

function renderStudentMarks() {
  var el = document.querySelector('.view[data-view="marks"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;
  var data = studentMarksAndCgpa(student);

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body flex justify-between items-center">
      <div><div class="eyebrow">Cumulative</div><div class="stat-value">${data.cgpa} / 10</div></div>
      <div class="stat-icon gold">${Icons.html('marks')}</div>
    </div></div>
    <div class="card"><div class="table-wrap"><table class="grid">
      <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
      <tbody>
        ${data.marks.length ? data.marks.map(function (m) {
          var exam = DB.find('exams', m.examId); var subj = DB.find('subjects', m.subjectId);
          var pct = Math.round((m.marksObtained / m.maxMarks) * 10000) / 100;
          return `<tr><td>${exam ? UI.escapeHTML(exam.name) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : '\u2014'}</td><td>${m.marksObtained} / ${m.maxMarks}</td><td>${pct}%</td><td><span class="chip gold">${m.grade}</span></td></tr>`;
        }).join('') : `<tr><td colspan="5"><div class="empty">${Icons.html('marks')}<p>No marks recorded yet.</p></div></td></tr>`}
      </tbody>
    </table></div></div>
  `;
}

function renderStudentReportCard() {
  var el = document.querySelector('.view[data-view="reportcard"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;
  var cls = DB.find('classes', student.classId);
  var data = studentMarksAndCgpa(student);

  el.innerHTML = `
    <div class="flex justify-between items-center mb-2 no-print">
      <div></div>
      <button type="button" class="btn btn-primary" id="rcPrintBtn">${Icons.html('printer', 'icon-sm')} Print / Save as PDF</button>
    </div>
    <div class="card"><div class="card-body">
      <div class="flex justify-between items-center mb-2" style="border-bottom:1px solid var(--border); padding-bottom:1rem;">
        <div><h3 style="margin-bottom:.1rem;">${Icons.html('graduation', 'icon-sm')} Meridian School</h3><p class="text-xs text-soft">Academic Report Card</p></div>
        ${UI.avatarHTML(student.name, student.photo, 'avatar-md')}
      </div>
      <div class="grid grid-3 mb-2">
        <div><span class="text-xs text-soft">Student name</span><div class="cell-primary">${UI.escapeHTML(student.name)}</div></div>
        <div><span class="text-xs text-soft">Admission no.</span><div class="cell-primary mono">${student.admissionNo}</div></div>
        <div><span class="text-xs text-soft">Class</span><div class="cell-primary">${cls ? DB.classLabel(cls) : '\u2014'}</div></div>
      </div>
      <table class="grid">
        <thead><tr><th>Exam</th><th>Subject</th><th>Marks obtained</th><th>Max marks</th><th>Percentage</th><th>Grade</th></tr></thead>
        <tbody>
          ${data.marks.length ? data.marks.map(function (m) {
            var exam = DB.find('exams', m.examId); var subj = DB.find('subjects', m.subjectId);
            var pct = Math.round((m.marksObtained / m.maxMarks) * 10000) / 100;
            return `<tr><td>${exam ? UI.escapeHTML(exam.name) : '\u2014'}</td><td>${subj ? UI.escapeHTML(subj.name) : '\u2014'}</td><td>${m.marksObtained}</td><td>${m.maxMarks}</td><td>${pct}%</td><td class="cell-primary">${m.grade}</td></tr>`;
          }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('marks')}<p>No marks recorded yet.</p></div></td></tr>`}
        </tbody>
      </table>
      <div class="card mt-2" style="max-width:260px;"><div class="card-body">
        <span class="text-xs text-soft">Overall CGPA</span><div class="stat-value">${data.cgpa} / 10</div>
      </div></div>
      <p class="text-xs text-soft text-center mt-2">This is a system-generated report card issued by Meridian School.</p>
    </div></div>
  `;

  document.getElementById('rcPrintBtn').addEventListener('click', function () { window.print(); });
}

function renderStudentFees() {
  var el = document.querySelector('.view[data-view="fees"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;

  var feeStructures = DB.query('feeStructures', function (f) { return f.classId == null || f.classId === student.classId; });
  var payments = DB.query('payments', function (p) { return p.studentId === student.id; }).sort(function (a, b) { return new Date(b.paymentDate) - new Date(a.paymentDate); });

  el.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-5">
        <div class="card"><div class="card-head"><h3>Applicable fee structure</h3></div><div class="table-wrap"><table class="grid">
          <thead><tr><th>Type</th><th>Amount</th><th>Due date</th></tr></thead>
          <tbody>
            ${feeStructures.length ? feeStructures.map(function (f) {
              return `<tr><td>${UI.escapeHTML(f.feeType)}</td><td>${UI.currency(f.amount)}</td><td>${f.dueDate ? UI.dateFmt(f.dueDate) : '\u2014'}</td></tr>`;
            }).join('') : `<tr><td colspan="3"><div class="empty">${Icons.html('fees')}<p>No fee structure set.</p></div></td></tr>`}
          </tbody>
        </table></div></div>
      </div>
      <div class="col-span-7">
        <div class="card"><div class="card-head"><h3>Payment history</h3></div><div class="table-wrap"><table class="grid">
          <thead><tr><th>Receipt</th><th>Fee type</th><th>Amount</th><th>Mode</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${payments.length ? payments.map(function (p) {
              var fee = DB.find('feeStructures', p.feeStructureId);
              return `<tr><td class="mono">${p.receiptNo}</td><td>${fee ? UI.escapeHTML(fee.feeType) : '\u2014'}</td><td>${UI.currency(p.amountPaid)}</td><td>${p.paymentMode.toUpperCase()}</td><td>${UI.dateFmt(p.paymentDate)}</td><td>${UI.statusBadge(p.status)}</td></tr>`;
            }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('cash')}<p>No payments recorded yet.</p></div></td></tr>`}
          </tbody>
        </table></div></div>
      </div>
    </div>
  `;
}

function renderStudentTimetable() {
  var el = document.querySelector('.view[data-view="timetable"]');
  if (!el) return;
  var student = Auth.currentProfile();
  if (!student) return;
  var entries = student.classId ? DB.query('timetable', function (t) { return t.classId === student.classId; }) : [];
  var grid = {};
  entries.forEach(function (e) { grid[e.day + '-' + e.period] = e; });

  el.innerHTML = `
    <div class="card"><div class="table-wrap"><table class="grid" style="text-align:center;">
      <thead><tr><th>Period</th>${DB.DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
      <tbody>
        ${[1, 2, 3, 4, 5].map(function (p) {
          return `<tr><td class="cell-primary">${p}</td>${DB.DAYS.map(function (d) {
            var slot = grid[d + '-' + p];
            if (slot) {
              var subj = DB.find('subjects', slot.subjectId);
              var teacher = DB.find('teachers', slot.teacherId);
              return `<td><div class="chip" style="width:100%; justify-content:center;">${subj ? UI.escapeHTML(subj.name) : 'Free'}</div><div class="text-xs text-soft mt-1">${teacher ? UI.escapeHTML(teacher.name) : ''}</div></td>`;
            }
            return `<td><span class="text-soft">\u2014</span></td>`;
          }).join('')}</tr>`;
        }).join('')}
      </tbody>
    </table></div></div>
  `;
}

function renderStudentNotices() {
  var el = document.querySelector('.view[data-view="notices"]');
  if (!el) return;
  var notices = DB.query('notices', function (n) { return n.targetRole === 'all' || n.targetRole === 'student'; })
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  el.innerHTML = `<div class="card"><div class="card-body">
    ${notices.length ? notices.map(function (n) {
      return `<div class="flex gap-2 mb-2 pb-2" style="border-bottom:1px solid var(--border-soft); align-items:flex-start;">
        <div class="stat-icon pine" style="width:40px;height:40px;">${Icons.html('notice', 'icon-sm')}</div>
        <div><div style="font-weight:600;">${UI.escapeHTML(n.title)}</div><p class="text-sm" style="margin:.2rem 0;">${UI.escapeHTML(n.content)}</p><span class="text-xs text-soft">${UI.dateTimeFmt(n.createdAt)}</span></div>
      </div>`;
    }).join('') : `<div class="empty">${Icons.html('notice')}<p>No notices posted yet.</p></div>`}
  </div></div>`;
}
