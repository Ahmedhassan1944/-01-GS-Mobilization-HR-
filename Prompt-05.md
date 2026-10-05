Act as a Senior Google Apps Script Developer and UI/UX Architect. I need to reorganize the Dashboard KPI layout to make it cleaner, more modular, and scalable for future expansion.

---

### 1. Requirements Overview

#### A. Keep Existing Pipeline Overview Section
- Retain the **📊 Pipeline Overview** section for general status, case, and recruitment type cards.
- Remove the 4 Batch cards (`Batch 1`, `Batch 2`, `Batch 3`, `Batch 4`) from the Pipeline Overview section.

#### B. Create New "Staff Batch" Section
- Create a dedicated KPI section titled **📦 Staff Batch** immediately below the Pipeline Overview section (before the Document HAS grid).
- Add a new grid container with `id="kpi-grid-batch"` and class `kpi-grid`.
- Move the 4 Batch cards into this new section and rename them:
  - `Batch 1` ➔ `Staff Batch 1`
  - `Batch 2` ➔ `Staff Batch 2`
  - `Batch 3` ➔ `Staff Batch 3`
  - `Batch 4` ➔ `Staff Batch 4`
- Retain their existing icons, colors, count variables (`batch1Count`, `batch2Count`, etc.), and filter bindings (`{ type: 'batchNumber', value: 'Batch 1' }` or `'Staff Batch 1'`).

#### C. Scalability Design
- Structure the batch rendering in `Script.html` so that adding future batches (e.g., `Staff Batch 5`, `Staff Batch 6`) can be done cleanly via a configurable array or helper function without cluttering the main grid array.

---

### 2. Files & Modifications Required

#### A. Frontend Container Layout (`Script.html` — `Views.dashboard()`)
Add the new section label and grid container right after `#kpi-grid-status`:
```html
<div class="kpi-section-label" style="margin-top:var(--sp-5)">📦 Staff Batch</div>
<div class="kpi-grid" id="kpi-grid-batch">
  ${[1, 2, 3, 4].map(() => `<div class="kpi-card"><div class="skeleton" style="height:80px"></div></div>`).join('')}
</div>