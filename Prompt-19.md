# TASK: Generalize Expiry Date Modal to Support Medical Exam & Medical Analysis

Act as a Principal Full-Stack Developer specializing in Google Apps Script (GAS) Web Applications and Vanilla JS SPAs.

### Objective
Generalize the existing manual ExpiryDate assignment modal (`Views._openPassportExpiryModal`) so that `Medical Examination` and `Medical Analysis` also support manual `ExpiryDate` updates in addition to `Passport`. Store the selected date directly in `tbl_Documents.ExpiryDate`.

---

### Implementation Requirements

#### 1. Generalized Backend Endpoint (`Database.gs`)
- Refactor `api_updatePassportExpiryDate` into a generalized function: `api_updateDocExpiryDate(candidateId, docType, expiryDate)`.
- **Validation**: Check that `candidateId`, `docType`, and `expiryDate` (`YYYY-MM-DD`) are supplied.
- **Database Update (`tbl_Documents`)**:
  - Locate the row matching `CandidateID === candidateId` AND `DocType === docType`.
  - Update the `ExpiryDate` column with the new date string.
- **Audit & Cache**:
  - Log the event via `api_writeLog_(candidateId, Session.getActiveUser().getEmail(), docType + ' Expiry Date Updated: ' + expiryDate)`.
  - Invalidate dashboard cache: `CacheService.getScriptCache().remove('dashboard_data')`.
- **Response**: Return `{ success: true, candidateId, docType, expiryDate }`.

#### 2. Generalized Modal Component (`Script.html`)
- Refactor `Views._openPassportExpiryModal(candidateId, currentExpiry)` into `Views._openDocExpiryModal(candidateId, docType, currentExpiry)`.
- **Dynamic Title**: Display `"📅 Set " + docType + " Expiry Date"`.
- **3-Dropdown Picker**: Reuse `#select-expiry-day`, `#select-expiry-month`, and `#select-expiry-year`.
- **Save Handler (`Views._saveDocExpiry(candidateId, docType)`)**:
  - Validate Day, Month, and Year selection and calendar validity (e.g. days in month).
  - Construct `YYYY-MM-DD` and call `GAS.call('api_updateDocExpiryDate', candidateId, docType, expiry)`.
  - Update the candidate's `docDetails[docType].expiryDate` in local `App.state` and trigger `Views._dcRender()` dynamically without a full page refresh.

#### 3. Validity Calculation Priority (`Script.html` — `Views._renderDocBadge`)
For `Medical Examination` and `Medical Analysis`:
- **Primary Rule**: If `doc.expiryDate` is present, compute remaining valid days directly from `doc.expiryDate` (distance to current date).
- **Fallback Rule**: If `doc.expiryDate` is empty/null, fall back to calculating validity based on `doc.issueDate` or `doc.uploadDate` (+60 days for Medical Exam, +90 days for Medical Analysis).
- **Badge Click**: Clicking any existing badge for `Passport`, `Medical Examination`, or `Medical Analysis` opens `Views._openDocExpiryModal(cand.candidateId, docType, doc.expiryDate || '')`.

---

### Production Code Reference

#### Backend (`Database.gs`)
```javascript
/**
 * Updates or sets ExpiryDate for any document type (Passport, Medical Examination, Medical Analysis).
 */
function api_updateDocExpiryDate(candidateId, docType, expiryDate) {
  const auth = requireRole_(['Admin', 'HR', 'Coordinator']);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (!candidateId || !docType || !expiryDate) {
    return { success: false, error: 'Candidate ID, Document Type, and Expiry Date are required.' };
  }

  try {
    const sheet = getSheet_(SHEET_DOCUMENTS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const candidateIdCol = headers.indexOf('CandidateID');
    const docTypeCol = headers.indexOf('DocType');
    const expiryDateCol = headers.indexOf('ExpiryDate');

    if (expiryDateCol === -1) {
      return { success: false, error: 'ExpiryDate column missing in database.' };
    }

    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][candidateIdCol] === candidateId && data[i][docTypeCol] === docType) {
        sheet.getRange(i + 1, expiryDateCol + 1).setValue(expiryDate);
        updated = true;
        break;
      }
    }

    if (updated) {
      api_writeLog_(candidateId, Session.getActiveUser().getEmail(), docType + ' Expiry Date Updated: ' + expiryDate);
      CacheService.getScriptCache().remove('dashboard_data');
      return { success: true, candidateId, docType, expiryDate };
    } else {
      return { success: false, error: docType + ' document record not found for this candidate.' };
    }
  } catch (e) {
    Logger.log(e);
    return { success: false, error: e.message };
  }
}

Frontend (Script.html)
Javascript

_openDocExpiryModal(candidateId, docType, currentExpiry) {
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

  Modal.open(`
  <div class="modal__header">
    <h2 class="modal__title">📅 Set ${escHtml(docType)} Expiry Date</h2>
    <button class="modal__close" onclick="Modal.close()" aria-label="Close">✕</button>
  </div>
  <div class="modal__body">
    <div class="form-group">
      <label class="form-label">Expiry Date (DD / MM / YY) <span class="required">*</span></label>
      <div class="passport-date-picker-group">
        <select class="form-select passport-date-select" id="select-expiry-day"><option value="">DD</option>${dayOptions}</select>
        <select class="form-select passport-date-select" id="select-expiry-month"><option value="">MM</option>${monthOptions}</select>
        <select class="form-select passport-date-select" id="select-expiry-year"><option value="">YY</option>${yearOptions}</select>
      </div>
    </div>
  </div>
  <div class="modal__footer">
    <button class="btn btn--outline" onclick="Modal.close()">Cancel</button>
    <button class="btn btn--primary" id="save-doc-expiry-btn" onclick="Views._saveDocExpiry('${candidateId}', '${docType}')">Save Expiry Date</button>
  </div>`);
},

async _saveDocExpiry(candidateId, docType) {
  const day = document.getElementById('select-expiry-day')?.value;
  const month = document.getElementById('select-expiry-month')?.value;
  const year = document.getElementById('select-expiry-year')?.value;

  if (!day || !month || !year) {
    Toast.warning('Please select a complete Day, Month, and Year.');
    return;
  }

  const yNum = parseInt(year, 10), mNum = parseInt(month, 10), dNum = parseInt(day, 10);
  const daysInMonth = new Date(yNum, mNum, 0).getDate();
  if (dNum > daysInMonth) {
    Toast.warning(`Invalid date: Selected month only has ${daysInMonth} days.`);
    return;
  }

  const expiry = `${year}-${month}-${day}`;
  const btn = document.getElementById('save-doc-expiry-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const res = await GAS.call('api_updateDocExpiryDate', candidateId, docType, expiry);
    if (!res.success) throw new Error(res.error);

    Toast.success(`${docType} expiry updated.`);
    Modal.close();

    if (App.state.documentsCenter && App.state.documentsCenter.loaded) {
      const cand = App.state.documentsCenter.candidates.find(c => c.candidateId === candidateId);
      if (cand && cand.docDetails && cand.docDetails[docType]) {
        cand.docDetails[docType].expiryDate = expiry;
        Views._dcRender();
      } else {
        Views._dcLoad();
      }
    }
  } catch (err) {
    Toast.error(err.message);
    btn.disabled = false;
    btn.innerHTML = 'Save Expiry Date';
  }
}

Constraints

    Do not alter existing document upload handlers or file archiving logic.
    Ensure full dark mode compatibility and responsive layout for the modal on all viewports.