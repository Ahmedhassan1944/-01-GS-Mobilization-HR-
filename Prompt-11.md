Act as a Senior Frontend and Google Apps Script Developer. I need to fix a client-side state and cache synchronization bug in the "EDECS HR Mobilization Management System" Web App (`Script.html`).

---

### Problem Diagnosis
When a user uploads or deletes a document for a candidate (e.g., in `Views._submitUpload` or `Views._confirmDeleteDocument`):
1. The Candidate Profile (`candidate-detail`) view immediately updates its local document completeness panel (`#doc-completeness`).
2. However, returning to or viewing the **Dashboard** or **Candidates Table** still shows 0% completeness or stale missing documents for that candidate.
3. The Dashboard/Candidates table only reflects updated completeness after performing a full browser hard refresh (F5).

### Root Cause
1. `Views._submitUpload()` and `Views._confirmDeleteDocument()` invoke `Views._loadCandidateDocuments(candidateId)`, which calculates completeness only for the DOM element (`#doc-completeness`) inside the candidate detail view.
2. Neither `App.state.docCompleteness[candidateId]` nor `App.state.candidates` is updated in memory after an upload or deletion.
3. When the user navigates back to the Dashboard (`showView('dashboard')`) or Candidates view (`showView('candidates')`), the views render from the stale `App.state.docCompleteness` map without re-fetching or updating the affected candidate's state.

---

### Required Modifications (`Script.html`)

#### 1. Synchronize Memory Cache on Document Mutation
- Update `Views._loadCandidateDocuments(candidateId)`:
  - After receiving document records for the candidate from `GAS.call('api_getDocumentsByCandidate', candidateId)`, compute the updated completeness object using the shared helper:
    `const newComp = computeCompleteness(docs);`
  - Instantly update `App.state.docCompleteness[candidateId] = newComp;` in JavaScript memory.
- Alternatively, in `Views._submitUpload()` and `Views._confirmDeleteDocument()`, trigger a background refresh of the global completeness map:
  - Call `Views._loadAllCompleteness(App.state.candidates)` after a successful upload or deletion so all in-memory completeness metrics remain fresh across views.

#### 2. Reactive View Sync & Table Row Re-render
- In `Views.candidateDetail()`:
  - When clicking "← Back to Candidates", ensure `Router.navigate('candidates')` or `Router.navigate('dashboard')` re-applies the latest filters (`Views._filterCandidates()` or `Views._applyDashboardAllFilters()`) using the synchronized `App.state.docCompleteness`.
- If the Candidates table or Dashboard table is currently in DOM, dynamically update the table row corresponding to `CandidateID === candidateId` using the new `pct` and `missingDocs` chips.

#### 3. Standardize Document Completeness Logic
- Ensure both Candidate Detail view and Table views exclusively rely on `computeCompleteness(docs)` and `REQUIRED_DOCS = ['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV']` as the single source of truth.

---

### Execution Constraints
- Do not alter backend database schemas in `Database.gs` or file upload logic in `DriveManager.gs`.
- Ensure zero regression in dashboard KPI card counts or batch download filtering in `DocumentsCenter.gs`.
- Keep memory state updates synchronous so view transitions feel instantaneous without needing full page reloads.