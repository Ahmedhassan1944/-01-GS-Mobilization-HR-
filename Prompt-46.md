### SYSTEM ARCHITECT FIXES: Dashboard Performance & KPI Accuracy

**Context:** The Dashboard QA Report identified two critical flaws in `Script.html`: 
1. `Views._computeDashboardKpis` uses a hardcoded array for `EXCLUDED_KPI_STATUSES`, causing client-side recalculations to mismatch the backend.
2. `Views._refreshDashboard` performs redundant `Promise.all` backend calls every time the view loads, ignoring already cached `App.state.candidates`.

Act as a Principal Performance Engineer. Apply the following 2 surgical patches to `Script.html`.

#### FIX 1: Dynamic Status Exclusion in `Views._computeDashboardKpis`
Locate the `Views._computeDashboardKpis` function. Find the line where `EXCLUDED_KPI_STATUSES` is hardcoded.
**Replace that line with this dynamic evaluation:**

```javascript
    // Read excluded statuses directly from App.state.settings, with a safe fallback
    const excludedArray = (App.state.settings && Array.isArray(App.state.settings.excludedStatuses) && App.state.settings.excludedStatuses.length > 0) 
      ? App.state.settings.excludedStatuses 
      : ['Closed', 'Rejected', 'Unfit-Injury', 'Unfit-PCR'];
      
    const EXCLUDED_KPI_STATUSES = new Set(excludedArray);

    FIX 2: Intelligent In-Memory Cache Check in Views._refreshDashboard

Locate the Views._refreshDashboard function (or wherever the Promise.all API calls are made when navigating to the dashboard).
Modify the function to accept a forceFetch parameter and short-circuit if data exists:

async _refreshDashboard(forceFetch = false) {
    try {
      // 1. Intelligent Cache Short-Circuit
      // If we already have candidates and we are not forcing a refresh, just recalculate and render!
      if (!forceFetch && App.state.candidates && App.state.candidates.length > 0) {
        if (typeof Views._computeDashboardKpis === 'function') Views._computeDashboardKpis();
        if (typeof Views._renderDashboardTables === 'function') Views._renderDashboardTables();
        return; // Exit early, no backend calls needed!
      }

      // 2. Fetch from Backend (Only if cache is empty or forceFetch is true)
      Views._showGlobalSpinner(); // Or your loading indicator function
      
      const [kpiRes, candsRes, eventsRes] = await Promise.all([
        GAS.call('api_getDashboardData'),
        GAS.call('api_getAllCandidates'),
        GAS.call('api_getAllUpcomingEvents')
      ]);

      // 3. Update App.state safely
      if (kpiRes && kpiRes.success) App.state.dashboardData = kpiRes.data;
      if (candsRes && candsRes.success) App.state.candidates = candsRes.data;
      if (eventsRes && eventsRes.success) App.state.upcomingEvents = eventsRes.data;

      // 4. Compute & Render
      if (typeof Views._computeDashboardKpis === 'function') Views._computeDashboardKpis();
      if (typeof Views._renderDashboardTables === 'function') Views._renderDashboardTables();

    } catch (error) {
      console.error("Dashboard refresh error:", error);
      // Optional: Handle UI error state here
    } finally {
      Views._hideGlobalSpinner(); // Or your loading indicator hide function
    }
  }

  Execution:
Apply these 2 patches directly to Script.html. Ensure any calls to Views._refreshDashboard() from refresh buttons pass true (e.g., Views._refreshDashboard(true)), while standard view navigation calls it with no arguments. Save the file.
