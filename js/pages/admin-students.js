/**
 * pages/admin-students.js
 */
var _studentsState = { page: 1, q: '', classId: '' };

function renderAdminStudents() {
  var el = document.querySelector('.view[data-view="students"]');
  if (!el) return;
  var classes = DB.all('classes');

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap;">
        <div class="search-box" style="flex:1; min-width:220px;">
          ${Icons.html('search')}
          <input class="input" id="stuSearch" placeholder="Search by name or admission no.">
        </div>
        <select class="input" id="stuClassFilter" style="max-width:200px;">
          <option value="">All classes</option>
          ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-primary" id="stuAddBtn">${Icons.html('plus', 'icon-sm')} Add student</button>
      </div>
    </div></div>
    <div class="card">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Admission no.</th><th>Name</th><th>Class</th><th>Phone</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
        <tbody id="stuTbody"></tbody>
      </table></div>
      <div id="stuPagerWrap" class="card-body" style="padding-top:0;"></div>
    </div>
  `;

  document.getElementById('stuSearch').addEventListener('input', debounce(function (e) {
    _studentsState.q = e.target.value; _studentsState.page = 1; refreshStudentsTable();
  }, 200));
  document.getElementById('stuClassFilter').addEventListener('change', function (e) {
    _studentsState.classId = e.target.value; _studentsState.page = 1; refreshStudentsTable();
  });
  document.getElementById('stuAddBtn').addEventListener('click', function () { openStudentModal(null); });

  refreshStudentsTable();
}

function refreshStudentsTable() {
  var tbody = document.getElementById('stuTbody');
  if (!tbody) return;
  var q = _studentsState.q.trim().toLowerCase();
  var classId = _studentsState.classId;

  var rows = DB.all('students').filter(function (s) {
    if (classId && String(s.classId) !== String(classId)) return false;
    if (q && s.name.toLowerCase().indexOf(q) === -1 && s.admissionNo.toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var pg = UI.paginate(rows, _studentsState.page, 8);

  if (!pg.items.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">${Icons.html('students')}<p>No students found.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = pg.items.map(function (s) {
      var cls = DB.find('classes', s.classId);
      return `<tr>
        <td>${UI.avatarHTML(s.name, s.photo, 'avatar-sm')}</td>
        <td class="cell-primary mono">${s.admissionNo}</td>
        <td><a href="#" data-view-student="${s.id}" class="cell-primary" style="text-decoration:none;">${UI.escapeHTML(s.name)}</a>
          <div class="cell-muted">${UI.escapeHTML(s.email || '')}</div></td>
        <td>${cls ? DB.classLabel(cls) : '\u2014'}</td>
        <td>${UI.escapeHTML(s.phone || '\u2014')}</td>
        <td>${UI.statusBadge(s.status)}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-icon btn-ghost" data-view-student="${s.id}" title="View">${Icons.html('eye', 'icon-sm')}</button>
          <button type="button" class="btn btn-icon btn-ghost" data-edit-student="${s.id}" title="Edit">${Icons.html('edit', 'icon-sm')}</button>
          <button type="button" class="btn btn-icon btn-ghost" data-del-student="${s.id}" title="Delete">${Icons.html('trash', 'icon-sm')}</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  var pagerWrap = document.getElementById('stuPagerWrap');
  pagerWrap.innerHTML = UI.pagerHTML(pg.page, pg.totalPages);
  UI.wirePager(pagerWrap, function (p) { _studentsState.page = p; refreshStudentsTable(); });

  tbody.querySelectorAll('[data-view-student]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); viewStudentModal(b.getAttribute('data-view-student')); });
  });
  tbody.querySelectorAll('[data-edit-student]').forEach(function (b) {
    b.addEventListener('click', function () { openStudentModal(b.getAttribute('data-edit-student')); });
  });
  tbody.querySelectorAll('[data-del-student]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-student');
      var s = DB.find('students', id);
      UI.confirmDialog(`Delete student "<strong>${UI.escapeHTML(s.name)}</strong>"? This also removes their attendance, marks and payment history. This cannot be undone.`, { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) {
          if (!ok) return;
          DB.deleteStudent(id);
          UI.toast('Student deleted.', 'info');
          refreshStudentsTable();
        });
    });
  });
}

