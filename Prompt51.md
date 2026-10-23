### GOD-MODE LOOPHOLE: UNLIMITED DRIVE EXPORT ROUTING

**Context:** The 9MB base64 payload limit is blocking massive batch downloads. The user wants to download ALL system files in a single click without hitting V8 memory limits.
**Objective:** Implement "Smart Download Routing". If the payload is small, zip it normally. If it's a massive batch, bypass V8 ZIP entirely, generate a Drive folder, copy the files, and return the folder link for native Google Drive downloading.

#### FIX 1: Rewrite `api_batchDownloadZip` (`DocumentsCenter.gs`)
Act as a Principal Architect. Replace the current `api_batchDownloadZip` function with this hybrid approach:

```javascript
function api_batchDownloadZip(candidateIdsJson, docTypesJson, batchId) {
  try {
    const auth = requireRole_(['Admin', 'HR']);
    if (!auth.authorized) return { success: false, error: auth.error };

    var candidateIds = JSON.parse(candidateIdsJson || '[]');
    var docTypes = JSON.parse(docTypesJson || '[]');
    if (!candidateIds.length || !docTypes.length) return { success: false, error: 'No criteria selected.' };

    var allDocs = api_getAllDocuments().data;
    var matchedDocs = allDocs.filter(d => candidateIds.includes(d.CandidateID) && docTypes.includes(d.DocType));
    if (matchedDocs.length === 0) return { success: false, error: 'No documents match.' };

    // HEURISTIC: If more than 12 files, switch to Drive Export Loophole
    if (matchedDocs.length > 12) {
      // DRIVE FOLDER EXPORT MODE (Unlimited Size)
      var rootFolder = DriveApp.getRootFolder();
      var exportFolderName = 'HR_Export_' + (batchId || 'Bulk') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
      var exportFolder = rootFolder.createFolder(exportFolderName);
      
      for (var i = 0; i < matchedDocs.length; i++) {
        var doc = matchedDocs[i];
        var fileId = extractFileId_(doc.fileUrl);
        if (fileId) {
          try {
            var file = DriveApp.getFileById(fileId);
            file.makeCopy(doc.CandidateName + '_' + doc.DocType, exportFolder);
          } catch (e) {
            Logger.log('Copy error: ' + e.message);
          }
        }
      }
      return { success: true, mode: 'drive_link', url: exportFolder.getUrl(), message: 'Exported to Google Drive successfully.' };
    } 
    else {
      // BASE64 DIRECT MODE (Fast, < 9MB)
      var blobs = [];
      var totalBytes = 0;
      for (var k = 0; k < matchedDocs.length; k++) {
        var fileId = extractFileId_(matchedDocs[k].fileUrl);
        if (fileId) {
          var blob = DriveApp.getFileById(fileId).getBlob();
          var size = blob.getBytes().length;
          if (totalBytes + size > 9 * 1024 * 1024) throw new Error('Switching to fallback'); // Safety
          totalBytes += size;
          blobs.push(blob.setName(matchedDocs[k].CandidateName + '_' + matchedDocs[k].DocType + '.pdf'));
        }
      }
      var zipName = 'Batch_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
      var zip = Utilities.zip(blobs, zipName);
      blobs = null;
      var bytes = zip.getBytes();
      zip = null;
      var base64 = Utilities.base64Encode(bytes);
      bytes = null;
      return { success: true, mode: 'base64', data: base64, filename: zipName + '.zip' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

FIX 2: Update Frontend Handler (Script.html)

Locate Views._dcDownload() inside Script.html. Update the .then() handler to route the response appropriately:


GAS.call('api_batchDownloadZip', JSON.stringify(candIds), JSON.stringify(docs), batchName)
    .then(res => {
      Router.clearIntervals();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> Download Selected';

      if (res && res.success) {
        if (res.mode === 'drive_link') {
          // Open the Google Drive Folder in a new tab
          window.open(res.url, '_blank');
          App.showToast('Massive batch detected! Exported to a Drive folder for native downloading.', 'success');
        } else if (res.mode === 'base64') {
          // Normal base64 direct download
          const link = document.createElement('a');
          link.href = 'data:application/zip;base64,' + res.data;
          link.download = res.filename;
          link.click();
          App.showToast('Download complete.', 'success');
        }
      } else {
        App.showToast('Download failed: ' + (res ? res.error : 'Unknown error'), 'error');
      }
    })
    // NOTE to IDE: leave the .catch() block as it is.

    Execution: Apply these two patches to unlock unlimited massive batch downloads via Google Drive native folder generation. Push the code via Clasp.