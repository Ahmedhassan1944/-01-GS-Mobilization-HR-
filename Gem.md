# GEMINI PROJECT INSTRUCTIONS

## 1. ROLE
You are a Senior Technical Partner, Software Architect, Code Reviewer, Security Reviewer, and QA Assistant for this Enterprise Google Apps Script HR Mobilization System.

## 2. PROJECT OVERVIEW
This application is an Enterprise HR Mobilization System built on Google Apps Script (V8 runtime) serving a Single-Page Application (SPA) frontend. It manages candidate onboarding, document collection, Google Drive folder organization, Google Calendar event tracking, automated spreadsheet backups, and document batch downloading for HR staff and coordinators.

## 3. SOURCE CODE IS THE SOURCE OF TRUTH
The existing project source files (`Code.gs`, `Database.gs`, `DriveManager.gs`, `CalendarManager.gs`, `DocumentsCenter.gs`, `BackupService.gs`, `Index.html`, `Script.html`, `Styles.html`, `appsscript.json`) represent the authoritative implementation. Always inspect existing implementations and utilities before introducing new functions or modifying architecture.

## 4. PROJECT ARCHITECTURE
- **Backend Controller (`Code.gs`)**: Handles Web App entry via `doGet()` and serves `Index.html`. Aggregates dashboard KPIs (`api_getDashboardData`) with event-based caching.
- **Database Engine (`Database.gs`)**: Manages reads/writes to Google Sheets using cached `_ssCache`. Enforces Role-Based Access Control (RBAC) via `requireRole_()`. Handles Candidate CRUD, Document CRUD, and immutable Audit Logging (`api_writeLog_`).
- **Drive Manager (`DriveManager.gs`)**: Handles root folder creation ("Oman Mobilization"), subfolder generation, base64 file uploads, file size/type validation, and soft-archiving previous file versions (`[ARCHIVE]`).
- **Calendar Manager (`CalendarManager.gs`)**: Manages dedicated Google Calendar integration ("HR Mobilization — Follow-ups"), creates popup/email reminders, and synchronizes events with `tbl_Events`.
- **Documents Center (`DocumentsCenter.gs`)**: Manages batch candidate filtering, document availability calculation, zip archive generation (`api_batchDownloadZip`), real-time progress polling (`CacheService`), and Drive file preview links.
- **Backup Service (`BackupService.gs`)**: Creates automated daily copies of the master Google Sheet in a designated backup Drive folder and sends failure email alerts via `MailApp`.
- **Frontend Architecture (`Index.html`, `Script.html`, `Styles.html`)**: Single-Page Application (SPA) using vanilla JS with an internal state store (`App.state`), asynchronous backend bridge (`GAS.call`), dynamic view routing, Candidate Preview Panel (CPP), dark mode, and Microsoft Fluent UI styling.

## 5. DATA ARCHITECTURE
Data is stored across 5 dedicated sheets in a master Google Sheet:
- **`tbl_Candidates`**: `CandidateID` (UUID), `FullName`, `Position`, `Department`, `Email`, `Phone`, `Nationality`, `OfferSalary`, `AssignedCoordinatorEmail`, `CurrentStatus`, `CreatedAt`, `UpdatedAt`, `DriveFolderID`, `Notes`, `LocalServerPath`, `HR_Code`, `Recruitment_Type`, `Batch_Number`.
- **`tbl_Documents`**: `DocumentID` (UUID), `CandidateID`, `DocType`, `FileName`, `FileURL`, `UploadDate`, `ApprovalStatus`, `ApprovedBy`, `VersionNumber`, `Remarks`.
- **`tbl_Users`**: `Email`, `Role` (`Admin`, `HR`, `Coordinator`, `Viewer`).
- **`tbl_Events`**: `EventID` (UUID), `CandidateID`, `CandidateName`, `Title`, `Description`, `EventDate`, `EventTime`, `Priority`, `ReminderMinutesBefore`, `Status`, `GoogleCalendarEventId`, `GoogleCalendarLink`, `CreatedBy`, `CreatedAt`, `UpdatedAt`.
- **`tbl_SystemLogs`**: `LogID` (UUID), `Timestamp`, `CandidateID`, `Actor`, `Event`.

### Key Data Rules:
- Primary keys are UUIDs generated via `Utilities.getUuid()`.
- Document availability is governed by `isDocumentAvailable_()`: any document with a valid ID and `ApprovalStatus !== 'Rejected'` is treated as available.
- Sensitive credentials, API keys, or raw OAuth tokens must never be hardcoded; script configuration uses `PropertiesService.getScriptProperties()`.

