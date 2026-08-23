# Product Requirements Document (PRD)

## Universal Mandal / Organization Membership & Financial CRM

**Document Version:** 1.0  
**Initial Organization:** Narveer Tanaji Malusare Pratishthan, Kharabwadi  
**Product Type:** Universal / Multi-Organization Ready CRM  
**Primary Focus:** Annual Membership Fee, Pending Dues, Payments, Expenses, Income, Reports & WhatsApp Communication

---

# 1. Product Overview

This product is a universal CRM and financial management system designed for mandals, associations, trusts, social organizations, clubs and similar membership-based organizations.

The first implementation will be used by:

**Narveer Tanaji Malusare Pratishthan, Kharabwadi**

However, the software must **not be hard-coded for this organization**. The architecture, database, UI and business logic must be reusable for multiple organizations in the future.

The system's primary purpose is to digitally manage:

- Member records
- Annual membership fees / vargani
- Year-wise pending dues
- Member-wise payment history
- Receipts
- WhatsApp reminders
- Payment confirmation / thank-you messages
- Income
- Expenses
- Financial balance
- Reports
- User roles and permissions
- Audit history

---

# 2. Problem Statement

Many organizations maintain membership fee records manually in notebooks, Excel files or separate records.

This creates problems such as:

- Previous years' membership fees remain pending.
- It is difficult to identify which member owes money.
- It is difficult to know which financial year's fee is pending.
- Partial payments are difficult to track.
- Payment history is not centralized.
- Receipts may be difficult to locate.
- Members do not always receive timely reminders.
- Expense records may be maintained separately.
- Management cannot quickly see total income, expense and balance.
- Manual follow-up takes significant time.
- Different committee members may maintain different records.

The CRM should solve these problems through one centralized system.

---

# 3. Product Goals

## Primary Goals

1. Maintain a complete digital record for every member.
2. Track annual membership fees year-wise.
3. Track member-wise pending amounts.
4. Track multiple years of outstanding fees.
5. Support full and partial payments.
6. Generate payment receipts.
7. Send WhatsApp pending reminders.
8. Send WhatsApp payment confirmation / thank-you messages.
9. Maintain complete income and expense records.
10. Provide management with a clear financial dashboard.
11. Generate member-wise, year-wise and financial reports.
12. Maintain an audit trail for important financial operations.
13. Keep the software reusable for multiple organizations.

---

# 4. Universal / Multi-Organization Architecture

## 4.1 Core Requirement

The system must be designed as a **universal CRM**, not as software exclusively for Narveer Tanaji Malusare Pratishthan.

The first organization is only the initial tenant/customer.

## 4.2 Organization/Tenant Concept

Each organization should have its own profile.

Example:

```text
Organization
├── Organization ID
├── Organization Name
├── Logo
├── Address
├── Contact Number
├── Email
├── Registration Details
├── Financial Year Settings
├── Membership Fee Settings
├── Receipt Settings
├── WhatsApp Settings
├── User Settings
└── Organization-specific Data
```

## 4.3 Data Isolation

All organization-specific records should be associated with an organization/tenant ID.

Examples:

- Members → organization_id
- Membership fees → organization_id
- Payments → organization_id
- Receipts → organization_id
- Expenses → organization_id
- Income → organization_id
- WhatsApp messages → organization_id
- Users/roles → organization_id
- Reports → organization_id

One organization must never be able to access another organization's data.

## 4.4 Organization Branding

The following must be configurable instead of hard-coded:

- Organization name
- Logo
- Address
- Contact details
- Email
- Receipt header
- Footer
- WhatsApp sender configuration
- Message templates

For the initial deployment:

**Narveer Tanaji Malusare Pratishthan, Kharabwadi**

will be configured through organization settings.

---

# 5. User Roles

The system should support configurable role-based access.

## 5.1 Super Admin

For the universal platform owner.

Access:

- Organizations
- Organization creation
- Organization activation/deactivation
- System settings
- Platform-level reports
- Subscription/settings if introduced later

Super Admin should not automatically have access to every organization's financial data unless explicitly authorized.

## 5.2 Organization Admin / President

Full access within their organization.

Access:

- Dashboard
- Members
- Annual Membership Fees
- Payments
- Pending Dues
- Receipts
- Income
- Expenses
- Reports
- WhatsApp
- Users
- Roles
- Organization Settings
- Audit Logs

## 5.3 Treasurer / Finance User

Financial-focused access.

Access:

- Payments
- Receipts
- Income
- Expenses
- Financial Reports
- Pending Dues
- Member payment history

## 5.4 Committee Member

Limited operational access.

Possible access:

- View Members
- View Membership Fee Status
- View Pending Members
- View Reports

Additional permissions should be configurable.

## 5.5 Data Entry Operator

Operational access:

- Add/Edit Members
- Add Payments
- Generate Receipts
- Send WhatsApp Messages

Should not have access to sensitive settings or user management unless explicitly granted.

---

# 6. Organization Setup

When a new organization is created, the setup wizard should collect:

## Organization Details

- Organization Name
- Short Name
- Logo
- Address
- City
- State
- PIN Code
- Contact Number
- Email
- Website, if applicable
- Registration Number, if applicable

## Financial Configuration

- Financial Year Start
- Financial Year End
- Default Membership Fee
- Payment Modes
- Receipt Number Prefix

## Communication Configuration

- WhatsApp configuration
- Default reminder template
- Payment confirmation template
- Thank-you template

---

# 7. Member Management Module

Each member should have a unique profile within an organization.

## Member Information

- Member ID
- Full Name
- Mobile Number
- WhatsApp Number
- Alternate Mobile Number
- Email
- Address
- Area / Locality
- Date of Birth (optional)
- Joining Date
- Membership Type
- Member Status
- Notes
- Profile Photo (optional)

## Member Status

- Active
- Inactive
- Suspended
- Left Organization

The exact statuses should be configurable.

---

# 8. Member Profile

The member profile should provide a complete view of the member.

## Sections

### Personal Information

Member's basic information.

### Membership Information

- Member ID
- Joining Date
- Membership Type
- Current Status

### Annual Fee History

Year-wise fee status.

### Payment History

All payments made by the member.

### Pending Dues

Total pending amount and pending years.

### Receipts

All receipts generated for the member.

### WhatsApp History

Messages sent to the member.

---

# 9. Annual Membership Fee / Vargani Module

This is the primary module of the system.

The organization should be able to configure the annual membership fee for each financial year.

Example:

| Financial Year | Membership Fee |
|---|---:|
| 2024-25 | ₹1,000 |
| 2025-26 | ₹1,000 |
| 2026-27 | ₹1,200 |

The amount must be configurable.

It must never be hard-coded in the application.

---

# 10. Annual Fee Assignment

For every active member, the system should be able to create an annual fee record.

Possible methods:

1. Automatically create for all eligible active members.
2. Manually assign to selected members.
3. Bulk assign to members.
4. Import existing dues from Excel/CSV.

The system must prevent accidental duplicate fee assignments for the same member and financial year.

---

# 11. Member-wise Year-wise Fee Tracking

Example:

| Year | Fee | Paid | Pending | Status |
|---|---:|---:|---:|---|
| 2024-25 | ₹1,000 | ₹1,000 | ₹0 | Paid |
| 2025-26 | ₹1,000 | ₹500 | ₹500 | Partial |
| 2026-27 | ₹1,200 | ₹0 | ₹1,200 | Pending |

## Fee Status

- Pending
- Partial
- Paid
- Waived
- Exempted
- Cancelled

Status values should be controlled by business rules.

---

# 12. Historical Pending Dues

The system must support multiple years of pending fees.

Example:

```text
Member: ABC

2023-24 → Pending ₹1,000
2024-25 → Paid ₹1,000
2025-26 → Pending ₹1,000
2026-27 → Pending ₹1,200

Total Pending = ₹3,200
```

The system should calculate total outstanding automatically.

---

# 13. Payment Module

Payment entry should support:

- Full payment
- Partial payment
- Multiple payments
- Multiple financial years
- Different payment modes

## Payment Details

- Payment ID
- Member
- Financial Year
- Payment Date
- Amount
- Payment Mode
- Transaction / Reference Number
- Receipt Number
- Collected By
- Notes

## Payment Modes

- Cash
- UPI
- Bank Transfer
- Cheque
- Other

Payment modes should be configurable.

---

# 14. Payment Allocation

If a member has multiple pending years, the system should support allocation of a payment.

Example:

Member has:

```text
2024-25 → ₹1,000 pending
2025-26 → ₹1,000 pending
2026-27 → ₹1,200 pending
```

Member pays ₹2,000.

The system should allow the authorized user to allocate:

```text
2024-25 → ₹1,000
2025-26 → ₹1,000
2026-27 → ₹0
```

The allocation must be clearly visible in payment history.

---

# 15. Receipt Module

Every valid payment should be capable of generating a receipt.

## Receipt Information

- Organization Name
- Organization Logo
- Receipt Number
- Receipt Date
- Member Name
- Member ID
- Financial Year
- Amount
- Payment Mode
- Transaction Number
- Purpose
- Collected By
- Authorized Person
- Organization Contact Details

## Receipt Features

- Generate PDF
- Print
- Download
- Share
- Send via WhatsApp

Receipt numbering must be unique within the organization.

---

# 16. WhatsApp Communication Module

WhatsApp communication is a core feature.

The system should support personalized communication based on member status.

## Message Types

1. Pending Fee Reminder
2. Payment Confirmation
3. Thank You Message
4. Receipt Sharing
5. General Announcement (future)
6. Custom Message

WhatsApp integration should use an official/approved WhatsApp Business/API solution.

---

# 17. Pending Fee WhatsApp Reminder

When a member has pending dues, an authorized user should be able to send a personalized reminder.

Message should support dynamic variables such as:

- Member Name
- Organization Name
- Financial Year
- Pending Amount
- Total Pending Amount
- Payment Instructions
- Contact Number

Example:

```text
नमस्कार [Member Name],

आपल्या [Financial Year] या वर्षाची सभासद वर्गणी ₹[Pending Amount] बाकी आहे.

कृपया आपली वर्गणी लवकरात लवकर जमा करावी.

धन्यवाद.

[Organization Name]
```

---

# 18. Payment Confirmation / Thank-you WhatsApp

After a payment is successfully recorded, the system should allow an automatic or manual confirmation message.

Example:

```text
नमस्कार [Member Name],

आपली [Financial Year] या वर्षाची सभासद वर्गणी ₹[Amount] जमा झाली आहे.

आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद. 🙏

[Organization Name]
```

---

# 19. WhatsApp Receipt Sharing

Workflow:

```text
Payment Received
       ↓
Payment Recorded
       ↓
Receipt Generated
       ↓
Receipt PDF
       ↓
WhatsApp Share
```

The user should be able to send the receipt to the member.

---

# 20. WhatsApp Message History

Every outgoing WhatsApp communication should be logged.

Fields:

- Message ID
- Organization
- Member
- Message Type
- Message Content/Template
- Sent Date/Time
- Related Payment
- Related Fee
- Delivery Status
- Failure Reason, if applicable

## Status

- Pending
- Sent
- Delivered
- Read
- Failed

---

# 21. Bulk WhatsApp Reminder

Admin should be able to select pending members and initiate bulk reminders.

Example:

```text
Pending Members: 125

Select Members
      ↓
Review Message
      ↓
Send WhatsApp Reminders
      ↓
Track Status
```

