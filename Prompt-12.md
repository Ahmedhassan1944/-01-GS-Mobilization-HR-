Act as a Senior Frontend and Google Apps Script Developer working on the "EDECS HR Mobilization Management System" SPA. I need to add a custom multi-criteria filter toolbar right above the Candidates Table in `Script.html` and `Styles.html`.

---

### 1. Requirements Overview

#### A. Filter Toolbar Layout & HTML Structure
Place a horizontal filter bar container directly above the Candidates Table card. It must contain the following controls:
1. **Search Input**:
   - Icon: `🔍`
   - Placeholder: `"Name, HR Code, ID..."`
   - Input ID: `cand-tb-search`
2. **Position Dropdown**:
   - Label: `💼 Position`
   - Default Option: `"All Positions"`
   - Select ID: `cand-tb-pos`
3. **Current Status Dropdown**:
   - Label: `📋 Status`
   - Default Option: `"All Statuses"`
   - Select ID: `cand-tb-status`
4. **Nationality Dropdown**:
   - Label: `🌍 Nationality`
   - Default Option: `"All Nationalities"`
   - Select ID: `cand-tb-nat`
5. **Batch Number Dropdown**:
   - Label: `📦 Batch Number`
   - Default Option: `"All Batches"`
   - Select ID: `cand-tb-batch`
6. **Clear Button**:
   - Label: `✕ Clear`
   - Action: Reset all dropdown selects and search input to default values and restore the full candidate list.

---

### 2. Required JavaScript Logic (`Script.html`)

1. **Dynamic Dropdown Population (`populateCandidateFilterDropdowns()`)**:
   - On candidate data load (`App.state.candidates`), extract unique, non-empty, sorted values for:
     - Positions
     - Statuses
     - Nationalities
     - Batch Numbers
   - Append `<option>` elements dynamically into the respective `<select>` controls without overwriting default "All" options.

2. **Unified Multi-Condition Filtering (`applyCandidateFilters()`)**:
   - Trigger on `oninput` for search text and `onchange` for all four dropdowns.
   - Criteria evaluation (combined via logical `AND`):
     - **Search Text**: Case-insensitive substring match on candidate `FullName`, `HR_Code`, `CandidateID`, or `Email`.
     - **Position**: Match `c.Position` (or pass if "All Positions" selected).
     - **Status**: Match `c.CurrentStatus` (or pass if "All Statuses" selected).
     - **Nationality**: Match `c.Nationality` (or pass if "All Nationalities" selected).
     - **Batch Number**: Match `c.Batch_Number` (or pass if "All Batches" selected).
   - Interoperability with Quick Filters & Card Filters: Ensure existing quick-filter tags (e.g. missing doc chips) continue to combine logically with toolbar selections.
   - Update `App.state.filteredCandidates` and re-render table (`Views._renderCandidatesTable(filtered)`).
   - Update count header string: `"X Candidates found"`.

3. **Reset Control (`clearAllCandidateFilters()`)**:
   - Reset search input value to `""`.
   - Set all select dropdowns back to index `0` (default "All" options).
   - Reset state and re-render table with full dataset.

---

### 3. Styling & CSS Rules (`Styles.html`)

- Add `.candidate-filter-bar` CSS flexbox container with gap spacing, background surface color, borders, and rounded corners (`var(--radius)`).
- Responsive Behavior:
  - Flex-wrap controls neatly on tablet and mobile viewports.
  - Set minimum widths for inputs/selects so text remains legible and controls do not collapse awkward.
- Consistent typography, focus rings (`var(--border-focus)`), and dark-mode compatibility (`body.dark-mode`).

---

### 4. Constraints
- Do not modify backend Google Sheets queries or server-side functions in `Code.gs` or `Database.gs`.
- Preserve existing table row formatting, column sorting, and candidate detail view navigation.