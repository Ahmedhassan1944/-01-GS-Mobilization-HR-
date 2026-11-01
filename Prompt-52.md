### BUG FIX: AUTO-HYDRATE SETTINGS ON LOAD & REFRESH

**Context:** The "Mobilization Statuses & Exclusion Rules" settings UI does not populate on hard refresh or initial load. The data only appears when the user manually clicks the "Reload from Database" button.
**Objective:** Act as a Principal Frontend Engineer. Automate the settings fetch process so the UI hydrates immediately upon application load or when navigating to the Settings view.

#### FIX 1: Trigger Settings Load on App Init/View Render (`Script.html`)
1. **Locate the Manual Trigger:** Find the event listener or function bound to the "Reload from Database" button (e.g., `Views._reloadSettings()`, `_loadStatuses()`, or the `GAS.call('api_getSettings')` block).
2. **Automate on View Load:** Ensure that whenever the Settings view is mounted/rendered by the Router (e.g., inside `Views._renderSettings()` or similar view-load logic), this fetch function is executed automatically.
3. **Automate on Global Init:** Add a background fetch for settings during the initial `App.init()` bootstrap phase so the exclusion rules are ready in `App.state` globally for the Dashboard/KPIs, even before the user opens the Settings tab.

**Implementation Example:**
```javascript
// Inside your Router or Views._renderSettings (or equivalent):
async function _renderSettings() {
    // Existing UI setup...
    
    // Auto-trigger the reload from DB seamlessly
    const settingsBtn = document.getElementById('reload-settings-btn'); 
    if (settingsBtn && !App.state.settingsLoaded) {
        settingsBtn.click(); // Quickest native trigger if decoupled
    } else {
        // Or call the actual API wrapper function
        await Views._fetchSettingsFromDB(); 
    }
}

// Inside App.init() or the main DOMContentLoaded listener:
GAS.call('api_getSettings').then(res => {
    if (res && res.success) {
        App.state.settings = res.data;
        App.state.settingsLoaded = true;
        // Re-render KPI tables if needed
    }
}).catch(() => {});