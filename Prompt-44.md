# SURGICAL BUG FIX PROMPT: ZIP Download Stuck at 0%

Act as a Principal Full-Stack Engineer specializing in Google Apps Script (GAS) Web Applications and Vanilla JS SPAs.

---

### Problem & Context
In the **📁 Documents Center** view (`Script.html`), selecting candidates and document types (e.g., Passport) and clicking **"Download ZIP"** opens the progress modal ("Preparing your download..."), but the process gets stuck indefinitely at **0%**. The "Files Found" and "Downloaded" status indicators remain empty (`—`).

---

### Root Cause Analysis
1. **Frontend Selection Mismatch**: Recent UI refactoring altered the DOM structure, causing the selection reader (`App.state.documentsCenter.selectedIds` or `.dc-doctype-check:checked`) to retrieve empty arrays when triggering the download payload.
2. **Missing Failure Handlers**: The client-side `google.script.run` call or progress polling loop lacks a `.withFailureHandler()`, causing backend runtime exceptions to fail silently without updating the progress UI overlay.
3. **Unvalidated Backend Payloads**: In `DocumentsCenter.gs`, `api_batchDownloadZip()` may encounter an empty input set or missing file IDs without setting the progress stage to `'error'`, leaving the frontend polling loop waiting for updates indefinitely.

---

### Critical Execution Rules
- Inspect and update **`Script.html`** (ZIP download trigger & progress handler) and **`DocumentsCenter.gs`** (`api_batchDownloadZip`).
- Do **NOT** modify spreadsheet schemas or unrelated UI views.
- Ensure all backend errors are caught and transmitted to the frontend progress modal.

---

### Required Fixes & Implementation Specifications

#### 1. Frontend Data Collection & Error Handling (`Script.html`)
Inspect `Views._dcDownload()` in `Script.html`:
- Ensure candidate IDs are correctly collected from `App.state.documentsCenter.selectedIds` (converted to an Array).
- Ensure checked document types are queried accurately from `.dc-doctype-check:checked`.
- Wrap the invocation in `try...catch` and attach `.withFailureHandler()` to the server call:
  ```javascript
  google.script.run
    .withSuccessHandler(res => {
      if (!res || !res.success) {
        Views._dcProgressError(res?.error || 'Batch ZIP generation failed.');
        return;
      }
      // Process base64 download...
    })
    .withFailureHandler(err => {
      Views._dcProgressError(err.message || 'Server error during ZIP creation.');
    })
    .api_batchDownloadZip(JSON.stringify(candidateIds), JSON.stringify(docTypes), batchId);

2. Backend Error Handling & Response Validation (DocumentsCenter.gs)
In api_batchDownloadZip(candidateIdsJson, docTypesJson, batchId):

    Validate that candidateIds and docTypes arrays are non-empty before processing. If empty, invoke setProgress_(batchId, { stage: 'error', percent: 0, message: 'No candidates or document types selected.' }) and return { success: false, error: '...' }.
    Wrap the entire file-fetching loop in try...catch. If zero blobs are fetched from Drive, report stage: 'error' to CacheService so frontend progress polling detects the termination state immediately.

Verification Checklist

    Clicking "Download ZIP" with selected candidates and document types accurately initiates scanning.
    Any server-side error (e.g., missing Drive files, invalid permissions) immediately updates the modal with a red error alert instead of remaining stuck at 0%.
    Successfully generated ZIP archives trigger a clean browser download and display 100% completion.

