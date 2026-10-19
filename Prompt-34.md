# SURGICAL UX FIX PROMPT: In-Place Status Update on Dashboard

Act as a Senior Frontend UI/UX Developer. I need to apply a surgical UX fix to `Script.html` in the "EDECS HR Mobilization Management System" Web App so that updating a candidate's status from the Dashboard table updates the row in-place without redirecting to another view.

---

### Problem & Objective
Currently, when a user clicks the "Update Status" button (🔄) on a candidate row in the Dashboard view, selects a new status, and clicks "Save Status", the application navigates away to the Candidate Detail view (`Router.navigate('candidate-detail')`).

**Goal:** Keep the user on the Dashboard page, update the candidate's status in client memory (`App.state.candidates`), close the modal, re-render the Dashboard table in-place, and apply a temporary subtle green highlight animation to the updated candidate row for visual feedback.

---

### CRITICAL EXECUTION CONSTRAINTS
- Do NOT modify `Code.gs` or `Database.gs`.
- Modify ONLY `Script.html`.
- Preserve all existing filter criteria, search states, and KPI table counts on the Dashboard.

---

### Implementation Requirements (`Script.html`)

1. **Locate Status Submit Handler**:
   In `Script.html`, locate `Views._submitStatus(candidateId)` (or the success handler for `api_updateCandidateStatus`).

2. **Remove Navigation Redirect**:
   Remove any `Router.navigate('candidate-detail')` or `Router.navigate('candidates')` execution calls inside the success block.

3. **Update Local State & Reactive DOM Refresh**:
   Replace the navigation call with the following exact in-place update logic:

```javascript
async _submitStatus(candidateId) {
  const newStatus = document.getElementById('new-status')?.value;
  if (!newStatus) return;
  
  Modal.close();

  try {
    const res = await GAS.call('api_updateCandidateStatus', candidateId, newStatus);
    if (!res.success) throw new Error(res.error);

    // 1. Update global candidate array in memory
    const candIndex = (App.state.candidates || []).findIndex(c => c.CandidateID === candidateId);
    if (candIndex > -1) {
      App.state.candidates[candIndex].CurrentStatus = newStatus;
    }
    if (App.state.selectedCandidate?.CandidateID === candidateId) {
      App.state.selectedCandidate.CurrentStatus = newStatus;
    }

    // 2. Show Success Toast
    Toast.success(`Status updated to: ${newStatus}`);

    // 3. Re-render current view dynamically without navigation
    if (document.getElementById('dashboard-table')) {
      // On Dashboard: Re-evaluate single-pass filtering & re-render table
      Views._applyDashboardAllFilters();

      // 4. Apply temporary subtle green flash highlight to updated row
      setTimeout(() => {
        const rows = document.querySelectorAll('#dashboard-table tbody tr');
        rows.forEach(tr => {
          if (tr.innerHTML.includes(candidateId) || tr.innerText.includes(App.state.candidates[candIndex]?.FullName)) {
            tr.style.transition = 'background-color 0.5s ease';
            tr.style.backgroundColor = '#dcfce7'; // subtle emerald highlight
            setTimeout(() => { tr.style.backgroundColor = ''; }, 1500);
          }
        });
      }, 100);
    } else if (document.getElementById('candidates-table')) {
      // Fallback if user was on Candidates page
      Views._filterCandidates();
    }
  } catch (err) {
    Toast.error('Update failed: ' + err.message);
  }
}

Verification Checklist

    Updating status on the Dashboard keeps the user on the Dashboard page.
    Updated status badge reflects the new stage immediately.
    Updated candidate row flashes green temporarily (#dcfce7) before returning to normal styling.
    No full page reload or view redirection occurs.