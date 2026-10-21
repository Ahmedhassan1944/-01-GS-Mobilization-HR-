### SYSTEM ARCHITECT FIXES: Calendar Module Optimization

**Context:** The Calendar QA Report identified 4 critical vulnerabilities across logic, memory, performance, and UI.
Act as a Principal Developer. Apply the following 4 surgical patches to `CalendarManager.gs`, `Script.html`, and `Styles.html`.

#### FIX 1: Timezone-Safe Date Normalization (`CalendarManager.gs`)
Locate `normalizeEventDateString_(value)`. Replace it entirely with this timezone-safe version to prevent 1-day backward shifts:
```javascript
function normalizeEventDateString_(value) {
  if (!value) return '';
  
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  
  const strVal = String(value).trim();
  if (strVal.startsWith('#') || strVal.toLowerCase() === 'nan' || strVal === 'Invalid Date') {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
    const [y, m, d] = strVal.split('-').map(Number);
    const testDate = new Date(y, m - 1, d);
    if (isNaN(testDate.getTime())) return '';
    return strVal;
  }

  const dVal = new Date(value);
  if (isNaN(dVal.getTime())) return '';
  return Utilities.formatDate(dVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

FIX 2: Event Delegation & Memory Leak Prevention (Script.html)

    In Views._renderMonthCalendar(), remove the inline onclick attribute. Change the cell generation to use data attributes:

// Replace the old cell generation with this:
cellsHtml += `
  <div class="month-calendar__day ${isToday ? 'month-calendar__day--today' : ''} ${dayEvents.length ? 'month-calendar__day--has-events' : ''} ${isSelected ? 'month-calendar__day--selected' : ''}"
       data-date-key="${dateKey}">
    <div class="month-calendar__day-num">${d}</div>
    ${dotsHtml}
  </div>`;

  Add this delegation function and call it at the end of Views.calendar() and Views._renderMonthCalendar() (if re-rendering the grid):

  Views._initCalendarDelegation = function() {
  const container = document.getElementById('month-calendar');
  if (!container || container.dataset.delegated) return;
  
  container.addEventListener('click', (e) => {
    const dayCell = e.target.closest('.month-calendar__day[data-date-key]');
    if (dayCell) {
      Views._selectCalendarDay(dayCell.dataset.dateKey);
    }
  });
  
  container.dataset.delegated = 'true';
};

FIX 3: Intelligent Cache Check & Optimistic Deletion (Script.html)

    Update Views.calendar(container, forceFetch = false) to use the cache:

// Add this at the top of Views.calendar before fetching:
  if (!forceFetch && App.state.calendarEvents && App.state.calendarEvents.length > 0) {
    const cachedEvents = App.state.calendarEvents;
    const activeKpi = document.getElementById('cal-kpi-active');
    if (activeKpi) activeKpi.textContent = cachedEvents.filter(e => e.Status === 'Active').length;
    
    Views._renderMonthCalendar();
    if (typeof Views._initCalendarDelegation === 'function') Views._initCalendarDelegation();
    
    const initialFilter = App.state.filter || 'All';
    const btn = document.querySelector(`button[data-cal-filter="${initialFilter}"]`);
    Views._applyCalendarFilter(initialFilter, btn);
    return; // Short-circuit!
  }

  Update Views._deleteEvent(eventId) to mutate state instead of full reload:

  // Inside the success block of _deleteEvent:
    if (res.success) {
      Toast.success('Event deleted.');
      if (App.state.calendarEvents) {
        App.setState({ calendarEvents: App.state.calendarEvents.filter(e => e.EventID !== eventId) });
      }
      
      if (App.state.currentView === 'calendar') {
        Views._renderMonthCalendar();
        if (typeof Views._initCalendarDelegation === 'function') Views._initCalendarDelegation();
        const activeFilter = document.querySelector('.quick-filter-btn--active')?.dataset.calFilter || 'All';
        Views._applyCalendarFilter(activeFilter);
      }

FIX 4: Mobile Grid Responsiveness (Styles.html)

Add these CSS rules to fix mobile grid squishing and tooltip clipping:

@media (max-width: 640px) {
  .month-calendar__day { min-height: 48px; padding: 2px; }
  .month-calendar__day-num { font-size: .7rem; }
  .month-calendar__weekday { font-size: .6rem; padding: 4px 2px; }
  .month-calendar__dot { width: 5px; height: 5px; }
}

.month-calendar__days .month-calendar__day:nth-child(-n+7) .ev-tooltip {
  bottom: auto;
  top: calc(100% + 6px);
}

Execution: Apply all 4 patches strictly. Save all files and confirm completion.