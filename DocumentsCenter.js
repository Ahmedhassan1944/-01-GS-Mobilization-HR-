// DocumentsCenter.js — Documents Center Backend API

/**
 * Helper to extract Google Drive file ID from a URL.
 */
function extractFileId_(url) {
  if (!url) return null;
  var match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Returns all candidates with their document availability summary, filtered by the given criteria.
 */
function api_getDocumentsCenterData(filtersJson) {
  try {
    var execId = 'dc-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000);
    Logger.log("DocumentsCenter: execution started [" + execId + "]");
    var filters = filtersJson ? JSON.parse(filtersJson) : {};
    Logger.log("[" + execId + "] DocumentsCenter: parsed filters = " + JSON.stringify(filters));
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    
    // 1. Read all rows from tbl_Candidates
    var candidatesSheet = ss.getSheetByName('tbl_Candidates');
    if (!candidatesSheet) throw new Error("Sheet 'tbl_Candidates' not found.");
    var cData = candidatesSheet.getDataRange().getValues();
    Logger.log("[" + execId + "] DocumentsCenter: tbl_Candidates row count = " + cData.length + ", headers = " + JSON.stringify(cData[0]));
    if (cData.length < 2) {
      // Empty or headers only
      cData = [cData[0] || []]; 
    }
    var cHeaders = cData[0];
    
    var cIdIdx = cHeaders.indexOf('CandidateID');
    var cNameIdx = cHeaders.indexOf('FullName');
    var cPosIdx = cHeaders.indexOf('Position');
    var cDeptIdx = cHeaders.indexOf('Department');
    var cNatIdx = cHeaders.indexOf('Nationality');
    var cStatusIdx = cHeaders.indexOf('CurrentStatus');
    var cCoordIdx = cHeaders.indexOf('AssignedCoordinatorEmail');
    var cBatchIdx = cHeaders.indexOf('Batch_Number');
    if (cBatchIdx === -1) cBatchIdx = cHeaders.indexOf('Batch Number');
    if (cBatchIdx === -1) cBatchIdx = cHeaders.indexOf('BatchNumber');
    if (cBatchIdx === -1) cBatchIdx = cHeaders.indexOf('Batch');
    var cFolderIdx = cHeaders.indexOf('DriveFolderID');
    if (cFolderIdx === -1) cFolderIdx = cHeaders.indexOf('DriveFolderId');
    if (cFolderIdx === -1) cFolderIdx = cHeaders.indexOf('Drive Folder ID');
    var cHrCodeIdx = cHeaders.indexOf('HR_Code');
    if (cHrCodeIdx === -1) cHrCodeIdx = cHeaders.indexOf('HR Code');
    if (cHrCodeIdx === -1) cHrCodeIdx = cHeaders.indexOf('HRCode');

    // Parse filters
    var fStatus = filters.status || [];
    var fDept = filters.department || [];
    var fNat = filters.nationality || [];
    var fPos = filters.position || "";
    var fCoord = filters.coordinator || "";
    var fBatch = filters.batch_number || "";
    var fSearch = (filters.search || "").toLowerCase();

    var filteredCandidates = [];
    Logger.log("[" + execId + "] DocumentsCenter: filters received = " + (filtersJson || '{}'));
    
    // Collect all filter options while we are at it
    var uniqueDepts = {};
    var uniqueNats = {};
    var uniquePositions = {};
    var uniqueCoords = {};
    var uniqueBatches = {};
    
    for (var i = 1; i < cData.length; i++) {
      var row = cData[i];
      var id = (row[cIdIdx] || "").toString();
      var name = (row[cNameIdx] || "").toString();
      var pos = (row[cPosIdx] || "").toString();
      var dept = (row[cDeptIdx] || "").toString();
      var nat = (row[cNatIdx] || "").toString();
      var status = (row[cStatusIdx] || "").toString();
      var coord = (row[cCoordIdx] || "").toString();
      var batch = (row[cBatchIdx] || "").toString();
      var hrCode = (row[cHrCodeIdx] || "").toString();
      var folderId = (row[cFolderIdx] || "").toString();

      if (dept) uniqueDepts[dept] = true;
      if (nat) uniqueNats[nat] = true;
      if (pos) uniquePositions[pos] = true;
      if (coord) uniqueCoords[coord] = true;
      if (batch) uniqueBatches[batch] = true;

      // Apply filters
      if (fStatus.length > 0 && fStatus.indexOf(status) === -1) continue;
      if (fDept.length > 0 && fDept.indexOf(dept) === -1) continue;
      if (fNat.length > 0 && fNat.indexOf(nat) === -1) continue;
      if (fPos && pos !== fPos) continue;
      if (fCoord && coord !== fCoord) continue;
      if (fBatch && batch !== fBatch) continue;
      
      if (fSearch) {
        if (name.toLowerCase().indexOf(fSearch) === -1 && 
            pos.toLowerCase().indexOf(fSearch) === -1 &&
            hrCode.toLowerCase().indexOf(fSearch) === -1 && 
            id.toLowerCase().indexOf(fSearch) === -1) {
          continue;
        }
      }

      filteredCandidates.push({
        candidateId: id,
        fullName: name,
        department: dept,
        nationality: nat,
        position: pos,
        status: status,
        hrCode: hrCode,
        driveFolderId: folderId,
        batchNumber: batch,
        Batch_Number: batch,
        'Batch Number': batch,
        BatchNumber: batch,
        batch: batch
      });
    }

    // 3. Read all rows from tbl_Documents
    var docsSheet = ss.getSheetByName('tbl_Documents');
    if (!docsSheet) throw new Error("Sheet 'tbl_Documents' not found.");
    var dData = docsSheet.getDataRange().getValues();
    var dHeaders = dData[0];
    
    var dCandIdIdx = dHeaders.indexOf('CandidateID');
    var dTypeIdx = dHeaders.indexOf('DocType');
    var dStatusIdx = dHeaders.indexOf('ApprovalStatus');
    var dDocIdIdx = dHeaders.indexOf('DocumentID');
    var dIssueIdx = dHeaders.indexOf('IssueDate');
    var dUploadIdx = dHeaders.indexOf('UploadDate');
    var dExpiryIdx = dHeaders.indexOf('ExpiryDate');

    // Group documents by CandidateID
    var approvedDocsByCand = {};
    for (var j = 1; j < dData.length; j++) {
      var dRow = dData[j];
      var cId = (dRow[dCandIdIdx] || "").toString();
      var dType = (dRow[dTypeIdx] || "").toString();
      var dStatus = (dRow[dStatusIdx] || "").toString();
      var dDocId = (dRow[dDocIdIdx] || "").toString();
      var dIssue = dIssueIdx !== -1 ? (dRow[dIssueIdx] || "").toString() : "";
      var dUpload = dUploadIdx !== -1 ? (dRow[dUploadIdx] || "").toString() : "";
      var dExpiry = dExpiryIdx !== -1 ? (dRow[dExpiryIdx] || "").toString() : "";
      
      if (isDocumentAvailable_({ DocumentID: dDocId, ApprovalStatus: dStatus })) {
        if (!approvedDocsByCand[cId]) approvedDocsByCand[cId] = {};
        approvedDocsByCand[cId][dType] = {
          issueDate: dIssue,
          uploadDate: dUpload,
          expiryDate: dExpiry
        };
      }
    }

    var docTypesList = [
      'Passport', 'Photo', 'Academic Certificate', 'Medical Examination', 
      'Medical Analysis', 'Visa', 'CV'
    ];
    
    var totalAvailable = 0;
    var totalMissing = 0;
    var finalCandidates = [];

    // 4. Compute docSummary
    for (var k = 0; k < filteredCandidates.length; k++) {
      var cand = filteredCandidates[k];
      var candDocs = approvedDocsByCand[cand.candidateId] || {};
      var docSummary = {};
      var availCount = 0;
      var missCount = 0;
      
      for (var m = 0; m < docTypesList.length; m++) {
        var type = docTypesList[m];
        if (candDocs[type]) {
          docSummary[type] = "Available";
          availCount++;
          totalAvailable++;
        } else {
          docSummary[type] = "Missing";
          missCount++;
          totalMissing++;
        }
      }
      
      cand.docSummary = docSummary;
      cand.docDetails = candDocs;
      cand.availableCount = availCount;
      cand.missingCount = missCount;
      
      finalCandidates.push(cand);
    }

    var allStatuses = [
      "New Candidate", "Documents Requested", "Documents Under Preparing",
      "Pending Passport", "Pending Photo", "Pending Academic Certificate",
      "Pending Medical", "Booked a medical examination", "Documents Complete",
      "Visa Pending", "Visa Completed", "Mobilized", "Closed",
      "Talent Acquisition Issues", "Renewal Passport", "Not Available",
      "Creating WhatsApp Group", "Unfit-PCR", "Unfit-Injury", "Rejected"
    ];

    var result = {
      success: true,
      execId: execId,
      candidates: finalCandidates,
      stats: {
        totalCandidates: finalCandidates.length,
        totalSelected: 0,
        totalAvailableDocs: totalAvailable,
        totalMissingDocs: totalMissing
      },
      filterOptions: {
        statuses: allStatuses,
        departments: Object.keys(uniqueDepts).sort(),
        nationalities: Object.keys(uniqueNats).sort(),
        positions: Object.keys(uniquePositions).sort(),
        coordinators: Object.keys(uniqueCoords).sort(),
        batchNumbers: Object.keys(uniqueBatches).sort()
      }
    };
    
    Logger.log("[" + execId + "] DocumentsCenter: finalCandidates.length = " + finalCandidates.length);
    Logger.log("[" + execId + "] DocumentsCenter: RESULT candidates.length = " + result.candidates.length);
    Logger.log("[" + execId + "] DocumentsCenter: returning result = " + JSON.stringify(result).substring(0, 500));
    return result;
  } catch (e) {
    Logger.log("Error in api_getDocumentsCenterData: " + e.message + "\n" + e.stack);
    return { success: false, error: e.message };
  }
}

/**
 * Retrieve the current progress of a batch download operation from CacheService.
 * Called by the frontend every 500ms to update the Progress UI.
 * @param {string} batchId - Unique batch identifier generated by the frontend.
 * @return {Object} Progress object: { stage, percent, message, filesFound, filesDownloaded }
 */
function api_getBatchDownloadProgress(batchId) {
  try {
    var cache = CacheService.getScriptCache();
    var json = cache.get('batch_progress_' + batchId);
    return json ? JSON.parse(json) : { stage: 'unknown', percent: 0, message: 'Waiting…' };
  } catch (e) {
    return { stage: 'error', percent: 0, message: e.message };
  }
}

/**
 * Internal helper to write progress into CacheService.
 * @param {string} batchId
 * @param {Object} progressObj
 */
function setProgress_(batchId, progressObj) {
  try {
    CacheService.getScriptCache().put(
      'batch_progress_' + batchId,
      JSON.stringify(progressObj),
      300 // 5 minutes TTL
    );
  } catch (e) {
    Logger.log('setProgress_ error: ' + e.message);
  }
}

/**
 * Collect the requested document files from Google Drive for the selected candidates 
 * and return a single ZIP file as a base64 string.
 * Progress is tracked via CacheService and can be polled with api_getBatchDownloadProgress.
 *
 * Progress weight distribution (designed so no stage stays frozen):
 *   0% →  5%  — Scanning sheets & building document list
 *   5% → 65%  — Downloading files from Drive (per-file, every file)
 *  65% → 68%  — Announcing ZIP build start
 *  68% → 85%  — Utilities.zip + base64 encode (announced before & after)
 *  85% → 93%  — Preparing download link (base64 encode tail + cleanup)
 *  93% → 98%  — Finalizing response
 *  98% → 100% — Complete
 *
 * @param {string} candidateIdsJson - JSON array of candidate ID strings.
 * @param {string} docTypesJson     - JSON array of document type strings.
 * @param {string} batchId          - Unique batch ID generated by the frontend for progress polling.
 */
function api_batchDownloadZip(candidateIdsJson, docTypesJson, batchId) {
  try {
    const auth = typeof requireRole_ === 'function' ? requireRole_(['Admin', 'HR']) : { authorized: true };
    if (!auth.authorized) return { success: false, error: auth.error };

    var candidateIds = [];
    var docTypes = [];
    try {
      candidateIds = typeof candidateIdsJson === 'string' ? JSON.parse(candidateIdsJson || '[]') : (candidateIdsJson || []);
      docTypes = typeof docTypesJson === 'string' ? JSON.parse(docTypesJson || '[]') : (docTypesJson || []);
    } catch (parseErr) {
      return { success: false, error: 'Invalid criteria: ' + parseErr.message };
    }

    if (!Array.isArray(candidateIds) || !candidateIds.length || !Array.isArray(docTypes) || !docTypes.length) {
      return { success: false, error: 'No criteria selected.' };
    }

    batchId = batchId || ('batch_' + new Date().getTime());

    // ── Build candidate lookup map for human-readable filenames ──
    var candidateMap = {};
    try {
      var ss = typeof getSpreadsheet_ === 'function' ? getSpreadsheet_() : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
      var cSheet = ss.getSheetByName('tbl_Candidates');
      if (cSheet) {
        var cData = cSheet.getDataRange().getValues();
        var cHeaders = cData[0] || [];
        var cIdIdx = cHeaders.indexOf('CandidateID');
        var cNameIdx = cHeaders.indexOf('FullName');
        for (var c = 1; c < cData.length; c++) {
          var cid = (cData[c][cIdIdx] || '').toString().trim();
          var cname = (cData[c][cNameIdx] || '').toString().trim();
          if (cid) candidateMap[cid] = cname || cid;
        }
      }
    } catch (e) {
      Logger.log('Warning loading candidateMap: ' + e.message);
    }

    var allDocsRes = typeof api_getAllDocuments === 'function' ? api_getAllDocuments() : { success: false };
    var allDocs = (allDocsRes && allDocsRes.data) ? allDocsRes.data : [];

    var normCandIds = candidateIds.map(function(id) { return String(id).trim(); });
    var normDocTypes = docTypes.map(function(t) { return String(t).trim().toLowerCase(); });

    var matchedDocs = allDocs.filter(function(d) {
      var cId = String(d.CandidateID || d.candidateId || '').trim();
      var type = String(d.DocType || d.docType || '').trim().toLowerCase();
      var isAvail = typeof isDocumentAvailable_ === 'function'
        ? isDocumentAvailable_({ DocumentID: d.DocumentID || d.documentId, ApprovalStatus: d.ApprovalStatus || d.approvalStatus })
        : true;
      return normCandIds.indexOf(cId) !== -1 && normDocTypes.indexOf(type) !== -1 && isAvail;
    }).map(function(d) {
      var cId = String(d.CandidateID || d.candidateId || '').trim();
      var candName = d.CandidateName || candidateMap[cId] || cId;
      var docType = d.DocType || d.docType || 'Document';
      var fileUrl = d.fileUrl || d.FileURL || '';
      return {
        CandidateID: cId,
        CandidateName: candName,
        DocType: docType,
        FileName: d.FileName || d.fileName || (docType + '.pdf'),
        fileUrl: fileUrl
      };
    });

    if (matchedDocs.length === 0) {
      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, { stage: 'error', percent: 0, message: 'No documents match.', filesFound: 0, filesDownloaded: 0 });
      }
      return { success: false, error: 'No documents match.' };
    }

    // HEURISTIC: If more than 12 files, switch to Drive Export Loophole
    if (matchedDocs.length > 12) {
      // DRIVE FOLDER EXPORT MODE (Unlimited Size)
      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'downloading',
          percent: 5,
          message: 'Large batch detected (' + matchedDocs.length + ' files). Preparing Google Drive export folder…',
          filesFound: matchedDocs.length,
          filesDownloaded: 0
        });
      }

      var rootFolder = DriveApp.getRootFolder();
      var exportFolderName = 'HR_Export_' + (batchId || 'Bulk') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
      var exportFolder = rootFolder.createFolder(exportFolderName);
      
      var copiedCount = 0;
      for (var i = 0; i < matchedDocs.length; i++) {
        var doc = matchedDocs[i];
        var fileId = extractFileId_(doc.fileUrl);
        if (fileId) {
          try {
            var file = DriveApp.getFileById(fileId);
            file.makeCopy(doc.CandidateName + '_' + doc.DocType, exportFolder);
            copiedCount++;
          } catch (e) {
            Logger.log('Copy error: ' + e.message);
          }
        }
        if (typeof setProgress_ === 'function') {
          var dlPct = Math.round(5 + ((i + 1) / matchedDocs.length) * 90);
          setProgress_(batchId, {
            stage: 'downloading',
            percent: dlPct,
            message: 'Exporting file ' + (i + 1) + ' of ' + matchedDocs.length + ' to Drive…',
            filesFound: matchedDocs.length,
            filesDownloaded: copiedCount
          });
        }
      }

      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'complete',
          percent: 100,
          message: 'Exported to Google Drive successfully!',
          filesFound: matchedDocs.length,
          filesDownloaded: copiedCount
        });
      }

      return {
        success: true,
        mode: 'drive_link',
        url: exportFolder.getUrl(),
        message: 'Exported to Google Drive successfully.',
        fileCount: copiedCount,
        candidateCount: candidateIds.length
      };
    } 
    else {
      // BASE64 DIRECT MODE (Fast, < 9MB)
      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'downloading',
          percent: 10,
          message: 'Downloading ' + matchedDocs.length + ' file(s) for direct ZIP…',
          filesFound: matchedDocs.length,
          filesDownloaded: 0
        });
      }

      var blobs = [];
      var totalBytes = 0;
      for (var k = 0; k < matchedDocs.length; k++) {
        var fileId = extractFileId_(matchedDocs[k].fileUrl);
        if (fileId) {
          try {
            var blob = DriveApp.getFileById(fileId).getBlob();
            var size = blob.getBytes().length;
            if (totalBytes + size > 9 * 1024 * 1024) throw new Error('Switching to fallback'); // Safety
            totalBytes += size;
            blobs.push(blob.setName(matchedDocs[k].CandidateName + '_' + matchedDocs[k].DocType + '.pdf'));
          } catch (fileErr) {
            if (fileErr.message === 'Switching to fallback') {
              // Safety fallback: switch directly to Drive Export Loophole if total exceeds 9MB
              var rootFolderFallback = DriveApp.getRootFolder();
              var fallbackFolderName = 'HR_Export_Fallback_' + (batchId || 'Bulk') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
              var fallbackFolder = rootFolderFallback.createFolder(fallbackFolderName);
              for (var fIdx = 0; fIdx < matchedDocs.length; fIdx++) {
                var fId = extractFileId_(matchedDocs[fIdx].fileUrl);
                if (fId) {
                  try {
                    DriveApp.getFileById(fId).makeCopy(matchedDocs[fIdx].CandidateName + '_' + matchedDocs[fIdx].DocType, fallbackFolder);
                  } catch (copyErr) {}
                }
              }
              if (typeof setProgress_ === 'function') {
                setProgress_(batchId, { stage: 'complete', percent: 100, message: 'Exported to Google Drive!', filesFound: matchedDocs.length, filesDownloaded: matchedDocs.length });
              }
              return { success: true, mode: 'drive_link', url: fallbackFolder.getUrl(), message: 'Exported to Google Drive successfully.' };
            }
            Logger.log('File error: ' + fileErr.message);
          }
        }
        if (typeof setProgress_ === 'function') {
          var dlPct = Math.round(10 + ((k + 1) / matchedDocs.length) * 60);
          setProgress_(batchId, {
            stage: 'downloading',
            percent: dlPct,
            message: 'Downloading file ' + (k + 1) + ' of ' + matchedDocs.length + '…',
            filesFound: matchedDocs.length,
            filesDownloaded: blobs.length
          });
        }
      }

      if (blobs.length === 0) {
        if (typeof setProgress_ === 'function') {
          setProgress_(batchId, { stage: 'error', percent: 0, message: 'No downloadable files found.', filesFound: matchedDocs.length, filesDownloaded: 0 });
        }
        return { success: false, error: 'No downloadable files found.' };
      }

      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'zipping',
          percent: 75,
          message: 'All files downloaded — building ZIP archive…',
          filesFound: matchedDocs.length,
          filesDownloaded: blobs.length
        });
      }

      var zipName = 'Batch_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
      var zip = Utilities.zip(blobs, zipName + '.zip');
      var downloadedCount = blobs.length;
      blobs = null;

      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'encoding',
          percent: 90,
          message: 'Encoding ZIP archive for download…',
          filesFound: matchedDocs.length,
          filesDownloaded: downloadedCount
        });
      }

      var bytes = zip.getBytes();
      zip = null;

      var base64 = Utilities.base64Encode(bytes);
      bytes = null;

      if (typeof setProgress_ === 'function') {
        setProgress_(batchId, {
          stage: 'complete',
          percent: 100,
          message: 'Done!',
          filesFound: matchedDocs.length,
          filesDownloaded: downloadedCount
        });
      }

      return {
        success: true,
        mode: 'base64',
        data: base64,
        base64: base64,
        filename: zipName + '.zip',
        fileCount: downloadedCount,
        candidateCount: candidateIds.length
      };
    }
  } catch (err) {
    Logger.log('Error in api_batchDownloadZip: ' + err.message + '\n' + err.stack);
    if (typeof setProgress_ === 'function') {
      setProgress_(batchId, { stage: 'error', percent: 0, message: err.message || 'An unexpected server error occurred.', filesFound: 0, filesDownloaded: 0 });
    }
    return { success: false, error: err.message };
  }
}

