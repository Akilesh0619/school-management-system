/**
 * pages/teacher.js
 * Bootstraps the teacher dashboard.
 */
(function () {
  DB.init();
  var user = Auth.requireRole('teacher');
  if (!user) return;

  window.NAV_GROUPS = [
    { label: 'Overview', items: [{ view: 'dashboard', icon: 'dashboard', label: 'Dashboard' }] },
    { label: 'Teaching', items: [
      { view: 'students', icon: 'students', label: 'My Students' },
      { view: 'attendance', icon: 'attendance', label: 'Mark Attendance' },
      { view: 'marks', icon: 'marks', label: 'Enter Marks' }
    ] },
    { label: 'Account', items: [
      { view: 'profile', icon: 'profile', label: 'Profile' },
      { view: 'password', icon: 'lock', label: 'Change Password' }
    ] }
  ];

  Icons.hydrate();
  Shell.build(window.NAV_GROUPS);
  UI.initChrome();

  UI.registerView('dashboard', { title: 'Dashboard', subtitle: "Here's what's happening today", render: renderTeacherDashboard });
  UI.registerView('students', { title: 'My Students', subtitle: 'Students in the classes you teach', render: renderTeacherStudents });
  UI.registerView('attendance', { title: 'Mark Attendance', subtitle: 'Select a class, subject and date to begin', render: renderTeacherAttendance });
  UI.registerView('marks', { title: 'Enter Marks', subtitle: 'Select an exam and subject to begin', render: renderTeacherMarks });
  UI.registerView('profile', { title: 'My Profile', subtitle: 'Manage your account details', render: renderProfileView });
  UI.registerView('password', { title: 'Change Password', subtitle: 'Update your account credentials', render: renderPasswordView });

  UI.initRouter('dashboard');
})();
