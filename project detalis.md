School Management System

Project Title

School Management System

---

Problem Statement

Traditional school management processes rely heavily on manual record keeping, which leads to inefficiencies, data redundancy, and difficulty in managing student information, attendance, marks, fees, and staff records. Schools require a centralized digital platform to automate administrative tasks, improve data accuracy, and provide quick access to information for administrators, teachers, students, and parents.

---

Project Objectives

- Automate school administration processes.
- Maintain centralized student and teacher records.
- Manage attendance digitally.
- Record and track student marks and academic performance.
- Manage fee collection and payment status.
- Generate reports for administration and decision-making.
- Provide role-based access for different users.
- Reduce paperwork and improve operational efficiency.
- Ensure secure storage and retrieval of school data.

---

Modules List

1. Authentication Module

- User Login
- User Logout
- Role-Based Access Control

2. Student Management Module

- Add Student
- Update Student
- Delete Student
- View Student Details
- Search Students

3. Teacher Management Module

- Add Teacher
- Update Teacher
- Delete Teacher
- View Teacher Details

4. Class Management Module

- Create Classes
- Assign Teachers
- Assign Students

5. Attendance Management Module

- Mark Attendance
- View Attendance Records
- Generate Attendance Reports

6. Marks Management Module

- Enter Marks
- Update Marks
- Calculate Results
- Generate Mark Reports

7. Fee Management Module

- Fee Collection
- Payment Tracking
- Pending Fee Reports
- Receipt Generation

8. Parent Management Module

- Parent Information
- Student-Parent Mapping

9. Reports Module

- Student Reports
- Attendance Reports
- Fee Reports
- Academic Reports

10. Notification Module

- Announcements
- Alerts
- System Notifications

---

User Roles

Super Admin

- Full System Access

Admin

- Manage Students
- Manage Teachers
- Manage Attendance
- Manage Fees
- Generate Reports

Teacher

- Mark Attendance
- Enter Marks
- View Student Information

Student

- View Attendance
- View Marks
- View Profile

Parent

- View Child Attendance
- View Child Marks
- View Fee Status

Accountant

- Fee Collection
- Financial Reports

---

Table List

users

Stores login credentials and user roles.

Field| Type
user_id| INT
username| VARCHAR
password| VARCHAR
role| VARCHAR

students

Field| Type
student_id| INT
name| VARCHAR
roll_no| VARCHAR
class_id| INT
phone| VARCHAR
email| VARCHAR

teachers

Field| Type
teacher_id| INT
name| VARCHAR
subject| VARCHAR
phone| VARCHAR
email| VARCHAR

parents

Field| Type
parent_id| INT
name| VARCHAR
phone| VARCHAR
email| VARCHAR

classes

Field| Type
class_id| INT
class_name| VARCHAR
section| VARCHAR

attendance

Field| Type
attendance_id| INT
student_id| INT
date| DATE
status| VARCHAR

marks

Field| Type
marks_id| INT
student_id| INT
subject| VARCHAR
marks| INT

fees

Field| Type
fee_id| INT
student_id| INT
amount| DECIMAL
status| VARCHAR

assignments

Field| Type
assignment_id| INT
teacher_id| INT
title| VARCHAR
due_date| DATE

notifications

Field| Type
notification_id| INT
title| VARCHAR
message| TEXT
created_at| DATETIME

---

Technology Stack

Frontend

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript

Backend

- Python Flask
- REST APIs

Database

- MySQL

Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman

---

Expected Outcome

The School Management System will provide a centralized web-based platform for managing students, teachers, attendance, marks, fees, and reports. The system improves efficiency, accuracy, and accessibility while reducing manual administrative work.
