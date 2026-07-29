/**
 * pages/admin-teachers.js
 */
var _teachersState = { page: 1, q: '' };

function renderAdminTeachers() {
  var el = document.querySelector('.view[data-view="teachers"]');
  if (!el) return;

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap;">
        <div class="search-box" style="flex:1; min-width:220px;">
          ${Icons.html('search')}
          <input class="input" id="tchSearch" placeholder="Search by name or employee no.">
        </div>
        <button type="button" class="btn btn-primary" id="tchAddBtn">${Icons.html('plus', 'icon-sm')} Add teacher</button>
      </div>
    </div></div>
    <div class="card">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Employee no.</th><th>Name</th><th>Qualification</th><th>Subjects</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
        <tbody id="tchTbody"></tbody>
      </table></div>
      <div id="tchPagerWrap" class="card-body" style="padding-top:0;"></div>
    </div>
  `;

  document.getElementById('tchSearch').addEventListener('input', debounce(function (e) {
    _teachersState.q = e.target.value; _teachersState.page = 1; refreshTeachersTable();
  }, 200));
  document.getElementById('tchAddBtn').addEventListener('click', function () { openTeacherModal(null); });

  refreshTeachersTable();
}

function refreshTeachersTable() {
  var tbody = document.getElementById('tchTbody');
  if (!tbody) return;
  var q = _teachersState.q.trim().toLowerCase();

  var rows = DB.all('teachers').filter(function (t) {
    if (q && t.name.toLowerCase().indexOf(q) === -1 && t.employeeNo.toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var pg = UI.paginate(rows, _teachersState.page, 8);

  if (!pg.items.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">${Icons.html('teacher')}<p>No teachers found.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = pg.items.map(function (t) {
      var subjects = DB.query('subjects', function (s) { return s.teacherId === t.id; });
      return `<tr>
        <td>${UI.avatarHTML(t.name, t.photo, 'avatar-sm')}</td>
        <td class="cell-primary mono">${t.employeeNo}</td>
        <td class="cell-primary">${UI.escapeHTML(t.name)}<div class="cell-muted">${UI.escapeHTML(t.email || '')}</div></td>
        <td>${UI.escapeHTML(t.qualification || '\u2014')}</td>
        <td>${subjects.length ? subjects.map(s => `<span class="chip">${s.code}</span>`).join(' ') : '\u2014'}</td>
        <td>${UI.statusBadge(t.status)}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-icon btn-ghost" data-edit-teacher="${t.id}" title="Edit">${Icons.html('edit', 'icon-sm')}</button>
          <button type="button" class="btn btn-icon btn-ghost" data-del-teacher="${t.id}" title="Delete">${Icons.html('trash', 'icon-sm')}</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  var pagerWrap = document.getElementById('tchPagerWrap');
  pagerWrap.innerHTML = UI.pagerHTML(pg.page, pg.totalPages);
  UI.wirePager(pagerWrap, function (p) { _teachersState.page = p; refreshTeachersTable(); });

  tbody.querySelectorAll('[data-edit-teacher]').forEach(function (b) {
    b.addEventListener('click', function () { openTeacherModal(b.getAttribute('data-edit-teacher')); });
  });
  tbody.querySelectorAll('[data-del-teacher]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-teacher');
      var t = DB.find('teachers', id);
      UI.confirmDialog(`Delete teacher "<strong>${UI.escapeHTML(t.name)}</strong>"? Their class/subject assignments will be unassigned rather than deleted.`, { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) {
          if (!ok) return;
          DB.deleteTeacher(id);
          UI.toast('Teacher deleted.', 'info');
          refreshTeachersTable();
        });
    });
  });
}

