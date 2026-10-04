Act as a Senior Google Apps Script Developer and UI/UX Designer. I need to add new candidate mobilization statuses with custom semantic badge colors across both backend logic and frontend UI files in this project.

### 1. New Candidate Statuses & Semantic Color Specifications
Please add the following 6 new statuses and configure their visual badge styling:

1. **Talent Acquisition Issues**
   - Theme: Amber / Warning
   - Background: `#fef3c7`
   - Text Color: `#b45309`

2. **Renewal Passport**
   - Theme: Cyan / Info
   - Background: `#e0f2fe`
   - Text Color: `#0369a1`

3. **Not Available**
   - Theme: Slate / Gray
   - Background: `#f1f5f9`
   - Text Color: `#475569`

4. **Creating WhatsApp Group**
   - Theme: Emerald Green / Communication
   - Background: `#d1fae5`
   - Text Color: `#047857`

5. **Unfit-PCR**
   - Theme: Crimson Red / Danger
   - Background: `#fee2e2`
   - Text Color: `#b91c1c`

6. **Unfit-Medical / Injury** (e.g., "Unfit-Injury")
   - Theme: Rose / Severe Warning
   - Background: `#ffe4e6`
   - Text Color: `#be123c`

---

### 2. Files & Modifications Required

#### A. Backend Validation (`Database.gs`)
- In `api_updateCandidateStatus(candidateId, newStatus)`, update the `ALLOWED_STATUSES` Set to include these 6 new status strings so backend updates pass validation.

#### B. Dashboard Aggregation (`Code.gs`)
- In `api_getDashboardData()`, update any status sets or KPI grouping logic if these statuses should count towards active, pending, or closed pipelines.

#### C. Frontend UI & Renderer (`Script.html`)
1. **Badge Mapping Helper (`statusBadge`)**:
   - Add mappings for all 6 new status strings to return appropriate badge classes (e.g., `badge--ta-issues`, `badge--renewal-passport`, `badge--not-available`, `badge--whatsapp`, `badge--unfit-pcr`, `badge--unfit-injury`).
2. **Status Dropdowns**:
   - Update `statusOptions` arrays in:
     - `Views._openStatusModal()`
     - `Views.newCandidate()`
     - `Views.dashboard()` quick filters & filter panels
     - Filter options in `DocumentsCenter.gs` / `api_getDocumentsCenterFilterOptions()`

#### D. Design System Styles (`Styles.html`)
- Add CSS rules for the new badge classes matching the exact text and background color specifications listed above:
  - `.badge--ta-issues`
  - `.badge--renewal-passport`
  - `.badge--not-available`
  - `.badge--whatsapp`
  - `.badge--unfit-pcr`
  - `.badge--unfit-injury`
- Ensure dark mode overrides are included for each badge class for contrast and legibility.

---

### 3. Execution Constraints
- Preserve all existing 13 statuses without breaking backward compatibility.
- Ensure all dropdowns and filter panels display the full list of statuses consistently.
- Do not modify database schemas, column indices, or core document upload logic.