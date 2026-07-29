/**
 * pages/admin-parents.js
 * Mirrors the Students/Teachers CRUD pattern: search + paginated table,
 * an add/edit modal with a login-account section (view/reset password or
 * create one), plus a children multi-select so a parent can be linked to
 * one or more students directly from this screen.
 */
var _parentsState = { page: 1, q: '' };

function renderAdminParents() {
  var el = document.querySelector('.view[data-view="parents"]');
  if (!el) return;

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="flex gap-2" style="flex-wrap:wrap;">
        <div class="search-box" style="flex:1; min-width:220px;">
          ${Icons.html('search')}
          <input class="input" id="parSearch" placeholder="Search by name, phone or email">
        </div>
        <button type="button" class="btn btn-primary" id="parAddBtn">${Icons.html('plus', 'icon-sm')} Add parent</button>
      </div>
    </div></div>
    <div class="card">
      <div class="table-wrap"><table class="grid">
        <thead><tr><th></th><th>Name</th><th>Phone</th><th>Email</th><th>Children</th><th class="text-right">Actions</th></tr></thead>
        <tbody id="parTbody"></tbody>
      </table></div>
      <div id="parPagerWrap" class="card-body" style="padding-top:0;"></div>
    </div>
  `;

  document.getElementById('parSearch').addEventListener('input', debounce(function (e) {
    _parentsState.q = e.target.value; _parentsState.page = 1; refreshParentsTable();
  }, 200));
  document.getElementById('parAddBtn').addEventListener('click', function () { openParentModal(null); });

  refreshParentsTable();
}

function refreshParentsTable() {
  var tbody = document.getElementById('parTbody');
  if (!tbody) return;
  var q = _parentsState.q.trim().toLowerCase();

  var rows = DB.all('parents').filter(function (p) {
    if (!q) return true;
    return p.name.toLowerCase().indexOf(q) !== -1 ||
      (p.phone || '').toLowerCase().indexOf(q) !== -1 ||
      (p.email || '').toLowerCase().indexOf(q) !== -1;
  }).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var pg = UI.paginate(rows, _parentsState.page, 8);

  if (!pg.items.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">${Icons.html('family')}<p>No parents found.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = pg.items.map(function (p) {
      var children = DB.query('students', function (s) { return s.parentId === p.id; });
      return `<tr>
        <td>${UI.avatarHTML(p.name, p.photo, 'avatar-sm')}</td>
        <td class="cell-primary">${UI.escapeHTML(p.name)}<div class="cell-muted">${UI.escapeHTML(p.occupation || '')}</div></td>
        <td>${UI.escapeHTML(p.phone || '\u2014')}</td>
        <td>${UI.escapeHTML(p.email || '\u2014')}</td>
        <td>${children.length ? children.map(c => `<span class="chip mb-1">${UI.escapeHTML(c.name)}</span>`).join(' ') : '<span class="text-soft text-sm">None linked</span>'}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-icon btn-ghost" data-edit-parent="${p.id}" title="Edit">${Icons.html('edit', 'icon-sm')}</button>
          <button type="button" class="btn btn-icon btn-ghost" data-del-parent="${p.id}" title="Delete">${Icons.html('trash', 'icon-sm')}</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  var pagerWrap = document.getElementById('parPagerWrap');
  pagerWrap.innerHTML = UI.pagerHTML(pg.page, pg.totalPages);
  UI.wirePager(pagerWrap, function (p) { _parentsState.page = p; refreshParentsTable(); });

  tbody.querySelectorAll('[data-edit-parent]').forEach(function (b) {
    b.addEventListener('click', function () { openParentModal(b.getAttribute('data-edit-parent')); });
  });
  tbody.querySelectorAll('[data-del-parent]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-parent');
      var p = DB.find('parents', id);
      var childCount = DB.query('students', function (s) { return s.parentId === Number(id); }).length;
      var warn = childCount ? ` ${childCount} linked student(s) will be unassigned from this parent, not deleted.` : '';
      UI.confirmDialog(`Delete parent "<strong>${UI.escapeHTML(p.name)}</strong>"?${warn}`, { danger: true, confirmLabel: 'Delete' })
        .then(function (ok) {
          if (!ok) return;
          DB.deleteParent(id);
          UI.toast('Parent deleted.', 'info');
          refreshParentsTable();
        });
    });
  });
}

