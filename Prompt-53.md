### UI FIX: PREVENT FOUC (FLASH OF UNSTYLED CONTENT) ON FILTERS

**Context:** The Document Center filter dropdowns exhibit FOUC, rendering as raw, expanded HTML `<select>` elements for ~4 seconds during data fetching before JS styling initializes.
**Objective:** Act as a Principal Frontend Engineer. Hide the unstyled selects initially and fade them in smoothly ONLY after JavaScript has fully populated and initialized them.

#### FIX 1: Add CSS State Classes (`Styles.html`)
Open `Styles.html` and append these classes to handle the hiding and smooth fading:
```css
/* FOUC Prevention for Filters */
.fouc-hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none;
}
.fouc-ready {
    opacity: 1 !important;
    visibility: visible !important;
    transition: opacity 0.5s ease-in-out;
}

FIX 2: Apply Initial Hidden State (Index.html / Script.html)

Locate the container holding the filters (e.g., the row containing the search bar and the 8 dropdowns).

    Add the class fouc-hidden to the main filter wrapper/container in the HTML so it starts completely invisible.

FIX 3: Reveal After Initialization (Script.html)

Locate the function responsible for loading the Document Center and populating the dropdowns (e.g., Views._dcLoad, Views._populateCandidateFilterDropdowns, or Views._initPremiumMultiSelects).
At the very end of the .then() block (after the data is fetched, dropdowns are filled, and custom select UI is built), remove the hidden class and add the ready class:

// Add this at the very end of the filter initialization logic:
const filterContainer = document.querySelector('.fouc-hidden'); // Or use the specific container ID
if (filterContainer) {
    filterContainer.classList.remove('fouc-hidden');
    filterContainer.classList.add('fouc-ready');
}
Execution: Apply this CSS/JS combo. Save and push.