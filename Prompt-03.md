Act as a Senior Google Apps Script Developer and UI Architect. I need to update the KPI filtering logic across all three Dashboard KPI sections:
1. 📊 Pipeline Overview
2. ✅ Candidates WITH Document
3. ❌ Candidates MISSING Document

Currently, these sections only exclude candidates with the status 'Closed'. I want to expand the exclusion list so that candidates with any of the following 4 statuses are excluded from these KPI grid calculations:
1. Closed
2. Rejected
3. Unfit-Injury
4. Unfit-PCR

---

### File & Code Modifications Required

#### A. Backend KPI Controller (`Code.gs`)
In `api_getDashboardData()`:
1. Replace the single `status !== 'Closed'` filter with a Set of excluded statuses:
   ```javascript
   const EXCLUDED_KPI_STATUSES = new Set(['Closed', 'Rejected', 'Unfit-Injury', 'Unfit-PCR']);

   const candidates = allCandidates.filter(c => {
     const status = (c.CurrentStatus || '').trim();
     return !EXCLUDED_KPI_STATUSES.has(status);
   });