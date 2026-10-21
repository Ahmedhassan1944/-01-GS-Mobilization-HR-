# SURGICAL BUG FIX PROMPT: Bulletproof Batch Filter String Normalization

Act as a Senior Google Apps Script & Frontend Developer. Apply ONLY the following surgical fix to the batch matching logic in `Script.html`.

---

### Problem & Cause
In the Documents Center (`Script.html`), selecting a batch filter option (e.g., "Batch 4", "Staff Batch 4") returns 0 candidates even when matching candidates exist in the dataset. 

**Root Cause:**
Direct string equality check `String(b).trim() === String(Views._getBatchValue(c)).trim()` fails due to subtle formatting discrepancies between dropdown option strings and candidate sheet values (e.g., "Staff Batch 4" vs "Batch 4", trailing/leading whitespace, or case sensitivity).

---

### Critical Execution Rules
- Modify **ONLY** `Script.html`.
- Do **NOT** modify `Code.gs`, `Database.gs`, or any other backend files.
- Apply the fix strictly inside the filtering function (`Views._dcApplyFilters` / `Views._filterDocuments`).

---

### Fix: Bulletproof Batch Matching (`Script.html`)

Inside `Views._dcApplyFilters` (or `Views._filterDocuments`), locate the line evaluating `batches` filtering:

```javascript
// REPLACE THIS LINE:
if (batches.length > 0 && !batches.some(b => String(b).trim() === String(Views._getBatchValue(c)).trim())) return false;

Replace it with this bulletproof normalized matching logic:
Javascript

// FIX: Bulletproof Batch Matching using normalized string comparisons
if (batches.length > 0) {
  const candBatchNorm = Views._normBatch(Views._getBatchValue(c));
  const isMatch = batches.some(selectedBatch => {
    const selectedNorm = Views._normBatch(selectedBatch);
    return selectedNorm === candBatchNorm || 
           selectedNorm.replace(/\s+/g, '') === candBatchNorm.replace(/\s+/g, '');
  });
  if (!isMatch) return false;
}

Verification Checklist

    Selecting "Batch 4", "Staff Batch 4", or "Kalhat Batch 1" accurately filters and returns matching candidates.
    No regression occurs when multiple batches are selected simultaneously in multi-select mode.
    The 4 summary expiry tables and candidates table update dynamically upon clicking "✅ Apply Filters".