Each member must receive their own personalized amount and details.

The system should provide a confirmation/review step before bulk sending.

---

# 22. Expense Management Module

All organization expenses should be recorded centrally.

## Expense Details

- Expense ID
- Date
- Category
- Description
- Amount
- Payment Mode
- Paid To
- Bill Number
- Bill/Receipt Attachment
- Approved By
- Created By
- Notes

## Expense Categories

Examples:

- Event / Program
- Office
- Maintenance
- Electricity
- Water
- Advertising
- Materials
- Services
- Travel
- Other

Categories should be configurable per organization.

---

# 23. Income Management Module

The system should support income other than membership fees.

Examples:

- Membership Fees
- Donations
- Event Income
- Sponsorship
- Other Income

## Income Details

- Income ID
- Date
- Income Type
- Amount
- Received From
- Payment Mode
- Reference Number
- Notes
- Attachment

Income categories should be configurable.

---

# 24. Financial Dashboard

The dashboard should provide an overall financial snapshot.

## Member Summary

- Total Members
- Active Members
- Inactive Members

## Current Year Membership Fee

- Expected Collection
- Collected
- Pending
- Paid Members
- Pending Members
- Collection Percentage

## Financial Summary

- Total Income
- Total Expense
- Current Balance

## Quick Actions

- Add Member
- Add Payment
- Add Expense
- Add Income
- View Pending Dues
- Send WhatsApp Reminder
- Generate Report

---

# 25. Financial Calculation

The system should calculate:

```text
Total Income - Total Expense = Current Balance
```

Membership collection should be separately identifiable from other income.

Example:

```text
Membership Collection       ₹4,00,000
Other Income                ₹1,00,000
---------------------------------------
Total Income                ₹5,00,000

Total Expense               ₹3,00,000
---------------------------------------
Current Balance             ₹2,00,000
```

---

# 26. Reports

## 26.1 Member-wise Report

Show:

- Member Details
- Year-wise Fee
- Paid Amount
- Pending Amount
- Payment History
- Receipt History

## 26.2 Pending Dues Report

Show:

- Member Name
- Mobile Number
- Pending Years
- Pending Amount
- Last Payment Date
- WhatsApp Reminder Status

## 26.3 Year-wise Collection Report

Show:

- Financial Year
- Total Expected
- Total Collected
- Total Pending
- Collection Percentage

## 26.4 Expense Report

Filters:

- Date
- Month
- Financial Year
- Category
- Amount

## 26.5 Income Report

Filters:

- Date
- Type
- Financial Year
- Payment Mode

## 26.6 Income vs Expense Report

Show:

- Total Income
- Total Expense
- Balance

## 26.7 Payment Mode Report

Show collection by:

- Cash
- UPI
- Bank
- Cheque
- Other

## 26.8 WhatsApp Report

Show:

- Total messages
- Pending reminders
- Payment confirmations
- Receipts sent
- Sent
- Delivered
- Read
- Failed

Reports should support PDF and Excel export.

---

# 27. Search & Filters

Global search should support:

- Member Name
- Member ID
- Mobile Number
- Receipt Number
- Payment ID

Common filters:

- Organization
- Financial Year
- Member Status
- Payment Status
- Pending/Partial/Paid
- Date Range
- Expense Category
- Income Category
- Payment Mode

Organization users should only see their organization's data.

---

# 28. Notifications

The system may provide notifications for:

- New financial year created
- New annual fee assigned
- Payment received
- Payment partially received
- Large expense added
- WhatsApp failed
- Pending collection increased
- Receipt generated

Notification settings should be configurable.

---

# 29. Audit Trail

All important financial and administrative actions should be logged.

Example:

```text
User: Treasurer
Action: Payment Updated
Member: XYZ
Old Amount: ₹500
New Amount: ₹1,000
Date/Time: 23-08-2026
```

Audit records should include:

