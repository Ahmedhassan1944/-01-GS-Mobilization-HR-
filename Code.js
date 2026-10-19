/**
 * =========================================================
 * ENTERPRISE HR MOBILIZATION SYSTEM - BACKEND CONTROLLER
 * =========================================================
 */

/**
 * Standard GET handler. Evaluates and serves the Index.html template.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Enterprise HR Mobilization')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Required if embedding
}

/**
 * Helper function to inject Styles.html and Script.html into Index.html.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * =========================================================
 * API LAYER -> To be called via google.script.run
 * =========================================================
 */

/**
 * Fetches and aggregates ALL dashboard KPI data.
 *
 * Status-based KPIs (from tbl_Candidates):
 *   activeCount         → all candidates except Closed
 *   missingDocs         → New Candidate | Documents Requested | Documents Under Preparing |
 *                         Pending Passport | Pending Photo | Pending Academic Certificate |
 *                         Pending Medical | Booked a medical examination
 *   visaPending         → Visa Pending
 *   visaCompleted       → Visa Completed
 *   mobilized           → Mobilized
 *   pendingMedical      → Pending Medical
 *   bookedMedical       → Booked a medical examination
 *   docsUnderPreparing  → Documents Under Preparing
 *
 * Document-based KPIs (from tbl_Documents, per candidate):
 *   hasPassport, hasPhoto, hasAcademicCert,
 *   hasMedicalExam, hasMedicalAnalysis, hasVisa, hasCV
 *   → count of candidates who HAVE that doc (ApprovalStatus !== 'Rejected')
 *
 *   missingPassport, missingPhoto, missingAcademicCert,
 *   missingMedicalExam, missingMedicalAnalysis, missingVisa, missingCV
 *   → count of candidates who are MISSING that doc
 */

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD CACHE — INVALIDATION POLICY (project architecture rule)
// ═══════════════════════════════════════════════════════════════════════
// Cache key : 'dashboard_data'
// TTL       : 60 seconds (FALLBACK ONLY — not the primary mechanism)
// Strategy  : EVENT-BASED invalidation
//
// Any backend function that inserts, updates, deletes, approves, rejects,
// archives, restores, or otherwise modifies data displayed on the Dashboard
// MUST add this line immediately before its success return:
//
//   CacheService.getScriptCache().remove('dashboard_data');
//
// Read-only api_get* functions MUST NOT call remove().
//
// Cache lifecycle:
//   Request → cache HIT  → return cached JSON (0 Sheets calls)
//   Request → cache MISS → read Sheets → compute → cache.put() → return
//   Write op fires       → cache.remove() → next request regenerates
// ═══════════════════════════════════════════════════════════════════════

