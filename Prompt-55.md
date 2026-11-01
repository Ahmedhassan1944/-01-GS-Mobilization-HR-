### ARCHITECTURE FIX: CENTRALIZE DOCUMENT TYPES FROM SETTINGS (SSOT)

**Context:** Document types in the "Upload Document" dropdowns and the "Missing Documents" calculation logic are currently hardcoded. The user requires them to dynamically read from the centralized Settings state so that when a new required document type is added, it automatically propagates across all modals and tables.
**Objective:** Act as a Principal Frontend Engineer. Refactor the frontend logic to dynamically pull document types exclusively from the loaded Settings (`App.state.settings`).

#### FIX 1: Dynamic Upload Dropdown (`Script.html`)
Locate the logic that opens or initializes the Upload Document modal (e.g., `Views._openUploadModal` or the global initialization function).
- Remove any hardcoded `<option>` elements in the HTML for document types.
- Fetch the dynamic array of document types from the settings (e.g., `App.state.settings.documentTypes` or the equivalent configuration array).
- Dynamically build and append the `<option>` elements to the upload `<select>` dropdown (e.g., `#upload-doc-type` or similar ID) using a `DocumentFragment` for performance.

#### FIX 2: Dynamic Missing Documents Logic (`Script.html`)
Locate the function responsible for computing missing documents for a candidate (e.g., inside `_renderCandidatesTable`, `_renderDashboardTable`, or a helper like `_calculateMissingDocs`).
- Replace the hardcoded array of required documents (e.g., `['Passport', 'Medical Examination', 'Visa', ...]`) with the dynamic array from Settings (e.g., `App.state.settings.documentTypes` or the exact variable holding required docs).
- Ensure the diff logic correctly compares this dynamic required list against the documents the candidate has actually uploaded to generate the red missing tags.

**Execution:** Apply these dynamic bindings to enforce a Single Source of Truth. Save and push.