function openStudentModal(id) {
  var student = id ? DB.find('students', id) : null;
  var classes = DB.all('classes');
  var parents = DB.all('parents');
  var linkedUser = student ? DB.findLinkedUser('student', student.id) : null;

  var loginSection;
  if (student && linkedUser) {
    loginSection = `
      <div class="field">
        <label>Login account</label>
        <div class="flex gap-2 items-center mb-1">
          <span class="chip">${Icons.html('idCard', 'icon-sm')} ${UI.escapeHTML(linkedUser.username)}</span>
          <span class="text-xs text-soft">Sign in with this username, or with the email above</span>
        </div>
        <input class="input" id="sf-newpass" type="text" placeholder="Set a new password (leave blank to keep current)">
        <p class="hint">Leave blank to keep the current password unchanged.</p>
      </div>`;
  } else if (student && !linkedUser) {
    loginSection = `
      <div class="field">
        <label class="checkbox-row" style="margin-bottom:.5rem;"><input type="checkbox" id="sf-createlogin"> <span>Create a login account for this student</span></label>
        <input class="input" id="sf-newpass" type="text" placeholder="Password (default: student123)" value="student123">
      </div>`;
  } else {
    loginSection = `
      <div class="checkbox-row"><input type="checkbox" id="sf-createlogin" checked><label for="sf-createlogin">Create a login account</label></div>
      <div class="field mt-1"><label>Login password</label><input class="input" id="sf-newpass" type="text" value="student123">
        <p class="hint">The username is generated automatically from the name and shown to you after saving.</p>
      </div>`;
  }

  var body = `
    <div class="flex gap-2" style="align-items:flex-start;">
      <div style="text-align:center;">
        ${UI.avatarHTML(student ? student.name : 'New Student', student ? student.photo : null, 'avatar-md')}
        <div style="margin-top:.5rem;"><input type="file" id="sf-photo" accept="image/*" style="font-size:.72rem; max-width:120px;"></div>
      </div>
      <div style="flex:1;">
        <div class="input-row">
          <div class="field"><label>Full name *</label><input class="input" id="sf-name" value="${student ? UI.escapeHTML(student.name) : ''}" required></div>
          <div class="field"><label>Date of birth</label><input class="input" type="date" id="sf-dob" value="${student ? student.dob || '' : ''}"></div>
        </div>
      </div>
    </div>
    <div class="input-row">
      <div class="field"><label>Gender</label><select class="input" id="sf-gender">
        ${['Male', 'Female', 'Other'].map(g => `<option ${student && student.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select></div>
      <div class="field"><label>Blood group</label><input class="input" id="sf-blood" placeholder="e.g. O+" value="${student ? student.bloodGroup || '' : ''}"></div>
      <div class="field"><label>Status</label><select class="input" id="sf-status">
        ${['active', 'inactive', 'graduated'].map(s => `<option value="${s}" ${student && student.status === s ? 'selected' : ''}>${UI.capitalize(s)}</option>`).join('')}
      </select></div>
    </div>
    <div class="input-row">
      <div class="field"><label>Class</label><select class="input" id="sf-class">
        <option value="">\u2014 Unassigned \u2014</option>
        ${classes.map(c => `<option value="${c.id}" ${student && student.classId === c.id ? 'selected' : ''}>${DB.classLabel(c)}</option>`).join('')}
      </select></div>
      <div class="field"><label>Parent / guardian</label><select class="input" id="sf-parent">
        <option value="">\u2014 None \u2014</option>
        ${parents.map(p => `<option value="${p.id}" ${student && student.parentId === p.id ? 'selected' : ''}>${UI.escapeHTML(p.name)}</option>`).join('')}
      </select></div>
    </div>
    <div class="input-row">
      <div class="field"><label>Phone</label><input class="input" id="sf-phone" value="${student ? student.phone || '' : ''}"></div>
      <div class="field"><label>Email</label><input class="input" type="email" id="sf-email" value="${student ? student.email || '' : ''}"></div>
    </div>
    <div class="field"><label>Address</label><textarea class="input" id="sf-address">${student ? student.address || '' : ''}</textarea></div>
    <div class="divider-dashed"></div>
    ${loginSection}
  `;

  var handle = UI.openModal({
    title: student ? 'Edit student' : 'Add student',
    size: 'lg',
    body: body,
    footer: `<button type="button" class="btn btn-outline" data-close>Cancel</button>
             <button type="button" class="btn btn-primary" id="sf-save">${Icons.html('check', 'icon-sm')} ${student ? 'Save changes' : 'Add student'}</button>`,
    onOpen: function (elModal) {
      elModal.querySelector('#sf-save').addEventListener('click', function () {
        var name = document.getElementById('sf-name').value.trim();
        if (!name) { UI.toast('Name is required.', 'error'); return; }

        var patch = {
          name: name,
          dob: document.getElementById('sf-dob').value || null,
          gender: document.getElementById('sf-gender').value,
          bloodGroup: document.getElementById('sf-blood').value.trim(),
          status: document.getElementById('sf-status').value,
          classId: document.getElementById('sf-class').value ? Number(document.getElementById('sf-class').value) : null,
          section: (function () { var c = DB.find('classes', document.getElementById('sf-class').value); return c ? c.section : null; })(),
          parentId: document.getElementById('sf-parent').value ? Number(document.getElementById('sf-parent').value) : null,
          phone: document.getElementById('sf-phone').value.trim(),
          email: document.getElementById('sf-email').value.trim(),
          address: document.getElementById('sf-address').value.trim()
        };

        var newPassField = document.getElementById('sf-newpass');
        var createLoginBox = document.getElementById('sf-createlogin');

        function persist(photoDataUrl) {
          if (photoDataUrl) patch.photo = photoDataUrl;
          var newlyCreatedUsername = null;

          if (student) {
            DB.update('students', student.id, patch);

            if (linkedUser) {
              var linkedPatch = { email: patch.email || linkedUser.email };
              if (newPassField && newPassField.value.trim()) linkedPatch.password = newPassField.value.trim();
              DB.update('users', linkedUser.id, linkedPatch);
            } else if (createLoginBox && createLoginBox.checked) {
              var uname2 = DB.generateUsername(name);
              DB.insert('users', {
                username: uname2, password: (newPassField.value.trim() || 'student123'), role: 'student',
                profileId: student.id, email: patch.email || (uname2 + '@school.local'), photo: null, createdAt: new Date().toISOString()
              });
              newlyCreatedUsername = uname2;
            }
            UI.toast('Student updated.', 'success');
          } else {
            patch.admissionNo = DB.generateCode('STU');
            patch.admissionDate = DB.todayISO();
            patch.photo = patch.photo || null;
            var created = DB.insert('students', patch);
            if (createLoginBox && createLoginBox.checked) {
              var uname = DB.generateUsername(name);
              DB.insert('users', {
                username: uname, password: (newPassField.value.trim() || 'student123'), role: 'student',
                profileId: created.id, email: created.email || (uname + '@school.local'), photo: null, createdAt: new Date().toISOString()
              });
              newlyCreatedUsername = uname;
            }
            UI.toast('Student added.', 'success');
          }
          handle.close();
          refreshStudentsTable();
          if (newlyCreatedUsername) showCredentialsModal(name, newlyCreatedUsername, newPassField.value.trim() || 'student123');
        }

        var file = document.getElementById('sf-photo').files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function () { persist(reader.result); };
          reader.readAsDataURL(file);
        } else {
          persist(null);
        }
      });
    }
  });
}

function viewStudentModal(id) {
  var s = DB.find('students', id);
  if (!s) return;
  var cls = DB.find('classes', s.classId);
  var attendance = DB.query('attendanceDetails', function (r) { return r.studentId === s.id; });
  var present = attendance.filter(function (r) { return r.status === 'present'; }).length;
  var pct = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  var marks = DB.query('marks', function (m) { return m.studentId === s.id; }).slice(0, 6);
  var payments = DB.query('payments', function (p) { return p.studentId === s.id; }).slice(0, 6);

  UI.openModal({
    title: 'Student profile',
    size: 'lg',
    body: `
      <div class="flex gap-2 mb-2" style="align-items:center;">
        ${UI.avatarHTML(s.name, s.photo, 'avatar-md')}
        <div>
          <h3 style="margin-bottom:.15rem;">${UI.escapeHTML(s.name)}</h3>
          <p class="text-sm text-soft" style="margin-bottom:.3rem;">${cls ? DB.classLabel(cls) : 'Unassigned'} &middot; ${s.admissionNo}</p>
          ${UI.statusBadge(s.status)}
        </div>
      </div>
      <div class="grid grid-3 mb-2">
        <div class="stat-card"><div class="stat-icon pine">${Icons.html('attendance', 'icon-sm')}</div><div><div class="stat-value" style="font-size:1.2rem;">${pct}%</div><div class="stat-label">Attendance</div></div></div>
        <div class="stat-card"><div class="stat-icon gold">${Icons.html('marks', 'icon-sm')}</div><div><div class="stat-value" style="font-size:1.2rem;">${marks.length}</div><div class="stat-label">Marks entries</div></div></div>
        <div class="stat-card"><div class="stat-icon slate">${Icons.html('phone', 'icon-sm')}</div><div><div class="stat-value" style="font-size:1.2rem;">${UI.escapeHTML(s.phone || '\u2014')}</div><div class="stat-label">Phone</div></div></div>
      </div>
      <h4 class="text-sm mb-1">Recent marks</h4>
      <div class="table-wrap mb-2"><table class="grid"><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead><tbody>
        ${marks.length ? marks.map(function (m) { var subj = DB.find('subjects', m.subjectId); return `<tr><td>${subj ? subj.name : '\u2014'}</td><td>${m.marksObtained}/${m.maxMarks}</td><td><span class="chip gold">${m.grade}</span></td></tr>`; }).join('') : '<tr><td colspan="3" class="text-soft text-sm">No marks yet.</td></tr>'}
      </tbody></table></div>
      <h4 class="text-sm mb-1">Payment history</h4>
      <div class="table-wrap"><table class="grid"><thead><tr><th>Receipt</th><th>Amount</th><th>Mode</th></tr></thead><tbody>
        ${payments.length ? payments.map(function (p) { return `<tr><td class="mono">${p.receiptNo}</td><td>${UI.currency(p.amountPaid)}</td><td>${p.paymentMode.toUpperCase()}</td></tr>`; }).join('') : '<tr><td colspan="3" class="text-soft text-sm">No payments yet.</td></tr>'}
      </tbody></table></div>
    `,
    footer: `<button type="button" class="btn btn-outline" data-close>Close</button>
             <button type="button" class="btn btn-primary" id="sv-edit">${Icons.html('edit', 'icon-sm')} Edit student</button>`,
    onOpen: function (elModal, close) {
      elModal.querySelector('#sv-edit').addEventListener('click', function () { close(); openStudentModal(s.id); });
    }
  });
}

function debounce(fn, wait) {
  var t;
  return function () {
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(null, args); }, wait);
  };
}