function openTeacherModal(id) {
  var teacher = id ? DB.find('teachers', id) : null;
  var subjects = DB.all('subjects');
  var linkedUser = teacher ? DB.findLinkedUser('teacher', teacher.id) : null;

  var loginSection;
  if (teacher && linkedUser) {
    loginSection = `
      <div class="field">
        <label>Login account</label>
        <div class="flex gap-2 items-center mb-1">
          <span class="chip">${Icons.html('idCard', 'icon-sm')} ${UI.escapeHTML(linkedUser.username)}</span>
          <span class="text-xs text-soft">Sign in with this username, or with the email above</span>
        </div>
        <input class="input" id="tf-newpass" type="text" placeholder="Set a new password (leave blank to keep current)">
        <p class="hint">Leave blank to keep the current password unchanged.</p>
      </div>`;
  } else if (teacher && !linkedUser) {
    loginSection = `
      <div class="field">
        <label class="checkbox-row" style="margin-bottom:.5rem;"><input type="checkbox" id="tf-createlogin"> <span>Create a login account for this teacher</span></label>
        <input class="input" id="tf-newpass" type="text" placeholder="Password (default: teacher123)" value="teacher123">
      </div>`;
  } else {
    loginSection = `
      <div class="checkbox-row"><input type="checkbox" id="tf-createlogin" checked><label for="tf-createlogin">Create a login account</label></div>
      <div class="field mt-1"><label>Login password</label><input class="input" id="tf-newpass" type="text" value="teacher123">
        <p class="hint">The username is generated automatically from the name and shown to you after saving.</p>
      </div>`;
  }

  var body = `
    <div class="flex gap-2" style="align-items:flex-start;">
      <div style="text-align:center;">
        ${UI.avatarHTML(teacher ? teacher.name : 'New Teacher', teacher ? teacher.photo : null, 'avatar-md')}
        <div style="margin-top:.5rem;"><input type="file" id="tf-photo" accept="image/*" style="font-size:.72rem; max-width:120px;"></div>
      </div>
      <div style="flex:1;">
        <div class="input-row">
          <div class="field"><label>Full name *</label><input class="input" id="tf-name" value="${teacher ? UI.escapeHTML(teacher.name) : ''}" required></div>
          <div class="field"><label>Qualification</label><input class="input" id="tf-qual" value="${teacher ? UI.escapeHTML(teacher.qualification || '') : ''}"></div>
        </div>
      </div>
    </div>
    <div class="input-row">
      <div class="field"><label>Experience (years)</label><input class="input" type="number" min="0" id="tf-exp" value="${teacher ? teacher.experienceYears || 0 : 0}"></div>
      <div class="field"><label>Salary (&#8377;/month)</label><input class="input" type="number" min="0" id="tf-salary" value="${teacher ? teacher.salary || 0 : 0}"></div>
      ${teacher ? `<div class="field"><label>Status</label><select class="input" id="tf-status">${['active', 'inactive'].map(s => `<option value="${s}" ${teacher.status === s ? 'selected' : ''}>${UI.capitalize(s)}</option>`).join('')}</select></div>` : ''}
    </div>
    <div class="input-row">
      <div class="field"><label>Phone</label><input class="input" id="tf-phone" value="${teacher ? teacher.phone || '' : ''}"></div>
      <div class="field"><label>Email</label><input class="input" type="email" id="tf-email" value="${teacher ? teacher.email || '' : ''}"></div>
    </div>
    <div class="field"><label>Address</label><textarea class="input" id="tf-address">${teacher ? teacher.address || '' : ''}</textarea></div>
    <div class="field"><label>Subjects taught</label>
      <div class="grid grid-2" style="gap:.4rem;">
        ${subjects.map(s => `<label class="checkbox-row"><input type="checkbox" class="tf-subject" value="${s.id}" ${teacher && s.teacherId === teacher.id ? 'checked' : ''}> ${UI.escapeHTML(s.name)} (${s.code})</label>`).join('')}
      </div>
      ${!subjects.length ? '<p class="hint">No subjects created yet &mdash; add some from Classes &amp; Subjects first.</p>' : ''}
    </div>
    <div class="divider-dashed"></div>
    ${loginSection}
  `;

  var handle = UI.openModal({
    title: teacher ? 'Edit teacher' : 'Add teacher',
    size: 'lg',
    body: body,
    footer: `<button type="button" class="btn btn-outline" data-close>Cancel</button>
             <button type="button" class="btn btn-primary" id="tf-save">${Icons.html('check', 'icon-sm')} ${teacher ? 'Save changes' : 'Add teacher'}</button>`,
    onOpen: function (elModal) {
      elModal.querySelector('#tf-save').addEventListener('click', function () {
        var name = document.getElementById('tf-name').value.trim();
        if (!name) { UI.toast('Name is required.', 'error'); return; }

        var patch = {
          name: name,
          qualification: document.getElementById('tf-qual').value.trim(),
          experienceYears: Number(document.getElementById('tf-exp').value) || 0,
          salary: Number(document.getElementById('tf-salary').value) || 0,
          phone: document.getElementById('tf-phone').value.trim(),
          email: document.getElementById('tf-email').value.trim(),
          address: document.getElementById('tf-address').value.trim()
        };
        if (teacher) patch.status = document.getElementById('tf-status').value;

        var selectedSubjectIds = Array.from(elModal.querySelectorAll('.tf-subject:checked')).map(cb => Number(cb.value));
        var newPassField = document.getElementById('tf-newpass');
        var createLoginBox = document.getElementById('tf-createlogin');

        function persist(photoDataUrl) {
          if (photoDataUrl) patch.photo = photoDataUrl;
          var teacherId;
          var newlyCreatedUsername = null;

          if (teacher) {
            DB.update('teachers', teacher.id, patch);
            teacherId = teacher.id;

            if (linkedUser) {
              // keep the login's email in sync with the profile so "log in
              // with your email" always matches what's shown on this form
              var linkedPatch = { email: patch.email || linkedUser.email };
              if (newPassField && newPassField.value.trim()) linkedPatch.password = newPassField.value.trim();
              DB.update('users', linkedUser.id, linkedPatch);
            } else if (createLoginBox && createLoginBox.checked) {
              var uname2 = DB.generateUsername(name);
              DB.insert('users', {
                username: uname2, password: (newPassField.value.trim() || 'teacher123'), role: 'teacher',
                profileId: teacherId, email: patch.email || (uname2 + '@school.local'), photo: null, createdAt: new Date().toISOString()
              });
              newlyCreatedUsername = uname2;
            }
            UI.toast('Teacher updated.', 'success');
          } else {
            patch.employeeNo = DB.generateCode('TCH');
            patch.joiningDate = DB.todayISO();
            patch.status = 'active';
            patch.photo = patch.photo || null;
            var created = DB.insert('teachers', patch);
            teacherId = created.id;
            if (createLoginBox && createLoginBox.checked) {
              var uname = DB.generateUsername(name);
              DB.insert('users', {
                username: uname, password: (newPassField.value.trim() || 'teacher123'), role: 'teacher',
                profileId: created.id, email: created.email || (uname + '@school.local'), photo: null, createdAt: new Date().toISOString()
              });
              newlyCreatedUsername = uname;
            }
            UI.toast('Teacher added.', 'success');
          }
          // reassign subjects: clear old, apply new selection
          DB.updateWhere('subjects', function (s) { return s.teacherId === teacherId; }, { teacherId: null });
          selectedSubjectIds.forEach(function (sid) { DB.update('subjects', sid, { teacherId: teacherId }); });

          handle.close();
          refreshTeachersTable();
          if (newlyCreatedUsername) showCredentialsModal(name, newlyCreatedUsername, newPassField.value.trim() || 'teacher123');
        }

        var file = document.getElementById('tf-photo').files[0];
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

function showCredentialsModal(personName, username, password) {
  UI.openModal({
    title: 'Login account created',
    body: `
      <p>Share these sign-in details with <strong>${UI.escapeHTML(personName)}</strong>. They can sign in with either the username or their email address.</p>
      <div class="input-row">
        <div class="field"><label>Username</label><input class="input mono" readonly value="${UI.escapeHTML(username)}"></div>
        <div class="field"><label>Password</label><input class="input mono" readonly value="${UI.escapeHTML(password)}"></div>
      </div>
    `,
    footer: `<button type="button" class="btn btn-primary" data-close>Got it</button>`
  });
}
