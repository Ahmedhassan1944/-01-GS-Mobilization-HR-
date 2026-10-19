### ENTERPRISE OPTIMIZATION PHASE 2: Dashboard Performance & Cache Resilience

Based on the Stress Test Report, apply the following 3 surgical optimizations to `Code.gs`, `CalendarManager.gs`, and `Script.html`.
**CRITICAL RULE:** Implement ONLY these targeted fixes. Do not rewrite rendering logic entirely.

#### Fix 1: Cache Overflow Prevention in `api_getDashboardData` (`Code.gs`)
**Vulnerability 3.1:** The cache fails silently if `_result` exceeds 100KB because it caches the raw arrays.
**Implementation:** Inside `api_getDashboardData`, modify the cache saving logic. Do NOT stringify the entire `_result` if it contains the massive `candidates`, `documents`, and `events` arrays. Instead, extract ONLY the aggregated metrics (`batchCounts`, `activeCount`, `missingDocs`, etc.) into a lightweight `_cachePayload` object and cache that. Ensure the cache read logic at the top of the function properly handles this lightweight payload.

#### Fix 2: Defensive Date Parsing (`Code.gs` & `CalendarManager.gs`)
**Vulnerability 5.3:** Formula errors (#REF!, #N/A) from Sheets evaluate to `NaN` and crash date aggregations.
**Implementation:** In `api_getDashboardData` (where dates are compared for Expiry KPIs) and `normalizeEventDateString_` (in `CalendarManager.gs`), wrap `new Date(val)` creations in a safety check: `if (isNaN(new Date(val).getTime()))`. If it's `NaN`, fallback gracefully (e.g., skip the item or return null) instead of breaking the aggregation math.

#### Fix 3: Debounce Search Inputs to Prevent DOM Freezing (`Script.html`)
**Vulnerability 4.2:** Undebounced keypress filtering freezes the UI on large datasets.
**Implementation:** In `Script.html`, define a global debounce helper utility. Locate the `.addEventListener('input', ...)` attachments for the search textboxes (e.g., `#dash-tb-search`, `#cand-tb-search`) and wrap their callback executions in a 300ms debounce.

**Execution:** Apply these three specific implementations. Return only the updated functions/code blocks.