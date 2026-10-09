# TASK: Replace Passport Expiry Date Input with 3-Dropdown Selector (DD / MM / YY)

Act as a Senior Frontend and Google Apps Script Developer. In the "Set Passport Expiry Date" modal (`Views._openPassportExpiryModal` in `Script.html`), replace the native `<input type="date">` field with three custom styled dropdown selects (`<select>`) side-by-side following the UK Date standard: Day / Month / Year (DD / MM / YY).

---

### 1. Requirements & Specifications

#### A. HTML Structure & Layout (`Script.html`)
- Replace `<input type="date" class="form-control" id="passport-expiry-date">` inside `Views._openPassportExpiryModal` with a flexbox container (`.passport-date-picker-group`).
- Inside the container, render three distinct `<select>` dropdowns:
  1. **Day (`#select-expiry-day`)**: Options from `01` to `31` with default placeholder option `<option value="">DD</option>`.
  2. **Month (`#select-expiry-month`)**: Options from `01` to `12` with default placeholder option `<option value="">MM</option>`.
  3. **Year (`#select-expiry-year`)**: Options covering 12 years starting from the current year (e.g., 2026 to 2038). Display options formatted as 2-digit years (`'26`, `'27`, `'28` ... `'38`) while storing 4-digit values (`2026`, `2027`, etc.) in value attributes, with default placeholder option `<option value="">YY</option>`.

#### B. Pre-population Logic (`Script.html`)
- When opening the modal via `Views._openPassportExpiryModal(candidateId, currentExpiry)`:
  - If a valid ISO expiry date string (`YYYY-MM-DD`, e.g., `"2031-08-15"`) is passed:
    - Parse the Year (`"2031"`), Month (`"08"`), and Day (`"15"`).
    - Automatically set the `.value` for `#select-expiry-year`, `#select-expiry-month`, and `#select-expiry-day`.
  - If no expiry date exists or `currentExpiry` is empty:
    - Default all 3 dropdowns to their blank/placeholder selections (`""`).

#### C. Validation & ISO String Construction (`Script.html`)
- When the user clicks the "Save" button (`Views._savePassportExpiry`):
  1. **Presence Check**: Validate that a non-empty selection exists for Day, Month, and Year. Display `Toast.warning('Please select a complete Day, Month, and Year.')` if any field is unselected.
  2. **Calendar Validity Check**: Validate day counts relative to the selected month and leap year rules:
     - Months with 30 days (`04`, `06`, `09`, `11`): Max 30 days.
     - February (`02`): Max 29 days in a leap year (`(year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)`), max 28 days otherwise.
     - If an invalid date is selected (e.g., February 30 or April 31), display `Toast.warning('Invalid date selected for the chosen month.')` and abort save.
  3. **ISO Construction**: Assemble the final ISO date string `YYYY-MM-DD` (e.g., `2033-06-15`).
  4. **Backend Transmission**: Send the constructed `YYYY-MM-DD` string to `GAS.call('api_updatePassportExpiryDate', candidateId, expiryDate)`.

#### D. Design System & CSS Styling (`Styles.html`)
- Add styles for `.passport-date-picker-group` and `.passport-date-select`:
  - `.passport-date-picker-group`: Flex layout with `gap: 8px; width: 100%;`.
  - `.passport-date-select`: Height ~38px, flex `1`, border `1px solid var(--border)`, border-radius `var(--radius-sm)`, background `var(--bg-surface)`, text color `var(--text-primary)`.
  - Full dark-mode compatibility (`body.dark-mode .passport-date-select`).

---

### 2. Implementation Code Snippets Needed

1. **Updated `Views._openPassportExpiryModal` HTML generation**:
```javascript
_openPassportExpiryModal(candidateId, currentExpiry) {
  let defaultY = '', defaultM = '', defaultD = '';
  if (currentExpiry && /^\d{4}-\d{2}-\d{2}$/.test(currentExpiry)) {
    const parts = currentExpiry.split('-');
    defaultY = parts[0];
    defaultM = parts[1];
    defaultD = parts[2];
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 13 }, (_, i) => {
    const y = currentYear + i;
    const shortY = String(y).slice(-2);
    return `<option value="${y}" ${String(y) === defaultY ? 'selected' : ''}>'${shortY}</option>`;
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
    <h2 class="modal__title">📅 Set Passport Expiry Date</h2>
    <button class="modal__close" onclick="Modal.close()" aria-label="Close">✕</button>
  </div>
  <div class="modal__body">
    <div class="form-group">
      <label class="form-label">Expiry Date (DD / MM / YY) <span class="required">*</span></label>
      <div class="passport-date-picker-group">
        <select class="form-select passport-date-select" id="select-expiry-day">
          <option value="">DD</option>
          ${dayOptions}
        </select>
        <select class="form-select passport-date-select" id="select-expiry-month">
          <option value="">MM</option>
          ${monthOptions}
        </select>
        <select class="form-select passport-date-select" id="select-expiry-year">
          <option value="">YY</option>
          ${yearOptions}
        </select>
      </div>
    </div>
  </div>
  <div class="modal__footer">
    <button class="btn btn--outline" onclick="Modal.close()">Cancel</button>
    <button class="btn btn--primary" id="save-passport-btn" onclick="Views._savePassportExpiry('${candidateId}')">Save Expiry Date</button>
  </div>`);
}

    Updated Views._savePassportExpiry Date Validation & Handler:

Javascript

async _savePassportExpiry(candidateId) {
  const day = document.getElementById('select-expiry-day')?.value;
  const month = document.getElementById('select-expiry-month')?.value;
  const year = document.getElementById('select-expiry-year')?.value;

  if (!day || !month || !year) {
    Toast.warning('Please select a complete Day, Month, and Year.');
    return;
  }

  const yNum = parseInt(year, 10);
  const mNum = parseInt(month, 10);
  const dNum = parseInt(day, 10);

  // Validate Days per Month
  const daysInMonth = new Date(yNum, mNum, 0).getDate();
  if (dNum > daysInMonth) {
    Toast.warning(`Invalid date: Selected month only has ${daysInMonth} days.`);
    return;
  }

  const expiry = `${year}-${month}-${day}`;
  const btn = document.getElementById('save-passport-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    const res = await GAS.call('api_updatePassportExpiryDate', candidateId, expiry);
    if (!res.success) throw new Error(res.error);

    Toast.success('Passport expiry updated.');
    Modal.close();

    if (App.state.documentsCenter && App.state.documentsCenter.loaded) {
      const cand = App.state.documentsCenter.candidates.find(c => c.candidateId === candidateId);
      if (cand && cand.docDetails && cand.docDetails['Passport']) {
        cand.docDetails['Passport'].expiryDate = expiry;
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

    CSS Styles (Styles.html):

.passport-date-picker-group {
  display: flex;
  gap: 8px;
  width: 100%;
}
.passport-date-select {
  flex: 1;
  height: 38px;
  padding: 0 8px;
  font-size: 0.88rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
}

Constraints

    Do not modify database schemas in Database.gs or backend endpoints in Code.gs.
    Ensure full responsiveness on narrow viewports and dark-mode screens.


Would you like me to adjust the year 