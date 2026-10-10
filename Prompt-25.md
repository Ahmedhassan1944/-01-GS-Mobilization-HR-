# FEATURE PARITY & UI ALIGNMENT: Unify Medical Documents with Passport "Set Date" Logic

Act as a Principal Full-Stack Developer specializing in Google Apps Script (GAS) Web Applications and Vanilla JS SPAs.

### Objective
In the Documents Center table (`Views.documentsCenter` in `Script.html`), unify the behavior of `Medical Examination` and `Medical Analysis` to strictly mirror the manual date selection logic used for `Passport`.

---

### Core Behavioral Rules

1. **No Auto-Date on Upload**: Uploading a `Medical Examination` or `Medical Analysis` document must **NEVER** auto-assign an issue date, upload date, or computed expiry date (+60 or +90 days). The date field in `tbl_Documents` must remain `null` or empty until explicitly set by the user.
2. **"Set Date ⚠️" Badge for Undated Uploads**: If a document is uploaded but has no manually assigned date, render the warning action badge:
   `<div class="doc-cell-badge doc-cell-badge--needs-action" onclick="Views._openDocExpiryModal(candidateId, docType, '')">Set Date ⚠️</div>`
3. **Manual Date Picker Trigger**: Clicking `Set Date ⚠️` or any existing date badge opens `Views._openDocExpiryModal(candidateId, docType, currentExpiryDate)`.
4. **Calculated Remaining Days Only After Selection**: Compute and display remaining valid days (`44d`, `74d`, `Expired (-3d)`, etc.) **ONLY** after a date has been manually set by the user.

---

### Implementation Requirements

#### 1. Backend & Upload Handler (`DriveManager.gs` / `Database.gs`)
- In `api_uploadFileToDrive` and `api_writeDocumentRecord_`:
  - Do NOT default `issueDate` or `expiryDate` to `new Date()` or computed date offsets for `Medical Examination` or `Medical Analysis`.
  - Leave `IssueDate` and `ExpiryDate` blank/empty unless explicitly provided by the user during file upload.

#### 2. Table Cell Rendering Template (`Script.html` — `Views._renderDocBadge`)
Update `Views._renderDocBadge(cand, docType)` so `Medical Examination` and `Medical Analysis` use the exact same cell rendering pipeline as `Passport`:

```javascript
_renderDocBadge(cand, docType) {
  const summary = cand.docSummary || {};
  const details = cand.docDetails || {};
  const status = summary[docType] || 'Missing';

  // 1. Missing Document
  if (status === 'Missing') {
    return `<div class="doc-cell-badge doc-cell-badge--missing" title="Document missing" 
              onclick="Views._openUploadModal('${cand.candidateId}', '${cand.driveFolderId || ''}', '${docType}')">Missing</div>`;
  }

  const doc = details[docType] || {};
  const assignedDate = doc.expiryDate || doc.issueDate || doc.documentDate;

  // 2. Uploaded but no date set manually -> Render "Set Date ⚠️"
  if (!assignedDate) {
    return `<div class="doc-cell-badge doc-cell-badge--needs-action" title="Set Expiry / Validity Date" 
              onclick="Views._openDocExpiryModal('${cand.candidateId}', '${docType}', '')">Set Date ⚠️</div>`;
  }

  // 3. Manually assigned date -> Compute remaining days relative to today
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const refDate = new Date(assignedDate);
  const diffTime = refDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let badgeClass = 'doc-cell-badge--valid';
  let badgeText = `${diffDays}d`;

  if (diffDays <= 0) {
    badgeClass = 'doc-cell-badge--expired';
    badgeText = `Expired (${diffDays}d)`;
  } else if (diffDays <= 30) {
    badgeClass = 'doc-cell-badge--expiring';
    badgeText = `${diffDays}d`;
  }

  const tooltip = `Assigned Date: ${assignedDate}&#10;Click to update expiry date`;

  return `<div class="doc-cell-badge ${badgeClass}" title="${tooltip}" 
            onclick="Views._openDocExpiryModal('${cand.candidateId}', '${docType}', '${assignedDate}')">${badgeText}</div>`;
}

3. Modal Save Logic (Script.html — Views._saveDocExpiry)

    Ensure saving a date via Views._saveDocExpiry updates cand.docDetails[docType].expiryDate in local App.state and triggers Views._dcRender() to dynamically update the badge from Set Date ⚠️ to the remaining days count (e.g. 44d) without a full page refresh.

Constraints

    Maintain identical badge CSS classes (.doc-cell-badge--needs-action, .doc-cell-badge--valid, .doc-cell-badge--expiring, .doc-cell-badge--expired, .doc-cell-badge--missing).
    Ensure no auto-generated dates affect candidate document statistics in tbl_Documents.