function openParentModal(id) {
  var parent = id ? DB.find('parents', id) : null;
  var allStudents = DB.all('students').sort(function (a, b) { return a.name.localeCompare(b.name); });
  var linkedUser = parent ? DB.findLinkedUser('parent', parent.id) : null;

  var loginSection;
  if (parent && linkedUser) {
    loginSection = `
      <div class="field">
        <label>Login account</label>
        <div class="flex gap-2 items-center mb-1">
          <span class="chip">${Icons.html('idCard', 'icon-sm')} ${UI.escapeHTML(linkedUser.username)}</span>
          <span class="text-xs text-soft">Sign in with this username, or with the email above</span>
        </div>
        <input class="input" id="pf-newpass" type="text" placeholder="Set a new password (leave blank to keep current)">
        <p class="hint">Leave blank to keep the current password unchanged.</p>
      </div>`;
  } else if (parent && !linkedUser) {
    loginSection = `
      <div class="field">
        <label class="checkbox-row" style="margin-bottom:.5rem;"><input type="checkbox" id="pf-createlogin"> <span>Create a login account for this parent</span></label>
        <input class="input" id="pf-newpass" type="text" placeholder="Password (default: parent123)" value="parent123">
      </div>`;
  } else {
    loginSection = `
      <div class="checkbox-row"><input type="checkbox" id="pf-createlogin" checked><label for="pf-createlogin">Create a login account</label></div>
      <div class="field mt-1"><label>Login password</label><input class="input" id="pf-newpass" type="text" value="parent123">
        <p class="hint">The username is generated automatically from the name and shown to you after saving.</p>
      </div>`;
  }

  var body = `
    <div class="input-row">
      <div class="field"><label>Full name *</label><input class="input" id="pf-name" value="${parent ? UI.escapeHTML(parent.name) : ''}" required></div>
      <div class="field"><label>Occupation</label><input class="input" id="pf-occupation" value="${parent ? UI.escapeHTML(parent.occupation || '') : ''}"></div>
    </div>
    <div class="input-row">
      <div class="field"><label>Phone</label><input class="input" id="pf-phone" value="${parent ? parent.phone || '' : ''}"></div>
      <div class="field"><label>Email</label><input class="input" type="email" id="pf-email" value="${parent ? parent.email || '' : ''}"></div>
    </div>
    <div class="field"><label>Address</label><textarea class="input" id="pf-address">${parent ? parent.address || '' : ''}</textarea></div>
    <div class="field">
      <label>Children</label>
      <p class="hint" style="margin-top:0; margin-bottom:.5rem;">Checking a student here links them to this parent, replacing any previous parent link they had.</p>
      <div class="grid grid-2" style="gap:.4rem; max-height:180px; overflow-y:auto; padding:.2rem;">
        ${allStudents.length ? allStudents.map(function (s) {
          var cls = DB.find('classes', s.classId);
          return `<label class="checkbox-row"><input type="checkbox" class="pf-child" value="${s.id}" ${parent && s.parentId === parent.id ? 'checked' : ''}>
            ${UI.escapeHTML(s.name)} <span class="text-xs text-soft">(${cls ? DB.classLabel(cls) : 'unassigned'})</span></label>`;
        }).join('') : '<p class="hint">No students exist yet.</p>'}
      </div>
    </div>
    <div class="divider-dashed"></div>
    ${loginSection}
  `;

  var handle = UI.openModal({
    title: parent ? 'Edit parent' : 'Add parent',
    size: 'lg',
    body: body,
    footer: `<button type="button" class="btn btn-outline" data-close>Cancel</button>
             <button type="button" class="btn btn-primary" id="pf-save">${Icons.html('check', 'icon-sm')} ${parent ? 'Save changes' : 'Add parent'}</button>`,
    onOpen: function (elModal) {
      elModal.querySelector('#pf-save').addEventListener('click', function () {
        var name = document.getElementById('pf-name').value.trim();
        if (!name) { UI.toast('Name is required.', 'error'); return; }

        var patch = {
          name: name,
          occupation: document.getElementById('pf-occupation').value.trim(),
          phone: document.getElementById('pf-phone').value.trim(),
          email: document.getElementById('pf-email').value.trim(),
          address: document.getElementById('pf-address').value.trim()
        };

        var newPassField = document.getElementById('pf-newpass');
        var createLoginBox = document.getElementById('pf-createlogin');
        var selectedChildIds = Array.from(elModal.querySelectorAll('.pf-child:checked')).map(cb => Number(cb.value));

        var parentId;
        var newlyCreatedUsername = null;

        if (parent) {
          DB.update('parents', parent.id, patch);
          parentId = parent.id;

          if (linkedUser) {
            var linkedPatch = { email: patch.email || linkedUser.email };
            if (newPassField && newPassField.value.trim()) linkedPatch.password = newPassField.value.trim();
            DB.update('users', linkedUser.id, linkedPatch);
          } else if (createLoginBox && createLoginBox.checked) {
            var uname2 = DB.generateUsername(name);
            DB.insert('users', {
              username: uname2, password: (newPassField.value.trim() || 'parent123'), role: 'parent',
              profileId: parentId, email: patch.email || (uname2 + '@school.local'), photo: null, createdAt: new Date().toISOString()
            });
            newlyCreatedUsername = uname2;
          }
          UI.toast('Parent updated.', 'success');
        } else {
          var created = DB.insert('parents', patch);
          parentId = created.id;
          if (createLoginBox && createLoginBox.checked) {
            var uname = DB.generateUsername(name);
            DB.insert('users', {
              username: uname, password: (newPassField.value.trim() || 'parent123'), role: 'parent',
              profileId: created.id, email: created.email || (uname + '@school.local'), photo: null, createdAt: new Date().toISOString()
            });
            newlyCreatedUsername = uname;
          }
          UI.toast('Parent added.', 'success');
        }

        // Reassign children: unlink any student currently pointing at this
        // parent but no longer checked, then link every checked student.
        DB.updateWhere('students', function (s) { return s.parentId === parentId && selectedChildIds.indexOf(s.id) === -1; }, { parentId: null });
        selectedChildIds.forEach(function (sid) { DB.update('students', sid, { parentId: parentId }); });

        handle.close();
        refreshParentsTable();
        if (newlyCreatedUsername) showCredentialsModal(name, newlyCreatedUsername, newPassField.value.trim() || 'parent123');
      });
    }
  });
}
