# MASTER UI/UX UPGRADE PROMPT: Add Document Expiry Filter Row in Documents Center

Act as a Principal UI/UX & Full-Stack Developer specializing in Google Apps Script Web Applications and Vanilla JS SPAs.

### Objective & Scope
In the **📁 Documents Center** view (`Views.documentsCenter` in `Script.html`), add a secondary horizontal row of filter controls directly below the primary filter row (Search, Status, Department, Nationality, Batch Number).

This secondary filter bar will provide 4 document-specific status dropdowns to filter candidates based on the expiration state of their critical documents:
1. **🛂 Passport Status** (`#dc-filter-passport`)
2. **🩺 Medical Exam Status** (`#dc-filter-medexam`)
3. **🩸 Medical Analysis Status** (`#dc-filter-medanalysis`)
4. **✈️ Visa Status** (`#dc-filter-visa`)

Each dropdown must contain the following options:
- `All` (default - value `""`)
- `Missing` (value `"missing"`)
- `Date Not Set` (value `"nodate"`)
- `Expired` (value `"expired"`)
- `Expiring (<= 30 Days)` (value `"exp30"`)
- `Expiring (<= 6 Months)` (value `"exp180"`)

---

### Strict Architectural Constraints
- Modify **ONLY** `Script.html`.
- Do **NOT** modify `Code.gs`, `Database.gs`, or any backend files.
- Preserve all existing search, status, department, nationality, batch, and date range filters.

---

### Implementation Instructions (`Script.html`)

#### STEP 1: Inject Secondary Filter Row HTML
Inside `Views.documentsCenter`, locate the main filter row container (`#dc-filter-panel .filter-panel__inner`). Immediately below the main filter row controls, append a secondary dashed-bordered flex container:

