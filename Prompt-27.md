# ENGINEERING PROMPT: Refactor Dashboard KPI Grids to 3-Column Summary Tables Layout

Act as a Principal Full-Stack Engineer and UI/UX Architect specializing in Google Apps Script (GAS) Web Applications and Vanilla JS/CSS Single-Page Applications (SPA).

---

### Objective & Scope
Refactor ONLY the **KPI Card Grids section** of the Dashboard view (`Views.dashboard` in `Script.html` and CSS in `Styles.html`) into a **3-Column Premium UI Summary Table Layout**. Completely remove the **📅 Follow-up Calendar** KPI section while maintaining 100% backwards compatibility with interactive filtering mechanics (`Views._onKpiCardClick`), multi-select card filtering (`CTRL + Click`), dynamic batch counter updates, and single-pass filtering (`Views._applyDashboardAllFilters()`).

---

### Strict Architectural Constraints
1. **Zero Component Regression**:
   Do NOT alter or break the Page Header, Interactive Selection Hint Bar (`#dashboard-filter-hint`), Candidate Filter Bar (`.candidate-filter-bar`), Advanced Filter Panel (`#dash-advanced-filter-panel`), Candidates Table (`#dashboard-table`), Candidate Preview Panel (`#cpp-panel`), or Export Engine (`Views._exportDashboard*`).
2. **Backward-Compatible Event & Attribute Hooks**:
   - Every interactive table row (`<tr class="kpi-card kpi-card--clickable">`) MUST retain class compatibility with `kpi-card` and `kpi-card--clickable` so `Views._onKpiCardClick`, `.kpi-card--selected`, and dynamic counter update queries function without breaking JavaScript execution.
   - Bind attributes on interactive rows:
     - `data-filter-type="..."` (`status`, `recruitmentType`, `batchNumber`, `hasDoc`, `missingDoc`)
     - `data-filter-value="..."`
     - `onclick="Views._onKpiCardClick(event, this)"`
     - `tabindex="0" role="button"`
   - Retain inner counter element IDs and `data-*` selectors so `Views._selectedBatchFilter` and batch recalculations populate counts accurately.
3. **Backend & Database Stability**:
   Do NOT modify `Code.gs` or `Database.gs`. The payload structure from `api_getDashboardData()` remains untouched.

---

### Structural Layout Specifications (`Script.html`)

Replace the existing 6 KPI card grid containers with a **3-Column CSS Grid Container** (`.dash-kpi-tables-grid`):

#### 1. Column 1: Pipeline & Status Overview
- **Section Title**: `📊 Status Overview`
- **Table Headers**: `Status` | `#Count`
- **Rows**: Render active summary rows (`Active Cases`, `Internal Candidates`, `External Candidates`) followed by all mobilization stage statuses (`Pending Medical`, `Booked Medical Exam`, `Docs Under Preparing`, `Visa Pending`, `Visa Completed`, `Talent Acquisition Issues`, `Renewal Passport`, `Not Available`, `Creating WhatsApp Group`, `Unfit-PCR`, `Unfit-Injury`, `Rejected`).
- Bind each row to `onclick="Views._onKpiCardClick(event, this)"` with corresponding `data-filter-type` (`status` or `recruitmentType`).

#### 2. Column 2: Batches Overview (Stacked Vertically)
- **Section Title**: `📦 Batches Overview`
- **Top Section (Staff Batches)**:
  - Sub-header / Group Title: `Staff Batches`
  - Columns: `Batch` | `#Count`
  - Rows: `Staff Batch 1` through `Staff Batch 4` (`data-filter-type="batchNumber"`).
- **Bottom Section (Kalhat Batches)**:
  - Sub-header / Group Title: `Kalhat Batches`
  - Columns: `Batch` | `#Count`
  - Rows: `Kalhat Batch 1` and `Kalhat Batch 2` (`data-filter-type="batchNumber"`).

#### 3. Column 3: Document Completeness (Stacked Vertically)
- **Section Title**: `📄 Document Completeness`
- **Top Section (Candidates WITH Document)**:
  - Sub-header / Group Title: `✅ Candidates WITH Document`
  - Columns: `Document` | `#Count`
  - Rows: All 7 canonical document types (`Passport`, `Photo`, `Academic Certificate`, `Medical Examination`, `Medical Analysis`, `Visa`, `CV`) bound to `data-filter-type="hasDoc"`.
- **Bottom Section (Candidates MISSING Document)**:
  - Sub-header / Group Title: `❌ Candidates MISSING Document`
  - Columns: `Document` | `#Count`
  - Rows: All 7 canonical document types bound to `data-filter-type="missingDoc"`.

#### 4. Complete Removal of Calendar KPIs
- Completely delete the `📅 Follow-up Calendar` KPI section and its grid container from `Views.dashboard` and rendering functions.

---

### Design System & Typography Specifications (`Styles.html`)

1. **Typography Rules**:
   - **Section & Table Titles**: `font-size: 18px; font-weight: 700; letter-spacing: -0.01em;`
   - **Table Headers, Cells, Badges & Sub-headers**: `font-size: 12.8px;` (`0.8rem`).
2. **Layout & Surface Cards**:
   - Main Grid Container:
     ```css
     .dash-kpi-tables-grid {
       display: grid;
       grid-template-columns: repeat(3, 1fr);
       gap: 16px;
       align-items: start;
       margin-bottom: 20px;
     }
     @media (max-width: 1024px) {
       .dash-kpi-tables-grid { grid-template-columns: 1fr; }
     }
     ```
   - Card Wrapper: Elevated surface cards (`background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06); overflow: hidden;`).
   - Right-align count columns with tabular numbers (`text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;`).
3. **Interactive States (`.kpi-card--clickable` on `<tr>`)**:
   - Base cursor: `cursor: pointer; transition: background-color 0.15s ease;`
   - Hover state: `background-color: #f8fafc;`
   - Selected state (`.kpi-card--selected`): `background-color: #eff6ff; box-shadow: inset 3px 0 0 #2563eb; font-weight: 600;`
   - Emerald accent styling for `WITH Document` sub-headers/pills and Rose/Red accent styling for `MISSING Document` sub-headers/pills.
   - Full dark-mode compatibility under `body.dark-mode`.

---

### Deliverables Expected
1. Refactored HTML layout and dynamic table rendering JS methods in `Script.html`.
2. Clean CSS classes and responsive grid rules for `Styles.html`.