### SYSTEM ARCHITECT FIXES: QA Report Vulnerability Patching

**Context:** The QA Automation Audit revealed 4 specific logic and performance vulnerabilities in `Script.html`. 
Act as a Principal Developer. Apply the following 4 surgical patches to `Script.html`.

#### FIX 1: Align Expiry Logic & Prevent `NaNd` Badges
Locate `Views._renderDocBadge(cand, docType)` (or your equivalent badge rendering function). Ensure date parsing uses `_parseSafeDate`, catches invalid dates, and strictly aligns `diffDays < 0` for Expired.
**Update the logic inside the function to this:**
```javascript
  const docList = cand.docSummary || cand.docDetails || [];
  const doc = docList.find(d => String(d.DocType || d.docType || '').toLowerCase().includes(docType));
  
  if (!doc) return '<span class="doc-badge doc-badge--missing">Missing</span>';
  
  const rawDate = doc.ExpiryDate || doc.expiryDate || doc.Expiry_Date || doc.endDate;
  const expDate = typeof _parseSafeDate === 'function' ? _parseSafeDate(rawDate) : new Date(rawDate);
  
  if (!expDate || isNaN(expDate.getTime())) return '<span class="doc-badge doc-badge--nodate">Set Date ⚠️</span>';

  const _now = new Date();
  _now.setHours(0,0,0,0);
  expDate.setHours(0,0,0,0);
  
  const diffDays = Math.ceil((expDate - _now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `<span class="doc-badge doc-badge--expired">Expired (${diffDays}d)</span>`;
  if (diffDays <= 30) return `<span class="doc-badge doc-badge--exp30">${diffDays}d</span>`;
  if (diffDays <= 180) return `<span class="doc-badge doc-badge--exp180">${diffDays}d</span>`;
  return `<span class="doc-badge doc-badge--valid">${diffDays}d</span>`;

  FIX 2: Robust String Normalization in _dcApplyFilters (or _filterDocuments)

Locate the Department and Nationality filter matching logic inside the .filter() loop. Apply .trim().toLowerCase() to prevent space/case dropping.
Replace the exact matching lines with:
JavaScript

const safeNorm = (str) => String(str || '').toLowerCase().trim();
  const matchDept = depts.length === 0 || depts.some(d => safeNorm(d) === safeNorm(c.Department));
  const matchNat = nats.length === 0 || nats.some(n => safeNorm(n) === safeNorm(c.Nationality));

  FIX 3: Safe Date Calculation in CSV Export (_exportDocExpiryCSV)

Locate the _exportDocExpiryCSV() function. Find the getDaysRemaining or date calculation logic.
Update it to catch NaN:

const getDaysRemaining = (dateStr) => {
    const d = typeof _parseSafeDate === 'function' ? _parseSafeDate(dateStr) : new Date(dateStr);
    if (!d || isNaN(d.getTime())) return 'No Date';
    d.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  FIX 4: Deduplicated Multiselect Click Event Listener (Memory Leak Fix)

Locate the initPremiumMultiSelects() function.
Move the document.addEventListener('click', ...) OUTSIDE the .forEach() loop to prevent duplicate bindings:

function initPremiumMultiSelects() {
  // 1. Attach global listener ONLY ONCE to prevent memory leaks
  if (!window._premiumSelectListenerAttached) {
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.premium-multiselect.open').forEach(wrapper => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
      });
    });
    window._premiumSelectListenerAttached = true;
  }

  // 2. Loop through selects
  document.querySelectorAll('select.upgrade-multiselect').forEach(select => {
    if (select.dataset.upgraded) return;
    select.dataset.upgraded = 'true';
    select.style.display = 'none';
    
    // ... [KEEP REST OF WRAPPER CREATION LOGIC HERE] ...
    // IMPORTANT: Remove the old document.addEventListener from inside this loop.

Execution: Apply these 4 exact patches. Save Script.html and push.