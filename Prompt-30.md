# SURGICAL BUG FIX PROMPT: "Failed to Load Dashboard" (Unsafe Type Coercion)

Act as a Senior Google Apps Script Backend Developer. Apply ONLY the following surgical fix to `Code.gs`.

**CRITICAL RULE:** Do NOT rewrite, reformat, or modify any other functions, and do NOT touch any HTML/Frontend files.

---

### Fix: Safe String Normalization in `api_getDashboardData` (`Code.gs`)

The Dashboard crashes because `b.toString()` throws a `TypeError` if `b` is `null`/`undefined` in the settings arrays. In `Code.gs`, inside `api_getDashboardData()`, locate the batch aggregation loop and update it to use safe type coercion (`String(b || '')` and `.filter(Boolean)`). Replace the current `allBatches` loop section with this exact safe logic:

```javascript
// [SURGICAL FIX] Safe Batch Aggregation
const batchCounts = {};
const allBatches = [...(settings.staffBatches || []), ...(settings.kalhatBatches || [])].filter(Boolean);
allBatches.forEach(b => {
  batchCounts[String(b)] = 0;
});

candidates.forEach(cand => {
  // ... existing status logic ...
  const cBatch = String(cand.Batch_Number || cand['Batch Number'] || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/^staff\s+/, '');
  if (cBatch) {
    allBatches.forEach(b => {
      const normB = String(b).trim().toLowerCase().replace(/[-_]/g, ' ').replace(/^staff\s+/, '');
      if (cBatch === normB) {
        batchCounts[String(b)] = (batchCounts[String(b)] || 0) + 1;
      }
    });
  }
});