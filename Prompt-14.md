# Engineering Prompt: Fix Empty Filter Dropdowns on Dashboard Candidate Table

Act as a Senior Frontend and Google Apps Script Developer working on the "EDECS HR Mobilization Management System" SPA (`Script.html`).

---

### Problem Description
The newly added filter dropdowns above the Dashboard Candidate Table are completely empty, displaying only their default placeholder options (`"💼 All Positions"`, `"📋 All Statuses"`, `"🌍 All Nationalities"`, `"📦 All Batches"`).

---

### Root Causes & Investigation Requirements

1. **DOM ID Collisions / Element Isolation**:
   - Verify that all filter elements on the Dashboard have unique IDs that do not conflict with the Candidates view (`#cand-tb-*`).
   - Use distinct IDs for the Dashboard filter controls:
     - Search input: `dash-tb-search`
     - Position select: `dash-tb-pos`
     - Status select: `dash-tb-status`
     - Nationality select: `dash-tb-nat`
     - Batch select: `dash-tb-batch`
   - If IDs overlap between views, `document.getElementById()` returns the hidden view's DOM node, leaving the visible Dashboard dropdowns unpopulated.

2. **Population Timing & Data Source Alignment**:
   - Ensure the dropdown population function runs immediately after the candidate dataset (`App.state.candidates` / `candsRes.data`) is successfully loaded via `GAS.call('api_getAllCandidates')`.
   - Verify that property names on candidate objects match the backend schema exactly:
     - Position: `c.Position`
     - Status: `c.CurrentStatus`
     - Nationality: `c.Nationality`
     - Batch Number: `c.Batch_Number` (or via `Views._getBatchValue(c)`)

3. **Population Pattern & Execution**:
   - Update or call `Views._populateCandidateFilterDropdowns(candidates)` to populate both the Candidates view (`cand-tb-*`) AND the Dashboard view (`dash-tb-*`) in a single pass.
   - Extract unique, non-empty, trimmed values for each category and sort them alphabetically before appending `<option>` elements.

---

### Implementation Details (`Script.html`)

#### 1. Dropdown Population Function
```javascript
_populateCandidateFilterDropdowns(candidates) {
  if (!candidates || !candidates.length) return;

  const posSet = new Set();
  const statusSet = new Set();
  const natSet = new Set();
  const batchSet = new Set();

  candidates.forEach(c => {
    if (c.Position) posSet.add(c.Position.trim());
    if (c.CurrentStatus) statusSet.add(c.CurrentStatus.trim());
    if (c.Nationality) natSet.add(c.Nationality.trim());
    const batchVal = Views._getBatchValue(c);
    if (batchVal) batchSet.add(batchVal.trim());
  });

  const fill = (elementId, set) => {
    const select = document.getElementById(elementId);
    if (!select) return;
    const defaultOption = select.options[0];
    select.innerHTML = '';
    if (defaultOption) select.appendChild(defaultOption);

    [...set].sort((a, b) => a.localeCompare(b)).forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  };

  // Populate Candidates Page Dropdowns
  fill('cand-tb-pos', posSet);
  fill('cand-tb-status', statusSet);
  fill('cand-tb-nat', natSet);
  fill('cand-tb-batch', batchSet);

  // Populate Dashboard Dropdowns
  fill('dash-tb-pos', posSet);
  fill('dash-tb-status', statusSet);
  fill('dash-tb-nat', natSet);
  fill('dash-tb-batch', batchSet);
}