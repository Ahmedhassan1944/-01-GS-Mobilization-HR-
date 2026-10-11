# BUG FIX PROMPT: Toolbar Search Input Non-Responsive in Both Views

Act as a Senior Frontend and Google Apps Script Developer. I need to fix a critical bug in `Script.html` where typing into the search input box (`Name, HR Code, ID...`) fails to filter the candidates table in both the **Candidates** view and the **Dashboard** view.

---

### Problem Description
Typing into the search input box (`Name, HR Code, ID...`) does not trigger any filtering action. The table rows remain completely unchanged and unresponsive to text input across both views.

---

### Root Cause Analysis & Technical Requirements

1. **HTML Input Event Binding (`Script.html`)**:
   - Ensure the search inputs explicitly attach real-time `oninput` listeners:
     - **Candidates View Search Input**: `id="cand-tb-search"` with `oninput="Views._applyCandidateFilters()"` (or `Views._filterCandidates()`).
     - **Dashboard View Search Input**: `id="dash-tb-search"` with `oninput="Views._applyDashboardAllFilters()"`.

2. **Defensive String Conversion & Null Checks**:
   - In `Views._filterCandidates()` and `Views._applyDashboardAllFilters()`:
     - Trim and normalize search input text:
       ```javascript
       const query = (document.getElementById('cand-tb-search')?.value || '').trim().toLowerCase();
       ```
     - Perform safe string coercion on all searchable candidate fields (`FullName`, `HR_Code`, `CandidateID`, `Email`) before calling `.toLowerCase()` to prevent `TypeError` exceptions if numerical IDs or `undefined` values exist:
       ```javascript
       const matchQ = !query ||
         String(c.FullName || '').toLowerCase().includes(query) ||
         String(c.HR_Code || '').toLowerCase().includes(query) ||
         String(c.CandidateID || '').toLowerCase().includes(query) ||
         String(c.Email || '').toLowerCase().includes(query);
       ```

3. **Single-Pass State Filtering & Reactive Rendering**:
   - Filter strictly from the immutable master list (`App.state.candidates`) rather than a previously filtered subset to prevent search state locks.
   - Update `App.state.filteredCandidates` and dynamically re-render the candidate table rows (`Views._renderCandidatesTable(data)` / `Views._renderDashboardTable(data)`).
   - Dynamically update the count header (e.g., `X Candidates found`).

---

### Reference Code Fix Snippet (`Script.html`)

```html
<!-- Candidates View Search Input -->
<div class="search-input" style="flex: 1; min-width: 200px;">
  <span class="search-input__icon" aria-hidden="true">🔍</span>
  <input type="search" id="cand-tb-search" placeholder="Name, HR Code, ID..."
         aria-label="Search candidates" oninput="Views._filterCandidates()" autocomplete="off">
</div>

<!-- Dashboard View Search Input -->
<div class="search-input" style="flex: 1; min-width: 200px;">
  <span class="search-input__icon" aria-hidden="true">🔍</span>
  <input type="search" id="dash-tb-search" placeholder="Name, HR Code, ID..."
         aria-label="Search candidates" oninput="Views._applyDashboardAllFilters()" autocomplete="off">
</div>


Javascript

// Candidates Filtering Logic
_filterCandidates() {
  const query = (document.getElementById('cand-tb-search')?.value || '').trim().toLowerCase();
  const posFilter = document.getElementById('cand-tb-pos')?.value || '';
  const statusTbFilter = document.getElementById('cand-tb-status')?.value || '';
  const natFilter = document.getElementById('cand-tb-nat')?.value || '';
  const batchFilter = document.getElementById('cand-tb-batch')?.value || '';

  const deptFilter = document.getElementById('dept-filter')?.value || '';
  const completionMin = parseInt(document.getElementById('completion-min')?.value || '0', 10);
  const { statusFilters, docFilters, docCompleteness, sortCol, sortDir, excludeStatusFilters } = App.state;

  let data = App.state.candidates.filter(c => {
    // Safe multi-field search check
    const matchQ = !query ||
      String(c.FullName || '').toLowerCase().includes(query) ||
      String(c.HR_Code || '').toLowerCase().includes(query) ||
      String(c.CandidateID || '').toLowerCase().includes(query) ||
      String(c.Email || '').toLowerCase().includes(query);

    const matchPos = !posFilter || c.Position === posFilter;
    const matchStatusTb = !statusTbFilter || c.CurrentStatus === statusTbFilter;
    const matchNat = !natFilter || c.Nationality === natFilter;
    const matchBatch = !batchFilter || c.Batch_Number === batchFilter;
    const matchS = statusFilters.length === 0 || statusFilters.includes(c.CurrentStatus);
    const matchExcl = excludeStatusFilters.length === 0 || !excludeStatusFilters.includes(c.CurrentStatus);
    const matchD = !deptFilter || c.Department === deptFilter;

    const comp = docCompleteness[c.CandidateID];
    const isUnavailable = comp?.status === 'unavailable';
    const matchDoc = docFilters.length === 0
      ? true
      : (comp && !isUnavailable && docFilters.some(doc => comp.missingDocs.includes(doc)));

    const matchCompletion = isUnavailable
      ? (completionMin === 0)
      : (!comp || comp.pct >= completionMin);

    return matchQ && matchPos && matchStatusTb && matchNat && matchBatch && matchS && matchExcl && matchD && matchDoc && matchCompletion;
  });

  App.setState({ filteredCandidates: data });
  Views._renderCandidatesTable(data);
}

Constraints

    Do not alter backend Apps Script queries in Code.gs or Database.gs.
    Ensure multi-criteria filter combinations (search + position + status + batch) function seamlessly together.