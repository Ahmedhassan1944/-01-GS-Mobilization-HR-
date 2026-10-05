Act as a Senior Google Apps Script Developer and UI/UX Architect. I need to update the structural organization of the Dashboard KPI sections to accommodate two distinct batch groups: Staff Batches and Kalhat Batches.

---

### 1. Requirements Overview

#### A. Rename Section: "Staff Batch" ➔ "Staff Batches"
- Update the section label from `📦 Staff Batch` to `📦 Staff Batches`.
- Keep the existing grid container (`id="kpi-grid-batch"`) and its 4 existing cards:
  - `Staff Batch 1`
  - `Staff Batch 2`
  - `Staff Batch 3`
  - `Staff Batch 4`

#### B. Create New Section: "Kalhat Batches"
- Add a new section label `📦 Kalhat Batches` immediately following the **Staff Batches** section (before the Document HAS section).
- Add a dedicated grid container (`id="kpi-grid-kalhat-batch"` with class `kpi-grid`).
- Include 2 new cards:
  - `Kalhat Batch 1` (Filter value: `Kalhat Batch 1` / `Kalhat 1`)
  - `Kalhat Batch 2` (Filter value: `Kalhat Batch 2` / `Kalhat 2`)

#### C. Final Dashboard Section Order
1. 📊 Pipeline Overview
2. 📦 Staff Batches
3. 📦 Kalhat Batches
4. ✅ Candidates WITH Document
5. ❌ Candidates MISSING Document
6. 📅 Follow-up Calendar

---

### 2. File Modifications Required

#### A. Frontend Container Layout (`Script.html` — `Views.dashboard()`)
- Update section label to `📦 Staff Batches`.
- Add the `📦 Kalhat Batches` section label and grid container immediately below `#kpi-grid-batch`:
  ```html
  <div class="kpi-section-label" style="margin-top:var(--sp-5)">📦 Staff Batches</div>
  <div class="kpi-grid" id="kpi-grid-batch">...</div>

  <div class="kpi-section-label" style="margin-top:var(--sp-5)">📦 Kalhat Batches</div>
  <div class="kpi-grid" id="kpi-grid-kalhat-batch">
    ${[1, 2].map(() => `<div class="kpi-card"><div class="skeleton" style="height:80px"></div></div>`).join('')}
  </div>