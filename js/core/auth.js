/**
 * auth.js
 * Client-side "session" simulation. There is no server, so this is a
 * convenience/demo layer, not real security — anyone with access to the
 * browser's storage can read everything. That's an inherent limitation of
 * a backend-less build, and is called out clearly in the README.
 */
var Auth = (function () {
  var SESSION_KEY = 'sms_currentUser';

  function login(username, password) {
    var input = String(username).trim().toLowerCase();
    var user = DB.query('users', function (u) {
      return u.username.toLowerCase() === input || (u.email && u.email.toLowerCase() === input);
    })[0];
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid username or password.' };
    }
    var session = { id: user.id, username: user.username, role: user.role, profileId: user.profileId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: user };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = getBasePath() + 'index.html';
  }

  function currentSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function currentUser() {
    var s = currentSession();
    if (!s) return null;
    return DB.find('users', s.id);
  }

  // profile = the students/teachers/parents row linked to the logged-in user
  function currentProfile() {
    var u = currentUser();
    if (!u || u.profileId == null) return null;
    var collection = u.role === 'teacher' ? 'teachers' : u.role === 'student' ? 'students' : u.role === 'parent' ? 'parents' : null;
    return collection ? DB.find(collection, u.profileId) : null;
  }

  function displayName(user) {
    if (!user) return '';
    if (user.role === 'admin') return 'Admin';
    var collection = user.role === 'teacher' ? 'teachers' : user.role === 'student' ? 'students' : 'parents';
    var profile = user.profileId != null ? DB.find(collection, user.profileId) : null;
    return profile ? profile.name : user.username;
  }

  // Works out how many '../' segments are needed to get back to the
  // project root, based on how deep the current HTML file is nested.
  function getBasePath() {
    var depth = window.location.pathname.split('/').filter(Boolean);
    // pages live at root (index.html) or one level deep (admin.html etc.) —
    // this project keeps every HTML file at the root, so base path is ''.
    return '';
  }

  // Call at the top of every protected page. Redirects to login if there's
  // no session, or to the correct dashboard if the role doesn't match.
  function requireRole(role) {
    var session = currentSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    if (session.role !== role) {
      window.location.href = roleHome(session.role);
      return null;
    }
    var user = DB.find('users', session.id);
    if (!user) {
      logout();
      return null;
    }
    return user;
  }

  function roleHome(role) {
    var map = { admin: 'admin.html', teacher: 'teacher.html', student: 'student.html', parent: 'parent.html' };
    return map[role] || 'index.html';
  }

  return {
    login: login, logout: logout, currentSession: currentSession, currentUser: currentUser,
    currentProfile: currentProfile, displayName: displayName, requireRole: requireRole, roleHome: roleHome
  };
})();
