/**
 * pages/admin-reports.js
 */
function renderAdminReports() {
  var el = document.querySelector('.view[data-view="reports"]');
  if (!el) return;

  var cards = [
    { color: 'pine', icon: 'attendance', title: 'Attendance report', desc: 'Daily attendance records across all classes with present/absent/late/leave breakdown.', action: 'Export CSV', fn: 'exportAttendanceCSV', link: 'attendance' },
    { color: 'slate', icon: 'marks', title: 'Marks report', desc: 'Exam-wise marks, grades and subject performance for every student.', action: 'Export CSV', fn: 'exportMarksCSV', link: 'marks' },
    { color: 'gold', icon: 'fees', title: 'Fee report', desc: 'All collected payments with receipt numbers, modes and outstanding balances.', action: 'Export CSV', fn: 'exportFeesCSV', link: 'fees' },
    { color: 'slate', icon: 'students', title: 'Student report', desc: 'Full roster of enrolled students with class, contact and status information.', action: 'View students', link: 'students' },
    { color: 'pine', icon: 'teacher', title: 'Teacher report', desc: 'Full roster of teaching staff with qualifications and subject load.', action: 'View teachers', link: 'teachers' },
    { color: 'crimson', icon: 'barChart', title: 'Dashboard analytics', desc: 'Live charts for attendance trends, fee collection and class distribution.', action: 'View dashboard', link: 'dashboard' }
  ];

  el.innerHTML = `<div class="grid grid-3">` + cards.map(function (c) {
    return `<div class="card"><div class="card-body">
      <div class="stat-icon ${c.color} mb-1">${Icons.html(c.icon)}</div>
      <h4 style="margin-bottom:.3rem;">${c.title}</h4>
      <p class="text-sm">${c.desc}</p>
      <button type="button" class="btn btn-outline btn-sm" data-report-action="${c.fn || ''}" data-report-link="${c.link}">${c.fn ? Icons.html('download', 'icon-sm') : ''} ${c.action}</button>
    </div></div>`;
  }).join('') + `</div>
  <div class="card mt-2"><div class="card-body flex gap-2" style="align-items:flex-start;">
    ${Icons.html('info')}
    <p class="text-sm mb-0">Reports export as CSV files, which open directly in Excel or Google Sheets. Fee receipts can additionally be printed or saved as PDF from the Fees page.</p>
  </div></div>`;

  el.querySelectorAll('[data-report-action]').forEach(function (btn) {
    var fnName = btn.getAttribute('data-report-action');
    if (fnName && window[fnName]) {
      btn.addEventListener('click', function () { window[fnName](); });
    } else {
      btn.addEventListener('click', function () { UI.go('#' + btn.getAttribute('data-report-link')); });
    }
  });
}
