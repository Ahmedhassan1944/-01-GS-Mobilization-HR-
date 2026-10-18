### SURGICAL BUG FIX: Fix ReferenceError `matchNat is not defined`

Based on the Diagnostic Report, the Dashboard crashes purely due to a client-side `ReferenceError` in `Script.html` inside `Views._applyDashboardAllFilters()`. The variable `matchNat` is evaluated in a conditional statement but was never declared.

Apply ONLY this surgical fix to `Script.html`.
**CRITICAL RULE:** Do NOT modify any other files or rewrite any other logic.

#### Fix: Declare `matchNat` in `Views._applyDashboardAllFilters()`
1. Open `Script.html`.
2. Locate the function `Views._applyDashboardAllFilters()`.
3. At the top of the function where filter values are retrieved, ensure `natFilter` is defined (e.g., `const natFilter = document.getElementById('dash-tb-nat')?.value || '';`).
4. Inside the `.filter(c => { ... })` loop, locate this exact block of code:
   ```javascript
   const matchPos = !posFilter || c.Position === posFilter;
   const matchStatusTb = !statusTbFilter || c.CurrentStatus === statusTbFilter;
   const matchBatch = !batchFilter || (Views._normBatch(Views._getBatchValue(c)) === Views._normBatch(batchFilter));
   if (!(matchPos && matchStatusTb && matchNat && matchBatch)) return false;

   Insert the missing matchNat declaration right before the matchBatch line, so the block looks exactly like this:

   const matchPos = !posFilter || c.Position === posFilter;
const matchStatusTb = !statusTbFilter || c.CurrentStatus === statusTbFilter;
const matchNat = !natFilter || c.Nationality === natFilter; // <-- SURGICAL FIX ADDED
const matchBatch = !batchFilter || (Views._normBatch(Views._getBatchValue(c)) === Views._normBatch(batchFilter));
if (!(matchPos && matchStatusTb && matchNat && matchBatch)) return false;...