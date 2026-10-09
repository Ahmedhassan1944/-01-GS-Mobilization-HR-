# BUG FIX: "Unavailable" Missing Documents & Empty "Doc Completeness" in Dashboard/Candidates Tables

Act as a Senior Full-Stack Google Apps Script & Vanilla JS Developer.

### Problem Description
In both the Candidates View and Dashboard View tables, document tracking data is broken:
1. `DOC COMPLETENESS` column consistently renders a dash (`—`) or fails to display accurate progress percentages.
2. `MISSING DOCUMENTS` column displays `Unavailable` for candidate records.
3. Quick Filter pills (e.g., `Missing Med. Analysis`) fail to filter candidates correctly due to missing or unpopulated document properties on candidate objects.

---

### Root Cause Analysis
1. Candidate objects in `App.state.candidates` (or backend API payloads) lack populated document availability metadata mapped against the canonical 7 document types: `['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV']`.
2. The frontend rendering helper that inspects candidate document properties encounters `null` or `undefined`, triggering the fallback strings `'Unavailable'` and `'—'`.
3. In `Script.html`, `_loadAllCompleteness(candidates)` or row template functions fail to sync document records into `App.state.docCompleteness` prior to table evaluation.

---

### Required Modifications & Fixes

#### A. Backend Data Mapping & Joining (`Database.gs` / `Code.gs` / `DocumentsCenter.gs`)
1. **Candidate & Document Data Association**:
   - In `api_getAllCandidates()` / `api_getDashboardData()`, ensure document records from `tbl_Documents` are joined with `tbl_Candidates`.
   - Verify `isDocumentAvailable_(doc)` evaluates all registered documents where `ApprovalStatus !== 'Rejected'`.
2. **Canonical Document Type Mapping**:
   - Evaluate each candidate against the canonical 7 document types: `['Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 'Medical Analysis', 'Visa', 'CV']`.
   - Ensure the server payload or client-side mapper constructs:
     - `presentDocs`: Array of valid document types present for the candidate.
     - `missingDocs`: Array of document types missing from the required set.
     - `pct`: Calculated completeness percentage (`Math.round((presentDocs.length / 7) * 100)`).

#### B. Frontend Table Row Rendering (`Script.html`)
1. **Doc Completeness Column**:
   - Render a progress bar and percentage value (`X%`) when document data is present.
   - Render `Loading…` during in-flight fetches, and reserve `—` strictly for unresolvable server error states.
2. **Missing Documents Column**:
   - If missing documents exist, render styled badge chips (`.missing-chip`) for each missing document type instead of plain text `'Unavailable'`.
   - If all 7 documents are uploaded, display a green `✅ Complete` badge (`.doc-chip--complete`).
3. **Quick Filter Interoperability**:
   - Update `Views._toggleDocFilter` and `Views._filterCandidates` to evaluate `comp.missingDocs.includes(docType)` directly against `App.state.docCompleteness`.

---

### Deliverables Expected
1. **Backend Query & Mapping Updates (`Database.gs` / `Code.gs`)**: Data join and document aggregation logic.
2. **Frontend Template Helpers (`Script.html`)**: Refactored `Views._candidateTableHtml` and completeness calculation helpers resolving the `'Unavailable'` and `'—'` rendering bugs.