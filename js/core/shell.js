/**
 * shell.js
 * Builds the parts of the sidebar/topbar that depend on who's logged in,
 * so each role's HTML file only needs empty containers, not duplicated
 * markup for every nav item.
 */
var Shell = (function () {
  function build(navGroups) {
    var user = Auth.currentUser();
    if (!user) return;
    var profile = Auth.currentProfile();
    var displayName = Auth.displayName(user);

    var nav = document.getElementById('sidebarNav');
    if (nav) {
      var html = '';
      navGroups.forEach(function (group) {
        html += '<div class="nav-label">' + group.label + '</div>';
        group.items.forEach(function (item) {
          html += '<button type="button" class="nav-link" data-view="' + item.view + '">' +
            Icons.html(item.icon) + '<span>' + item.label + '</span></button>';
        });
      });
      nav.innerHTML = html;
    }

    var foot = document.getElementById('sidebarFoot');
    if (foot) {
      foot.innerHTML = 'Signed in as <strong>' + UI.escapeHTML(displayName) + '</strong><br>Role: ' + UI.capitalize(user.role);
    }

    var avatarSlot = document.getElementById('topbarAvatar');
    if (avatarSlot) {
      var photo = (profile && profile.photo) || user.photo || null;
      avatarSlot.innerHTML = UI.avatarHTML(displayName, photo, 'avatar-sm');
      avatarSlot.style.cursor = 'pointer';
      avatarSlot.title = 'View profile';
      avatarSlot.addEventListener('click', function () { UI.go('#profile'); });
    }

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);
  }

  return { build: build };
})();
