Act as a Senior Google Apps Script Developer and UI/UX Architect. I need to modify the Pipeline Overview KPI grid (`kpi-grid-status`) on the Dashboard.

### 1. Requirements Summary
1. **Remove Card**:
   - Remove the **Mobilized** card from the Pipeline Overview grid.
2. **Reorder Cards**:
   - Move **Internal Candidates** and **External Candidates** immediately after the **Active Cases** card.
3. **Add 7 New KPI Cards**:
   - **Talent Acquisition Issues** (`status`: `'Talent Acquisition Issues'`, Icon: `⚠️`, Accent: `amber` / `orange`)
   - **Renewal Passport** (`status`: `'Renewal Passport'`, Icon: `🛂`, Accent: `blue`)
   - **Not Available** (`status`: `'Not Available'`, Icon: `🚫`, Accent: `slate` / `gray`)
   - **Creating WhatsApp** (`status`: `'Creating WhatsApp Group'`, Icon: `💬`, Accent: `green`)
   - **Unfit-PCR** (`status`: `'Unfit-PCR'`, Icon: `🧪`, Accent: `red`)
   - **Unfit-Injury** (`status`: `'Unfit-Injury'`, Icon: `🩹`, Accent: `red`)
   - **Rejected** (`status`: `'Rejected'`, Icon: `❌`, Accent: `red`)

---

### 2. File Modifications Required

#### A. Backend KPI Calculations (`Code.gs`)
In `api_getDashboardData()`:
1. Add individual status counters for the 7 new candidate statuses:
   - `taIssues` (`status === 'Talent Acquisition Issues'`)
   - `renewalPassport` (`status === 'Renewal Passport'`)
   - `notAvailable` (`status === 'Not Available'`)
   - `creatingWhatsapp` (`status === 'Creating WhatsApp Group'`)
   - `unfitPcr` (`status === 'Unfit-PCR'`)
   - `unfitInjury` (`status === 'Unfit-Injury'`)
   - `rejected` (`status === 'Rejected'`)
2. Return these new counter properties in the `data` object payload.

#### B. Frontend Dashboard Rendering (`Script.html`)
Update both `Views._refreshDashboard()` and `Views._renderKpiSectionsWithBatchFilter()` where `kpi-grid-status` is populated:

1. **New Pipeline Overview Card Sequence**:
   1. `Active Cases`
   2. `Internal Candidates`
   3. `External Candidates`
   4. `Pending Medical`
   5. `Booked Medical Exam`
   6. `Docs Under Preparing`
   7. `Visa Pending`
   8. `Visa Completed`
   9. `Talent Acquisition Issues`
   10. `Renewal Passport`
   11. `Not Available`
   12. `Creating WhatsApp Group`
   13. `Unfit-PCR`
   14. `Unfit-Injury`
   15. `Rejected`
   16. `Batch 1`
   17. `Batch 2`
   18. `Batch 3`
   19. `Batch 4`

2. Bind each new card to its corresponding status filter object:
   - `{ type: 'status', value: 'Talent Acquisition Issues' }`
   - `{ type: 'status', value: 'Renewal Passport' }`
   - `{ type: 'status', value: 'Not Available' }`
   - `{ type: 'status', value: 'Creating WhatsApp Group' }`
   - `{ type: 'status', value: 'Unfit-PCR' }`
   - `{ type: 'status', value: 'Unfit-Injury' }`
   - `{ type: 'status', value: 'Rejected' }`

---

### 3. Execution Constraints
- Ensure card clicking correctly filters the candidate table below.
- Do not alter the Has Document (`kpi-grid-has`), Missing Document (`kpi-grid-missing`), or Calendar (`kpi-grid-calendar`) grids.