function api_getDashboardData() {
  try {
    // ── Cache read ─────────────────────────────────────────────────────
    // CacheService stores the computed result for 60 seconds (TTL = fallback).
    // Primary invalidation is EVENT-BASED: every write api_* function calls
    // CacheService.getScriptCache().remove('dashboard_data') before returning.
    // This means the cache is always fresh immediately after any data change.
    const _cache      = CacheService.getScriptCache();
    const _cachedJson = _cache.get('dashboard_data');
    if (_cachedJson) {
      try {
        const cachedPayload = JSON.parse(_cachedJson);
        if (cachedPayload && cachedPayload.success && cachedPayload.data) {
          return cachedPayload;
        }
      } catch (cacheParseErr) {
        Logger.log('Corrupted dashboard cache, recomputing: ' + cacheParseErr.message);
      }
    }
    // ───────────────────────────────────────────────────────────────────

    const settingsRes = typeof api_getSystemSettings === 'function' ? api_getSystemSettings() : { success: true, data: DEFAULT_SYSTEM_SETTINGS };
    const settings = (settingsRes && settingsRes.success && settingsRes.data) ? settingsRes.data : DEFAULT_SYSTEM_SETTINGS;

    const candsRes = api_getAllCandidates();
    if (!candsRes.success) throw new Error(candsRes.error);
    const docsRes  = api_getAllDocuments();
    if (!docsRes.success) throw new Error(docsRes.error);
    const eventsRes = api_getAllUpcomingEvents();
    if (!eventsRes.success) throw new Error(eventsRes.error);
    const allCandidates = candsRes.data;
    const EXCLUDED_KPI_STATUSES = new Set(settings.excludedStatuses || ['Closed', 'Rejected', 'Unfit-Injury', 'Unfit-PCR']);
    const candidates = allCandidates;
    const allDocs    = docsRes.data;
    const activeEvents = eventsRes.data;
    // ── Status-based counters ──────────────────────────────────────
    const MISSING_DOC_STATUSES = new Set([
      'New Candidate',
      'Documents Requested',
      'Documents Under Preparing',
      'Pending Passport',
      'Pending Photo',
      'Pending Academic Certificate',
      'Pending Medical',
      'Booked a medical examination'
    ]);
    let activeCount        = 0;
    let missingDocs        = 0;
    let visaPending        = 0;
    let visaCompleted      = 0;
    let mobilized          = 0;
    let pendingMedical     = 0;
    let bookedMedical      = 0;
    let docsUnderPreparing = 0;
    let taIssues           = 0;
    let renewalPassport    = 0;
    let notAvailable       = 0;
    let creatingWhatsapp   = 0;
    let unfitPcr           = 0;
    let unfitInjury        = 0;
    let rejected           = 0;

    // Dynamic status & batch counters
    const statusCounts = {};
    (settings.statuses || []).forEach(st => { statusCounts[st] = 0; });

    // [SURGICAL FIX] Safe Batch Aggregation
    const batchCounts = {};
    const allBatches = [...(settings.staffBatches || []), ...(settings.kalhatBatches || [])].filter(Boolean);
    allBatches.forEach(b => {
      batchCounts[String(b)] = 0;
    });

    candidates.forEach(cand => {
      const status = String(cand.CurrentStatus || '').trim();
      if (!EXCLUDED_KPI_STATUSES.has(status)) activeCount++;
      if (MISSING_DOC_STATUSES.has(status))           missingDocs++;
      if (status === 'Visa Pending')                   visaPending++;
      if (status === 'Visa Completed')                 visaCompleted++;
      if (status === 'Mobilized')                      mobilized++;
      if (status === 'Pending Medical')                pendingMedical++;
      if (status === 'Booked a medical examination')   bookedMedical++;
      if (status === 'Documents Under Preparing')      docsUnderPreparing++;
      if (status === 'Talent Acquisition Issues')      taIssues++;
      if (status === 'Renewal Passport')               renewalPassport++;
      if (status === 'Not Available')                  notAvailable++;
      if (status === 'Creating WhatsApp Group')        creatingWhatsapp++;
      if (status === 'Unfit-PCR')                      unfitPcr++;
      if (status === 'Unfit-Injury')                   unfitInjury++;
      if (status === 'Rejected')                       rejected++;

      if (statusCounts[status] !== undefined) statusCounts[status]++;

      // Dynamic batch matching (supports "Staff Batch N", "Batch N", "Kalhat Batch N")
      const cBatch = String(cand.Batch_Number || cand['Batch Number'] || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/^staff\s+/, '');
      if (cBatch) {
        allBatches.forEach(b => {
          const normB = String(b).trim().toLowerCase().replace(/[-_]/g, ' ').replace(/^staff\s+/, '');
          if (cBatch === normB) {
            batchCounts[String(b)] = (batchCounts[String(b)] || 0) + 1;
          }
        });
      }
    });

    // ── Document-based counters ────────────────────────────────────
    const REQUIRED_DOCS = settings.documentTypes || [
      'Passport', 'Photo', 'Academic Certificate',
      'Medical Examination', 'Medical Analysis', 'Visa', 'CV'
    ];
    // Count has/missing per docType across all candidates
    const hasCount     = {};
    const missingCount = {};
    REQUIRED_DOCS.forEach(dt => { hasCount[dt] = 0; missingCount[dt] = 0; });
    candidates.forEach(cand => {
      const status = String(cand.CurrentStatus || '').trim();
      if (EXCLUDED_KPI_STATUSES.has(status)) return;
      
      const comp = cand.docCompleteness || { presentDocs: [], missingDocs: [] };
      const present = new Set(comp.presentDocs);
      
      REQUIRED_DOCS.forEach(dt => {
        if (present.has(dt)) hasCount[dt]++;
        else                 missingCount[dt]++;
      });
    });
    
    // ── Calendar-based counters ────────────────────────────────────
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const nextWeekDate = new Date(todayDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);

    let eventsToday = 0;
    let eventsTomorrow = 0;
    let eventsThisWeek = 0;
    let eventsOverdue = 0;
    let eventsHighPriority = 0;

    activeEvents.forEach(evt => {
      const dateStr = normalizeEventDateString_(evt.EventDate);
      if (!dateStr) return;
      const [y, m, d] = dateStr.split('-').map(Number);
      if (isNaN(y) || isNaN(m) || isNaN(d)) return;
      const evDate = new Date(y, m - 1, d);
      // Defensive Date Parsing: wrap in safety check to avoid formula errors (#REF!, #N/A) crashing math
      if (isNaN(evDate.getTime())) return;
      
      if (evDate.getTime() === todayDate.getTime()) eventsToday++;
      if (evDate.getTime() === tomorrowDate.getTime()) eventsTomorrow++;
      if (evDate >= todayDate && evDate <= nextWeekDate) eventsThisWeek++;
      if (evDate < todayDate) eventsOverdue++;
      if (evt.Priority === 'High' && evDate >= todayDate) eventsHighPriority++;
    });

    // ── Document Expiry KPIs with Defensive Date Parsing ────────────
    const _now = new Date();
    let expPassport = 0;
    let expMedExam = 0;
    let expMedAnalysis = 0;
    let expVisa = 0;

    (allDocs || []).forEach(doc => {
      const val = doc.ExpiryDate || doc.expiryDate;
      if (!val) return;
      const expDate = new Date(val);
      // Defensive Date Parsing: wrap in safety check to prevent formula errors evaluating to NaN
      if (isNaN(expDate.getTime())) return;

      if (expDate < _now) {
        const dType = String(doc.DocType || doc.docType || '').toLowerCase();
        if (dType.includes('passport')) expPassport++;
        if (dType.includes('medical examination')) expMedExam++;
        if (dType.includes('medical analysis')) expMedAnalysis++;
        if (dType.includes('visa')) expVisa++;
      }
    });

    const aggregatedMetrics = {
      // Status-based
      activeCount,
      missingDocs,
      visaPending,
      visaCompleted,
      mobilized,
      pendingMedical,
      bookedMedical,
      docsUnderPreparing,
      taIssues,
      renewalPassport,
      notAvailable,
      creatingWhatsapp,
      unfitPcr,
      unfitInjury,
      rejected,
      statusCounts,
      batchCounts,
      hasCount,
      missingCount,
      // Document HAS counts
      hasPassport:      hasCount['Passport'] || 0,
      hasPhoto:         hasCount['Photo'] || 0,
      hasAcademicCert:  hasCount['Academic Certificate'] || 0,
      hasMedicalExam:   hasCount['Medical Examination'] || 0,
      hasMedicalAnalysis: hasCount['Medical Analysis'] || 0,
      hasVisa:          hasCount['Visa'] || 0,
      hasCV:            hasCount['CV'] || 0,
      // Document MISSING counts
      missingPassport:       missingCount['Passport'] || 0,
      missingPhoto:          missingCount['Photo'] || 0,
      missingAcademicCert:   missingCount['Academic Certificate'] || 0,
      missingMedicalExam:    missingCount['Medical Examination'] || 0,
      missingMedicalAnalysis:missingCount['Medical Analysis'] || 0,
      missingVisa:           missingCount['Visa'] || 0,
      missingCV:             missingCount['CV'] || 0,
      // Calendar-based
      eventsToday,
      eventsTomorrow,
      eventsThisWeek,
      eventsOverdue,
      eventsHighPriority,
      // Expiry KPIs
      expPassport,
      expMedExam,
      expMedAnalysis,
      expVisa,
      msg: 'Live data successfully retrieved from Google Sheets.'
    };

    const _result = {
      success: true,
      settings: settings,
      data: aggregatedMetrics
    };

    // ── Cache write: Lightweight Payload Only (Fix Vulnerability 3.1) ───
    // Prevent 100KB CacheService overflow by caching ONLY the aggregated metrics
    // and settings, NEVER raw massive arrays (candidates, documents, events).
    const _cachePayload = {
      success: true,
      settings: settings,
      data: aggregatedMetrics
    };

    try {
      const payloadStr = JSON.stringify(_cachePayload);
      if (payloadStr.length < 100000) {
        _cache.put('dashboard_data', payloadStr, 60);
      } else {
        Logger.log('WARNING: dashboard_data cache exceeds 100KB (' + payloadStr.length + ' bytes). Skipping cache.');
      }
    } catch (cacheErr) {
      Logger.log('Cache put failed: ' + cacheErr.message);
    }

    return _result;
  } catch (e) {
    Logger.log(e);
    return { success: false, error: e.message };
  }
}
