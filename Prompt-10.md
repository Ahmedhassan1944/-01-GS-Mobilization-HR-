# PROMPT: Add Documents Validity Tracking Column & Expiration Logic

Act as a Senior Full-Stack Developer specializing in Google Apps Script (GAS) Web Applications, Google Sheets databases, and Vanilla JavaScript/CSS SPA architectures. I need to enhance the Candidate Mobilization Management System dashboard and candidate tables by adding a new **"Documents Validity"** tracking column.

---

### 1. Business Logic & Document Expiration Rules

Evaluate document validity relative to the current date (`new Date()`):

1. **Permanent Documents (No Expiration)**
   - **DocTypes**: `Photo`, `CV`, `Academic Certificate`
   - **Logic**: Always valid. Flagged as `Permanent` (no countdown or expiration calculation required).

2. **Auto-Calculated Validity (Calculated from `UploadDate`)**
   - **Medical Examination**: Valid for **2 months** (60 days) from `UploadDate`.
   - **Medical Analysis**: Valid for **3 months** (90 days) from `UploadDate`.
   - **Visa**: Valid for **3 months** (90 days) from `UploadDate`.

3. **Manual Custom Validity (Passport)**
   - **Passport**: Relies on a user-defined expiration date (`ExpiryDate`).
   - **Storage**: Read/write from an `ExpiryDate` column in `tbl_Documents`.
   - **UI**: Provide an interactive modal or inline date-picker to set/update this date easily.

4. **Validity Status Classifications & Color Coding**
   - **Valid / Permanent**: 🟢 Green (`#107c10` / `#dff6dd`)
   - **Expiring Soon** (Within 30 days): 🟡 Yellow/Amber (`#b45309` / `#fef3c7`)
   - **Expired**: 🔴 Red (`#b91c1c` / `#fee2e2`)
   - **Missing**: ⚪ Gray (`#475569` / `#f1f5f9`)

---

### 2. Required Modifications Across Files

#### A. Backend Logic (`Database.gs` / `Code.gs`)
1. **Passport Expiry Endpoint (`Database.gs`)**:
   - Create `api_updatePassportExpiryDate(candidateId, expiryDate)`:
     - Locate the candidate's `Passport` record in `tbl_Documents`.
     - Update or set the `ExpiryDate` cell value (`YYYY-MM-DD`).
     - Write an audit log entry (`api_writeLog_`).
     - Invalidate the dashboard cache via `CacheService.getScriptCache().remove('dashboard_data')`.

2. **Validity Computation Helper**:
   - Create a backend or frontend helper function `calculateDocumentValidity(doc)`:
     - Return `{ status: 'Valid'|'Expiring Soon'|'Expired'|'Missing'|'Permanent', daysRemaining: number|null, expiryDateStr: string }`.

#### B. Frontend UI & Table Rendering (`Script.html`)
1. **New Table Column ("Documents Validity")**:
   - Add a `<th>Documents Validity</th>` header to both Candidates and Dashboard tables in `Script.html`.
   - In row rendering, render compact, interactive status badges for each required document.

2. **Interactive Badge & Tooltip Features**:
   - **Hover Tooltips**: Display document name, exact expiration date (`YYYY-MM-DD`), and remaining days (e.g., `Expires in 14 days` or `Expired 5 days ago`).
   - **Passport Click Action**: Clicking the `Passport` badge opens a modal (`Views._openPassportExpiryModal(candidateId, currentExpiryDate)`) containing a date input field and a **Save Expiration Date** button.

#### C. Design System Styles (`Styles.html`)
- Add CSS classes for document validity badges and tooltips:
  - `.doc-val-badge--valid`
  - `.doc-val-badge--expiring`
  - `.doc-val-badge--expired`
  - `.doc-val-badge--missing`
  - `.doc-val-badge--permanent`
- Ensure full dark-mode contrast compatibility (`body.dark-mode`).

---

### 3. Execution Constraints
- Base all calculations on `UploadDate` from `tbl_Documents` unless `ExpiryDate` is present for Passports.
- Do not alter existing document approval status logic (`ApprovalStatus !== 'Rejected'`).
- Ensure table rows remain compact and responsive across mobile and desktop screens.