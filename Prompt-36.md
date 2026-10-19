### ENTERPRISE OPTIMIZATION PHASE 1: Database Write & Schema Fault Tolerance

Based on the Stress Test Report, apply the following 3 surgical optimizations to `Database.gs` to prevent API timeouts, rate limits, and schema corruption.
**CRITICAL RULE:** Do NOT modify `Code.gs`, `Script.html`, or any frontend logic. Modify ONLY `Database.gs`.

#### Fix 1: Batch Row Updates in `api_updateCandidateDetails` (Fix Vulnerability 2.1)
Instead of executing multiple single-cell `sheet.getRange().setValue()` calls, refactor the function to fetch the candidate's row as an array, apply all modifications in memory, and commit via a single `setValues()` call.
*Implementation:* Find the matching row index, read `sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]`, map the updates using `headers.indexOf()`, then `sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow])`.

#### Fix 2: Schema-Safe Append in `api_createCandidate` (Fix Vulnerability 5.1)
Instead of using a hardcoded array `[candidateId, data.fullName, ...]` for `sheet.appendRow()`, dynamically map the incoming data to the exact header positions found in `data[0]`.
*Implementation:* Fetch `headers = sheet.getDataRange().getValues()[0]`. Create a `newRow` array of length `headers.length` filled with `""`. Map `newRow[headers.indexOf('CandidateID')] = candidateId`, etc. Then `sheet.appendRow(newRow)`. Add defensive checks `if (idx !== -1)` to prevent negative indexing (Fixing Vuln 5.2 conceptually).

#### Fix 3: Optimize Cascade Deletion in `api_deleteCandidate` (Fix Vulnerability 1.1)
Remove the synchronous `sheet.deleteRow(i + 1)` inside loops for `tbl_Candidates`, `tbl_Documents`, `tbl_Events`, and `tbl_SystemLogs`. 
*Implementation:* For each sheet, read the entire data grid: `const data = sheet.getDataRange().getValues();`. Filter the data in-memory: keep row 0 (headers) and all rows where the `CandidateID` column does NOT match the deleted candidate. Then call `sheet.clearContents()` and `sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);`. This reduces network calls from $O(N)$ to exactly $O(1)$ read and $O(1)$ write per sheet.

**Execution:** Carefully refactor ONLY these three functions in `Database.gs`. Retain all existing authorization checks (`requireRole_`), log writing, and cache invalidation logic within them.