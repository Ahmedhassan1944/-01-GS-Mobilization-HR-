Act as a Senior Google Apps Script Backend & Frontend Developer. I need to fix a communication failure in the "EDECS HR Mobilization Management System" Web App where calling `api_getDocumentsByCandidate` fails when loading the Candidate Profile view.

### Problem Description
When opening a candidate's profile, the profile header loads, but the "Documents" section fails to load and displays:
`⚠️ No response from server for "api_getDocumentsByCandidate". This can happen right after a new deployment — try reloading the page.`

### Root Cause Analysis
1. **Strict Type Comparison Failure in `Database.gs`**: `api_getDocumentsByCandidate` compares `row[headers.indexOf('CandidateID')] === candidateId` using strict equality without type coercion or string trimming.
2. **Defensive Indexing**: `headers.indexOf('CandidateID')` is checked inside the filter loop without verifying if `indexOf` returned `-1`.
3. **Response Envelope Standardization**: Unhandled exceptions cause `google.script.run` to return `null`/`undefined`, triggering client-side promise timeouts.

---

### Required Fixes

#### 1. Backend API (`Database.gs`)
Refactor `api_getDocumentsByCandidate(candidateId)` to:
- Enforce defensive string trimming and flexible type comparison:
  `String(row[candIdCol] || '').trim() === String(candidateId || '').trim()`
- Check that `CandidateID` exists in the header row before filtering (`candIdCol !== -1`).
- Wrap execution in a `try...catch` block and return a standardized response object:
  - Success: `{ success: true, data: documents }`
  - Failure: `{ success: false, error: e.message, data: [] }`

#### 2. Frontend Candidate Detail Loader (`Script.html`)
Update `Views._loadCandidateDocuments(candidateId)` to:
- Sanitize `candidateId` before invoking `GAS.call('api_getDocumentsByCandidate', String(candidateId).trim())`.
- Check `res.success` explicitly.
- Display an empty state (`📭 No documents uploaded yet.`) when `res.data` is empty instead of throwing errors.

---

### Code Implementation

