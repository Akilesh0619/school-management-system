/**
 * pages/admin-marks.js
 */
var _marksFilterClass = '';

function renderAdminMarks() {
  var el = document.querySelector('.view[data-view="marks"]');
  if (!el) return;
  var classes = DB.all('classes');
  var exams = DB.all('exams').sort(function (a, b) { return b.examDate.localeCompare(a.examDate); });

  el.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-4">
        <div class="card mb-2"><div class="card-head"><h3>Create exam</h3></div><div class="card-body">
          <form id="examForm">
            <div class="field"><label>Exam name *</label><input class="input" id="ef-name" placeholder="e.g. Mid Semester 2026" required></div>
            <div class="field"><label>Exam type *</label><select class="input" id="ef-type" required>
              <option value="internal">Internal</option>
              <option value="model">Model Exam</option>
              <option value="mid_semester">Mid Semester</option>
              <option value="end_semester">End Semester</option>
            </select></div>
            <div class="field"><label>Class</label><select class="input" id="ef-class">
              <option value="">\u2014 Any \u2014</option>
              ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
            </select></div>
            <div class="field"><label>Academic year</label><input class="input" id="ef-year" value="2025-2026"></div>
            <div class="field"><label>Exam date</label><input class="input" type="date" id="ef-date"></div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.html('plus', 'icon-sm')} Create exam</button>
          </form>
        </div></div>
        <div class="card"><div class="card-head"><h3>Exams (${exams.length})</h3></div><div class="card-body" id="examList"></div></div>
      </div>
      <div class="col-span-8">
        <div class="card">
          <div class="card-head">
            <h3>Recorded marks</h3>
            <div class="flex gap-2">
              <select class="input" id="marksClassFilter" style="max-width:180px;">
                <option value="">All classes</option>
                ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
              </select>
              <button type="button" class="btn btn-outline btn-sm" id="marksExportBtn">${Icons.html('download', 'icon-sm')} CSV</button>
            </div>
          </div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Exam</th><th>Student</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
            <tbody id="marksTbody"></tbody>
          </table></div>
        </div>
      </div>
    </div>
  `;

  renderExamList(exams);

  document.getElementById('examForm').addEventListener('submit', function (e) {
    e.preventDefault();
    DB.insert('exams', {
      name: document.getElementById('ef-name').value.trim(),
      examType: document.getElementById('ef-type').value,
      classId: document.getElementById('ef-class').value ? Number(document.getElementById('ef-class').value) : null,
      academicYear: document.getElementById('ef-year').value.trim(),
      examDate: document.getElementById('ef-date').value || DB.todayISO()
    });
    UI.toast('Exam created.', 'success');
    renderAdminMarks();
  });

  document.getElementById('marksClassFilter').addEventListener('change', function (e) {
    _marksFilterClass = e.target.value;
    refreshMarksTable();
  });
  document.getElementById('marksExportBtn').addEventListener('click', exportMarksCSV);

  refreshMarksTable();
}

function renderExamList(exams) {
  var list = document.getElementById('examList');
  if (!list) return;
  list.innerHTML = exams.length ? exams.map(function (e) {
    return `<div class="flex justify-between items-center mb-1 pb-1" style="border-bottom:1px solid var(--border-soft);">
      <div><div class="text-sm" style="font-weight:600;">${UI.escapeHTML(e.name)}</div>
      <div class="text-xs text-soft">${UI.capitalize(e.examType.replace('_', ' '))} &middot; ${UI.dateFmt(e.examDate)}</div></div>
      <button type="button" class="btn btn-icon btn-ghost" data-del-exam="${e.id}">${Icons.html('trash', 'icon-sm')}</button>
    </div>`;
  }).join('') : `<div class="empty">${Icons.html('marks')}<p>No exams yet.</p></div>`;

  list.querySelectorAll('[data-del-exam]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-exam');
      UI.confirmDialog('Delete this exam? All marks recorded under it will also be removed.', { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) { if (!ok) return; DB.deleteExam(id); UI.toast('Exam deleted.', 'info'); renderAdminMarks(); });
    });
  });
}

function marksWithClassFilter() {
  var rows = DB.all('marks');
  if (_marksFilterClass) {
    rows = rows.filter(function (m) {
      var exam = DB.find('exams', m.examId);
      var stu = DB.find('students', m.studentId);
      return (exam && String(exam.classId) === String(_marksFilterClass)) || (stu && String(stu.classId) === String(_marksFilterClass));
    });
  }
  return rows.sort(function (a, b) { return new Date(b.enteredAt) - new Date(a.enteredAt); });
}

function refreshMarksTable() {
  var tbody = document.getElementById('marksTbody');
  if (!tbody) return;
  var rows = marksWithClassFilter().slice(0, 100);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty">${Icons.html('marks')}<p>No marks recorded yet.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(function (m) {
    var exam = DB.find('exams', m.examId);
    var student = DB.find('students', m.studentId);
    var subject = DB.find('subjects', m.subjectId);
    return `<tr>
      <td>${exam ? UI.escapeHTML(exam.name) : '\u2014'}</td>
      <td>${student ? UI.escapeHTML(student.name) : '\u2014'}</td>
      <td>${subject ? UI.escapeHTML(subject.name) : '\u2014'}</td>
      <td>${m.marksObtained}/${m.maxMarks}</td>
      <td><span class="chip gold">${m.grade || '\u2014'}</span></td>
    </tr>`;
  }).join('');
}

function exportMarksCSV() {
  var rows = marksWithClassFilter().map(function (m) {
    var exam = DB.find('exams', m.examId);
    var student = DB.find('students', m.studentId);
    var subject = DB.find('subjects', m.subjectId);
    return [exam ? exam.name : '', student ? student.admissionNo : '', student ? student.name : '', subject ? subject.name : '', m.marksObtained, m.maxMarks, m.grade];
  });
  UI.downloadCSV('marks_report.csv', ['Exam', 'Admission No', 'Student', 'Subject', 'Marks', 'Max Marks', 'Grade'], rows);
  UI.toast('Marks report downloaded.', 'success');
}