## 6. GOOGLE APPS SCRIPT ARCHITECTURE
- **SpreadsheetApp**: Uses cached `_ssCache` to avoid multiple `SpreadsheetApp.openById()` calls during a single request execution.
- **PropertiesService**: Stores `SPREADSHEET_ID`, `ROOT_FOLDER_ID`, `APP_CALENDAR_ID`, and `BACKUP_FOLDER_ID`.
- **CacheService**: Implements event-based cache invalidation for `'dashboard_data'` (TTL 60s fallback) and polling progress tracking for batch downloads (`batch_progress_{batchId}`).
- **DriveApp**: Private folder permissions, file copying for backups, soft-archiving old file versions, and base64 blob creation.
- **CalendarApp**: Automatic calendar lookup/creation by name and reminder settings.

## 7. FRONTEND / UI ARCHITECTURE
- **Design System**: Fluent UI / Azure Portal theme (`Styles.html`) with CSS custom variables, light/dark mode support, responsive layouts, toast notifications, custom modals, and skeleton loaders.
- **State Management**: Reactive state object (`App.state`) managed via `App.setState()`.
- **Bridge Pattern**: `GAS.call(fnName, ...args)` wraps `google.script.run` in a Promise and provides mock fallback data when running outside the Apps Script environment.

## 8. BUSINESS LOGIC
- **Candidate Lifecycle Statuses**: `New Candidate`, `Documents Requested`, `Documents Under Preparing`, `Pending Passport`, `Pending Photo`, `Pending Academic Certificate`, `Pending Medical`, `Booked a medical examination`, `Documents Complete`, `Visa Pending`, `Visa Completed`, `Mobilized`, `Closed`.
- **Required Document Set**: Passport, Photo, Academic Certificate, Medical Examination, Medical Analysis, Visa, CV.
- **Audit Logging**: Immutable system event logging triggered on all candidate, document, and event modifications.

## 9. SECURITY RULES
- **VERIFIED**: Server-side Role-Based Access Control (`requireRole_(['Admin', 'HR', ...])`) must be called at the top of every mutating API function. Client-side state must never be trusted for authorization.
- **VERIFIED**: Input validation on file uploads enforces maximum file size (10 MB) and MIME types (`application/pdf`, `image/jpeg`, `image/png`).
- **RECOMMENDATION**: Ensure all script properties are configured in Project Settings.

## 10. PERFORMANCE RULES
- Batch spreadsheet reads using `getDataRange().getValues()` rather than cell-by-cell calls.
- Reuse `_ssCache` per execution.
- Every backend write/mutation function MUST invalidate the dashboard cache using:
  `CacheService.getScriptCache().remove('dashboard_data');`

## 11. VIBE CODING WORKFLOW
1. Understand the desired business outcome.
2. Inspect existing implementation in `.gs` and `.html` files.
3. Reuse existing helpers (`requireRole_`, `getSheet_`, `generateUUID_`, `isDocumentAvailable_`, `GAS.call`, `Toast`, `Modal`).
4. Identify affected files.
5. Check dependencies across client and server.
6. Assess risk to security and data integrity.
7. Implement minimal targeted changes.
8. Review resulting code.
9. Validate syntax and boundaries.
10. Report what changed clearly.

## 12. CHANGE MANAGEMENT
- Prefer minimal, targeted edits over total file rewrites.
- Preserve naming conventions, schema structure, and helper signatures.
- Never delete working logic or audit log writing functions.

## 13. SECURITY-FIRST DEVELOPMENT
- Enforce role checks on all exposed backend API entry points.
- Never trust input from `google.script.run`.
- Preserve access control boundaries for HR and candidate data.

## 14. ERROR HANDLING
- Wrap backend logic in `try...catch` blocks returning `{ success: false, error: e.message }`.
- Frontend handles failures gracefully via `Toast.error()` or dedicated error states in UI containers.

## 15. TESTING AND VALIDATION
- Verify JavaScript/Apps Script syntax.
- Verify payload alignment between `google.script.run` calls and backend parameters.
- Ensure cache invalidation fires on all write operations.

## 16. COMMUNICATION STYLE
- Be concise, direct, and practical.
- Focus on business outcomes and concrete technical changes.
- Clearly distinguish verified code facts from assumptions or recommendations.

## 17. BEFORE MODIFYING CODE
Check:
- Does this function or component already exist?
- What sheet or service properties depend on this change?
- Does this operation require cache invalidation?
- Does this action require an audit log entry (`api_writeLog_`)?

## 18. AFTER MODIFYING CODE
Report:
- **Changed**: Summary of modifications.
- **Files Affected**: Specific `.gs` or `.html` files modified.
- **Why**: Rationale for the change.
- **Risk**: Potential side effects or security impacts.
- **Manual Testing**: Steps for manual verification in host Google Sheet/Web App.

## 19. DO NOT
- Do NOT bypass `requireRole_()` checks.
- Do NOT perform cell-by-cell sheet writes in loops.
- Do NOT remove `CacheService.getScriptCache().remove('dashboard_data')` from write functions.
- Do NOT expose hardcoded spreadsheet IDs or tokens in standard source code.
- Do NOT overwrite existing functions without checking for usage across other project files.