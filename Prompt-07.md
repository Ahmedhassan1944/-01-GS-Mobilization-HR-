Act as a Senior Google Apps Script Developer and UI Architect. I need to update the "Batch Number (Optional)" dropdown field in the New Candidate form and ensure full compatibility across candidate creation, viewing, and editing.

---

### 1. Requirements Overview

#### A. Dropdown Options Update (`Script.html` — `Views.newCandidate()`)
Update the `<select id="nc-batch">` element in the New Candidate form to include the following full set of options:

1. `— Not assigned —` (value: `""`)
2. `Staff Batch 1` (value: `Staff Batch 1` or `Batch 1`)
3. `Staff Batch 2` (value: `Staff Batch 2` or `Batch 2`)
4. `Staff Batch 3` (value: `Staff Batch 3` or `Batch 3`)
5. `Staff Batch 4` (value: `Staff Batch 4` or `Batch 4`)
6. `Kalhat Batch 1` (value: `Kalhat Batch 1`)
7. `Kalhat Batch 2` (value: `Kalhat Batch 2`)

---

### 2. Files & Modifications Required

#### A. Frontend Candidate Form (`Script.html`)
- Update the `<select id="nc-batch">` dropdown options in `Views.newCandidate()`.
- In `Views._submitNewCandidate()`, ensure the selected `nc-batch` value is extracted (`document.getElementById('nc-batch').value.trim()`) and sent in the payload as `batchNumber`.

#### B. Candidate Detail / Edit Views (`Script.html`)
- If a candidate edit profile modal or batch update dropdown exists, update its batch selection list to match all 6 batch options.
- Ensure the candidate detail view (`Views.candidateDetail()`) correctly reads and displays the stored batch string (e.g., `Kalhat Batch 1` or `Staff Batch 1`).

#### C. Backend Saving & Fetching (`Database.gs` & `Code.gs`)
- Verify that `api_createCandidate` appends the `batchNumber` string into the `Batch_Number` column of `tbl_Candidates`.
- Verify that `api_getAllCandidates` returns the `Batch_Number` property in candidate objects so frontend views can populate the selected option seamlessly.

---

### 3. Execution Constraints
- Do not modify existing dropdown styling or layout classes (`form-group`, `form-select`).
- Treat all `Kalhat Batch` options identically to `Staff Batch` options.
- Maintain full backward compatibility with any previously created candidate records.
- Do not alter unrelated form fields, validation logic, or database columns.