### UI FEATURE: ENABLE SORTING ON DASHBOARD TABLE

**Context:** The data table in the Dashboard view is missing the column sorting functionality (clickable headers with up/down indicators) that is already perfectly implemented in the Candidates view table.
**Objective:** Act as a Principal Frontend Engineer. Replicate the sorting mechanism from the Candidates table to the Dashboard table.

#### FIX 1: Update Dashboard Table Headers (`Index.html` or `Script.html`)
Locate the HTML where the Dashboard table headers (`<thead>` -> `<th>`) are defined. This could be hardcoded in `Index.html` under the dashboard section or dynamically built in `Script.html`.
- Add the exact same sorting CSS classes (e.g., `cursor-pointer`, `sortable`), `data-sort` attributes, and sort icons (e.g., `&#8645;` or `<i class="fas fa-sort"></i>`) to the applicable Dashboard headers (Candidate, Position, Status, Doc Completeness, Created, etc.) exactly as they exist in the Candidates table.

#### FIX 2: Bind Sorting Logic for Dashboard (`Script.html`)
Locate how sorting is handled for the Candidates table (e.g., `Views.sortCandidates(column)` or a generic event listener on `th.sortable`).
- Replicate or extend this logic for the Dashboard. 
- If creating a dedicated function (e.g., `Views._sortDashboard(column)`):
  1. Track the current sort column and direction for the Dashboard state (`App.state.dashSortCol`, `App.state.dashSortAsc`).
  2. Sort the currently filtered Dashboard dataset based on the selected column.
  3. Update the header visual indicators (up/down arrows) to reflect the active sort.
  4. Trigger the re-render of the Dashboard table (e.g., `Views._renderDashboardTable()`).

**Execution:** Apply these changes. Ensure the Dashboard table headers are clickable and successfully sort the rows ascending/descending just like the Candidates table. Save and push.