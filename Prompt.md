Act as a Senior Google Apps Script & Frontend Developer. I found a bug when clicking on the newly added Pipeline Overview KPI cards on the Dashboard (e.g., Talent Acquisition Issues, Renewal Passport, Not Available, Creating WhatsApp Group, Unfit-PCR, Unfit-Injury, Rejected). 

### Problem Diagnosis
When a KPI card is clicked, `_onKpiCardClick()` invokes `_renderKpiSectionsWithBatchFilter()`, which recalculates KPI card numbers dynamically via `Views._computeDashboardKpis()`. 
However, `Views._computeDashboardKpis()` in `Script.html` was missing counter variables for the 7 new candidate statuses. As a result, clicking any card causes the counts on the new cards to evaluate to `undefined` and fall back to displaying `'--'`.

---

### File & Code Modifications Required

#### File: `Script.html`

1. **Update `Views._computeDashboardKpis(candidates, docCompleteness)`**:
   - Add status counter variables for all 7 new candidate statuses:
     - `taIssues` (`status === 'Talent Acquisition Issues'`)
     - `renewalPassport` (`status === 'Renewal Passport'`)
     - `notAvailable` (`status === 'Not Available'`)
     - `creatingWhatsapp` (`status === 'Creating WhatsApp Group'`)
     - `unfitPcr` (`status === 'Unfit-PCR'`)
     - `unfitInjury` (`status === 'Unfit-Injury'`)
     - `rejected` (`status === 'Rejected'`)
   - Include these properties in the returned KPI object:
     ```javascript
     return {
       activeCount, missingDocs, visaPending, visaCompleted, mobilized,
       pendingMedical, bookedMedical, docsUnderPreparing,
       taIssues, renewalPassport, notAvailable, creatingWhatsapp,
       unfitPcr, unfitInjury, rejected,
       // ... existing document HAS and MISSING properties
     };
     ```

2. **Verify Card IDs in `Views._restoreDashboardFilterState()`**:
   - Ensure `value.replace(/\s+/g, '_')` safely handles hyphens (e.g., `Unfit-PCR` -> `kpi-card-status-Unfit-PCR`) so selected state styling (the ring highlight) matches `Views._kpiCard()` rendering.

3. **Verify Candidate Table Filtering**:
   - Ensure candidates with statuses like `Unfit-PCR`, `Unfit-Injury`, `Rejected`, or `Not Available` are correctly matched in `Views._buildDashboardCardPredicate()` when their corresponding card is clicked.

---

### Constraints
- Do not modify backend database logic in `Database.gs` or schema structure.
- Preserve all existing 13 statuses and 19 KPI cards without breaking batch or document filters.