- User
- Organization
- Action
- Module
- Record ID
- Old Value
- New Value
- Date/Time
- IP/device information where appropriate

Financial records should preferably be voided/cancelled instead of permanently deleted.

---

# 30. Data Import

Since the first organization may already have historical records, the system should support importing existing data.

## Import Sources

- Excel
- CSV

## Initial Import Should Support

### Members

- Member ID
- Name
- Mobile
- Address
- Status

### Historical Membership Fees

- Member
- Financial Year
- Fee Amount
- Paid Amount
- Pending Amount
- Status

### Historical Payments

- Member
- Date
- Amount
- Payment Mode
- Reference

The import process should include validation and duplicate detection before final import.

---

# 31. Data Export

Authorized users should be able to export:

- Members
- Pending Dues
- Payments
- Receipts
- Income
- Expenses
- Financial Reports

Formats:

- Excel
- CSV
- PDF

---

# 32. Settings

Organization Admin should manage:

## Organization Settings

- Organization Name
- Logo
- Address
- Contact
- Email
- Registration Details

## Financial Settings

- Financial Year
- Annual Membership Fee
- Payment Modes
- Income Categories
- Expense Categories
- Receipt Prefix

## Communication Settings

- WhatsApp Templates
- Reminder Settings
- Confirmation Settings

## User Settings

- Users
- Roles
- Permissions

---

# 33. Important Business Rules

1. Every member must belong to an organization.
2. Every financial record must belong to an organization.
3. Organization data must remain isolated.
4. Annual membership fee must be configurable.
5. Duplicate annual fee records must not be allowed for the same member/year.
6. Partial payments must be supported.
7. Pending amount must be calculated automatically.
8. Fully paid fee must automatically become Paid.
9. Receipt numbers must be unique within an organization.
10. Financial records should not be permanently deleted by normal users.
11. Important financial changes must be recorded in the audit log.
12. WhatsApp messages must use the actual member's details and pending amount.
13. Bulk WhatsApp sending must have an authorized workflow.
14. Reports must respect organization-level permissions.
15. Organization name and branding must never be hard-coded.
16. Membership fee history must remain available even if the current fee changes.
17. Changing the current year's fee must not modify historical payment records.
18. Inactive members' historical financial records must remain accessible.
19. All monetary calculations must use precise decimal/currency handling.
20. Access to financial information must be role-based.

---

# 34. Core Workflows

## 34.1 New Organization

```text
Create Organization
        ↓
Organization Settings
        ↓
Financial Year Setup
        ↓
Membership Fee Setup
        ↓
User & Role Setup
        ↓
Organization Ready
```

## 34.2 New Member

```text
Add Member
    ↓
Generate Member ID
    ↓
Set Active Status
    ↓
Assign Annual Fee
```

## 34.3 New Financial Year

```text
Create Financial Year
        ↓
Set Membership Fee
        ↓
Select Eligible Members
        ↓
Create Annual Fee Records
        ↓
Start Pending Tracking
```

## 34.4 Payment

```text
Payment Received
        ↓
Select Member
        ↓
Select Financial Year / Pending Dues
        ↓
Enter Amount
        ↓
Allocate Payment
        ↓
Update Pending Amount
        ↓
Generate Receipt
        ↓
WhatsApp Confirmation
```

## 34.5 Pending Reminder

```text
Pending Dues
     ↓
Filter Members
     ↓
Select Members
     ↓
Review Personalized Messages
     ↓
Send WhatsApp
     ↓
Track Delivery Status
```

## 34.6 Expense

```text
Expense Added
      ↓
Optional Approval
      ↓
Expense Recorded
      ↓
Financial Balance Updated
```

---

# 35. MVP Scope

The first production version should include:

