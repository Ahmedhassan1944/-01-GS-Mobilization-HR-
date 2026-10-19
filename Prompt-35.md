### MASTER FEATURE REQUEST: Document Center Expiry KPIs & Expiry CSV Export System

**Context & Objective:** 
The user wants to implement an advanced "Expiry Tracking" feature inside the `Documents Center` view (`Views.documents` in `Script.html`).
This requires adding a new row of 4 KPI cards for expired documents and a new CSV Export engine to track "Days Remaining" for critical documents.

Act as a Principal UI/UX & Full-Stack Developer. Apply ONLY the following additions to `Script.html`.
**CRITICAL STRICT RULES:** 
- Do NOT modify `Code.gs` or `Database.gs`. 
- Do NOT break or remove the existing `Download ZIP` functionality or the existing top 4 KPI cards.
- Do NOT alter any other page (Dashboard, Candidates, Settings).

---

### STEP 1: Add Expiry KPI Calculation & HTML Injection (`Script.html` -> `Views.documents`)

Inside `Script.html`, locate the `Views.documents(container)` function where the Document Center HTML is generated.
Find the block of code that generates the top 4 KPI cards (Total Candidates, Selected, Available Docs, Missing Docs). Immediately **AFTER** that grid, inject the logic for the expired documents grid.

**Insert this exact logic and HTML string into the render flow:**

```javascript
// 1. Calculate Expired Documents
const _now = new Date();
let expPassport = 0, expMedExam = 0, expMedAnalysis = 0, expVisa = 0;

(App.state.documents || []).forEach(doc => {
  if (doc.ExpiryDate) {
    const expDate = new Date(doc.ExpiryDate);
    if (expDate < _now) {
      const dType = (doc.DocType || '').toLowerCase();
      if (dType.includes('passport')) expPassport++;
      if (dType.includes('medical examination')) expMedExam++;
      if (dType.includes('medical analysis')) expMedAnalysis++;
      if (dType.includes('visa')) expVisa++;
    }
  }
});

// 2. Build the Expiry KPIs HTML
const expiryKpisHtml = `
<div class="dash-kpi-tables-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; margin-bottom: 24px;">
  <div class="kpi-card" style="border-left: 4px solid #ef4444; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Expired Passports</div>
    <div style="font-size: 24px; color: #ef4444; font-weight: 700; margin-top: 8px;">${expPassport}</div>
  </div>
  <div class="kpi-card" style="border-left: 4px solid #f97316; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Expired Med. Exams</div>
    <div style="font-size: 24px; color: #f97316; font-weight: 700; margin-top: 8px;">${expMedExam}</div>
  </div>
  <div class="kpi-card" style="border-left: 4px solid #eab308; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Expired Med. Analysis</div>
    <div style="font-size: 24px; color: #eab308; font-weight: 700; margin-top: 8px;">${expMedAnalysis}</div>
  </div>
  <div class="kpi-card" style="border-left: 4px solid #3b82f6; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Expired Visas</div>
    <div style="font-size: 24px; color: #3b82f6; font-weight: 700; margin-top: 8px;">${expVisa}</div>
  </div>
</div>
`;

Ensure expiryKpisHtml is concatenated to the main HTML output of the view directly below the primary KPI grid.


STEP 2: Inject the Export CSV Button (Script.html -> Views.documents)

In the same Views.documents function, locate the Header HTML where the Download ZIP button is defined (e.g., <button id="btn-download-zip"...).
Inject the new Export button directly to the left of it.

Update the Header Action Div to look like this:

<div class="header-actions" style="display: flex; gap: 10px;">
  <button class="btn btn--outline" onclick="Views._exportDocExpiryCSV()">
    <span class="icon">📥</span> Export Expiry CSV
  </button>
  <button class="btn btn--primary" id="btn-download-zip" onclick="DocumentsCenter.downloadSelectedZip()">
    <span class="icon">⬇️</span> Download ZIP
  </button>
</div>

STEP 3: Append the Core Export Logic (Script.html -> Views Object)

Add the _exportDocExpiryCSV function directly into the Views object in Script.html. This function handles the complex "Days Remaining" calculation and triggers the CSV download.

Insert this function inside the Views object:

_exportDocExpiryCSV() {
    try {
      const candidatesToExport = Views._docFilteredCandidates || App.state.candidates || [];
      if (candidatesToExport.length === 0) {
        Toast.warning('No candidates available to export.');
        return;
      }

      Toast.info('Generating Expiry Report...');

      // Helper to calculate days remaining
      const getDaysRemaining = (candidateId, docTypeSubstring) => {
        const doc = (App.state.documents || []).find(d => 
          d.CandidateID === candidateId && 
          (d.DocType || '').toLowerCase().includes(docTypeSubstring.toLowerCase())
        );
        
        if (!doc) return 'Missing';
        if (!doc.ExpiryDate) return 'No Expiry Date';
        
        const diffTime = new Date(doc.ExpiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays; 
      };

      // CSV Header
      const headers = [
        'HR Code', 
        'Full Name', 
        'Position', 
        'Passport (Days Left)', 
        'Visa (Days Left)', 
        'Medical Exam (Days Left)', 
        'Medical Analysis (Days Left)'
      ];
      const csvRows = [headers.join(',')];

      // Process Candidates
      candidatesToExport.forEach(c => {
        const row = [
          `"${String(c.HR_Code || '').replace(/"/g, '""')}"`,
          `"${String(c.FullName || '').replace(/"/g, '""')}"`,
          `"${String(c.Position || '').replace(/"/g, '""')}"`,
          `"${getDaysRemaining(c.CandidateID, 'passport')}"`,
          `"${getDaysRemaining(c.CandidateID, 'visa')}"`,
          `"${getDaysRemaining(c.CandidateID, 'medical examination')}"`,
          `"${getDaysRemaining(c.CandidateID, 'medical analysis')}"`
        ];
        csvRows.push(row.join(','));
      });

      // Trigger Download
      const csvString = csvRows.join('\\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Document_Expiry_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Toast.success('Export completed successfully.');
    } catch (err) {
      console.error(err);
      Toast.error('Failed to generate export.');
    }
  },

  Final Execution Check: Ensure all brackets and commas are valid within the Views object. Save Script.html.