# Smart Campus Complaint System — Demonstration Walkthrough

This document provides an end-to-end walkthrough for faculty review, viva voce demonstration, and system verification.

---

## 👥 Role Accounts & Portals

The application implements strict Role-Based Access Control (RBAC) across three distinct user roles:

| Role | Default Access | Primary Functions |
| :--- | :--- | :--- |
| **Student** | `/student/*` | Submit grievances, real-time ML category/priority prediction, track status on audit timeline. |
| **Staff** | `/staff/*` | View department-isolated queue, self-assign issues, provide resolution remarks, close tickets. |
| **Admin** | `/admin/*` | Campus-wide complaint triage, user/department/location management, Smart Analytics dashboard, factual insights, CSV/PDF reporting. |

---

## 🎬 Demonstration Scenarios

### Scenario 1: Student Complaint Submission with Machine Learning
1. Navigate to `/register` or `/login`.
2. Register an account with role **Student** (e.g., username `student_demo`, password `DemoPassword@123`).
3. Click **"New Complaint"** (`/student/new-complaint`).
4. Type a realistic campus facility issue:
   - **Title**: `Wi-Fi router in library has failed`
   - **Description**: `The wireless network router in the 2nd floor computer reading room is blinking red. Students are unable to access the library portal or academic journals.`
   - Notice the **Machine Learning Classifier** automatically predicts:
     - **Category**: `IT` (with confidence indicator)
     - **Priority**: `High` (due to widespread academic impact)
5. Select Location: `Main Academic Block` and submit.
6. The system immediately redirects to the **Complaint Details** page featuring an immutable **Visual Tracking Timeline**:
   - `Pending` badge is active with submission timestamp.

---

### Scenario 2: Staff Queue, Department Isolation & Lifecycle Resolution
1. Log out or open a private window.
2. Register an account with role **Staff** and department **IT** (or use an existing staff account).
3. Log in and navigate to the **Staff Dashboard** (`/staff/dashboard`).
4. Notice the department metrics cards:
   - Total complaints assigned to IT.
   - Pending issues awaiting triage.
5. In the **Complaint Queue** (`/staff/complaints`), locate the newly submitted library Wi-Fi issue.
6. Click **"Assign to Me"**:
   - The status updates to `Assigned` with the staff technician's name recorded.
7. Click **"Update Status"** → Select `In Progress`:
   - Enter remark: `Technician dispatched with replacement Gigabit router.`
8. Click **"Resolve Complaint"**:
   - Enter mandatory resolution remark: `Replaced malfunctioning router with Cisco AP 3800. Signal verified at 150 Mbps.`
   - Status transitions to `Resolved` and records `resolved_at` timestamp.
9. Click **"Close Complaint"**:
   - Confirm final verification: `Confirmed working with student.`
   - Status becomes `Closed` (terminal state).
   - Any further transition attempts are rejected by the system.

---

### Scenario 3: Admin Overview & Management
1. Log in with an **Admin** account (`/admin/dashboard`).
2. Explore the Administrative management tools:
   - **All Complaints** (`/admin/complaints`): Campus-wide table with bulk search, multi-filter dropdowns, and manual override capabilities.
   - **User Management** (`/admin/users`): View all registered students, staff members, and administrators.
   - **Departments & Locations** (`/admin/departments`, `/admin/locations`): Add or update campus infrastructure zones.

---

### Scenario 4: Smart Analytics, Dynamic Insights & Report Exports
1. Navigate to **Campus Analytics** (`/admin/analytics`).
2. **Overview KPIs**:
   - Review live count of total, pending, assigned, in progress, resolved, and closed complaints.
   - Real-time resolution rate and closure rate calculations.
3. **Smart Campus Insights**:
   - Observe deterministic, factual observations generated from live database data:
     - **Top Complaint Category**: Displays highest category volume and percentage share.
     - **Most Affected Department**: Highlights departments with the heaviest complaint load.
     - **Most Reported Location**: Pinpoints high-frequency campus incident zones.
     - **Average Resolution Turnaround**: Average hours from creation to resolution (with fastest and slowest turnaround stats).
     - **Workload Observation**: Flags open backlogs across departments.
4. **Filter Interactivity**:
   - In the filter bar, select **Category: IT** or **Priority: High**.
   - Notice that all KPI cards, trend charts, distribution tables, and Smart Campus Insights dynamically recalculate to reflect *only* the filtered data.
5. **CSV Export**:
   - Click **"Export CSV"**:
   - System streams `campus-analytics-YYYY-MM-DD.csv` containing 10 structured sections ready for Excel analysis.
6. **PDF Report Export**:
   - Click **"Export PDF"**:
   - System compiles and downloads a publication-grade administrative report `campus-analytics-YYYY-MM-DD.pdf` featuring CampusFlow header branding, executive summary, smart insights, side-by-side distribution tables, and dynamic `"Page X of Y"` footers.

---

## 🔍 Verification Endpoints

- **API Base**: `http://localhost:8000/api`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **System Health Check**: `http://localhost:8000/api/v1/health`
- **Analytics Overview API**: `http://localhost:8000/api/v1/admin/analytics/overview`
- **Smart Insights API**: `http://localhost:8000/api/v1/admin/analytics/insights`
- **CSV Export API**: `http://localhost:8000/api/v1/admin/analytics/export/csv`
- **PDF Export API**: `http://localhost:8000/api/v1/admin/analytics/export/pdf`
