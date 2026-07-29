/**
 * db.js
 * A tiny localStorage-backed "database" that stands in for a real backend.
 * Plain global script (no ES modules) so file:// opening works everywhere.
 *
 * Collections are stored as JSON arrays under the `sms_<collection>` key.
 * DB.* gives generic CRUD; a few higher-level helpers (deleteStudent, etc.)
 * implement the same thoughtful cascade/unlink rules the original backend
 * design used (delete children that only make sense with their parent,
 * unlink optional references instead of deleting).
 */
var DB = (function () {
  var PREFIX = 'sms_';
  var COLLECTIONS = [
    'users', 'students', 'teachers', 'parents', 'classes', 'subjects',
    'attendance', 'attendanceDetails', 'exams', 'marks',
    'feeStructures', 'payments', 'timetable', 'notices'
  ];

  // ---------------------------------------------------------------------
  // low-level storage helpers
  // ---------------------------------------------------------------------
  function key(name) { return PREFIX + name; }

  function all(name) {
    try {
      var raw = localStorage.getItem(key(name));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('DB.all failed for', name, e);
      return [];
    }
  }

  function save(name, arr) {
    localStorage.setItem(key(name), JSON.stringify(arr));
  }

  function find(name, id) {
    id = Number(id);
    var rows = all(name);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) return rows[i];
    }
    return null;
  }

  function query(name, predicate) {
    return all(name).filter(predicate);
  }

  function nextId(name) {
    var rows = all(name);
    var max = 0;
    rows.forEach(function (r) { if (r.id > max) max = r.id; });
    return max + 1;
  }

  function insert(name, obj) {
    var rows = all(name);
    obj.id = nextId(name);
    rows.push(obj);
    save(name, rows);
    return obj;
  }

  function update(name, id, patch) {
    id = Number(id);
    var rows = all(name);
    var updated = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        Object.assign(rows[i], patch);
        updated = rows[i];
        break;
      }
    }
    save(name, rows);
    return updated;
  }

  function remove(name, id) {
    id = Number(id);
    var rows = all(name).filter(function (r) { return r.id !== id; });
    save(name, rows);
  }

  function removeWhere(name, predicate) {
    var rows = all(name).filter(function (r) { return !predicate(r); });
    save(name, rows);
  }

  function updateWhere(name, predicate, patch) {
    var rows = all(name);
    rows.forEach(function (r) { if (predicate(r)) Object.assign(r, patch); });
    save(name, rows);
  }

  // ---------------------------------------------------------------------
  // business helpers
  // ---------------------------------------------------------------------
  function calculateGrade(pct) {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  }

  function gradePoint(grade) {
    var map = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
    return map[grade] || 0;
  }

  function generateCode(prefix) {
    var d = new Date();
    var ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0');
    var rand = Math.random().toString(16).slice(2, 7).toUpperCase();
    return prefix + ym + '-' + rand;
  }

  // Builds a memorable login username from a person's name ("Priya Sharma"
  // -> "priya.sharma"), disambiguating with a trailing number if that
  // username is already taken. Much easier for an admin to share/remember
  // than an opaque id-based string.
  function generateUsername(name) {
    var parts = String(name).trim().toLowerCase().split(/\s+/).filter(Boolean);
    var base = (parts[0] || 'user') + (parts.length > 1 ? '.' + parts[parts.length - 1] : '');
    base = base.replace(/[^a-z0-9.]/g, '') || 'user';
    var taken = {};
    all('users').forEach(function (u) { taken[u.username.toLowerCase()] = true; });
    if (!taken[base]) return base;
    var n = 2;
    while (taken[base + n]) n++;
    return base + n;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function classLabel(cls) {
    return cls ? (cls.name + ' - ' + cls.section) : '\u2014';
  }

  function findLinkedUser(role, profileId) {
    return query('users', function (u) { return u.role === role && u.profileId === Number(profileId); })[0] || null;
  }

  // ---------------------------------------------------------------------
  // cascading deletes / unlinks — mirrors thoughtful FK design:
  // strictly-owned child rows are deleted, optional references are unlinked
  // ---------------------------------------------------------------------
  function deleteStudent(id) {
    id = Number(id);
    removeWhere('attendanceDetails', function (r) { return r.studentId === id; });
    removeWhere('marks', function (r) { return r.studentId === id; });
    removeWhere('payments', function (r) { return r.studentId === id; });
    removeWhere('users', function (r) { return r.role === 'student' && r.profileId === id; });
    remove('students', id);
  }

  function deleteTeacher(id) {
    id = Number(id);
    updateWhere('classes', function (r) { return r.classTeacherId === id; }, { classTeacherId: null });
    updateWhere('subjects', function (r) { return r.teacherId === id; }, { teacherId: null });
    updateWhere('timetable', function (r) { return r.teacherId === id; }, { teacherId: null });
    updateWhere('attendance', function (r) { return r.markedBy === id; }, { markedBy: null });
    removeWhere('users', function (r) { return r.role === 'teacher' && r.profileId === id; });
    remove('teachers', id);
  }

  function deleteParent(id) {
    id = Number(id);
    updateWhere('students', function (r) { return r.parentId === id; }, { parentId: null });
    removeWhere('users', function (r) { return r.role === 'parent' && r.profileId === id; });
    remove('parents', id);
  }

  function deleteClass(id) {
    id = Number(id);
    var sessions = query('attendance', function (r) { return r.classId === id; }).map(function (r) { return r.id; });
    removeWhere('attendanceDetails', function (r) { return sessions.indexOf(r.attendanceId) !== -1; });
    removeWhere('attendance', function (r) { return r.classId === id; });
    removeWhere('timetable', function (r) { return r.classId === id; });
    updateWhere('students', function (r) { return r.classId === id; }, { classId: null, section: null });
    updateWhere('subjects', function (r) { return r.classId === id; }, { classId: null });
    updateWhere('exams', function (r) { return r.classId === id; }, { classId: null });
    updateWhere('feeStructures', function (r) { return r.classId === id; }, { classId: null });
    remove('classes', id);
  }

  function deleteSubject(id) {
    id = Number(id);
    removeWhere('marks', function (r) { return r.subjectId === id; });
    updateWhere('attendance', function (r) { return r.subjectId === id; }, { subjectId: null });
    updateWhere('timetable', function (r) { return r.subjectId === id; }, { subjectId: null });
    remove('subjects', id);
  }

  function deleteExam(id) {
    id = Number(id);
    removeWhere('marks', function (r) { return r.examId === id; });
    remove('exams', id);
  }

  function deleteFeeStructure(id) {
    id = Number(id);
    if (query('payments', function (r) { return r.feeStructureId === id; }).length > 0) {
      return false; // RESTRICT — mirrors the backend's financial-integrity rule
    }
    remove('feeStructures', id);
    return true;
  }

  function deleteNotice(id) { remove('notices', Number(id)); }

  // ---------------------------------------------------------------------
  // seed data
  // ---------------------------------------------------------------------
  var FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ananya', 'Diya', 'Ishaan', 'Kabir', 'Meera', 'Naina', 'Rohan', 'Saanvi', 'Tara', 'Yash', 'Zara', 'Kiran', 'Priya', 'Rahul'];
  var LAST_NAMES = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Menon', 'Kapoor', 'Das', 'Rao', 'Pillai', 'Chauhan', 'Joshi', 'Mehta'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomName() { return pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function isSeeded() { return localStorage.getItem(PREFIX + 'seeded') === '1'; }

  function seed() {
    COLLECTIONS.forEach(function (c) { save(c, []); });

    // ---- classes ----
    var classes = [];
    ['8', '9', '10'].forEach(function (grade) {
      ['A', 'B'].forEach(function (section) {
        classes.push({ id: 0, name: grade, section: section, academicYear: '2025-2026', classTeacherId: null, roomNo: 'R-' + (100 + classes.length) });
      });
    });
    classes.forEach(function (c) { insert('classes', c); });

    // ---- subjects ----
    var subjectDefs = [
      ['Mathematics', 'MATH101', 4], ['Science', 'SCI101', 4], ['English', 'ENG101', 3],
      ['Social Studies', 'SOC101', 3], ['Computer Science', 'CS101', 3]
    ];
    var subjects = subjectDefs.map(function (d) {
      // classId: null -> applies to every class, which is realistic for core
      // subjects like Math/English and also guarantees every student has a
      // full set of marks rather than only matching one random class.
      return insert('subjects', { name: d[0], code: d[1], credits: d[2], classId: null, teacherId: null });
    });

    // ---- teachers ----
    var teachers = [];
    for (var i = 0; i < 5; i++) {
      teachers.push(insert('teachers', {
        employeeNo: generateCode('TCH'), name: randomName(),
        qualification: pick(['M.Sc', 'M.A', 'B.Ed', 'Ph.D']), experienceYears: 1 + Math.floor(Math.random() * 15),
        phone: '98765' + (40000 + i), email: 'teacher' + (i + 1) + '@school.local',
        address: '12 Staff Quarters', salary: 30000 + Math.floor(Math.random() * 30000),
        photo: null, joiningDate: isoDate(2020 + i % 4, 1 + i, 10), status: 'active'
      }));
    }
    subjects.forEach(function (s, i) { update('subjects', s.id, { teacherId: teachers[i % teachers.length].id }); });
    subjects = all('subjects'); // refresh — update() re-reads from storage, so this local array was stale
    classes.forEach(function (c, i) { update('classes', c.id, { classTeacherId: teachers[i % teachers.length].id }); });
    classes = all('classes'); // refresh, same reason

    // ---- parents ----
    var parents = [];
    for (var p = 0; p < 6; p++) {
      parents.push(insert('parents', {
        name: randomName(), phone: '91234' + (50000 + p), email: 'parent' + (p + 1) + '@school.local',
        address: '123 Main Street', occupation: pick(['Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Accountant'])
      }));
    }

    // ---- students ----
    var students = [];
    for (var s = 0; s < 20; s++) {
      var cls = classes[s % classes.length];
      students.push(insert('students', {
        admissionNo: generateCode('STU'), name: randomName(),
        dob: isoDate(2010, 1 + (s % 12), 3 + (s % 25)), gender: pick(['Male', 'Female']),
        bloodGroup: pick(['A+', 'B+', 'O+', 'AB+', 'O-']),
        classId: cls.id, section: cls.section, parentId: parents[s % parents.length].id,
        phone: '90000' + (10000 + s), email: 'student' + (s + 1) + '@school.local',
        address: '45 Park Avenue', photo: null, admissionDate: isoDate(2025, 6, 2 + (s % 20)), status: 'active'
      }));
    }

    // ---- users (login accounts) ----
    insert('users', { username: 'admin', password: 'admin123', role: 'admin', profileId: null, email: 'admin@school.local', photo: null, createdAt: new Date().toISOString() });
    insert('users', { username: 'teacher1', password: 'teacher123', role: 'teacher', profileId: teachers[0].id, email: teachers[0].email, photo: null, createdAt: new Date().toISOString() });
    insert('users', { username: 'student1', password: 'student123', role: 'student', profileId: students[0].id, email: students[0].email, photo: null, createdAt: new Date().toISOString() });
    insert('users', { username: 'parent1', password: 'parent123', role: 'parent', profileId: parents[0].id, email: parents[0].email, photo: null, createdAt: new Date().toISOString() });
    update('students', students[0].id, { parentId: parents[0].id }); // guarantee parent1 sees student1

    // ---- exam + marks ----
    var exam = insert('exams', { name: 'Mid Semester 2026', examType: 'mid_semester', classId: null, academicYear: '2025-2026', examDate: todayISO() });
    students.forEach(function (stu) {
      subjects.forEach(function (subj) {
        if (subj.classId && subj.classId !== stu.classId) return;
        var obtained = Math.round((35 + Math.random() * 63) * 10) / 10;
        var pct = Math.round((obtained / 100) * 10000) / 100;
        insert('marks', {
          examId: exam.id, studentId: stu.id, subjectId: subj.id,
          marksObtained: obtained, maxMarks: 100, grade: calculateGrade(pct),
          enteredAt: new Date().toISOString()
        });
      });
    });

    // ---- attendance: last 7 days ----
    var today = new Date();
    for (var dayOffset = 6; dayOffset >= 0; dayOffset--) {
      var d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      var iso = d.toISOString().slice(0, 10);
      classes.forEach(function (cls) {
        var session = insert('attendance', { classId: cls.id, subjectId: null, date: iso, markedBy: cls.classTeacherId, createdAt: new Date().toISOString() });
        students.filter(function (stu) { return stu.classId === cls.id; }).forEach(function (stu) {
          var r = Math.random();
          var status = r < 0.85 ? 'present' : r < 0.93 ? 'absent' : r < 0.98 ? 'late' : 'leave';
          insert('attendanceDetails', { attendanceId: session.id, studentId: stu.id, status: status });
        });
      });
    }

    // ---- fee structures + payments ----
    var feeDefs = [
      ['Tuition Fee', 15000], ['Transport Fee', 4000], ['Lab Fee', 2000]
    ];
    var fees = feeDefs.map(function (d) {
      return insert('feeStructures', { classId: null, feeType: d[0], amount: d[1], dueDate: isoDate(2026, 8, 15), academicYear: '2025-2026' });
    });
    students.slice(0, 12).forEach(function (stu, idx) {
      var fee = pick(fees);
      var monthsAgo = idx % 5; // spread across the last 5 months so the dashboard chart has real shape
      var payDate = new Date();
      payDate.setDate(1); // avoid month-length overflow (e.g. Jan 31 -> Mar 3) when subtracting months
      payDate.setMonth(payDate.getMonth() - monthsAgo);
      payDate.setDate(3 + Math.floor(Math.random() * 22));
      insert('payments', {
        studentId: stu.id, feeStructureId: fee.id, amountPaid: fee.amount,
        paymentMode: pick(['cash', 'upi', 'card', 'online']), paymentDate: payDate.toISOString(),
        receiptNo: generateCode('RCPT'), status: 'paid'
      });
    });

    // ---- timetable ----
    classes.forEach(function (cls) {
      DAYS.forEach(function (day) {
        for (var period = 1; period <= 5; period++) {
          var subj = pick(subjects);
          insert('timetable', {
            classId: cls.id, day: day, period: period, subjectId: subj.id, teacherId: subj.teacherId,
            startTime: (8 + period) + ':00', endTime: (8 + period) + ':45'
          });
        }
      });
    });

    // ---- notices ----
    var adminUser = find('users', all('users')[0].id);
    insert('notices', { title: 'Welcome to the new academic year!', content: 'We are excited to kick off 2025-2026. Please check your class timetable and make sure your profile details are up to date.', postedBy: adminUser.id, targetRole: 'all', createdAt: new Date().toISOString() });
    insert('notices', { title: 'Parent-Teacher Meeting', content: 'Scheduled for next Friday at 10 AM in the main auditorium. Attendance is encouraged for all parents.', postedBy: adminUser.id, targetRole: 'parent', createdAt: new Date().toISOString() });
    insert('notices', { title: 'Staff Meeting Reminder', content: 'All teachers please attend the staff meeting this Monday in the staff room at 4 PM.', postedBy: adminUser.id, targetRole: 'teacher', createdAt: new Date().toISOString() });

    localStorage.setItem(PREFIX + 'seeded', '1');
  }

  function init() {
    if (!isSeeded()) seed();
  }

  function resetAll() {
    COLLECTIONS.forEach(function (c) { localStorage.removeItem(key(c)); });
    localStorage.removeItem(PREFIX + 'seeded');
    localStorage.removeItem(PREFIX + 'currentUser');
    localStorage.removeItem(PREFIX + 'theme');
    seed();
  }

  return {
    COLLECTIONS: COLLECTIONS,
    all: all, save: save, find: find, query: query, insert: insert, update: update,
    remove: remove, removeWhere: removeWhere, updateWhere: updateWhere,
    calculateGrade: calculateGrade, gradePoint: gradePoint, generateCode: generateCode,
    generateUsername: generateUsername, findLinkedUser: findLinkedUser,
    todayISO: todayISO, classLabel: classLabel,
    deleteStudent: deleteStudent, deleteTeacher: deleteTeacher, deleteClass: deleteClass,
    deleteSubject: deleteSubject, deleteExam: deleteExam, deleteFeeStructure: deleteFeeStructure,
    deleteNotice: deleteNotice, deleteParent: deleteParent,
    init: init, resetAll: resetAll, isSeeded: isSeeded, DAYS: DAYS
  };
})();
