# Comprehensive Engineering Prompt: EDECS HR Mobilization System (Google Apps Script Web App SPA)

Act as a Lead Full-Stack and Google Apps Script Developer for the **"EDECS HR Mobilization Management System"**. We need to finalize critical UI synchronization, multi-criteria filtering, and quick-action toolbar features across both the "Candidates" and "Dashboard" views.

---

### 1. Architectural & Technical Context
- **Application Architecture:** Google Apps Script V8 Web App deployed as a Single Page Application (SPA).
- **Backend:** Google Apps Script (`Code.gs`) communicating via `google.script.run`.
- **Database & Storage:** Google Sheets (structured relational records) + Google Drive (file storage for documents).
- **Frontend Stack:** HTML5, CSS3 / Tailwind CSS classes, Vanilla JavaScript.

---

### 2. Feature 1: Multi-Action Toolbar ("Buttons" Column)
Add a dedicated column named `"Buttons"` to both the Candidates table and the Dashboard candidates table (placed directly after the existing `"Actions"` column). 

Inside this column, render a compact horizontal toolbar containing 5 icon buttons for each candidate row:

1. **[Add Event]:**
   - **Icon:** Calendar with a plus badge (Calendar-plus SVG).
   - **Action:** `openAddEventModal(candidateId, candidateName)` (schedules follow-up in Google Calendar).
2. **[Update Status]:**
   - **Icon:** Dual rotating arrows / workflow sync SVG.
   - **Action:** `openUpdateStatusModal(candidateId, currentStatus)` (transitions mobilization lifecycle stage).
3. **[Edit Profile]:**
   - **Icon:** User profile edit / pen SVG.
   - **Action:** `openEditProfileModal(candidateId)` (opens profile edit drawer/modal).
4. **[Upload Document]:**
   - **Icon:** Cloud upload / file upload SVG.
   - **Action:** `openUploadDocModal(candidateId, candidateName)` (uploads files directly linked to candidate's Drive folder).
5. **[Copy Local Path]:**
   - **Icon:** Folder copy SVG.
   - **Crucial Path Format Requirements:**
     - Extract **strictly the first two names** from the candidate's full name (e.g., `"Ahmed Tawfik Elsdeq"` must become `"Ahmed Tawfik"`).
     - Output clean single backslashes without JSON stringification or double-escaping (`\\\\`):
       `U:\HR\06. Employee Database\06.1 Employee Personal Files\[First Two Names]`
       *Example:* `U:\HR\06. Employee Database\06.1 Employee Personal Files\Ahmed Tawfik`
     - Copy cleanly to the clipboard using `navigator.clipboard.writeText` with an `execCommand` fallback.
     - Provide immediate visual feedback (e.g., temporary green color change on the button and tooltip switch to "Copied!").

---

### 3. Feature 2: Multi-Criteria Filter Bar for Dashboard
Replicate the candidate filter toolbar right above the Dashboard candidate list/table.

- **Controls Required:**
  1. `Search Input`: Placeholder `"Name, HR Code, ID..."` (matches name, code, national ID, or passport).
  2. `Position Dropdown`: Labeled `"💼 Position"` with default `"All Positions"`.
  3. `Current Status Dropdown`: Labeled `"📋 Status"` with default `"All Statuses"`.
  4. `Nationality Dropdown`: Labeled `"🌍 Nationality"` with default `"All Nationalities"`.
  5. `Batch Number Dropdown`: Labeled `"📦 Batch"` with default `"All Batches"`.
  6. `✕ Clear Button`: Resets all dropdowns and search inputs, re-evaluating the table to show all records.
- **Dynamic Options:** Populate dropdowns on data load using unique, sorted values from the active candidate records.
- **Filtering Logic:** Combine all active dropdown values, search query, and any active quick status tags (e.g., Docs Complete, Missing Passport) using logical `AND`. Update the count header (e.g., `"X Candidates"`) and re-render rows dynamically.

---

### 4. Bug Fix: Document Completeness State Invalidation & Real-Time Sync
Currently, uploading a document updates the Candidate Profile view (e.g., showing 29%), but returning to the Dashboard or Candidates table still displays 0% and marks documents as missing until the user performs a full browser Hard Refresh (F5).

- **Root Cause:** Stale in-memory cache/state (`allCandidates` / `dashboardCandidates`). The upload callback does not update the client-side candidate model before re-rendering views.
- **Required Resolution:**
  1. Ensure the upload completion handler updates the candidate record in the in-memory array (`docCompleteness`, `missingDocs`, `uploadedCount`).
  2. Invalidate/update the table view immediately so that navigating back or closing the modal reflects real-time completeness without requiring a Hard Refresh.
  3. Ensure both the Profile view and the Table views share the exact same calculation helper function (`calculateDocCompleteness(candidate)`).

---

### Deliverables Expected:
1. **HTML Template:** Filter bar markup and updated `<thead>` / `<tbody>` structure with the "Buttons" column.
2. **Client-Side JavaScript:**
   - Dedicated clipboard handler for the Windows local path (strictly first 2 names, single backslashes).
   - Dynamic dropdown population and multi-filter filtering logic.
   - Cache synchronization and real-time UI re-rendering logic after document uploads.
3. **CSS / Tailwind Classes:** Clean, compact styling for table rows and buttons to avoid vertical expansion.