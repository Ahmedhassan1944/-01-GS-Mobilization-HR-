# MASTER ENGINEERING PROMPT: Staff Batch 5 Addition & Dynamic System Settings Architecture

Act as a Principal Full-Stack Architect for the **EDECS Enterprise HR Mobilization Management System** (Google Apps Script V8 / Google Sheets DB / Vanilla JS SPA).

---

### Objective & Dual-Phase Scope

1. **Immediate System Update**:
   Add **`Staff Batch 5`** across all system components (New Candidate form, Edit Candidate profile, Dashboard `Batches Overview` summary table, candidate filter dropdowns `#dash-tb-batch` / `#cand-tb-batch`, and backend KPI aggregation in `Code.gs`).
2. **Dynamic System Settings Engine (`⚙️ System Settings` View)**:
   Eliminate hardcoded lists across the application by building a dynamic configuration architecture powered by a `tbl_Settings` sheet in Google Sheets and a dedicated **System Settings UI page** in the SPA. This will enable administrators to manage (add, edit, reorder, remove) Batches, Statuses, Departments, Nationalities, Positions, and Document Types without code changes.

---

### Strict Architectural Constraints

1. **Cache Invalidation Protocol**:
   - Every backend function that modifies settings (`api_saveSystemSettings`, `api_addSettingItem`, `api_deleteSettingItem`, etc.) **MUST** invalidate both cache keys prior to returning:
     ```javascript
     CacheService.getScriptCache().remove('dashboard_data');
     CacheService.getScriptCache().remove('system_settings');
     ```

2. **Zero Regression on Dashboard & Filtering Mechanics**:
   - Preserve the **3-Column Premium UI Summary Table Layout** on the Dashboard.
   - Replace hardcoded `Staff Batch 1..4` and `Kalhat Batch 1..2` rows in `Views.dashboard` with dynamic iteration over `App.state.settings.staffBatches` (defaulting to `['Staff Batch 1', 'Staff Batch 2', 'Staff Batch 3', 'Staff Batch 4', 'Staff Batch 5']`) and `App.state.settings.kalhatBatches` (`['Kalhat Batch 1', 'Kalhat Batch 2']`).
   - Preserve `class="kpi-card kpi-card--clickable"`, `data-filter-type="batchNumber"`, `data-filter-value="..."`, and `onclick="Views._onKpiCardClick(event, this)"` on all dynamically rendered table rows so single-pass filtering (`Views._applyDashboardAllFilters`), multi-select (`CTRL+Click`), and batch counter updates continue working seamlessly.

3. **Schema Auto-Seeding & Resilience**:
   - If `tbl_Settings` does not exist in the host Google Spreadsheet, `Database.gs` / `Code.gs` must automatically create the sheet and seed it with `DEFAULT_SYSTEM_SETTINGS` (including `Staff Batch 5`) on first load.

---

### Part 1: Backend Architecture (`Code.gs` & `Database.gs`)

1. **Default Settings Schema (`DEFAULT_SYSTEM_SETTINGS`)**:
   Define the canonical system configuration defaults:
   - `staffBatches`: `['Staff Batch 1', 'Staff Batch 2', 'Staff Batch 3', 'Staff Batch 4', 'Staff Batch 5']`
   - `kalhatBatches`: `['Kalhat Batch 1', 'Kalhat Batch 2']`
   - `statuses`: `['New Candidate', 'Pending Passport', 'Pending Photo', 'Pending Academic Certificate', 'Pending Medical', 'Booked a medical examination', 'Documents Under Preparing', 'Documents Complete', 'Visa Pending', 'Visa Completed', 'Mobilized', 'Talent Acquisition Issues', 'Renewal Passport', 'Not Available', 'Creating WhatsApp Group', 'Unfit-PCR', 'Unfit-Injury', 'Rejected', 'Closed']`
   - `excludedStatuses`: `['Closed', 'Rejected', 'Unfit-Injury', 'Unfit-PCR']`
   - `recruitmentTypes`: `['Internal', 'External']`
   - `documentTypes`: `['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV']`
   - `departments`: Canonical department options.
   - `nationalities`: Canonical nationality options.

