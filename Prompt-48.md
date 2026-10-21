### SYSTEM ARCHITECT FIXES: Settings Module Hardening & Atomic Saves

**Context:** The Settings QA Report identified critical vulnerabilities in state synchronization, case-insensitive validation, and non-atomic dual RPC calls.
Act as a Principal Full-Stack Engineer. Apply the following 3 surgical patches to `Script.html` and `Database.gs`.

#### FIX 1: Server-Side Sanitization & Batch Updating (`Database.gs`)
Locate `api_updateSystemSettings`. Modify it to accept either a single key/value pair OR a batch object of multiple categories (for atomic saves). Add strict server-side sanitization.
**Conceptual Update Required:**
```javascript
function api_updateSystemSettings(categoryKeyOrObject, itemsArray = null) {
  // If batch object provided: { statuses: [...], excludedStatuses: [...] }
  const updates = typeof categoryKeyOrObject === 'object' ? categoryKeyOrObject : { [categoryKeyOrObject]: itemsArray };
  
  // Clean arrays: remove empty strings, trim, and deduplicate case-insensitively
  for (const key in updates) {
    if (Array.isArray(updates[key])) {
      const seen = new Set();
      updates[key] = updates[key].reduce((acc, item) => {
        const cleanItem = String(item || '').trim();
        const lowerItem = cleanItem.toLowerCase();
        if (cleanItem !== '' && !seen.has(lowerItem)) {
          seen.add(lowerItem);
          acc.push(cleanItem); // Keep original case, but prevent duplicates
        }
        return acc;
      }, []);
    }
  }
  // ... [Proceed to save 'updates' atomically to tbl_Settings] ...
}

FIX 2: Client-Side Case-Insensitive Validation (Script.html)

Locate Views._addSettingItem and Views._editSettingItem.
Replace the strict list.includes(val) checks with case-insensitive normalization:
JavaScript

  const safeNorm = (str) => String(str || '').trim().toLowerCase();
  // Instead of: if (list.includes(val))
  if (list.some(item => safeNorm(item) === safeNorm(val))) {
    Toast.error('This item already exists.');
    return;
  }

  FIX 3: Atomic Frontend Save & State Rollback (Script.html)

Locate Views._saveSettingCategory. Refactor it to batch the requests and safely rollback App.state on failure.Replace with this structure:
JavaScript

  async _saveSettingCategory(categoryKey, container) {
    // 1. Snapshot deep clone of current state for rollback
    const fallbackSettings = JSON.parse(JSON.stringify(App.state.settings || {}));
    
    try {
      // 2. Prepare payload (Batch statuses and excludedStatuses atomically)
      let payload;
      if (categoryKey === 'statuses') {
        payload = {
          statuses: Views._getTempList('statuses'),
          excludedStatuses: Views._getTempExcludedStatuses()
        };
      } else {
        payload = { [categoryKey]: Views._getTempList(categoryKey) };
      }

      // 3. Single RPC Call
      const res = await GAS.call('api_updateSystemSettings', payload);
      
      if (res && res.success) {
        // 4. Update memory safely with backend-sanitized result
        App.setState({ settings: res.settings });
        Toast.success('Settings saved successfully');
      } else {
        throw new Error(res.error || 'Backend save failed');
      }
    } catch (err) {
      // 5. Rollback on failure to prevent memory spillover!
      App.setState({ settings: fallbackSettings });
      Toast.error('Failed to save. Changes reverted.');
      console.error(err);
      Views.settings(document.getElementById('app-view')); // Re-render to clear dirty UI
    }
  }

Execution: Implement these logic changes exactly as described to guarantee atomic transactions and bulletproof data integrity. Save and push.

