/**
 * pages/login.js
 */
(function () {
  Icons.hydrate();
  DB.init();

  // already signed in? skip straight to the right dashboard
  var session = Auth.currentSession();
  if (session) {
    window.location.href = Auth.roleHome(session.role);
    return;
  }

  var form = document.getElementById('loginForm');
  var alertBox = document.getElementById('formAlert');

  function showError(msg) {
    alertBox.innerHTML =
      '<div class="field" style="background:var(--crimson-light); color:var(--crimson); padding:.65rem .8rem; border-radius:8px; font-size:.82rem; display:flex; gap:.5rem; align-items:flex-start;">' +
      Icons.html('alert', 'icon-sm') + '<span>' + UI.escapeHTML(msg) + '</span></div>';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alertBox.innerHTML = '';
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var result = Auth.login(username, password);
    if (!result.success) {
      showError(result.error);
      return;
    }
    window.location.href = Auth.roleHome(result.user.role);
  });

  document.querySelectorAll('.demo-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.getElementById('username').value = chip.getAttribute('data-user');
      document.getElementById('password').value = chip.getAttribute('data-pass');
      alertBox.innerHTML = '';
    });
  });

  document.getElementById('forgotLink').addEventListener('click', function (e) {
    e.preventDefault();
    UI.openModal({
      title: 'Forgot password',
      body:
        '<p>This is a front-end-only demo &mdash; there is no mail server to send a reset link to. ' +
        'In a full deployment this would email a secure reset link instead.</p>' +
        '<p class="text-sm text-soft" style="margin-bottom:.4rem;">For now, use one of the demo accounts below:</p>' +
        '<div class="demo-creds">' +
        '<span class="chip">admin / admin123</span>' +
        '<span class="chip">teacher1 / teacher123</span>' +
        '<span class="chip">student1 / student123</span>' +
        '<span class="chip">parent1 / parent123</span>' +
        '</div>',
      footer: '<button type="button" class="btn btn-primary" data-close>Got it</button>'
    });
  });

  document.getElementById('resetDataLink').addEventListener('click', function (e) {
    e.preventDefault();
    UI.confirmDialog(
      'This clears everything stored in this browser (students, teachers, attendance, marks, fees &hellip;) and reloads the original demo dataset. Continue?',
      { title: 'Reset demo data', confirmLabel: 'Reset data', danger: true }
    ).then(function (ok) {
      if (ok) {
        DB.resetAll();
        UI.toast('Demo data reset.', 'success');
      }
    });
  });
})();
