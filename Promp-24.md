Act as a Senior Google Apps Script Backend & Frontend Developer. I need to resolve a critical bug in the "EDECS HR Mobilization Management System" Web App where calling `api_getDocumentsByCandidate` causes a promise timeout or server hang.

### Problem Description
When opening a candidate profile, the profile header loads, but the Documents section fails with:
`⚠️ No response from server for "api_getDocumentsByCandidate". This can happen right after a new deployment — try reloading the page.`

### Root Cause Analysis
1. **Server-side Hang / Unhandled Exception**: The backend function execution fails or hangs before invoking the client-side `withSuccessHandler` callback.
2. **Non-Serializable Objects**: Returning native Apps Script objects (e.g., `Date` objects, `File`/`Folder` instances, or circular references) causes `google.script.run` JSON serialization to fail silently.
3. **Expensive Drive Calls**: Performing live `DriveApp` API operations during metadata retrieval instead of reading directly from `tbl_Documents`.
4. **Type Mismatch & Property Discrepancies**: Inconsistent matching between string vs. integer IDs or column names (`candidateId` vs `CandidateID`).

---

### Required Refactoring & Implementation

#### 1. Backend Endpoint (`DocumentsCenter.gs` / `Database.gs` / `Code.gs`)
Expose `api_getDocumentsByCandidate(candidateId)` in the global scope:
- Read document metadata **exclusively** from the cached Google Sheet (`tbl_Documents`).
- Perform robust string trimming and ID conversion (`String(candidateId).trim()`).
- Convert all `Date` instances to formatted date strings (`YYYY-MM-DD HH:mm:ss`) to prevent serialization errors.
- Always return a plain, JSON-serializable object envelope:
  - Success: `{ success: true, data: candidateDocs }`
  - Error: `{ success: false, error: err.toString(), data: [] }`

#### 2. Frontend Handler (`Script.html`)
Update `Views._loadCandidateDocuments(candidateId)`:
- Sanitize `candidateId` before transmission.
- Check `res.success` explicitly and handle `res.data`.
- Dynamically update in-memory state (`App.state.docCompleteness[cleanId]`) and re-render the view.
- Handle empty arrays gracefully (`📭 No documents uploaded yet.`) without throwing errors.

---

### Production Code Reference

#### Backend (`Database.gs` / `DocumentsCenter.gs`)
```javascript
/**
 * Global API endpoint called from Script.html
 * Fetches all document records linked to a specific candidate cleanly and safely.
 */
function api_getDocumentsByCandidate(candidateId) {
  try {
    if (!candidateId && candidateId !== 0) {
      return { success: true, data: [] };
    }

    const targetId = String(candidateId).trim();
    const ss = getSpreadsheet_(); // Cached spreadsheet accessor
    const sheet = ss.getSheetByName('tbl_Documents') || ss.getSheetByName('Documents');

    if (!sheet) {
      Logger.log('Documents table not found');
      return { success: true, data: [] };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = data[0].map(h => String(h).trim());
    const idColIdx = headers.indexOf('CandidateID') !== -1 
      ? headers.indexOf('CandidateID') 
      : headers.indexOf('candidateId');

    if (idColIdx === -1) {
      Logger.log('Candidate ID column not found in tbl_Documents');
      return { success: true, data: [] };
    }

    const candidateDocs = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[idColIdx] || '').trim() === targetId) {
        const docObj = {};
        headers.forEach((header, colIndex) => {
          let cellValue = row[colIndex];
          if (cellValue instanceof Date) {
            cellValue = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
          }
          docObj[header] = cellValue !== undefined ? cellValue : '';
        });
        candidateDocs.push(docObj);
      }
    }

    return { success: true, data: candidateDocs };
  } catch (err) {
    Logger.log('Error in api_getDocumentsByCandidate: ' + err.toString());
    return { success: false, error: err.toString(), data: [] };
  }
}

Frontend (Script.html)

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

    // 1. Sync memory cache
    const newComp = computeCompleteness(docs);
    App.state.docCompleteness[cleanId] = newComp;

    // 2. Reactive view sync
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

    Do not perform live Drive API lookups during metadata retrieval.
    Ensure 100% JSON-serializable payloads for google.script.run.
    Preserve existing database schema and table column indices.