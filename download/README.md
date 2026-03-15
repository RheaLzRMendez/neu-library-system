# NEU Library Visitor Management System (Web & Mobile)

## 1. Project Overview
Develop a digital logbook application to track and analyze library usage by students and faculty. The system utilizes institutional login to streamline entry and record real-time statistics.

## 2. User Roles
- **End-User:** Students and Faculty members.
- **Administrator:** Library staff or management.

## 3. Functional Requirements

### Authentication (Login)
- Users must log in using a valid Institutional Google Email (e.g., @neu.edu.ph).
- Non-institutional emails are rejected for student roles.

### User Entry (Check-in Process)
- Upon login, the user must provide/select:
  - Purpose of Visit (e.g., Study, Research, Borrowing).
  - Department/College (e.g., College of Nursing, College of CS).
- **Success Action:** Display a "Welcome to NEU Library" confirmation screen upon successful submission.

### Administrator Dashboard
- **Main View:** A dashboard displaying statistical cards for visitor analytics.
- **Analytics:**
  - Filter visitor data by Day, Week, and Month.
  - Visualize a breakdown of visitors by college.
- **Search:** A search bar to find specific users by name or email.
- **User Management:** Capability to Block/Ban specific users from accessing the app.
- **Reporting:** Generate and download PDF reports of user data.
