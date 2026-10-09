# Engineering Prompt: Documents Center Table Refactoring & Document Validity Tracking

Act as a Principal Full-Stack Engineer specializing in Google Apps Script (GAS) Web Applications, Google Sheets backends, and Vanilla JavaScript/CSS Single-Page Applications (SPA). We need to refactor ONLY the table inside the "📁 Documents Center" view in our HR Mobilization Management System.

We are replacing the legacy "Available Documents" and "Missing Documents" columns with 4 dedicated, high-density validity tracking columns for document types that follow expiration rules.

---

### 1. Scope & Target Files
- **Scope**: Restrict table changes STRICTLY to the "Documents Center" view. Do NOT modify Candidates or Dashboard tables or their calculations.
- **Files to Modify**: `DocumentsCenter.gs`, `Database.gs`, `Script.html` (Documents Center rendering & modal logic), and `Styles.html`.

---

### 2. Business Logic & Expiration Calculations

Validity is dynamically computed relative to the client date (`new Date()`):

1. **Medical Examination**: Valid for **60 days**. Calculated from custom `IssueDate` (if provided in `tbl_Documents`); fallback to `UploadDate`.
2. **Medical Analysis**: Valid for **90 days**. Calculated from custom `IssueDate` (if provided in `tbl_Documents`); fallback to `UploadDate`.
3. **Visa**: Valid for **90 days**. Calculated from custom `IssueDate` (if provided in `tbl_Documents`); fallback to `UploadDate`.
4. **Passport**: Explicit expiration date read/written from `tbl_Documents.ExpiryDate`.
   - If Passport is uploaded but `ExpiryDate` is null/empty: Flag as `"Needs Expiry Date"`.

#### Status Classifications & Visual Badges:
- 🟢 **Valid**: > 30 days remaining (Green) ➔ e.g., `"75d"`
- 🟡 **Expiring Soon**: 1 to 30 days remaining (Amber/Yellow) ➔ e.g., `"14d"`
- 🔴 **Expired**: ≤ 0 days (Red) ➔ e.g., `"Expired (-3d)"`
- 🟠 **Needs Expiry**: Passport uploaded without date set (Orange) ➔ e.g., `"Set Date ⚠️"`
- ⚪ **Missing**: Document not uploaded or rejected (Slate/Gray) ➔ e.g., `"Missing"`

---

### 3. Implementation Requirements

#### A. Backend & Database (`Database.gs` / `DocumentsCenter.gs`)
1. **Schema Check (`tbl_Documents`)**:
   - Ensure `IssueDate` and `ExpiryDate` columns exist in `tbl_Documents`. If missing from the header row, append them defensively.
2. **Document Upload Handler**:
   - Update `api_uploadFileToDrive` / `api_writeDocumentRecord_` to accept an optional `issueDate` parameter (`YYYY-MM-DD`). If supplied, save it in the `IssueDate` column; otherwise default to the current upload timestamp.
3. **Passport Expiration Endpoint**:
   - Implement `api_updatePassportExpiryDate(candidateId, expiryDate)` in `Database.gs`:
     - Update or set `ExpiryDate` for the candidate's `Passport` record in `tbl_Documents`.
     - Log the mutation via `api_writeLog_`.
     - Invalidate the cache via `CacheService.getScriptCache().remove('dashboard_data')`.

#### B. Frontend Documents Center Table (`Script.html`)
1. **Table Headers**:
   - In `Views.documentsCenter()`, replace `"📄 Available"` and `"⚠️ Missing"` header columns with 4 discrete document headers:
     - `Passport`
     - `Visa`
     - `Medical Exam`
     - `Medical Analysis`
2. **Interactive Cell Rendering**:
   - For each candidate row, evaluate document status for each of the 4 document types and render a compact badge:
     - **Clicking "Set Date ⚠️"**: Opens `Views._openPassportExpiryModal(candidateId, currentExpiryDate)` to enter/save the Passport expiry date. Upon saving, update local state and re-render the table cell dynamically without requiring a full page refresh.
     - **Clicking "Missing"**: Opens the document upload modal pre-selected for that candidate and document type, including an optional `"Issue / Exam Date"` datepicker field.
     - **Hover Tooltips**: Display exact dates (`IssueDate` / `ExpiryDate`) and calculated remaining days on hover.

#### C. Design System Styles (`Styles.html`)
- Add high-density badge styling for table cells:
  - `.doc-cell-badge` (base flex container, compact typography, rounded pill shape)
  - `.doc-cell-badge--valid` (Green theme)
  - `.doc-cell-badge--expiring` (Amber theme)
  - `.doc-cell-badge--expired` (Red theme)
  - `.doc-cell-badge--needs-action` (Orange theme with warning accent)
  - `.doc-cell-badge--missing` (Slate gray theme with subtle border)
- Ensure high contrast and dark mode compatibility under `body.dark-mode`.

---

### 4. Constraints
- Do not modify candidate table structures or KPI card logic on the Candidates or Dashboard pages.
- Ensure all document validity calculations are resilient to null or malformed date inputs.
- Keep table rows compact and vertically aligned.