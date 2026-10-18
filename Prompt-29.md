# SURGICAL BUG FIX PROMPT: Toast.info & tbl_Settings 7-Column Schema Alignment

Act as a Senior Google Apps Script Backend & Frontend Developer. Apply ONLY the 4 surgical fixes specified below to `Database.gs` and `Script.html`.

---

### CRITICAL EXECUTION RULE
Do NOT rewrite, reformat, or modify `Views.dashboard`, `Views.settings`, or any other unrelated functions or views in any file. Apply strictly these 4 targeted updates.

---

### 1. Fix `Toast.info` Method (`Script.html`)
In `Script.html`, update the `const Toast` object to include the `info(msg)` method:

```javascript
const Toast = {
  show(message, type = 'default', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', default: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'default'); }
};

2. Standardize tbl_Settings 7-Column Schema (Database.gs)

    Define const SETTINGS_HEADERS = ['SettingID', 'Category', 'ItemValue', 'ItemOrder', 'ItemMeta', 'CreatedAt', 'UpdatedAt']; directly above getOrCreateSettingsFromDb_().
    In getOrCreateSettingsFromDb_(), verify schema integrity after getDataRange().getValues(). If data.length <= 1 || data[0].length !== 7 || data[0][0] !== 'SettingID' || data[0][1] !== 'Category', execute sheet.clearContents(), set headers, seed 7-element rows from DEFAULT_SYSTEM_SETTINGS, and write via sheet.getRange(2, 1, rows.length, 7).setValues(rows).
    In api_updateSystemSettings(categoryKey, itemsArray), call getOrCreateSettingsFromDb_() at the top to ensure the 7-column layout exists before reading data. Normalize all retainedRows to 7 elements:

    retainedRows.push([row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||now, row[6]||now])

    Construct const allRows = [SETTINGS_HEADERS, ...retainedRows, ...newCategoryRows], and write using sheet.getRange(1, 1, allRows.length, 7).setValues(allRows).
    Maintain cache invalidation calls:
    Javascript

    CacheService.getScriptCache().remove('dashboard_data');
    CacheService.getScriptCache().remove('system_settings');

3. Support Dynamic Statuses in api_updateCandidateStatus (Database.gs)
Inside api_updateCandidateStatus, merge dynamic statuses from system settings into ALLOWED_STATUSES:
Javascript

(getOrCreateSettingsFromDb_().statuses || []).forEach(s => ALLOWED_STATUSES.add(s));

4. Remove Duplicate Keys in statusBadge (Script.html)
In Script.html, clean up the statusBadge helper function by removing duplicate dictionary keys for 'Talent Acquisition Issues', 'Renewal Passport', 'Not Available', 'Creating WhatsApp Group', 'Unfit-PCR', and 'Unfit-Injury':
Javascript

const statusBadge = (status) => {
  const map = {
    'Documents Requested': 'pending',
    'documents requested': 'pending',
    'Available': 'approved',
    'Rejected': 'rejected',
    'Closed': 'closed',
    'New Candidate': 'new',
    'Pending Passport': 'pending',
    'Pending Photo': 'pending',
    'Pending Academic Certificate': 'pending',
    'Pending Medical': 'pending',
    'Documents Complete': 'docs-complete',
    'Visa Pending': 'visa-pending',
    'Visa Completed': 'visa-completed',
    'Mobilized': 'mobilized',
    'Booked a medical examination': 'review',
    'Documents Under Preparing': 'pending',
    'Talent Acquisition Issues': 'ta-issues',
    'Renewal Passport': 'renewal-passport',
    'Not Available': 'not-available',
    'Creating WhatsApp Group': 'whatsapp',
    'Unfit-PCR': 'unfit-pcr',
    'Unfit-Injury': 'unfit-injury'
  };
  const cls = map[status] || 'pending';
  return `<span class="badge badge--${cls}">${status || 'Unknown'}</span>`;
};