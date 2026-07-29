/**
 * pages/account.js
 * "My Profile" and "Change Password" views — identical for every role, so
 * each role page just registers these two render functions instead of
 * duplicating the logic four times.
 */

function renderProfileView() {
  var user = Auth.currentUser();
  var profile = Auth.currentProfile();
  var name = Auth.displayName(user);
  var photo = (profile && profile.photo) || user.photo || null;
  var el = document.querySelector('.view[data-view="profile"]');
  if (!el) return;

  el.innerHTML =
    '<div class="grid grid-12">' +
    '<div class="col-span-4">' +
    '<div class="card"><div class="card-body text-center">' +
    '<div style="display:flex; justify-content:center;">' + UI.avatarHTML(name, photo, 'avatar-lg') + '</div>' +
    '<h3 style="margin-top:.9rem; margin-bottom:.1rem;">' + UI.escapeHTML(name) + '</h3>' +
    '<p class="text-sm text-soft" style="margin-bottom:.6rem;">' + UI.capitalize(user.role) + '</p>' +
    '<span class="chip">' + Icons.html('mail', 'icon-sm') + UI.escapeHTML(user.email || '\u2014') + '</span>' +
    '</div></div>' +
    '</div>' +
    '<div class="col-span-8">' +
    '<div class="card"><div class="card-head"><h3>Update profile</h3></div><div class="card-body">' +
    '<form id="profileForm">' +
    '<div class="input-row">' +
    '<div class="field"><label>Username</label><input class="input" value="' + UI.escapeHTML(user.username) + '" disabled></div>' +
    '<div class="field"><label>Email address</label><input class="input" id="pf-email" type="email" value="' + UI.escapeHTML(user.email || '') + '" required></div>' +
    '</div>' +
    '<div class="field"><label>Profile photo</label><input class="input" id="pf-photo" type="file" accept="image/*"><p class="hint">Stored directly in your browser as part of the demo data.</p></div>' +
    '<button type="submit" class="btn btn-primary">' + Icons.html('check', 'icon-sm') + ' Save changes</button>' +
    '</form>' +
    '</div></div>' +
    '</div>' +
    '</div>';

  document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('pf-email').value.trim();
    var fileInput = document.getElementById('pf-photo');
    var file = fileInput.files[0];

    function finish(photoDataUrl) {
      var patch = { email: email };
      if (photoDataUrl) patch.photo = photoDataUrl;
      DB.update('users', user.id, patch);
      if (profile) {
        var collection = user.role === 'teacher' ? 'teachers' : user.role === 'student' ? 'students' : 'parents';
        var profilePatch = { email: email };
        if (photoDataUrl) profilePatch.photo = photoDataUrl;
        DB.update(collection, profile.id, profilePatch);
      }
      UI.toast('Profile updated.', 'success');
      Shell.build(window.NAV_GROUPS || []);
      renderProfileView();
    }

    if (file) {
      var reader = new FileReader();
      reader.onload = function () { finish(reader.result); };
      reader.readAsDataURL(file);
    } else {
      finish(null);
    }
  });
}

function renderPasswordView() {
  var el = document.querySelector('.view[data-view="password"]');
  if (!el) return;
  el.innerHTML =
    '<div class="grid grid-12"><div class="col-span-7">' +
    '<div class="card"><div class="card-head"><h3>Change password</h3></div><div class="card-body">' +
    '<div id="pwAlert"></div>' +
    '<form id="pwForm">' +
    '<div class="field"><label>Current password</label><input class="input" type="password" id="pw-current" required></div>' +
    '<div class="field"><label>New password</label><input class="input" type="password" id="pw-new" minlength="6" required></div>' +
    '<div class="field"><label>Confirm new password</label><input class="input" type="password" id="pw-confirm" minlength="6" required></div>' +
    '<button type="submit" class="btn btn-primary">' + Icons.html('lock', 'icon-sm') + ' Update password</button>' +
    '</form>' +
    '</div></div>' +
    '</div></div>';

  document.getElementById('pwForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var user = Auth.currentUser();
    var current = document.getElementById('pw-current').value;
    var next = document.getElementById('pw-new').value;
    var confirm = document.getElementById('pw-confirm').value;
    var alertBox = document.getElementById('pwAlert');
    alertBox.innerHTML = '';

    function warn(msg) {
      alertBox.innerHTML = '<div class="field" style="background:var(--crimson-light); color:var(--crimson); padding:.6rem .8rem; border-radius:8px; font-size:.82rem;">' + msg + '</div>';
    }

    if (user.password !== current) { warn('Current password is incorrect.'); return; }
    if (next.length < 6) { warn('New password must be at least 6 characters.'); return; }
    if (next !== confirm) { warn('New passwords do not match.'); return; }

    DB.update('users', user.id, { password: next });
    UI.toast('Password changed successfully.', 'success');
    document.getElementById('pwForm').reset();
  });
}
