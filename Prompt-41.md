### SURGICAL FIX: Make Expiry Tables Dynamic & Accurate

**Context:** The user reverted to a stable commit where all document filters (Search, Status, Passport, Visa, etc.) are working perfectly. However, the 4 Expiry KPI Tables (Passport, Med Exam, Med Analysis, Visa) are displaying incorrect data and are static (they do not update when filters change).

**Objective:**
1. Update `Views._updateExpiryTables(filteredCandidates)` to calculate accurately based on the filtered list, strictly excluding 'Closed' candidates.
2. Hook this function into the end of `Views._filterDocuments` so the tables update dynamically every time a filter is applied.

Act as a Senior UI/UX Developer. Apply ONLY the following surgical fixes to `Script.html`.

#### STEP 1: Implement Dynamic Expiry Table Update Function
Inside `Views` object in `Script.html`, locate or replace the `_updateExpiryTables` function with this accurate version:

```javascript
_updateExpiryTables(filteredCandidates) {
  const _now = new Date();
  _now.setHours(0, 0, 0, 0);

  const stats = {
    passport: { missing: 0, nodate: 0, expired: 0, exp30: 0, exp180: 0 },
    medExam: { missing: 0, nodate: 0, expired: 0, exp30: 0, exp180: 0 },
    medAnalysis: { missing: 0, nodate: 0, expired: 0, exp30: 0, exp180: 0 },
    visa: { missing: 0, nodate: 0, expired: 0, exp30: 0, exp180: 0 }
  };

  // 1. STRICTLY exclude 'Closed' candidates from KPI counts
  const activeCands = (filteredCandidates || []).filter(c => String(c.CurrentStatus || '').trim().toLowerCase() !== 'closed');

  // 2. Compute accurate stats based ONLY on currently visible/filtered candidates
  activeCands.forEach(c => {
    const checkDoc = (typeSubstring, statObj) => {
      const docList = c.docSummary || c.docDetails || [];
      const matchingDocs = docList.filter(d => String(d.DocType || d.docType || '').toLowerCase().includes(typeSubstring));
      
      if (matchingDocs.length === 0) {
        statObj.missing++;
        return;
      }

      let validExpDate = null;
      for (const doc of matchingDocs) {
        const rawDate = doc.ExpiryDate || doc.expiryDate || doc.Expiry_Date || doc.endDate || doc.EndDate;
        if (!rawDate) continue;
        
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          validExpDate = parsed;
          break; // Found a valid date, stop searching this document type
        }
      }

      if (!validExpDate) {
        statObj.nodate++;
      } else {
        validExpDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((validExpDate - _now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) statObj.expired++;
        else if (diffDays <= 30) statObj.exp30++;
        else if (diffDays <= 180) statObj.exp180++;
      }
    };

    checkDoc('passport', stats.passport);
    checkDoc('medical examination', stats.medExam);
    checkDoc('medical analysis', stats.medAnalysis);
    checkDoc('visa', stats.visa);
  });

  // 3. Render the updated HTML
  const renderStatTable = (title, data, color) => `
    <div class="kpi-card" style="padding: 0; overflow: hidden; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="background: #f8fafc; padding: 10px 14px; font-weight: 700; font-size: 13px; color: #334155; border-bottom: 2px solid ${color}; text-transform: uppercase;">${title}</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Missing</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #94a3b8;">${data.missing}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Date Not Set</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #f59e0b;">${data.nodate}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Expired</td><td style="text-align: right; padding: 8px 14px; font-weight: 700; color: #ef4444;">${data.expired}</td></tr>
        <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Expiring (<= 30 Days)</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #f97316;">${data.exp30}</td></tr>
        <tr><td style="padding: 8px 14px;">Expiring (<= 6 Months)</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #3b82f6;">${data.exp180}</td></tr>
      </table>
    </div>`;

  // Find the existing container or the first row of tables to replace
  const container = document.querySelector('.dash-kpi-tables-grid');
  if (container) {
    const newHtml = `
      ${renderStatTable('Passport Status', stats.passport, '#3b82f6')}
      ${renderStatTable('Medical Exam Status', stats.medExam, '#10b981')}
      ${renderStatTable('Medical Analysis Status', stats.medAnalysis, '#8b5cf6')}
      ${renderStatTable('Visa Status', stats.visa, '#f59e0b')}
    `;
    // If the grid contains the top 4 KPIs as well, ensure we target a wrapper ID instead, 
    // but assuming standard structure, replace the innerHTML of the specific expiry tables container.
    // Safe replace:
    const expiryTablesWrapper = document.getElementById('expiry-tables-container') || container;
    expiryTablesWrapper.innerHTML = newHtml;
    expiryTablesWrapper.style.display = 'grid';
    expiryTablesWrapper.style.gridTemplateColumns = 'repeat(4, 1fr)';
    expiryTablesWrapper.style.gap = '16px';
  }
}

STEP 2: Hook into the Filter Event

Locate the _filterDocuments() function in Script.html. Scroll to the very end of this function where Views._renderDocumentsTable(); is called.
Immediately after that line, add:

if (typeof Views._updateExpiryTables === 'function') {
    Views._updateExpiryTables(Views._docFilteredCandidates);
  }

STEP 3: Add the HTML Container

Ensure the HTML string in Views.documents that renders the initial layout has an element with id="expiry-tables-container" where the 4 expiry tables belong.

Execution: Save the file. When you interact with ANY dropdown (Status, Passport, Search, etc.), the 4 tables will now recalculate instantly based purely on the filtered rows on the screen.