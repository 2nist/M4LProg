# LoopTimeline Auto-Scroll Fix Report

## Root Cause Analysis

There are **3 interacting problems** preventing the timeline from auto-scrolling:

### Problem 1: Duplicate `.timeline-track` CSS rules fighting each other

The CSS file defines `.timeline-track` **twice**:

- **Lines 85–145**: First definition — has `overflow-x: auto`, `scroll-behavior: smooth`, `scroll-snap-type: x mandatory`
- **Lines 1274–1310**: Second definition (in the "refactored" section at the bottom) — has `overflow-x: auto` again but is nested inside a different layout context (`flex: 1; height: 100%`)

Because both selectors have **identical specificity**, the second one wins. But the first one's `scroll-behavior: smooth` and `scroll-snap-type: x mandatory` still partially apply (they aren't overridden by the second block). This creates unpredictable behavior where:

- `scroll-snap-type: x mandatory` **fights** programmatic `scrollLeft` assignments by snapping back to the nearest snap point
- `scroll-behavior: smooth` **delays** the scroll, causing the JS `scrollLeft = value` to be overridden by the next animation frame before it completes

### Problem 2: `.timeline-track-wrapper` has `overflow: hidden`

```css
.timeline-track-wrapper {
  overflow: hidden;  /* Line 1268 */
}
```

The DOM hierarchy is:
```
.timeline-track-wrapper (overflow: hidden)
  └── .timeline-track (overflow-x: auto) ← scrollContainerRef points here
       └── .timeline-scroll-container (padding: 0 50%)
            └── sections...
```

The wrapper clips content but the inner `.timeline-track` is the actual scroll container. This is fine **if** the `.timeline-track` has an explicit size. But with `width: 100%` and `height: 100%` on the second definition, the track sizes to its parent — meaning `scrollWidth === clientWidth` and **there's nothing to scroll**.

The `padding: 0 50%` on `.timeline-scroll-container` should create scrollable overflow, but the flex layout can absorb this padding into the container's intrinsic size rather than creating overflow, depending on how the browser resolves the flex sizing.

### Problem 3: The JS auto-scroll temporarily disables `scroll-behavior` but can't override `scroll-snap`

Your fix attempt (lines 361–368 of LoopTimeline.tsx) correctly disables `scroll-behavior: smooth` during programmatic updates:

```js
container.style.scrollBehavior = 'auto';
container.scrollLeft = activeBeatPixelPosition;
container.style.scrollBehavior = originalBehavior;
```

But this **doesn't help** because:
1. `scroll-snap-type: x mandatory` immediately snaps the scroll back
2. If `scrollWidth <= clientWidth`, the assignment is a no-op regardless

---

## The Fix

### CSS Changes (timeline-analog.css)

1. **Remove the duplicate `.timeline-track` block** (lines 1274–1310) — keep only the first definition
2. **Remove `scroll-behavior: smooth`** from `.timeline-track` — it conflicts with programmatic scrolling
3. **Remove `scroll-snap-type: x mandatory`** — it fights `scrollLeft` assignments
4. **Change `.timeline-track-wrapper` overflow** from `hidden` to `visible` (or remove it) so the track can size properly

### JS Changes (LoopTimeline.tsx)

5. **Remove the `scroll-behavior` override hack** — no longer needed once the CSS is fixed
6. **Add a `requestAnimationFrame` wrapper** around the scroll assignment to ensure it happens after layout

---

## Files to Change

See the two fixed files created alongside this report.
