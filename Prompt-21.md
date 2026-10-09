# TASK: Inline Expiry Date Inputs Directly Inside Preview Modal Footer

Act as a Principal Frontend Engineer specializing in Google Apps Script (GAS) Web Applications and Vanilla JS SPAs.

### Problem
Currently, clicking "Set Expiry Date" closes or replaces the Document Preview Modal to open a secondary date picker modal. This hides the document image or PDF (Passport, Medical Exam, or Medical Analysis), preventing the user from reading the expiration date directly off the document while entering it.

### Required Solution
Eliminate the secondary popup modal when inside document preview. Embed the 3-dropdown date selector (Day `DD`, Month `MM`, Year `'YY`) and a "Save Date" button directly into the Document Preview Modal's footer (`Views._dcOpenPreview` in `Script.html`) for expiration-tracked documents (`Passport`, `Medical Examination`, `Medical Analysis`). This allows users to view the document document and select/save the expiration date simultaneously.

---

### Implementation Requirements

#### 1. Preview Modal Footer Refactor (`Script.html` — `Views._dcOpenPreview`)
- Inside `Views._dcOpenPreview(candidateId, docType)`:
  - Check if `['Passport', 'Medical Examination', 'Medical Analysis'].includes(docType)`.
  - Extract the current candidate's `expiryDate` string (`YYYY-MM-DD`) from `App.state.documentsCenter.candidates`.
  - Render an inline flex group (`.preview-expiry-inline-group`) on the left side of `.modal__footer`:
    ```html
    <div class="preview-expiry-inline-group">
      <span class="preview-expiry-label">📅 Expiry:</span>
      <select class="form-select preview-expiry-select" id="prev-select-day">
        <option value="">DD</option>
        ${dayOptions}
      </select>
      <select class="form-select preview-expiry-select" id="prev-select-month">
        <option value="">MM</option>
        ${monthOptions}
      </select>
      <select class="form-select preview-expiry-select" id="prev-select-year">
        <option value="">YY</option>
        ${yearOptions}
      </select>
      <button class="btn btn--primary btn--sm" id="prev-btn-save-expiry" 
        onclick="Views._savePreviewDocExpiry('${candidateId}', '${docType}')">
        Save Date
      </button>
    </div>
    ```
  - Keep `"🔗 Open in Drive"` and `"Close"` on the right side of the footer.

#### 2. Pre-population Logic (`Script.html`)
- If `currentExpiryDate` (`YYYY-MM-DD`) exists:
  - Parse `[year, month, day]` from the ISO string.
  - Pre-select the corresponding options in `#prev-select-year`, `#prev-select-month`, and `#prev-select-day` automatically upon opening the preview.
- If no expiry date exists: Default all three dropdowns to blank placeholders (`"DD"`, `"MM"`, `"YY"`).

#### 3. Save Action Handling (`Script.html` — `Views._savePreviewDocExpiry`)
When `#prev-btn-save-expiry` is clicked:
1. **Validation**:
   - Ensure Day, Month, and Year are all selected.
   - Validate calendar validity for the month (e.g. max days per month and leap years).
2. **ISO Construction**: Assemble the formatted ISO string `YYYY-MM-DD`.
3. **Async Server Transmission**:
   - Show a loading spinner on `#prev-btn-save-expiry`.
   - Call `GAS.call('api_updateDocExpiryDate', candidateId, docType, formattedExpiry)`.
4. **Local State Update & Reactive UI**:
   - Update `cand.docDetails[docType].expiryDate` in `App.state.documentsCenter`.
   - Re-render the Documents Center table badge in the background via `Views._dcRender()`.
   - Show `Toast.success(`${docType} expiry date updated.`)`.
   - Temporarily change the button text to `"Saved ✓"` in green for 1.5 seconds without closing or reloading the preview iframe.

#### 4. Design System & CSS Styling (`Styles.html`)
- Add styles for `.preview-expiry-inline-group` and `.preview-expiry-select`:
  - Inline flex container with tight gap (`6px`).
  - Dropdown height `32px` and compact font size (`0.8rem`).
  - Full dark-mode compatibility (`body.dark-mode .preview-expiry-select`).
  - Responsive flex-wrap handling for small screens.

---

### Reference Implementation Snippets

