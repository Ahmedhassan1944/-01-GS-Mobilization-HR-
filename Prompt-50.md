### ULTIMATE PERFORMANCE & MEMORY PATCH (3-IN-1 FIX)

**Context:** The user requested surgical fixes for three critical performance bottlenecks: Drive API Quota Exhaustion (Double RPCs), V8 Memory Leaks (Triple-heap allocation leading to "Out of memory" during ZIP creation), and Frontend DOM Thrashing.

**Objective:** Act as a Principal Performance Engineer. Apply these exact 3 patches to the codebase.

#### FIX 1: Drive Quota & V8 Memory Leak Fix (`DocumentsCenter.gs`)
**Issue:** `api_batchDownloadZip` uses double RPCs per file and holds the uncompressed blobs, zipped bytes, and base64 strings in memory simultaneously, causing V8 to crash.
**Solution:** Single RPC fetch, memory buffer limit, and aggressive V8 Garbage Collection via nullification.

Update the loop and the final ZIP generation in `api_batchDownloadZip`:
```javascript
  // 1. Loop Optimization (Single RPC + Memory Buffer)
  var MAX_TOTAL_BYTES = 9 * 1024 * 1024; // 9 MB safety buffer
  var totalBytes = 0;
  
  for (var k = 0; k < matchedDocs.length; k++) {
    var doc = matchedDocs[k];
    var fileId = extractFileId_(doc.fileUrl);
    if (fileId) {
      try {
        var blob = DriveApp.getFileById(fileId).getBlob(); // SINGLE RPC FETCH
        var size = blob.getBytes().length; // Read size from memory
        
        if (totalBytes + size > MAX_TOTAL_BYTES) {
          throw new Error('Total files exceed Google\'s 9MB memory limit. Please select fewer candidates.');
        }
        totalBytes += size;
        blobs.push(blob.setName(doc.CandidateName + '_' + doc.DocType + '.pdf'));
      } catch (fileErr) {
        if (fileErr.message.includes('9MB memory limit')) throw fileErr;
        Logger.log('File error: ' + fileErr.message);
      }
    }
  }

  if (blobs.length === 0) return { success: false, error: 'No downloadable files found.' };

  // 2. Aggressive V8 Garbage Collection for ZIP Process
  var zipName = 'Batch_Download_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  var zip = Utilities.zip(blobs, zipName);
  blobs = null; // Free up uncompressed blobs memory
  
  var bytes = zip.getBytes();
  zip = null; // Free up zip object memory
  
  var base64 = Utilities.base64Encode(bytes);
  bytes = null; // Free up byte array memory
  
  return { success: true, data: base64, filename: zipName + '.zip' };

  FIX 2: Clear Frontend Memory Leaks (Script.html)

Issue: Modal closures leave unused arrays in the global memory (e.g., Views._editingLocalPaths), slowly bloating the browser RAM.Solution: Nullify global state variables when the modal closes.

Locate the modal close logic (e.g., inside Modal.close() or _submitStatus) and ensure cleanup:

// Inside the main modal close trigger or submit function:
  Views._editingLocalPaths = null;

  FIX 3: Eliminate DOM Thrashing (Script.html)

Issue: Views._populateCandidateFilterDropdowns appending <option> tags inside a loop causes rapid layout thrashing.Solution: Use DocumentFragment.

Update the fill helper function inside Views._populateCandidateFilterDropdowns:

const fill = (elementId, set) => {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  const frag = document.createDocumentFragment(); // Offline container
  
  [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).forEach(val => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    frag.appendChild(opt); // Append to fragment (0 reflows)
  });
  
  select.appendChild(frag); // Append all at once (1 single reflow)
};

Execution: Apply these 3 precise changes. Save and push.