2. **Backend API Endpoints**:
   - `api_getSystemSettings()`: Reads cached settings from `CacheService` (`'system_settings'`), or loads/seeds from `tbl_Settings`. Also include `settings` directly inside `api_getDashboardData()` payload for single round-trip boot loading.
   - `api_updateSystemSettings(categoryKey, itemsArray)`: Writes updated category items to `tbl_Settings`, clears `'system_settings'` and `'dashboard_data'` from `CacheService.getScriptCache()`, and returns `{ success: true, settings: updatedSettings }`.

3. **Dynamic KPI Counter Aggregation (`api_getDashboardData`)**:
   - Update batch and status counting in `Code.gs` to iterate dynamically over `staffBatches` (including `Staff Batch 5`), `kalhatBatches`, `statuses`, and `documentTypes` provided by `api_getSystemSettings()`.

---

### Part 2: Frontend Integration (`Script.html`, `Index.html`, `Styles.html`)

1. **Global Settings State (`App.state.settings`)**:
   - Store settings in `App.state.settings` (falling back to `DEFAULT_SYSTEM_SETTINGS`).
   - Implement helper `App.getAllBatches() => [...App.state.settings.staffBatches, ...App.state.settings.kalhatBatches]`.

2. **Propagation Across Forms & Filters**:
   - **Candidate Forms**: Dynamically build `<select id="nc-batch">` and edit modals using `App.getAllBatches()`, grouped with `<optgroup label="Staff Batches">` and `<optgroup label="Kalhat Batches">`. Build status, department, and nationality dropdowns from `App.state.settings`.
   - **Filter Bars**: Populate `#dash-tb-batch`, `#cand-tb-batch`, `#dash-tb-status`, and `#dash-tb-nat` dynamically.
   - **Dashboard Tables**: Dynamically map `App.state.settings.staffBatches` into the `Staff Batches` table (rendering rows for `Staff Batch 1` through `Staff Batch 5`) and `kalhatBatches` into the `Kalhat Batches` table.

3. **New UI View: `⚙️ System Settings` (`Views.settings`)**:
   - Add a `"⚙️ Settings"` navigation item to the main sidebar (`sidebar_items`).
   - Build `Views.settings(container)` featuring categorized manager cards:
     - **📦 Staff Batches Manager**: Add, edit, reorder (Up/Down), or delete Staff Batches (including `Staff Batch 5`).
     - **📦 Kalhat Batches Manager**: Add, edit, reorder, or delete Kalhat Batches.
     - **📊 Mobilization Statuses & Exclusion Rules**: Manage mobilization stages and toggle KPI exclusion flags (`EXCLUDED_KPI_STATUSES`).
     - **📄 Document Types Manager**: Add/remove canonical document requirements.
     - **🏢 Departments & 🌍 Nationalities Manager**: Add/remove metadata tags.
   - Saving changes triggers `GAS.call('api_updateSystemSettings', ...)`, updates `App.state.settings`, displays `Toast.success()`, and refreshes Dashboard views.

---

### Deliverables Required

1. **`Code.gs` & `Database.gs`**:
   - Settings persistence engine, `tbl_Settings` auto-seeding with `Staff Batch 5`, `api_getSystemSettings()`, `api_updateSystemSettings()`, and dynamic `api_getDashboardData()` KPI calculation loops.
2. **`Script.html` & `Index.html`**:
   - Dynamic 3-Column summary table rendering, updated candidate form select controls, navigation link, and the full `Views.settings` management view.
3. **`Styles.html`**:
   - CSS styling for the `⚙️ System Settings` control panel cards, reorder handle controls, and toggle switches.