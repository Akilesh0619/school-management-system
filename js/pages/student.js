/**
 * pages/student.js
 * Bootstraps the student dashboard.
 */
(function () {
  DB.init();
  var user = Auth.requireRole('student');
  if (!user) return;

  window.NAV_GROUPS = [
    { label: 'Overview', items: [{ view: 'dashboard', icon: 'dashboard', label: 'Dashboard' }] },
    { label: 'My Records', items: [
      { view: 'attendance', icon: 'attendance', label: 'Attendance' },
      { view: 'marks', icon: 'marks', label: 'Marks & Grades' },
      { view: 'reportcard', icon: 'fileText', label: 'Report Card' },
      { view: 'fees', icon: 'fees', label: 'Fees' },
      { view: 'timetable', icon: 'timetable', label: 'Timetable' },
      { view: 'notices', icon: 'notice', label: 'Notices' }
    ] },
    { label: 'Account', items: [
      { view: 'profile', icon: 'profile', label: 'Profile' },
      { view: 'password', icon: 'lock', label: 'Change Password' }
    ] }
  ];

  Icons.hydrate();
  Shell.build(window.NAV_GROUPS);
  UI.initChrome();

  UI.registerView('dashboard', { title: 'Dashboard', subtitle: 'Your academic overview', render: renderStudentDashboard });
  UI.registerView('attendance', { title: 'My Attendance', subtitle: 'Full attendance history', render: renderStudentAttendance });
  UI.registerView('marks', { title: 'Marks & Grades', subtitle: 'Your exam results', render: renderStudentMarks });
  UI.registerView('reportcard', { title: 'Report Card', subtitle: 'Printable academic summary', render: renderStudentReportCard });
  UI.registerView('fees', { title: 'Fees', subtitle: 'Fee structure and payment history', render: renderStudentFees });
  UI.registerView('timetable', { title: 'Weekly Timetable', subtitle: '', render: renderStudentTimetable });
  UI.registerView('notices', { title: 'Notice Board', subtitle: 'Announcements from the school', render: renderStudentNotices });
  UI.registerView('profile', { title: 'My Profile', subtitle: 'Manage your account details', render: renderProfileView });
  UI.registerView('password', { title: 'Change Password', subtitle: 'Update your account credentials', render: renderPasswordView });

  UI.initRouter('dashboard');
})();
