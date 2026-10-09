# FEATURE REQUEST: Flat ZIP Download with Candidate Full Names for Single Document Type

Act as a Principal Full-Stack Engineer on Google Apps Script and Vanilla JS.

### Background & Objective
In the "📁 Documents Center" view, clicking "Download ZIP" currently creates a ZIP archive with nested folders per candidate (`Candidate Name -> selected documents`). We need to enhance the ZIP packaging engine (`DocumentsCenter.gs` / `api_batchDownloadZip` and `Script.html`):

When a user selects **ONLY ONE** document type (e.g., checking only `Passport`):
- Do **NOT** create nested subfolders for each candidate inside the ZIP.
- Place all files directly at the root of the ZIP archive.
- Automatically rename each file to the candidate's exact Full Name from `tbl_Candidates` (preserving the original file extension), e.g.:
  `Mohamed Naguib Abo El Fetouh.jpg`
  `Ahmed Tawfik Elsdeq.pdf`

---

### Implementation Specifications

#### 1. Backend ZIP Generation Logic (`DocumentsCenter.gs`)
- In `api_batchDownloadZip(candidateIdsJson, docTypesJson, batchId)`:
  - Determine if single-document flat mode applies:
    ```javascript
    const isSingleDocType = Array.isArray(docTypes) && docTypes.length === 1;
    ```
  - **Flat Mode (`isSingleDocType === true`)**:
    - For each matched document blob fetched from Google Drive:
      - Extract the original file extension (e.g., `.pdf`, `.jpg`, `.png`).
      - Sanitize forbidden filename characters in candidate full names (`/ \ : * ? " < > |`).
      - Check for duplicate candidate names in the current batch; if a name collision occurs, append the `HR_Code` or candidate ID suffix (e.g., `Mohamed Ali (HR-102).pdf`).
      - Set the blob name directly without folder slashes:
        ```javascript
        const cleanName = (doc.candidateName || 'Candidate').replace(/[\\/:*?"<>|]/g, '_').trim();
        const ext = doc.fileName.includes('.') ? doc.fileName.split('.').pop() : 'pdf';
        const flatFileName = `${cleanName}.${ext}`;
        blob.setName(flatFileName);
        blobs.push(blob);
        ```
    - Set the output ZIP archive name dynamically:
      `Mobilization_${docTypes[0]}_${dateStr}.zip`
  - **Hierarchical Mode (`isSingleDocType === false`)**:
    - Preserve existing behavior creating subfolders per candidate:
      `safeCandName + '/' + doc.docType + '_' + doc.fileName`
    - Keep output ZIP archive name as:
      `Documents_${dateStr}.zip`

#### 2. Frontend User Feedback (`Script.html` — `Views._dcDownload`)
- When triggering `Views._dcDownload()`:
  - If exactly 1 document type is checked in `.dc-doctype-check`:
    - Display a toast notification: `Toast.show('Single document selected: Files will be downloaded flat named by candidate full name.', 'info');`

#### 3. Error Handling & Edge Cases
- Skip candidates missing the requested document without throwing execution errors or creating empty files.
- Enforce the 200-file safety cap across both flat and hierarchical download modes.

---

### Reference Implementation Code (`DocumentsCenter.gs`)

```javascript
// Inside api_batchDownloadZip(candidateIdsJson, docTypesJson, batchId):

var isSingleDocType = docTypes.length === 1;
var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
var zipName = isSingleDocType 
  ? 'Mobilization_' + docTypes[0].replace(/\s+/g, '_') + '_' + dateStr + '.zip'
  : 'Documents_' + dateStr + '.zip';

var usedFileNames = {}; // Track duplicate names in flat mode

for (var k = 0; k < matchedDocs.length; k++) {
  var doc    = matchedDocs[k];
  var fileId = extractFileId_(doc.fileUrl);

  var dlPercent = Math.round(5 + (k / totalFiles) * 60);
  setProgress_(batchId, {
    stage: 'downloading',
    percent: dlPercent,
    message: 'Downloading file ' + (k + 1) + ' of ' + matchCount + '…',
    filesFound: matchCount,
    filesDownloaded: k
  });

  if (fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      var blob = file.getBlob();
      
      if (isSingleDocType) {
        // Flat mode: rename to candidate Full Name
        var cleanName = (doc.candidateName || 'Candidate').replace(/[\\/:*?"<>|]/g, '_').trim();
        var ext = doc.fileName.indexOf('.') !== -1 ? doc.fileName.split('.').pop() : 'pdf';
        var baseFileName = cleanName + '.' + ext;
        
        // Disambiguate collision
        if (usedFileNames[baseFileName]) {
          usedFileNames[baseFileName]++;
          baseFileName = cleanName + ' (' + doc.candidateId.slice(0, 6) + ').' + ext;
        } else {
          usedFileNames[baseFileName] = 1;
        }
        
        blob.setName(baseFileName);
      } else {
        // Hierarchical mode: candidate subfolder
        var safeCandName = doc.candidateName.replace(/[\/\\]/g, '_');
        blob.setName(safeCandName + '/' + doc.docType + '_' + doc.fileName);
      }
      
      blobs.push(blob);
      uniqueCandidatesFound[doc.candidateId] = true;
    } catch (fileErr) {
      Logger.log('Error getting file ' + fileId + ': ' + fileErr.message);
    }
  }
}

Constraints

    Do not alter spreadsheet query structures or permissions in Database.gs.
    Ensure zero breaking changes for multi-document type ZIP downloads.