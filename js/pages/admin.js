/**
 * pages/admin.js
 * Bootstraps the admin dashboard: auth guard, sidebar nav, view
 * registration, router start.
 */
(function () {
  DB.init();
  var user = Auth.requireRole('admin');
  if (!user) return;

  window.NAV_GROUPS = [
    { label: 'Overview', items: [{ view: 'dashboard', icon: 'dashboard', label: 'Dashboard' }] },
    { label: 'People', items: [
      { view: 'students', icon: 'students', label: 'Students' },
      { view: 'teachers', icon: 'teacher', label: 'Teachers' },
      { view: 'parents', icon: 'family', label: 'Parents' }
    ] },
    { label: 'Academics', items: [
      { view: 'academics', icon: 'classes', label: 'Classes & Subjects' },
      { view: 'attendance', icon: 'attendance', label: 'Attendance' },
      { view: 'marks', icon: 'marks', label: 'Marks & Exams' },
      { view: 'timetable', icon: 'timetable', label: 'Timetable' }
    ] },
    { label: 'Finance', items: [{ view: 'fees', icon: 'fees', label: 'Fees' }] },
    { label: 'Communication', items: [
      { view: 'notices', icon: 'notice', label: 'Notice Board' },
      { view: 'reports', icon: 'reports', label: 'Reports' }
    ] },
    { label: 'Account', items: [
      { view: 'profile', icon: 'profile', label: 'Profile' },
      { view: 'password', icon: 'lock', label: 'Change Password' }
    ] }
  ];

  Icons.hydrate();
  Shell.build(window.NAV_GROUPS);
  UI.initChrome();

  UI.registerView('dashboard', { title: 'Dashboard', subtitle: 'Overview of school-wide activity', render: renderAdminDashboard });
  UI.registerView('students', { title: 'Student Management', subtitle: 'Add, edit and search student records', render: renderAdminStudents });
  UI.registerView('teachers', { title: 'Teacher Management', subtitle: 'Add, edit and assign teaching staff', render: renderAdminTeachers });
  UI.registerView('parents', { title: 'Parent Management', subtitle: 'Add, edit and link parents to their children', render: renderAdminParents });
  UI.registerView('academics', { title: 'Classes & Subjects', subtitle: 'Manage sections, academic year and subjects', render: renderAdminAcademics });
  UI.registerView('attendance', { title: 'Attendance Overview', subtitle: 'School-wide attendance sessions', render: renderAdminAttendance });
  UI.registerView('marks', { title: 'Marks & Exams', subtitle: 'Create exams and review recorded marks', render: renderAdminMarks });
  UI.registerView('timetable', { title: 'Timetable', subtitle: 'Build the weekly schedule per class', render: renderAdminTimetable });
  UI.registerView('fees', { title: 'Fee Management', subtitle: 'Fee structures, collection and receipts', render: renderAdminFees });
  UI.registerView('notices', { title: 'Notice Board', subtitle: 'Post announcements for the school', render: renderAdminNotices });
  UI.registerView('reports', { title: 'Reports', subtitle: 'Export and review school-wide reports', render: renderAdminReports });
  UI.registerView('profile', { title: 'My Profile', subtitle: 'Manage your account details', render: renderProfileView });
  UI.registerView('password', { title: 'Change Password', subtitle: 'Update your account credentials', render: renderPasswordView });

  UI.initRouter('dashboard');
})();
