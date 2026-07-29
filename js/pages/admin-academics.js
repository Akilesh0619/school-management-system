/**
 * pages/admin-academics.js
 */
var _academicsTab = 'classes';

function renderAdminAcademics() {
  var el = document.querySelector('.view[data-view="academics"]');
  if (!el) return;

  el.innerHTML = `
    <div class="tabs">
      <button type="button" class="tab" data-tab="classes">Classes</button>
      <button type="button" class="tab" data-tab="subjects">Subjects</button>
    </div>
    <div id="academicsPanel"></div>
  `;

  el.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { _academicsTab = t.getAttribute('data-tab'); renderAcademicsPanel(); });
  });
  renderAcademicsPanel();
}

function renderAcademicsPanel() {
  var el = document.querySelector('.view[data-view="academics"]');
  if (!el) return;
  el.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === _academicsTab); });
  if (_academicsTab === 'classes') renderClassesPanel(); else renderSubjectsPanel();
}

function renderClassesPanel() {
  var panel = document.getElementById('academicsPanel');
  var classes = DB.all('classes');
  var teachers = DB.all('teachers');

  panel.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-4">
        <div class="card"><div class="card-head"><h3>Create class</h3></div><div class="card-body">
          <form id="classForm">
            <div class="field"><label>Class name *</label><input class="input" id="cf-name" placeholder="e.g. 10" required></div>
            <div class="field"><label>Section *</label><input class="input" id="cf-section" placeholder="e.g. A" required></div>
            <div class="field"><label>Academic year *</label><input class="input" id="cf-year" value="2025-2026" required></div>
            <div class="field"><label>Class teacher</label><select class="input" id="cf-teacher">
              <option value="">\u2014 None \u2014</option>
              ${teachers.map(t => `<option value="${t.id}">${UI.escapeHTML(t.name)}</option>`).join('')}
            </select></div>
            <div class="field"><label>Room no.</label><input class="input" id="cf-room"></div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.html('plus', 'icon-sm')} Create class</button>
          </form>
        </div></div>
      </div>
      <div class="col-span-8">
        <div class="card"><div class="card-head"><h3>All classes (${classes.length})</h3></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Class</th><th>Year</th><th>Class teacher</th><th>Room</th><th>Students</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              ${classes.length ? classes.map(function (c) {
                var t = DB.find('teachers', c.classTeacherId);
                var count = DB.query('students', function (s) { return s.classId === c.id; }).length;
                return `<tr>
                  <td class="cell-primary">${DB.classLabel(c)}</td>
                  <td>${c.academicYear}</td>
                  <td>${t ? UI.escapeHTML(t.name) : '\u2014'}</td>
                  <td>${c.roomNo || '\u2014'}</td>
                  <td><span class="chip">${count} students</span></td>
                  <td><div class="row-actions"><button type="button" class="btn btn-icon btn-ghost" data-del-class="${c.id}">${Icons.html('trash', 'icon-sm')}</button></div></td>
                </tr>`;
              }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('classes')}<p>No classes yet.</p></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('classForm').addEventListener('submit', function (e) {
    e.preventDefault();
    DB.insert('classes', {
      name: document.getElementById('cf-name').value.trim(),
      section: document.getElementById('cf-section').value.trim(),
      academicYear: document.getElementById('cf-year').value.trim(),
      classTeacherId: document.getElementById('cf-teacher').value ? Number(document.getElementById('cf-teacher').value) : null,
      roomNo: document.getElementById('cf-room').value.trim()
    });
    UI.toast('Class created.', 'success');
    renderClassesPanel();
  });

  panel.querySelectorAll('[data-del-class]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-class');
      UI.confirmDialog('Delete this class? Students in it will be unassigned rather than deleted.', { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) { if (!ok) return; DB.deleteClass(id); UI.toast('Class deleted.', 'info'); renderClassesPanel(); });
    });
  });
}

function renderSubjectsPanel() {
  var panel = document.getElementById('academicsPanel');
  var subjects = DB.all('subjects');
  var classes = DB.all('classes');
  var teachers = DB.all('teachers');

  panel.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-4">
        <div class="card"><div class="card-head"><h3>Create subject</h3></div><div class="card-body">
          <form id="subjectForm">
            <div class="field"><label>Subject name *</label><input class="input" id="sjf-name" placeholder="e.g. Mathematics" required></div>
            <div class="field"><label>Subject code *</label><input class="input" id="sjf-code" placeholder="e.g. MATH101" required></div>
            <div class="field"><label>Credits</label><input class="input" type="number" min="1" id="sjf-credits" value="1"></div>
            <div class="field"><label>Class</label><select class="input" id="sjf-class">
              <option value="">\u2014 Any \u2014</option>
              ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
            </select></div>
            <div class="field"><label>Teacher</label><select class="input" id="sjf-teacher">
              <option value="">\u2014 Unassigned \u2014</option>
              ${teachers.map(t => `<option value="${t.id}">${UI.escapeHTML(t.name)}</option>`).join('')}
            </select></div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.html('plus', 'icon-sm')} Create subject</button>
          </form>
        </div></div>
      </div>
      <div class="col-span-8">
        <div class="card"><div class="card-head"><h3>All subjects (${subjects.length})</h3></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Class</th><th>Teacher</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
              ${subjects.length ? subjects.map(function (s) {
                var cls = DB.find('classes', s.classId);
                var t = DB.find('teachers', s.teacherId);
                return `<tr>
                  <td class="cell-primary mono">${s.code}</td>
                  <td>${UI.escapeHTML(s.name)}</td>
                  <td>${s.credits}</td>
                  <td>${cls ? DB.classLabel(cls) : '\u2014'}</td>
                  <td>${t ? UI.escapeHTML(t.name) : '\u2014'}</td>
                  <td><div class="row-actions"><button type="button" class="btn btn-icon btn-ghost" data-del-subject="${s.id}">${Icons.html('trash', 'icon-sm')}</button></div></td>
                </tr>`;
              }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('subject')}<p>No subjects yet.</p></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('subjectForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = document.getElementById('sjf-code').value.trim();
    if (DB.query('subjects', function (s) { return s.code.toLowerCase() === code.toLowerCase(); }).length) {
      UI.toast('That subject code already exists.', 'error');
      return;
    }
    DB.insert('subjects', {
      name: document.getElementById('sjf-name').value.trim(),
      code: code,
      credits: Number(document.getElementById('sjf-credits').value) || 1,
      classId: document.getElementById('sjf-class').value ? Number(document.getElementById('sjf-class').value) : null,
      teacherId: document.getElementById('sjf-teacher').value ? Number(document.getElementById('sjf-teacher').value) : null
    });
    UI.toast('Subject created.', 'success');
    renderSubjectsPanel();
  });

  panel.querySelectorAll('[data-del-subject]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-subject');
      UI.confirmDialog('Delete this subject? Any marks recorded for it will also be removed.', { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) { if (!ok) return; DB.deleteSubject(id); UI.toast('Subject deleted.', 'info'); renderSubjectsPanel(); });
    });
  });
}
