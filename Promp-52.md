### BACKEND FIX: CHUNKED EXPORT & SUBFOLDERS
**Target File:** `DocumentsCenter.gs`

Act as a Principal Architect. Add this new function to handle chunked exports and create a subfolder for each candidate. Do NOT delete `api_batchDownloadZip`, just add this below it.

```javascript
function api_massiveDriveExport(candidateIdsJson, docTypesJson, existingFolderId, batchId) {
  const auth = requireRole_(['Admin', 'HR']);
  if (!auth.authorized) return { success: false, error: auth.error };

  var candidateIds = JSON.parse(candidateIdsJson || '[]');
  var docTypes = JSON.parse(docTypesJson || '[]');
  if (!candidateIds.length || !docTypes.length) return { success: false, error: 'No criteria selected.' };

  // 1. Resolve or Create Root Export Folder
  var rootFolder = DriveApp.getRootFolder();
  var exportFolder;
  if (existingFolderId) {
    exportFolder = DriveApp.getFolderById(existingFolderId);
  } else {
    var exportFolderName = 'HR_Export_' + (batchId || 'Bulk') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
    exportFolder = rootFolder.createFolder(exportFolderName);
  }

  // 2. Fetch and Filter Documents
  var allDocs = api_getAllDocuments().data;
  var matchedDocs = allDocs.filter(d => candidateIds.includes(d.CandidateID) && docTypes.includes(d.DocType));

  // 3. Group by Candidate Name for Subfolders
  var candidatesMap = {};
  matchedDocs.forEach(d => {
    if (!candidatesMap[d.CandidateName]) candidatesMap[d.CandidateName] = [];
    candidatesMap[d.CandidateName].push(d);
  });

  // 4. Create Subfolders & Copy Files
  for (var candName in candidatesMap) {
    var subFolder = exportFolder.createFolder(candName); 
    var cDocs = candidatesMap[candName];
    for (var i = 0; i < cDocs.length; i++) {
      var fileId = extractFileId_(cDocs[i].fileUrl);
      if (fileId) {
        try {
          var file = DriveApp.getFileById(fileId);
          file.makeCopy(cDocs[i].CandidateName + '_' + cDocs[i].DocType, subFolder);
        } catch (e) {
          Logger.log('Copy error for ' + candName + ': ' + e.message);
        }
      }
    }
  }

  return { success: true, folderId: exportFolder.getId(), folderUrl: exportFolder.getUrl() };
}

### التعديل الثاني: المتصفح (عداد التحميل وتقسيم الطلبات)
بعد ما الـ IDE يخلص الأول، انسخ الصندوق ده واديه للـ IDE عشان يعدل زرار التحميل في ملف `Script.html` :

```markdown
### FRONTEND FIX: ORCHESTRATING THE CHUNKS
**Target File:** `Script.html`

Act as a Principal Architect. Locate the `Views._dcDownload()` function. Replace the current download trigger logic (the part that evaluates `> 12` files and calls `api_batchDownloadZip`) with this chunking orchestrator:

```javascript
    const maxPossibleFiles = candIds.length * docs.length;

    if (maxPossibleFiles > 12) {
      // MASSIVE CHUNKED EXPORT MODE (Bypasses 6-minute limit & builds subfolders)
      try {
        let folderId = null;
        let folderUrl = null;
        const chunkSize = 5; // Process exactly 5 candidates per roundtrip

        for (let i = 0; i < candIds.length; i += chunkSize) {
          const chunk = candIds.slice(i, i + chunkSize);
          
          // Update UI Progress dynamically
          btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Exporting ${Math.min(i + chunkSize, candIds.length)}/${candIds.length} Candidates...`;
          
          const res = await GAS.call('api_massiveDriveExport', JSON.stringify(chunk), JSON.stringify(docs), folderId, batchName);
          if (!res || !res.success) throw new Error(res?.error || 'Chunk export failed');
          
          // Carry over the folder ID for the next chunk
          folderId = res.folderId;
          folderUrl = res.folderUrl;
        }

        Router.clearIntervals();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download Selected';
        window.open(folderUrl, '_blank');
        App.showToast('Export complete! Files organized into subfolders.', 'success');
        return; 
      } catch (err) {
        Router.clearIntervals();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download Selected';
        App.showToast('Export failed: ' + err.message, 'error');
        return;
      }
    }

    // BASE64 ZIP FALLBACK (For <= 12 files)
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zipping...';
    GAS.call('api_batchDownloadZip', JSON.stringify(candIds), JSON.stringify(docs), batchName)
      .then(res => {
        Router.clearIntervals();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download Selected';

        if (res && res.success) {
          if (res.mode === 'drive_link') {
            window.open(res.url, '_blank');
            App.showToast('Exported to Google Drive successfully.', 'success');
          } else {
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
      .catch(err => {
        Router.clearIntervals();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download Selected';
        App.showToast('Download error: ' + err.message, 'error');
      });