/**
 * Handles massive chunked document exports to Google Drive.
 * Organizes files into subfolders per candidate.
 * Bypasses Apps Script 6-minute execution limits and memory boundaries across client roundtrips.
 *
 * @param {string} candidateIdsJson - JSON string of candidate IDs for this chunk.
 * @param {string} docTypesJson     - JSON string of document types to export.
 * @param {string} existingFolderId - Existing Drive folder ID to append to (carried across chunks).
 * @param {string} batchId          - Unique batch identifier.
 * @returns {object} { success: boolean, folderId: string, folderUrl: string }
 */
function api_massiveDriveExport(candidateIdsJson, docTypesJson, existingFolderId, batchId) {
  try {
    const auth = typeof requireRole_ === 'function' ? requireRole_(['Admin', 'HR']) : { authorized: true };
    if (!auth.authorized) return { success: false, error: auth.error };

    var candidateIds = [];
    var docTypes = [];
    try {
      candidateIds = typeof candidateIdsJson === 'string' ? JSON.parse(candidateIdsJson || '[]') : (candidateIdsJson || []);
      docTypes = typeof docTypesJson === 'string' ? JSON.parse(docTypesJson || '[]') : (docTypesJson || []);
    } catch (parseErr) {
      return { success: false, error: 'Invalid criteria: ' + parseErr.message };
    }

    if (!Array.isArray(candidateIds) || !candidateIds.length || !Array.isArray(docTypes) || !docTypes.length) {
      return { success: false, error: 'No criteria selected.' };
    }

    // 1. Resolve or Create Root Export Folder
    var rootFolder = DriveApp.getRootFolder();
    var exportFolder;
    if (existingFolderId) {
      exportFolder = DriveApp.getFolderById(existingFolderId);
    } else {
      var exportFolderName = 'HR_Export_' + (batchId || 'Bulk') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
      exportFolder = rootFolder.createFolder(exportFolderName);
    }

    // Build Candidate Name mapping
    var candidateMap = {};
    try {
      var ss = typeof getSpreadsheet_ === 'function' ? getSpreadsheet_() : SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
      var cSheet = ss.getSheetByName('tbl_Candidates');
      if (cSheet) {
        var cData = cSheet.getDataRange().getValues();
        var cHeaders = cData[0] || [];
        var cIdIdx = cHeaders.indexOf('CandidateID');
        var cNameIdx = cHeaders.indexOf('FullName');
        for (var c = 1; c < cData.length; c++) {
          var cid = (cData[c][cIdIdx] || '').toString().trim();
          var cname = (cData[c][cNameIdx] || '').toString().trim();
          if (cid) candidateMap[cid] = cname || cid;
        }
      }
    } catch (e) {
      Logger.log('Warning loading candidateMap: ' + e.message);
    }

    // 2. Fetch and Filter Documents
    var allDocsRes = typeof api_getAllDocuments === 'function' ? api_getAllDocuments() : { success: false };
    var allDocs = (allDocsRes && allDocsRes.data) ? allDocsRes.data : [];

    var normCandIds = candidateIds.map(function(id) { return String(id).trim(); });
    var normDocTypes = docTypes.map(function(t) { return String(t).trim().toLowerCase(); });

    var matchedDocs = allDocs.filter(function(d) {
      var cId = String(d.CandidateID || d.candidateId || '').trim();
      var type = String(d.DocType || d.docType || '').trim().toLowerCase();
      var isAvail = typeof isDocumentAvailable_ === 'function'
        ? isDocumentAvailable_({ DocumentID: d.DocumentID || d.documentId, ApprovalStatus: d.ApprovalStatus || d.approvalStatus })
        : true;
      return normCandIds.indexOf(cId) !== -1 && normDocTypes.indexOf(type) !== -1 && isAvail;
    }).map(function(d) {
      var cId = String(d.CandidateID || d.candidateId || '').trim();
      var candName = d.CandidateName || candidateMap[cId] || cId;
      var docType = d.DocType || d.docType || 'Document';
      var fileUrl = d.fileUrl || d.FileURL || '';
      return {
        CandidateID: cId,
        CandidateName: candName,
        DocType: docType,
        FileName: d.FileName || d.fileName || (docType + '.pdf'),
        fileUrl: fileUrl
      };
    });

    // 3. Group by Candidate Name for Subfolders
    var candidatesMap = {};
    matchedDocs.forEach(function(d) {
      var key = d.CandidateName || d.CandidateID;
      if (!candidatesMap[key]) candidatesMap[key] = [];
      candidatesMap[key].push(d);
    });

    // 4. Create Subfolders & Copy Files
    for (var candName in candidatesMap) {
      var cleanFolderName = candName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Candidate';
      var subFolder = null;
      var existingSub = exportFolder.getFoldersByName(cleanFolderName);
      if (existingSub.hasNext()) {
        subFolder = existingSub.next();
      } else {
        subFolder = exportFolder.createFolder(cleanFolderName);
      }

      var cDocs = candidatesMap[candName];
      for (var i = 0; i < cDocs.length; i++) {
        var fileId = extractFileId_(cDocs[i].fileUrl);
        if (fileId) {
          try {
            var file = DriveApp.getFileById(fileId);
            var safeName = (cDocs[i].CandidateName + '_' + cDocs[i].DocType).replace(/[\\/:*?"<>|]/g, '_');
            file.makeCopy(safeName, subFolder);
          } catch (e) {
            Logger.log('Copy error for ' + candName + ': ' + e.message);
          }
        }
      }
    }

    return { success: true, folderId: exportFolder.getId(), folderUrl: exportFolder.getUrl() };
  } catch (err) {
    Logger.log('Error in api_massiveDriveExport: ' + err.message + '\n' + err.stack);
    return { success: false, error: err.message };
  }
}

/**
 * Return the information needed to preview a specific document for a candidate.
 */
function api_getDocumentPreviewInfo(candidateId, docType) {
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    
    // Get candidate name
    var cSheet = ss.getSheetByName('tbl_Candidates');
    var candidateName = candidateId;
    if (cSheet) {
      var cData = cSheet.getDataRange().getValues();
      var cHeaders = cData[0];
      var cIdIdx = cHeaders.indexOf('CandidateID');
      var cNameIdx = cHeaders.indexOf('FullName');
      for (var i = 1; i < cData.length; i++) {
        if (cData[i][cIdIdx] == candidateId) {
          candidateName = cData[i][cNameIdx];
          break;
        }
      }
    }
    
    var dSheet = ss.getSheetByName('tbl_Documents');
    if (!dSheet) throw new Error("Sheet 'tbl_Documents' not found.");
    var dData = dSheet.getDataRange().getValues();
    var dHeaders = dData[0];
    
    var dCandIdIdx = dHeaders.indexOf('CandidateID');
    var dTypeIdx = dHeaders.indexOf('DocType');
    var dStatusIdx = dHeaders.indexOf('ApprovalStatus');
    var dVerIdx = dHeaders.indexOf('VersionNumber');
    var dNameIdx = dHeaders.indexOf('FileName');
    var dUrlIdx = dHeaders.indexOf('FileURL');
    var dDocIdIdx = dHeaders.indexOf('DocumentID');
    
    var bestRow = null;
    var maxVer = -1;
    
    // Find the most recent available document (highest VersionNumber or last row)
    for (var j = 1; j < dData.length; j++) {
      var row = dData[j];
      if (row[dCandIdIdx] == candidateId && row[dTypeIdx] == docType) {
        if (isDocumentAvailable_({ DocumentID: row[dDocIdIdx], ApprovalStatus: row[dStatusIdx] })) {
        var ver = parseInt(row[dVerIdx], 10) || 0;
        if (ver >= maxVer) {
          maxVer = ver;
          bestRow = row;
        }
        }
      }
    }
    
    if (!bestRow) {
      return { success: false, error: "Document not found." };
    }
    
    var fileUrl = bestRow[dUrlIdx];
    var fileName = bestRow[dNameIdx];
    var fileId = extractFileId_(fileUrl);
    
    if (!fileId) {
      throw new Error("Invalid file URL.");
    }
    
    var file = DriveApp.getFileById(fileId);
    var mimeType = file.getMimeType();
    
    return {
      success: true,
      fileUrl: "https://drive.google.com/file/d/" + fileId + "/preview",
      fileName: fileName,
      mimeType: mimeType,
      candidateName: candidateName
    };
    
  } catch (e) {
    Logger.log("Error in api_getDocumentPreviewInfo: " + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Return all unique filter option values for populating the filter dropdowns.
 */
function api_getDocumentsCenterFilterOptions() {
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    var cSheet = ss.getSheetByName('tbl_Candidates');
    if (!cSheet) throw new Error("Sheet 'tbl_Candidates' not found.");
    
    var cData = cSheet.getDataRange().getValues();
    var cHeaders = cData[0];
    
    var cDeptIdx = cHeaders.indexOf('Department');
    var cNatIdx = cHeaders.indexOf('Nationality');
    var cPosIdx = cHeaders.indexOf('Position');
    var cCoordIdx = cHeaders.indexOf('AssignedCoordinatorEmail');
    var cBatchIdx = cHeaders.indexOf('Batch_Number');
    
    var uniqueDepts = {};
    var uniqueNats = {};
    var uniquePositions = {};
    var uniqueCoords = {};
    var uniqueBatches = {};
    
    for (var i = 1; i < cData.length; i++) {
      var dept = (cData[i][cDeptIdx] || "").toString();
      var nat = (cData[i][cNatIdx] || "").toString();
      var pos = (cData[i][cPosIdx] || "").toString();
      var coord = (cData[i][cCoordIdx] || "").toString();
      var batch = (cData[i][cBatchIdx] || "").toString();
      
      if (dept) uniqueDepts[dept] = true;
      if (nat) uniqueNats[nat] = true;
      if (pos) uniquePositions[pos] = true;
      if (coord) uniqueCoords[coord] = true;
      if (batch) uniqueBatches[batch] = true;
    }
    
    var allStatuses = [
      "New Candidate", "Documents Requested", "Documents Under Preparing",
      "Pending Passport", "Pending Photo", "Pending Academic Certificate",
      "Pending Medical", "Booked a medical examination", "Documents Complete",
      "Visa Pending", "Visa Completed", "Mobilized", "Closed",
      "Talent Acquisition Issues", "Renewal Passport", "Not Available",
      "Creating WhatsApp Group", "Unfit-PCR", "Unfit-Injury", "Rejected"
    ];
    
    return {
      success: true,
      statuses: allStatuses,
      departments: Object.keys(uniqueDepts).sort(),
      nationalities: Object.keys(uniqueNats).sort(),
      positions: Object.keys(uniquePositions).sort(),
      coordinators: Object.keys(uniqueCoords).sort(),
      batchNumbers: Object.keys(uniqueBatches).sort()
    };
    
  } catch (e) {
    Logger.log("Error in api_getDocumentsCenterFilterOptions: " + e.message);
    return { success: false, error: e.message };
  }
}
