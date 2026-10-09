# TASK: Add "Set Expiry Date" Action Directly Inside Document Preview Modal

Act as a Principal Full-Stack Developer specializing in Google Apps Script (GAS) Web Applications and Vanilla JS SPAs.

### Objective
In the document preview modal (`Views._dcOpenPreview` in `Script.html`), integrate a `"📅 Set Expiry Date"` button directly into the modal footer whenever viewing an expiration-tracked document (`Passport`, `Medical Examination`, or `Medical Analysis`). This allows HR staff to set or update expiration dates immediately while reviewing document images or PDFs without closing the preview.

---

### Implementation Requirements

#### 1. Preview Modal Footer Enhancement (`Script.html` — `Views._dcOpenPreview`)
- When `Views._dcOpenPreview(candidateId, docType)` renders the preview modal HTML:
  - Check if `['Passport', 'Medical Examination', 'Medical Analysis'].includes(docType)`.
  - Retrieve the current `expiryDate` string for this document from `App.state.documentsCenter.candidates` (if available).
  - If applicable, append a button in the `.modal__footer` container alongside "Open in Drive" and "Close":
    ```html
    <button class="btn btn--outline btn--sm" id="btn-preview-set-expiry"
      onclick="Views._openDocExpiryModal('${candidateId}', '${docType}', '${currentExpiry}')">
      📅 Set Expiry Date
    </button>
    ```

#### 2. Modal Layering & Interactivity (`Script.html`)
- Clicking `#btn-preview-set-expiry` invokes the existing 3-dropdown selector modal (`Views._openDocExpiryModal(candidateId, docType, currentExpiry)`).
- Ensure the z-index and overlay state permit the Expiry Date modal to open cleanly on top of the preview modal (or close the preview modal before launching the date picker).

#### 3. Data Synchronization & Dynamic Re-rendering
- When the user saves the date via `Views._saveDocExpiry(candidateId, docType)`:
  - Transmit the updated ISO string (`YYYY-MM-DD`) via `GAS.call('api_updateDocExpiryDate', candidateId, docType, expiry)`.
  - Update `cand.docDetails[docType].expiryDate` in `App.state.documentsCenter`.
  - Trigger `Views._dcRender()` in the background to update the status badge in the Documents Center table.
  - Display `Toast.success(`${docType} expiry date updated.`)`.

#### 4. Styling & UI Consistency (`Styles.html`)
- Align `#btn-preview-set-expiry` with existing modal button themes (`.btn--outline`, `.btn--sm`).
- Ensure full dark-mode styling compatibility (`body.dark-mode`) and responsive layout on mobile viewports.

---

### Reference Code Snippet (`Script.html`)

```javascript
async _dcOpenPreview(candidateId, docType) {
  // 1. Fetch candidate record from local state
  const dc = App.state.documentsCenter;
  const cand = dc.candidates.find(c => c.candidateId === candidateId);
  const docInfo = (cand && cand.docDetails && cand.docDetails[docType]) || {};
  const currentExpiry = docInfo.expiryDate || '';

  // 2. Loading state
  Modal.open(`
    <div class="modal__header">
      <h2 class="modal__title">👁 Preview — ${escHtml(docType)}</h2>
      <button class="modal__close" onclick="Modal.close()">✕</button>
    </div>
    <div class="modal__body" style="text-align:center;padding:40px;">
      <span style="color:var(--text-secondary);">Loading preview…</span>
    </div>
  `);

  try {
    const res = await GAS.call('api_getDocumentPreviewInfo', candidateId, docType);
    if (!res.success) throw new Error(res.error);

    const isExpirable = ['Passport', 'Medical Examination', 'Medical Analysis'].includes(docType);
    const expiryBtnHtml = isExpirable ? `
      <button class="btn btn--outline btn--sm" style="margin-right:auto;" 
        onclick="Views._openDocExpiryModal('${candidateId}', '${docType}', '${currentExpiry}')">
        📅 Set Expiry Date
      </button>` : '';

    Modal.open(`
      <div class="modal__header">
        <h2 class="modal__title">👁 ${escHtml(res.candidateName)} — ${escHtml(docType)}</h2>
        <button class="modal__close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal__body" style="padding:0;">
        <iframe src="${res.fileUrl}" style="width:100%;height:70vh;border:none;display:block;" 
          title="${escHtml(res.fileName)}"></iframe>
      </div>
      <div class="modal__footer" style="display:flex;align-items:center;justify-content:space-between;">
        ${expiryBtnHtml}
        <div style="display:flex;gap:var(--sp-2);">
          <a href="${res.fileUrl.replace('/preview', '/view')}" target="_blank" class="btn btn--outline btn--sm">🔗 Open in Drive</a>
          <button class="btn btn--outline" onclick="Modal.close()">Close</button>
        </div>
      </div>
    `);
  } catch (e) {
    Modal.open(`
      <div class="modal__header">
        <h2 class="modal__title">Preview Error</h2>
        <button class="modal__close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal__body" style="text-align:center;padding:40px;color:var(--danger);">
        ${escHtml(e.message)}
      </div>
    `);
  }
}

Execution Constraints

    Do not alter existing Drive file permissions or server-side preview generation logic in api_getDocumentPreviewInfo.
    Ensure seamless interaction with Views._openDocExpiryModal and Views._saveDocExpiry.