/**
 * pages/teacher-marks.js
 */
var _teachMarks = { examId: '', subjectId: '' };

function renderTeacherMarks() {
  var el = document.querySelector('.view[data-view="marks"]');
  if (!el) return;
  var teacher = Auth.currentProfile();
  if (!teacher) return;

  var exams = DB.all('exams').sort(function (a, b) { return b.examDate.localeCompare(a.examDate); });
  var mySubjects = DB.query('subjects', function (s) { return s.teacherId === teacher.id; });

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap; align-items:flex-end;">
        <div class="field mb-0" style="min-width:220px;"><label>Exam *</label><select class="input" id="tmExam">
          <option value="">\u2014 Select exam \u2014</option>
          ${exams.map(e => `<option value="${e.id}" ${String(_teachMarks.examId) === String(e.id) ? 'selected' : ''}>${UI.escapeHTML(e.name)} (${UI.capitalize(e.examType.replace('_', ' '))})</option>`).join('')}
        </select></div>
        <div class="field mb-0" style="min-width:200px;"><label>Subject *</label><select class="input" id="tmSubject">
          <option value="">\u2014 Select subject \u2014</option>
          ${mySubjects.map(s => `<option value="${s.id}" ${String(_teachMarks.subjectId) === String(s.id) ? 'selected' : ''}>${UI.escapeHTML(s.name)}</option>`).join('')}
        </select></div>
        <button type="button" class="btn btn-primary" id="tmLoadBtn">${Icons.html('search', 'icon-sm')} Load students</button>
      </div>
    </div></div>
    <div id="tmBody"></div>
  `;

  document.getElementById('tmLoadBtn').addEventListener('click', function () {
    _teachMarks.examId = document.getElementById('tmExam').value;
    _teachMarks.subjectId = document.getElementById('tmSubject').value;
    loadMarksRoster();
  });

  if (_teachMarks.examId && _teachMarks.subjectId) loadMarksRoster();
  else document.getElementById('tmBody').innerHTML = `<div class="card"><div class="empty">${Icons.html('marks')}<p>Select an exam and subject above to enter marks.</p></div></div>`;
}

function loadMarksRoster() {
  var body = document.getElementById('tmBody');
  if (!body) return;
  var subject = DB.find('subjects', _teachMarks.subjectId);
  if (!subject) { body.innerHTML = ''; return; }

  var students = subject.classId
    ? DB.query('students', function (s) { return s.classId === subject.classId && s.status === 'active'; })
    : DB.query('students', function (s) { return s.status === 'active'; });
  students.sort(function (a, b) { return a.name.localeCompare(b.name); });

  if (!students.length) {
    body.innerHTML = `<div class="card"><div class="empty">${Icons.html('students')}<p>No students found for this subject's class.</p></div></div>`;
    return;
  }

  var existingMarks = {};
  DB.query('marks', function (m) { return String(m.examId) === String(_teachMarks.examId) && String(m.subjectId) === String(_teachMarks.subjectId); })
    .forEach(function (m) { existingMarks[m.studentId] = m; });

  var anyExisting = students.map(function (s) { return existingMarks[s.id]; }).find(Boolean);
  var maxMarksDefault = anyExisting ? anyExisting.maxMarks : 100;

  body.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>${students.length} student(s)</h3>
        <div class="flex gap-2 items-center">
          <label class="text-sm mb-0">Max marks</label>
          <input class="input" id="tmMaxMarks" type="number" style="width:90px;" value="${maxMarksDefault}">
        </div>
      </div>
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Admission no.</th><th>Name</th><th style="width:160px;">Marks obtained</th><th>Grade</th></tr></thead>
        <tbody>
          ${students.map(function (s) {
            var m = existingMarks[s.id];
            return `<tr>
              <td>${UI.avatarHTML(s.name, s.photo, 'avatar-sm')}</td>
              <td class="cell-primary mono">${s.admissionNo}</td>
              <td>${UI.escapeHTML(s.name)}</td>
              <td><input class="input tm-marks-input" data-student="${s.id}" type="number" step="0.5" min="0" value="${m ? m.marksObtained : ''}"></td>
              <td class="tm-grade" data-student-grade="${s.id}">${m ? `<span class="chip gold">${m.grade}</span>` : '\u2014'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
      <div class="card-body">
        <button type="button" class="btn btn-primary" id="tmSaveBtn">${Icons.html('check', 'icon-sm')} Save marks</button>
      </div>
    </div>
  `;

  // live grade preview as marks are typed
  body.querySelectorAll('.tm-marks-input').forEach(function (input) {
    input.addEventListener('input', function () {
      var maxMarks = Number(document.getElementById('tmMaxMarks').value) || 100;
      var val = Number(input.value);
      var gradeCell = body.querySelector('[data-student-grade="' + input.getAttribute('data-student') + '"]');
      if (input.value === '' || isNaN(val)) { gradeCell.innerHTML = '\u2014'; return; }
      var pct = (val / maxMarks) * 100;
      gradeCell.innerHTML = `<span class="chip gold">${DB.calculateGrade(pct)}</span>`;
    });
  });

  document.getElementById('tmSaveBtn').addEventListener('click', function () {
    var maxMarks = Number(document.getElementById('tmMaxMarks').value) || 100;
    var savedCount = 0;
    students.forEach(function (s) {
      var input = body.querySelector('.tm-marks-input[data-student="' + s.id + '"]');
      if (input.value === '') return;
      var obtained = Number(input.value);
      var pct = (obtained / maxMarks) * 100;
      var grade = DB.calculateGrade(pct);
      var existing = existingMarks[s.id];
      if (existing) {
        DB.update('marks', existing.id, { marksObtained: obtained, maxMarks: maxMarks, grade: grade });
      } else {
        DB.insert('marks', {
          examId: Number(_teachMarks.examId), studentId: s.id, subjectId: Number(_teachMarks.subjectId),
          marksObtained: obtained, maxMarks: maxMarks, grade: grade, enteredAt: new Date().toISOString()
        });
      }
      savedCount++;
    });
    UI.toast(savedCount + ' mark(s) saved successfully.', 'success');
    loadMarksRoster();
  });
}