```html
<div class="filters-row-secondary" style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border, #cbd5e1);">
  <div class="filter-group" style="flex: 1; min-width: 160px;">
    <label style="font-size: 11px; color: var(--text-secondary, #64748b); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">🛂 Passport Status</label>
    <select class="form-control form-control--sm" id="dc-filter-passport" onchange="Views._dcApplyFilters()" style="width: 100%;">
      <option value="">All Passports</option>
      <option value="missing">Missing</option>
      <option value="nodate">Date Not Set</option>
      <option value="expired">Expired</option>
      <option value="exp30">Expiring (<= 30 Days)</option>
      <option value="exp180">Expiring (<= 6 Months)</option>
    </select>
  </div>

  <div class="filter-group" style="flex: 1; min-width: 160px;">
    <label style="font-size: 11px; color: var(--text-secondary, #64748b); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">🩺 Medical Exam</label>
    <select class="form-control form-control--sm" id="dc-filter-medexam" onchange="Views._dcApplyFilters()" style="width: 100%;">
      <option value="">All Med. Exams</option>
      <option value="missing">Missing</option>
      <option value="nodate">Date Not Set</option>
      <option value="expired">Expired</option>
      <option value="exp30">Expiring (<= 30 Days)</option>
      <option value="exp180">Expiring (<= 6 Months)</option>
    </select>
  </div>

  <div class="filter-group" style="flex: 1; min-width: 160px;">
    <label style="font-size: 11px; color: var(--text-secondary, #64748b); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">🩸 Medical Analysis</label>
    <select class="form-control form-control--sm" id="dc-filter-medanalysis" onchange="Views._dcApplyFilters()" style="width: 100%;">
      <option value="">All Med. Analysis</option>
      <option value="missing">Missing</option>
      <option value="nodate">Date Not Set</option>
      <option value="expired">Expired</option>
      <option value="exp30">Expiring (<= 30 Days)</option>
      <option value="exp180">Expiring (<= 6 Months)</option>
    </select>
  </div>

  <div class="filter-group" style="flex: 1; min-width: 160px;">
    <label style="font-size: 11px; color: var(--text-secondary, #64748b); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">✈️ Visa Status</label>
    <select class="form-control form-control--sm" id="dc-filter-visa" onchange="Views._dcApplyFilters()" style="width: 100%;">
      <option value="">All Visas</option>
      <option value="missing">Missing</option>
      <option value="nodate">Date Not Set</option>
      <option value="expired">Expired</option>
      <option value="exp30">Expiring (<= 30 Days)</option>
      <option value="exp180">Expiring (<= 6 Months)</option>
    </select>
  </div>
</div>

STEP 2: Upgrade Document Filtering Logic (Script.html)
In Views._dcApplyFilters() (and Views._dcClearFilters()), update the filter evaluation loop:
Javascript

_dcApplyFilters() {
  const dc = App.state.documentsCenter;
  const status = document.getElementById('dc-filter-status')?.value || '';
  const dept = document.getElementById('dc-filter-dept')?.value || '';
  const nat = document.getElementById('dc-filter-nat')?.value || '';
  const batch = document.getElementById('dc-filter-batch')?.value || '';
  const search = (document.getElementById('dc-search')?.value || '').toLowerCase();

  // Read Expiry State Filters
  const fPass = document.getElementById('dc-filter-passport')?.value || '';
  const fMedExam = document.getElementById('dc-filter-medexam')?.value || '';
  const fMedAna = document.getElementById('dc-filter-medanalysis')?.value || '';
  const fVisa = document.getElementById('dc-filter-visa')?.value || '';

  const _now = new Date();

  // Helper: Get candidate document expiration state
  const getDocState = (candidateId, docTypeSubstring) => {
    const docDetails = (dc.candidates.find(c => c.candidateId === candidateId) || {}).docDetails || {};
    
    // Find matching document entry in candidate details or global App.state.documents
    let expDateStr = null;
    let hasDoc = false;

    const matchedKey = Object.keys(docDetails).find(k => k.toLowerCase().includes(docTypeSubstring));
    if (matchedKey) {
      hasDoc = true;
      expDateStr = docDetails[matchedKey].expiryDate || docDetails[matchedKey].issueDate || docDetails[matchedKey].documentDate;
    } else {
      const globalDoc = (App.state.documents || []).find(d => 
        (d.CandidateID === candidateId || d.candidateId === candidateId) && 
        (d.DocType || '').toLowerCase().includes(docTypeSubstring)
      );
      if (globalDoc) {
        hasDoc = true;
        expDateStr = globalDoc.ExpiryDate || globalDoc.expiryDate;
      }
    }

    if (!hasDoc) return 'missing';
    if (!expDateStr) return 'nodate';

    const diffDays = Math.ceil((new Date(expDateStr) - _now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'exp30';
    if (diffDays <= 180) return 'exp180';
    return 'valid';
  };

  dc.filteredCandidates = dc.candidates.filter(c => {
    // Primary filters
    if (status && c.status !== status) return false;
    if (dept && c.department !== dept) return false;
    if (nat && c.nationality !== nat) return false;
    if (batch && c.batchNumber !== batch) return false;
    if (search && !`${c.fullName} ${c.position || ''} ${c.hrCode} ${c.candidateId}`.toLowerCase().includes(search)) return false;

    // Secondary document state filters
    const cId = c.candidateId || c.CandidateID;
    if (fPass && getDocState(cId, 'passport') !== fPass) return false;
    if (fMedExam && getDocState(cId, 'medical examination') !== fMedExam) return false;
    if (fMedAna && getDocState(cId, 'medical analysis') !== fMedAna) return false;
    if (fVisa && getDocState(cId, 'visa') !== fVisa) return false;

    return true;
  });

  Views._docFilteredCandidates = dc.filteredCandidates;

  // Clear selections no longer visible
  const visibleIds = new Set(dc.filteredCandidates.map(c => c.candidateId));
  dc.selectedIds.forEach(id => { if (!visibleIds.has(id)) dc.selectedIds.delete(id); });

  // Re-apply sort if active
  if (dc.sort && dc.sort.column) {
    Views._dcSort(dc.sort.column);
    return;
  }

  Views._dcRender();
  Views._dcUpdateSelectionLabel();
  Views._dcUpdateDownloadBtn();
}

STEP 3: Clear Filters Handler Update (Script.html)
Update Views._dcClearFilters() to reset all 4 secondary dropdowns to "":
Javascript

_dcClearFilters() {
  ['dc-filter-status', 'dc-filter-dept', 'dc-filter-nat', 'dc-filter-batch',
   'dc-filter-passport', 'dc-filter-medexam', 'dc-filter-medanalysis', 'dc-filter-visa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const s = document.getElementById('dc-search');
  if (s) s.value = '';

  Views._dcApplyFilters();
}

