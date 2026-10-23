### STRICT ZERO-FOUC OVERRIDE (NATIVE SELECT HIDER)

**Context:** The previous fix didn't prevent the intermediate paint of the raw HTML `<select>` elements, causing a 3-stage visual glitch (blank -> ugly native -> modern UI). The user wants the native shape to NEVER appear.
**Objective:** Act as a Principal UI Engineer. Permanently hide the native `<select>` tags in the DOM via CSS so the browser never paints them, allowing only the final custom JavaScript UI to be visible.

#### FIX 1: Strict Native Select Override (`Styles.html`)
Locate `Styles.html` (or your main CSS block) and inject this CSS. Remove the old `.fouc-hidden` logic as it was hiding the parent container.

```css
/* 1. Permanently hide raw native selects in the filter area to prevent FOUC */
/* Adjust the container class/id if your filters are inside a specific wrapper like #documents-center or .filter-row */
select[multiple], 
.filter-container select,
#dc-view select {
    opacity: 0 !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    z-index: -9999 !important;
    pointer-events: none !important;
}

/* 2. Optional: Add a smooth skeleton background to the containers while JS is building the modern UI */
.custom-select-wrapper:empty {
    min-height: 40px;
    border-radius: 6px;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: pulseSkeleton 1.5s infinite ease-in-out;
}

@keyframes pulseSkeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}