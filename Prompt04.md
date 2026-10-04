Act as a Senior Google Apps Script & Frontend Developer. I found a bug in the Dashboard KPI calculations regarding the excluded statuses (`Closed`, `Rejected`, `Unfit-Injury`, `Unfit-PCR`).

### Problem Diagnosis
In `Code.gs` (`api_getDashboardData`) and `Script.html` (`Views._refreshDashboard`, `Views._renderKpiSectionsWithBatchFilter`, `Views._computeDashboardKpis`), the candidates list was being pre-filtered with `EXCLUDED_KPI_STATUSES = new Set(['Closed', 'Rejected', 'Unfit-Injury', 'Unfit-PCR'])` BEFORE calculating individual status counts.

Because candidates with these 4 statuses were filtered out beforehand:
- The specific counters (`rejected`, `unfitInjury`, `unfitPcr`) were calculated as `0` on their own dedicated KPI cards.
- Their individual cards (`Rejected`, `Unfit-Injury`, `Unfit-PCR`) always displayed `0` or `--`.

---

### Required Fixes

#### 1. Backend Controller (`Code.gs` — `api_getDashboardData`)
- **Do NOT pre-filter `allCandidates`** before status counting. Loop over `allCandidates` so every specific status counter (`rejected`, `unfitInjury`, `unfitPcr`, `visaPending`, etc.) reflects its accurate total count.
- **Active Cases (`activeCount`)**: Increment only for candidates whose status is NOT in `EXCLUDED_KPI_STATUSES`.
- **Document HAS / MISSING Counters**: Compute document availability across active candidates only (excluding `Closed`, `Rejected`, `Unfit-Injury`, `Unfit-PCR`).

#### 2. Frontend Dashboard Logic (`Script.html`)
- **`Views._computeDashboardKpis(candidates, docCompleteness)`**:
  - Iterate over all candidates passed to the function.
  - Calculate `rejected`, `unfitInjury`, `unfitPcr` (and any other individual status) from the full list without skipping them.
  - Calculate `activeCount` by skipping candidates matching `EXCLUDED_KPI_STATUSES`.
- **`Views._refreshDashboard()` & `Views._renderKpiSectionsWithBatchFilter()`**:
  - Pass the full candidates array (or batch-filtered base list) to `Views._computeDashboardKpis` so specific status cards receive their true counts.
  - Ensure individual card counts for `Rejected`, `Unfit-Injury`, and `Unfit-PCR` show the correct numbers.
- **Card Click Filtering (`Views._buildDashboardCardPredicate`)**:
  - Ensure clicking a specific card (e.g. `Rejected`, `Unfit-Injury`, `Unfit-PCR`) correctly displays those candidate records in the table below.

---

### Constraints
- The 📊 Pipeline Overview total (`Active Cases`) and document grids (HAS / MISSING) must continue to exclude `Closed`, `Rejected`, `Unfit-Injury`, and `Unfit-PCR`.
- Dedicated cards for `Rejected`, `Unfit-Injury`, and `Unfit-PCR` must show their actual candidate totals.
- Preserve all existing batch filters and document completeness logic.