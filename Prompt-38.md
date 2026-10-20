# MASTER UI/UX UPGRADE PROMPT: Document Center Detailed Expiry Tables & Dynamic Status Filter

Act as a Principal UI/UX & Full-Stack Developer specializing in Google Apps Script Web Applications and Vanilla JS SPAs.

### Objective & Scope
Upgrade the **📁 Documents Center** view (`Views.documentsCenter` in `Script.html`) with two key enhancements:
1. Replace the 4 simple "Expired" KPI summary cards with **4 detailed miniature status tables** (Passport, Medical Exam, Medical Analysis, Visa).
2. Dynamically populate the **Status filter dropdown** (`#dc-filter-status`) from `App.state.settings.statuses` instead of hardcoded options.

---

### Strict Architectural Constraints
- Modify **ONLY** `Script.html`.
- Do **NOT** modify `Code.gs`, `Database.gs`, or any other backend script files.
- Preserve all existing Documents Center search, filter, batch download, sorting, and preview functionalities.

---

### 1. Detailed Expiry Matrix Tables (`Script.html`)

#### A. Candidate Filtering Rule (Exclude 'Closed')
- Compute statistics across active candidates **excluding** those with `CurrentStatus === 'Closed'`:
  ```javascript
  const activeCands = (App.state.candidates || []).filter(c => c.CurrentStatus !== 'Closed');

  B. 5-State Breakdown Matrix
For each of the 4 document types (Passport, Medical Examination, Medical Analysis, Visa), calculate counts across 5 distinct states:

    Missing: Candidate has no record for this document type.
    Date Not Set: Document is uploaded/available, but has no ExpiryDate assigned.
    Expired: diffDays < 0 (expiration date is in the past).
    Expiring (<= 30 Days): diffDays >= 0 && diffDays <= 30.
    Expiring (<= 6 Months): diffDays > 30 && diffDays <= 180.

C. HTML Layout & Visual Polish
Render a 4-column responsive grid (.dash-kpi-tables-grid) containing elevated surface cards with color accents:

    Passport Status: Blue accent (#3b82f6)
    Medical Exam Status: Emerald accent (#10b981)
    Medical Analysis Status: Purple accent (#8b5cf6)
    Visa Status: Amber accent (#f59e0b)

2. Dynamic Status Filter Dropdown (Script.html)

    In Views.documentsCenter (or _dcPopulateFilterDropdowns), locate the Status <select> element (#dc-filter-status).
    Dynamically populate <option> tags from App.state.settings.statuses:
    Javascript

    const dynamicStatusOptions = '<option value="">All Statuses</option>' + 
      (App.state.settings?.statuses || []).map(s => `<option value="${s}">${s}</option>`).join('');

Implementation Code Reference (Script.html)
Javascript

// 1. Calculate Detailed Expiry Matrix (Excluding 'Closed' Candidates)
const _now = new Date();
const stats = {
  passport:    { missing: 0, noDate: 0, expired: 0, exp30: 0, exp180: 0 },
  medExam:     { missing: 0, noDate: 0, expired: 0, exp30: 0, exp180: 0 },
  medAnalysis: { missing: 0, noDate: 0, expired: 0, exp30: 0, exp180: 0 },
  visa:        { missing: 0, noDate: 0, expired: 0, exp30: 0, exp180: 0 }
};

// Filter out 'Closed' candidates
const activeCands = (App.state.candidates || []).filter(c => c.CurrentStatus !== 'Closed');

activeCands.forEach(c => {
  const checkDoc = (typeSubstring, statObj) => {
    const doc = (App.state.documents || []).find(d => 
      (d.CandidateID === c.CandidateID || d.candidateId === c.CandidateID) && 
      (d.DocType || '').toLowerCase().includes(typeSubstring)
    );
    
    if (!doc) {
      statObj.missing++;
    } else if (!doc.ExpiryDate && !doc.expiryDate) {
      statObj.noDate++;
    } else {
      const expVal = doc.ExpiryDate || doc.expiryDate;
      const diffDays = Math.ceil((new Date(expVal) - _now) / (1000 * 60 * 60 * 24));
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

// Helper to render mini table
const renderStatTable = (title, data, color) => `
  <div class="kpi-card" style="padding: 0; overflow: hidden; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="background: #f8fafc; padding: 10px 14px; font-weight: 700; font-size: 13px; color: #334155; border-bottom: 2px solid ${color}; text-transform: uppercase;">
      ${title}
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Missing</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #94a3b8;">${data.missing}</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Date Not Set</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #f59e0b;">${data.noDate}</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Expired</td><td style="text-align: right; padding: 8px 14px; font-weight: 700; color: #ef4444;">${data.expired}</td></tr>
      <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 14px;">Expiring (<= 30 Days)</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #f97316;">${data.exp30}</td></tr>
      <tr><td style="padding: 8px 14px;">Expiring (<= 6 Months)</td><td style="text-align: right; padding: 8px 14px; font-weight: 600; color: #3b82f6;">${data.exp180}</td></tr>
    </table>
  </div>`;

// 2. Build HTML Grid
const detailedDocKpisHtml = `
<div class="dash-kpi-tables-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; margin-bottom: 24px;">
  ${renderStatTable('Passport Status', stats.passport, '#3b82f6')}
  ${renderStatTable('Medical Exam Status', stats.medExam, '#10b981')}
  ${renderStatTable('Medical Analysis Status', stats.medAnalysis, '#8b5cf6')}
  ${renderStatTable('Visa Status', stats.visa, '#f59e0b')}
</div>`;