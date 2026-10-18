### SURGICAL BUG FIX: Safe Candidate Status Coercion (Code.gs)

Based on your Diagnostic Report, the "Failed to load dashboard data" error is caused by an unhandled `TypeError` inside `api_getDashboardData()`. Calling `.trim()` on non-string `CurrentStatus` values crashes the backend.

Apply ONLY the following surgical fix to `Code.gs`.
**CRITICAL RULE:** Do NOT modify `Views.dashboard`, `Views.settings`, or any frontend HTML files.

#### Fix: Safe String Normalization in `api_getDashboardData` (`Code.gs`)
Locate the two candidate iteration loops inside `api_getDashboardData()` where candidate statuses are aggregated. 
Change this unsafe line:
`const status = (cand.CurrentStatus || '').trim();`

To this safe line:
`const status = String(cand.CurrentStatus || '').trim();`

**Execution Instructions:**
1. In `api_getDashboardData()` inside `Code.gs`, find the first `candidates.forEach(cand => { ... })` loop. Ensure the status extraction reads: `const status = String(cand.CurrentStatus || '').trim();`
2. In the same function, find the second `candidates.forEach(cand => { ... })` loop (used for Document-Based KPI aggregation). Ensure the status extraction there ALSO reads: `const status = String(cand.CurrentStatus || '').trim();`
3. Save the file.