### MASTER UI/UX UPGRADE 2026: Premium Multi-Select Dropdowns & Excluded Status

**Context & Objective:**
The user wants to upgrade the `Documents Center` filters (`Script.html`) to a "Premium UI 2026" standard. 
1. **New Filter:** Add an `Excluded Status` filter immediately after the `Status` filter in the top row.
2. **Premium Multi-Select UI:** Replace all standard `<select>` elements (both top row and bottom expiry row) with a custom, modern "Checkbox Dropdown" UI. Users should be able to open the dropdown, check multiple boxes, and the dropdown button should summarize the selection (e.g., "2 Selected" or "All").
3. **Manual Apply:** Filtering MUST NOT trigger on change. It should only trigger when a new primary "✅ Apply Filters" button is clicked.
4. **Logic Sync:** Update `Views._filterDocuments()` to read from these new multi-select arrays and properly handle the new `Excluded Status` logic.

Act as a Principal UI/UX Engineer. Apply the following implementation to `Script.html`.

#### STEP 1: Inject Premium CSS for Multi-Select
Add this to your `<style>` block (or `Styles.html`):
```css
/* Premium Multi-Select 2026 */
.premium-multiselect { position: relative; width: 100%; font-family: inherit; }
.premium-multiselect-btn { 
  width: 100%; text-align: left; background: #fff; border: 1px solid #cbd5e1; 
  padding: 8px 12px; border-radius: 6px; font-size: 13px; color: #334155; 
  cursor: pointer; display: flex; justify-content: space-between; align-items: center; height: 36px;
}
.premium-multiselect-btn:hover { border-color: #94a3b8; }
.premium-multiselect-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; background: #fff; 
  border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); 
  margin-top: 4px; max-height: 250px; overflow-y: auto; z-index: 1000; display: none; padding: 8px 0;
}
.premium-multiselect.open .premium-multiselect-dropdown { display: block; }
.premium-multiselect-option {
  padding: 6px 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s;
}
.premium-multiselect-option:hover { background: #f1f5f9; }
.premium-multiselect-option input { cursor: pointer; }
.filters-grid-2026 { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
.filter-col { flex: 1; min-width: 160px; }
.filter-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block; }

STEP 2: HTML Layout Replacement

Replace the existing filters container in Views.documents with this new structure. (Note: use native <select multiple> hidden inside, or let JS build the UI, but for ease of value retrieval, we will use standard hidden <select multiple> and wrap them).

Actually, the most robust way for GAS is to use standard <select multiple> and a generic JS class to upgrade them.

Inject this HTML structure:

<div class="filters-grid-2026">
  <!-- Top Row -->
  <div class="filter-col"><label class="filter-label">🔍 Search</label><input type="text" id="doc-tb-search" class="form-control" style="height:36px; width:100%;"></div>
  <div class="filter-col"><label class="filter-label">📋 Status</label><select id="doc-filter-status" multiple class="upgrade-multiselect"></select></div>
  <div class="filter-col"><label class="filter-label" style="color:#ef4444;">🚫 Excluded Status</label><select id="doc-filter-status-exclude" multiple class="upgrade-multiselect"></select></div>
  <div class="filter-col"><label class="filter-label">🏢 Department</label><select id="doc-filter-dept" multiple class="upgrade-multiselect"></select></div>
  <div class="filter-col"><label class="filter-label">🌍 Nationality</label><select id="doc-filter-nat" multiple class="upgrade-multiselect"></select></div>
  <div class="filter-col"><label class="filter-label">📦 Batch</label><select id="doc-filter-batch" multiple class="upgrade-multiselect"></select></div>
</div>

<div class="filters-grid-2026" style="margin-top: -8px; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; background: #fff;">
  <!-- Bottom Row -->
  <div class="filter-col"><label class="filter-label" style="color:#3b82f6;">🛂 Passport</label><select id="doc-filter-passport" multiple class="upgrade-multiselect"><option value="missing">Missing</option><option value="nodate">Date Not Set</option><option value="expired">Expired</option><option value="exp30">Expiring (<= 30 Days)</option><option value="exp180">Expiring (<= 6 Months)</option></select></div>
  <div class="filter-col"><label class="filter-label" style="color:#10b981;">🩺 Med Exam</label><select id="doc-filter-medexam" multiple class="upgrade-multiselect"><option value="missing">Missing</option><option value="nodate">Date Not Set</option><option value="expired">Expired</option><option value="exp30">Expiring (<= 30 Days)</option><option value="exp180">Expiring (<= 6 Months)</option></select></div>
  <div class="filter-col"><label class="filter-label" style="color:#8b5cf6;">🩸 Med Analysis</label><select id="doc-filter-medanalysis" multiple class="upgrade-multiselect"><option value="missing">Missing</option><option value="nodate">Date Not Set</option><option value="expired">Expired</option><option value="exp30">Expiring (<= 30 Days)</option><option value="exp180">Expiring (<= 6 Months)</option></select></div>
  <div class="filter-col"><label class="filter-label" style="color:#f59e0b;">✈️ Visa</label><select id="doc-filter-visa" multiple class="upgrade-multiselect"><option value="missing">Missing</option><option value="nodate">Date Not Set</option><option value="expired">Expired</option><option value="exp30">Expiring (<= 30 Days)</option><option value="exp180">Expiring (<= 6 Months)</option></select></div>
  
  <div class="filter-col" style="display: flex; gap: 8px; justify-content: flex-end; align-items: flex-end; flex: 2;">
    <button class="btn btn--outline" onclick="Views._clearDcFilters()" style="height: 36px;">✕ Clear</button>
    <button class="btn btn--primary" onclick="Views._filterDocuments()" style="height: 36px;">✅ Apply Filters</button>
  </div>
</div>

STEP 3: Vanilla JS Multi-Select Upgrader

Add this JS utility function to your code (e.g., inside Views or globally) and call it after rendering the dynamic options (like statuses and departments).

function initPremiumMultiSelects() {
  document.querySelectorAll('select.upgrade-multiselect').forEach(select => {
    if (select.dataset.upgraded) return; // Prevent double init
    select.dataset.upgraded = 'true';
    select.style.display = 'none'; // Hide original
    
    const wrapper = document.createElement('div');
    wrapper.className = 'premium-multiselect';
    
    const btn = document.createElement('div');
    btn.className = 'premium-multiselect-btn';
    btn.innerHTML = `<span>All</span> <span>▼</span>`;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'premium-multiselect-dropdown';
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });
    
    btn.addEventListener('click', () => {
      const isOpen = wrapper.classList.contains('open');
      document.querySelectorAll('.premium-multiselect').forEach(w => w.classList.remove('open'));
      if (!isOpen) wrapper.classList.add('open');
    });

    const updateBtnText = () => {
      const selected = Array.from(select.selectedOptions);
      if (selected.length === 0 || selected.length === select.options.length) {
        btn.querySelector('span').innerText = 'All';
      } else if (selected.length === 1) {
        btn.querySelector('span').innerText = selected[0].text;
      } else {
        btn.querySelector('span').innerText = `${selected.length} Selected`;
      }
    };

    Array.from(select.options).forEach(opt => {
      const row = document.createElement('label');
      row.className = 'premium-multiselect-option';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.value = opt.value;
      chk.checked = opt.selected;
      chk.addEventListener('change', () => {
        opt.selected = chk.checked;
        updateBtnText();
      });
      row.appendChild(chk);
      row.appendChild(document.createTextNode(opt.text));
      dropdown.appendChild(row);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    updateBtnText();
  });
}

(Ensure initPremiumMultiSelects() is called inside Views._dcLoad() or wherever you finish injecting the dynamic <option> tags into Status, Dept, etc.)
STEP 4: Update _filterDocuments() Logic

Modify Views._filterDocuments() to read arrays natively from these multi-selects and apply the excluded status logic:

const getMultiValues = id => Array.from(document.getElementById(id)?.selectedOptions || []).map(opt => opt.value).filter(v => v !== "");

  const incStatuses = getMultiValues('doc-filter-status');
  const excStatuses = getMultiValues('doc-filter-status-exclude');
  const depts = getMultiValues('doc-filter-dept');
  const nats = getMultiValues('doc-filter-nat');
  const batches = getMultiValues('doc-filter-batch');
  const fPass = getMultiValues('doc-filter-passport');
  const fMedExam = getMultiValues('doc-filter-medexam');
  const fMedAna = getMultiValues('doc-filter-medanalysis');
  const fVisa = getMultiValues('doc-filter-visa');

  Views._docFilteredCandidates = (App.state.dcCandidates || App.state.candidates || []).filter(c => {
    // Search
    const matchSearch = !searchTerm || [c.FullName, c.HR_Code, c.Position, c.NationalID].some(v => String(v || '').toLowerCase().includes(searchTerm));
    if (!matchSearch) return false;

    // Excluded Status Logic
    if (excStatuses.length > 0 && excStatuses.includes(c.CurrentStatus)) return false;

    // Standard Multi-Select Logic
    const matchStatus = incStatuses.length === 0 || incStatuses.includes(c.CurrentStatus);
    const matchDept = depts.length === 0 || depts.includes(c.Department);
    const matchNat = nats.length === 0 || nats.includes(c.Nationality);
    const matchBatch = batches.length === 0 || batches.some(b => String(b).trim() === String(Views._getBatchValue(c)).trim());

    if (!(matchStatus && matchDept && matchNat && matchBatch)) return false;

    // Expiry Array Matching
    if (fPass.length > 0 && !fPass.includes(getDocState(c, 'passport'))) return false;
    if (fMedExam.length > 0 && !fMedExam.includes(getDocState(c, 'medical examination'))) return false;
    if (fMedAna.length > 0 && !fMedAna.includes(getDocState(c, 'medical analysis'))) return false;
    if (fVisa.length > 0 && !fVisa.includes(getDocState(c, 'visa'))) return false;

    return true;
  });

  