#### `Database.gs`
```javascript
/**
 * Gets all documents for a specific candidate with defensive type matching.
 * @param {string} candidateId
 */
function api_getDocumentsByCandidate(candidateId) {
  if (!candidateId) {
    return { success: false, error: 'Candidate ID is required.', data: [] };
  }

  try {
    const sheet = getSheet_(SHEET_DOCUMENTS);
    const [headers, ...rows] = sheet.getDataRange().getValues();
    const candIdCol = headers.indexOf('CandidateID');

    if (candIdCol === -1) {
      return { success: false, error: 'CandidateID column missing in tbl_Documents.', data: [] };
    }

    const targetId = String(candidateId).trim();
    const documents = rows
      .filter(row => String(row[candIdCol] || '').trim() === targetId)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });

    return { success: true, data: documents };
  } catch (e) {
    Logger.log('api_getDocumentsByCandidate error: ' + e.message);
    return { success: false, error: e.message, data: [] };
  }
}

Script.html
Javascript

async _loadCandidateDocuments(candidateId) {
  const REQUIRED_DOCS = ['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV'];

  try {
    const cleanId = String(candidateId || '').trim();
    if (!cleanId) throw new Error('Invalid Candidate ID.');

    const res = await GAS.call('api_getDocumentsByCandidate', cleanId);
    if (!res || !res.success) throw new Error(res?.error || 'Failed to retrieve documents.');
    
    const docs = res.data || [];
    const el = document.getElementById('docs-section');

    // 1. Sync JavaScript memory cache instantly
    const newComp = computeCompleteness(docs);
    App.state.docCompleteness[cleanId] = newComp;

    // 2. Reactive view sync for table rows if currently in a table view
    if (App.state.currentView === 'candidates') {
      Views._filterCandidates();
    } else if (App.state.currentView === 'dashboard') {
      Views._applyDashboardAllFilters();
      Views._renderKpiSectionsWithBatchFilter();
    }

    const completenessEl = document.getElementById('doc-completeness');
    if (completenessEl) {
      const presentDocs = newComp.presentDocs;
      const missingDocs = newComp.missingDocs;
      const completedCount = presentDocs.length;
      const totalCount = REQUIRED_DOCS.length;
      const pct = newComp.pct;

      let suggestedStatus = '';
      if (missingDocs.includes('Passport')) suggestedStatus = 'Pending Passport';
      else if (missingDocs.includes('Photo')) suggestedStatus = 'Pending Photo';
      else if (missingDocs.includes('Academic Certificate')) suggestedStatus = 'Pending Academic Certificate';
      else if (missingDocs.includes('Medical Examination')) suggestedStatus = 'Booked a medical examination';
      else if (missingDocs.includes('Medical Analysis')) suggestedStatus = 'Booked a medical examination';
      else suggestedStatus = 'Documents Complete';

      const barColor = pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : 'var(--warning)';

      completenessEl.innerHTML = `
      <div class="doc-completeness__inner">
        <div class="doc-completeness__header">
          <span class="doc-completeness__title">📋 Document Completeness</span>
          <span class="doc-completeness__pct" style="color:${barColor}">${pct}%</span>
        </div>
        <div class="doc-completeness__bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="doc-completeness__bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <div class="doc-completeness__meta">
          <span>${completedCount} of ${totalCount} documents uploaded</span>
          ${suggestedStatus ? `<span>Suggested status: ${statusBadge(suggestedStatus)}</span>` : ''}
        </div>
        ${missingDocs.length ? `
        <div class="doc-completeness__missing">
          <span class="doc-completeness__missing-label">Missing:</span>
          ${missingDocs.map(d => `<span class="doc-chip doc-chip--missing">⚠ ${escHtml(d)}</span>`).join('')}
        </div>` : `
        <div class="doc-completeness__missing">
          <span class="doc-chip doc-chip--complete">✅ All required documents uploaded</span>
        </div>`}
      </div>`;
    }

    if (!el) return;

    if (!docs.length) {
      el.innerHTML = '<div class="table-empty"><div class="table-empty__icon">📭</div>No documents uploaded yet.</div>';
      return;
    }

    el.innerHTML = docs.map(d => `
    <div class="doc-row">
      <div class="doc-row__icon" aria-hidden="true">${d.FileName?.endsWith('.pdf') ? '📄' : '🖼️'}</div>
      <div class="doc-row__info">
        <div class="doc-row__name">${escHtml(d.DocType)} — v${d.VersionNumber || 1}</div>
        <div class="doc-row__meta">${escHtml(d.FileName)} · Uploaded ${fmt.date(d.UploadDate)}</div>
      </div>
      <div style="margin:0 var(--sp-2)">${statusBadge(d.ApprovalStatus)}</div>
      <div class="doc-row__actions">
        ${d.FileURL && d.FileURL !== '#' ? `<a href="${escHtml(d.FileURL)}" target="_blank" rel="noopener" class="btn btn--outline btn--sm">View ↗</a>` : ''}
        <button class="btn btn--danger btn--sm" onclick="Views._confirmDeleteDocument('${escHtml(d.DocumentID)}','${escHtml(d.CandidateID)}','${escHtml(d.DocType)}','${escHtml(d.FileName)}')">🗑️</button>
      </div>
    </div>`).join('');
  } catch (err) {
    const el = document.getElementById('docs-section');
    if (el) el.innerHTML = `<div class="table-empty">⚠️ ${escHtml(err.message)}</div>`;
    const completenessEl = document.getElementById('doc-completeness');
    if (completenessEl) completenessEl.innerHTML = '';
  }
}

Constraints

    Do not modify sheet names or database table structures.
    Ensure full compatibility with V8 runtime and clasp push.