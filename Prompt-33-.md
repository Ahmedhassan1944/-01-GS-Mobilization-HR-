### SURGICAL BUG FIX: Dynamic Status Dropdown in "Update Status" Modal

**Problem:** The user added a new mobilization status via System Settings, but it does not appear in the "Update Status" modal. The `<select>` dropdown in this modal is currently hardcoded and not utilizing `App.state.settings.statuses`.

Act as a Senior Frontend Developer. Apply ONLY the following surgical fix to `Script.html`.
**CRITICAL RULE:** Do NOT modify `Code.gs`, `Database.gs`, or any unrelated functions.

#### Fix: Make "Update Status" Modal Dropdown Dynamic (`Script.html`)
1. Open `Script.html` and locate the function responsible for rendering or opening the **Update Status** modal (e.g., `Views._openUpdateStatusModal`, `Views.showUpdateStatus`, or the HTML template string for this modal).
2. Find the `<select>` element for the status dropdown (e.g., `<select id="..." name="newStatus">`).
3. Replace the hardcoded `<option>` tags inside this select with a dynamic array map using `App.state.settings.statuses`.

**Implementation Logic:**
Generate the options dynamically exactly like this, ensuring the candidate's `currentStatus` is pre-selected if it matches:
```javascript
const currentStatus = candidate.CurrentStatus || ''; 
const statuses = App.state.settings?.statuses || [
  'New Candidate', 'Pending Passport', 'Pending Photo', 'Pending Academic Certificate', 
  'Pending Medical', 'Booked a medical examination', 'Documents Under Preparing', 
  'Documents Complete', 'Visa Pending', 'Visa Completed', 'Mobilized', 'Closed', 
  'Talent Acquisition Issues', 'Renewal Passport', 'Not Available', 
  'Creating WhatsApp Group', 'Unfit-PCR', 'Unfit-Injury', 'Rejected'
];

const statusOptionsHtml = statuses.map(s => {
  const isSelected = (s === currentStatus) ? 'selected' : '';
  return `<option value="${escHtml(s)}" ${isSelected}>${escHtml(s)}</option>`;
}).join('');

Inject statusOptionsHtml directly inside the <select> tag of the Update Status modal HTML template.