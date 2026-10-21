### FINAL ENTERPRISE PATCH: System Resilience & Quota Hardening

**Context:** The Ultimate Audit revealed 3 advanced edge cases: Router interval leaking, Quota bursting on Audit Logs, and a 10MB payload limit on ZIP downloads.
Act as a Principal Staff Engineer. Apply the following 3 ultimate patches to completely harden the system for production.

#### FIX 1: Global Unmount Cleanup (`Script.html`)
1. Locate the `Router` object. Add the interval registry and clear mechanism:
```javascript
const Router = {
  _activeIntervals: [],
  registerInterval(handle) { this._activeIntervals.push(handle); },
  clearIntervals() { 
    this._activeIntervals.forEach(h => clearInterval(h)); 
    this._activeIntervals = []; 
  },
  navigate(view, params = {}) {
    if (view === 'login') { this.navigate('dashboard', params); return; }
    
    // Clear all background polling when leaving a view
    this.clearIntervals(); 
    
    App.setState({ previousView: App.state.currentView, currentView: view, ...params });
    renderSidebar();
    renderView();
    document.getElementById('app-view')?.focus();
  }
};
Locate Views._dcDownload(). Register the polling interval:

// Inside Views._dcDownload, where setInterval is called:
  pollInterval = setInterval(pollProgress, 500);
  Router.registerInterval(pollInterval); // Register it here!

FIX 2: Single-Roundtrip Batch Audit API

    In Database.gs, add this new endpoint:

JavaScript

function api_getBatchAuditLogs(candidateIds) {
  const auth = requireRole_(['Admin', 'HR']);
  if (!auth.authorized) return { success: false, error: auth.error };
  try {
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) return { success: true, data: [] };
    const idSet = new Set(candidateIds.map(String));
    const sheet = getSheet_(SHEET_LOGS);
    const [headers, ...rows] = sheet.getDataRange().getValues();
    const candIdIdx = headers.indexOf('CandidateID');
    
    const logs = rows.filter(row => idSet.has(String(row[candIdIdx]))).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return { success: true, data: logs };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

    In Script.html, locate Views._loadAllAuditLogs(). Replace the Promise.all mapping with a single call:

JavaScript

    // Replace the old GAS.call loop with this single batch call:
    const res = await GAS.call('api_getBatchAuditLogs', candIds);
    if (!res.success) throw new Error(res.error);

    Views._allLogs = (res.data || [])
      .map(l => ({ ...l, _candidateName: candNameMap[l.CandidateID] || '' }))
      .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

FIX 3: ZIP Payload Memory Guard (DocumentsCenter.gs)

Locate api_batchDownloadZip. Add a file size safety buffer before compressing:
JavaScript

  // Inside the loop checking matchedDocs, before getting the blob:
  var MAX_TOTAL_BYTES = 9 * 1024 * 1024; // 9 MB safety buffer
  var totalBytes = 0;

  for (var k = 0; k < matchedDocs.length; k++) {
    var doc = matchedDocs[k];
    var fileId = extractFileId_(doc.fileUrl);
    if (fileId) {
      try {
        var file = DriveApp.getFileById(fileId);
        var size = file.getSize();
        if (totalBytes + size > MAX_TOTAL_BYTES) {
          throw new Error('Total files exceed Google\'s 9MB memory limit. Please select fewer candidates or document types for this batch.');
        }
        totalBytes += size;
        blobs.push(file.getBlob().setName(doc.CandidateName + '_' + doc.DocType + '.pdf'));
      } catch (fileErr) {
        if (fileErr.message.includes('9MB memory limit')) throw fileErr;
        Logger.log('File error: ' + fileErr.message);
      }
    }
  }

Execution: Apply these 3 patches. Save and deploy. The system is now Production-Ready.