- [ ] Organization Setup
- [ ] Organization/Tenant Architecture
- [ ] Admin Login
- [ ] Role-Based Access
- [ ] Member Management
- [ ] Annual Membership Fee Setup
- [ ] Member-wise Year-wise Fee Tracking
- [ ] Historical Pending Dues
- [ ] Full Payment
- [ ] Partial Payment
- [ ] Payment Allocation
- [ ] Receipt Generation
- [ ] WhatsApp Pending Reminder
- [ ] WhatsApp Payment Confirmation
- [ ] WhatsApp Receipt Sharing
- [ ] WhatsApp Message History
- [ ] Expense Management
- [ ] Income Management
- [ ] Dashboard
- [ ] Member-wise Reports
- [ ] Pending Dues Reports
- [ ] Collection Reports
- [ ] Income/Expense Reports
- [ ] Search & Filters
- [ ] Audit Log
- [ ] Excel/CSV Import
- [ ] Excel/PDF Export

---

# 36. Future Enhancements

The following can be added after the MVP.

## Membership

- Membership card
- Digital ID card
- Member mobile app
- Family/member relationship
- Member documents

## Payments

- Online payment gateway
- UPI payment link
- Dynamic QR
- Automatic payment reconciliation
- Auto receipt generation

## Communication

- Automated monthly reminders
- SMS
- Email
- General announcements
- Event notifications
- Campaign management

## Organization Management

- Events
- Meetings
- Attendance
- Donations
- Sponsorships
- Assets
- Document management

## Platform

- Multiple organizations
- Organization subscription plans
- Organization onboarding
- Platform analytics
- Backup and restore
- Advanced permissions

---

# 37. Security Requirements

The system should provide:

- Secure authentication
- Password hashing
- Role-based authorization
- Organization-level data isolation
- Secure API access
- Input validation
- Protection against unauthorized financial modifications
- Audit logging
- Regular database backups
- Secure document/file storage
- Session management
- Appropriate access controls for WhatsApp configuration

---

# 38. Non-Functional Requirements

## Performance

- Dashboard should load quickly under normal data volumes.
- Search should return results efficiently.
- Reports should support large member/payment datasets.

## Scalability

The architecture should support:

```text
1 Organization
        ↓
10 Organizations
        ↓
100+ Organizations
```

without requiring a complete rewrite.

## Reliability

Financial records should not be lost because of normal application errors.

## Maintainability

The system should use modular architecture so that:

- Membership
- Finance
- WhatsApp
- Reports
- Organizations
- Users

can evolve independently.

---

# 39. Initial Organization Configuration

The first organization will be configured as:

**Narveer Tanaji Malusare Pratishthan**

**Location:** Kharabwadi

This information should be stored in the Organization configuration and should not be embedded directly into application code.

The same software should later allow another organization to be created without changing the application source code.

---

# 40. Success Criteria

The product will be considered successful when the organization administrator can answer the following from the system:

1. How many total members are there?
2. How many active members are there?
3. What is the current year's expected membership collection?
4. How much has been collected?
5. How much is pending?
6. Which members have pending dues?
7. How much does each member owe?
8. Which financial years are pending for a member?
9. What payments has a member made?
10. Which receipts were generated?
11. Which members received WhatsApp reminders?
12. Which members received payment confirmation?
13. What is the organization's total income?
14. What is the total expense?
15. What is the current balance?
16. Which categories have the highest expenses?
17. What is the year-wise collection performance?
18. Can historical records be viewed?
19. Can authorized users export reports?
20. Can the same software be used for another organization without code changes?

---

# 41. Final Product Vision

The final product should become a **Universal Membership & Financial CRM** that can be used by different mandals, associations, trusts, clubs and membership-based organizations.

The core vision is:

> **Member Management + Annual Membership Fees + Pending Dues + Payments + Receipts + WhatsApp Communication + Income + Expenses + Reports + Financial Transparency**

All of these should be managed from one centralized, secure and scalable system.

The first customer/organization is:

**Narveer Tanaji Malusare Pratishthan, Kharabwadi**

but the product architecture must remain **organization-independent, configurable and reusable**.