#### A. Updated Preview Modal Renderer (`Script.html`)
```javascript
async _dcOpenPreview(candidateId, docType) {
  const dc = App.state.documentsCenter;
  const cand = dc.candidates.find(c => c.candidateId === candidateId);
  const docInfo = (cand && cand.docDetails && cand.docDetails[docType]) || {};
  const currentExpiry = docInfo.expiryDate || '';

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
    
    let defaultY = '', defaultM = '', defaultD = '';
    if (currentExpiry && /^\d{4}-\d{2}-\d{2}$/.test(currentExpiry)) {
      const parts = currentExpiry.split('-');
      defaultY = parts[0]; defaultM = parts[1]; defaultD = parts[2];
    }

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 13 }, (_, i) => {
      const y = currentYear + i;
      return `<option value="${y}" ${String(y) === defaultY ? 'selected' : ''}>'${String(y).slice(-2)}</option>`;
    }).join('');

    const monthOptions = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      return `<option value="${m}" ${m === defaultM ? 'selected' : ''}>${m}</option>`;
    }).join('');

    const dayOptions = Array.from({ length: 31 }, (_, i) => {
      const d = String(i + 1).padStart(2, '0');
      return `<option value="${d}" ${d === defaultD ? 'selected' : ''}>${d}</option>`;
    }).join('');

    const inlineExpiryHtml = isExpirable ? `
      <div class="preview-expiry-inline-group">
        <span class="preview-expiry-label">📅 Expiry:</span>
        <select class="form-select preview-expiry-select" id="prev-select-day"><option value="">DD</option>${dayOptions}</select>
        <select class="form-select preview-expiry-select" id="prev-select-month"><option value="">MM</option>${monthOptions}</select>
        <select class="form-select preview-expiry-select" id="prev-select-year"><option value="">YY</option>${yearOptions}</select>
        <button class="btn btn--primary btn--sm" id="prev-btn-save-expiry" 
          onclick="Views._savePreviewDocExpiry('${candidateId}', '${docType}')">Save Date</button>
      </div>` : '';

    Modal.open(`
      <div class="modal__header">
        <h2 class="modal__title">👁 ${escHtml(res.candidateName)} — ${escHtml(docType)}</h2>
        <button class="modal__close" onclick="Modal.close()">✕</button>
      </div>
      <div class="modal__body" style="padding:0;">
        <iframe src="${res.fileUrl}" style="width:100%;height:68vh;border:none;display:block;" 
          title="${escHtml(res.fileName)}"></iframe>
      </div>
      <div class="modal__footer" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        ${inlineExpiryHtml}
        <div style="display:flex;gap:var(--sp-2);margin-left:auto;">
          <a href="${res.fileUrl.replace('/preview', '/view')}" target="_blank" class="btn btn--outline btn--sm">🔗 Open in Drive</a>
          <button class="btn btn--outline btn--sm" onclick="Modal.close()">Close</button>
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
},

async _savePreviewDocExpiry(candidateId, docType) {
  const day = document.getElementById('prev-select-day')?.value;
  const month = document.getElementById('prev-select-month')?.value;
  const year = document.getElementById('prev-select-year')?.value;

  if (!day || !month || !year) {
    Toast.warning('Please select Day, Month, and Year.');
    return;
  }

  const yNum = parseInt(year, 10), mNum = parseInt(month, 10), dNum = parseInt(day, 10);
  const daysInMonth = new Date(yNum, mNum, 0).getDate();
  if (dNum > daysInMonth) {
    Toast.warning(`Invalid date: Selected month only has ${daysInMonth} days.`);
    return;
  }

  const expiry = `${year}-${month}-${day}`;
  const btn = document.getElementById('prev-btn-save-expiry');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';

  try {
    const res = await GAS.call('api_updateDocExpiryDate', candidateId, docType, expiry);
    if (!res.success) throw new Error(res.error);

    Toast.success(`${docType} expiry date saved!`);
    
    // Update local state
    if (App.state.documentsCenter && App.state.documentsCenter.loaded) {
      const cand = App.state.documentsCenter.candidates.find(c => c.candidateId === candidateId);
      if (cand && cand.docDetails && cand.docDetails[docType]) {
        cand.docDetails[docType].expiryDate = expiry;
        Views._dcRender();