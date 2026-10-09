Act as a Senior Google Apps Script and Frontend Developer. I need to apply a critical set of bug fixes and stability updates to `Script.html` in the "EDECS HR Mobilization Management System" Web App.

---

### Audit Summary & Fix Requirements

#### 1. Fix Dashboard Search Element ID Mismatch
- **File**: `Script.html`
- **Issue**: `Views._saveDashboardFilterState()`, `Views._restoreDashboardFilterState()`, and `Views._clearDashboardCandidateFilters()` reference `document.getElementById('dash-search-input')`, but the DOM search input in the Dashboard filter bar uses `id="dash-tb-search"`.
- **Fix**: Update these functions to consistently read/reset `dash-tb-search`.

#### 2. Fix Document Quick-Filter Pill Sync
- **File**: `Script.html`
- **Issue**: `Views._onDocCheckChange()` loops over `['Passport', 'Photo', 'Academic Certificate', 'Medical', 'Visa', 'CV']`. The key `'Medical'` does not match DOM element IDs `qf-doc-Medical_Examination` or `qf-doc-Medical_Analysis`.
- **Fix**: Update the document types array in `_onDocCheckChange()` to iterate through all 7 canonical document types: `['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV']`.

#### 3. Deduplicate Status Checkboxes & Fix ID Collisions
- **File**: `Script.html`
- **Issue**: Custom status options (`Talent Acquisition Issues`, `Renewal Passport`, `Not Available`, `Creating WhatsApp Group`, `Unfit-PCR`, `Unfit-Injury`) were accidentally duplicated in the status check groups in `Views.candidates()` and `Views.dashboard()`, creating duplicate DOM element IDs.
- **Fix**: Clean up the status checkbox groups in both views to render a single, deduplicated list of options with unique IDs (`sc-*` for candidate filter checkboxes and `ex-*` for exclusion checkboxes).

---

### Implementation Code (`Script.html`)

Please apply the following updated methods in `Script.html`:

1. **Dashboard Filter State Persistence**:
```javascript
_saveDashboardFilterState() {
  const searchEl = document.getElementById('dash-tb-search');
  const deptEl = document.getElementById('dash-dept-filter');
  const rangeEl = document.getElementById('dash-completion-min');
  const payload = {
    statusFilters: Views._dashStatusFilters || [],
    excludeStatusFilters: Views._dashExcludeStatusFilters || [],
    docFilters: Views._dashDocFilters || [],
    searchQuery: searchEl ? searchEl.value : '',
    deptFilter: deptEl ? deptEl.value : '',
    completionMin: rangeEl ? parseInt(rangeEl.value, 10) : 0,
    selectedCards: Array.from(Views._dashboardSelectedCards || []),
  };
  try { localStorage.setItem('hr_dashboard_filters', JSON.stringify(payload)); } catch (_) { }
},

_restoreDashboardFilterState() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem('hr_dashboard_filters') || 'null'); } catch (_) { }
  if (!saved) return;

  Views._dashStatusFilters = Array.isArray(saved.statusFilters) ? saved.statusFilters : [];
  Views._dashExcludeStatusFilters = Array.isArray(saved.excludeStatusFilters) ? saved.excludeStatusFilters : [];
  Views._dashDocFilters = Array.isArray(saved.docFilters) ? saved.docFilters : [];

  Views._dashboardSelectedCards = new Set(Array.isArray(saved.selectedCards) ? saved.selectedCards : []);
  const batchKey = Array.from(Views._dashboardSelectedCards).find(k => k.startsWith('batchNumber::'));
  Views._selectedBatchFilter = batchKey ? batchKey.split('::')[1] : null;

  (saved.selectedCards || []).forEach(key => {
    const [type, value] = key.split('::');
    const cardId = `kpi-card-${type}-${(value || '').replace(/\s+/g, '_')}`;
    const el = document.getElementById(cardId);
    if (el) el.classList.add('kpi-card--selected');
  });

  document.querySelectorAll('.dash-status-check').forEach(cb => {
    cb.checked = Views._dashStatusFilters.includes(cb.value);
  });
  ['Visa Pending', 'Visa Completed', 'Mobilized', 'Documents Complete'].forEach(st => {
    const btn = document.getElementById(`dash-qf-status-${st.replace(/\s/g, '_')}`);
    if (btn) {
      const on = Views._dashStatusFilters.includes(st);
      btn.classList.toggle('quick-filter-btn--active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
  });

  document.querySelectorAll('.dash-excl-status-check').forEach(cb => {
    cb.checked = Views._dashExcludeStatusFilters.includes(cb.value);
  });

  document.querySelectorAll('.dash-doc-check').forEach(cb => {
    cb.checked = Views._dashDocFilters.includes(cb.value);
  });
  ['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV'].forEach(doc => {
    const btn = document.getElementById(`dash-qf-doc-${doc.replace(/\s/g, '_')}`);
    if (btn) {
      const on = Views._dashDocFilters.includes(doc);
      btn.classList.toggle('quick-filter-btn--active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
  });

  const searchEl = document.getElementById('dash-tb-search');
  if (searchEl && saved.searchQuery) searchEl.value = saved.searchQuery;

  const deptEl = document.getElementById('dash-dept-filter');
  if (deptEl && saved.deptFilter) deptEl.value = saved.deptFilter;

  const rangeEl = document.getElementById('dash-completion-min');
  const rangeVal = document.getElementById('dash-completion-min-val');
  if (rangeEl && saved.completionMin != null) {
    rangeEl.value = saved.completionMin;
    if (rangeVal) rangeVal.textContent = saved.completionMin + '%';
  }

  Views._dashUpdateClearButton();
  Views._applyDashboardAllFilters();
},

_clearDashboardCandidateFilters() {
  if (document.getElementById('dash-tb-search')) document.getElementById('dash-tb-search').value = '';
  if (document.getElementById('dash-tb-pos')) document.getElementById('dash-tb-pos').selectedIndex = 0;
  if (document.getElementById('dash-tb-status')) document.getElementById('dash-tb-status').selectedIndex = 0;
  if (document.getElementById('dash-tb-nat')) document.getElementById('dash-tb-nat').selectedIndex = 0;
  if (document.getElementById('dash-tb-batch')) document.getElementById('dash-tb-batch').selectedIndex = 0;
  this._applyDashboardAllFilters();
}

    Quick-Filter Pill Sync:

Javascript

_onDocCheckChange() {
  const checked = [...document.querySelectorAll('.doc-check:checked')].map(el => el.value);
  App.setState({ docFilters: checked });
  ['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV'].forEach(doc => {
    const btn = document.getElementById(`qf-doc-${doc.replace(/\s/g, '_')}`);
    if (btn) {
      btn.classList.toggle('quick-filter-btn--active', checked.includes(doc));
      btn.setAttribute('aria-pressed', String(checked.includes(doc)));
    }
  });
  Views._saveFilterState();
  Views._updateClearButton();
  Views._filterCandidates();
}

Constraints

    Do not modify backend Apps Script functions in Code.gs or Database.gs.
    Preserve existing card selection, quick actions toolbar buttons, and document center features.