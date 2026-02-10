# 🔧 Integration Checklist - Expandable Timeline

## 📦 Files to Add to Your Project

Copy these files from `/mnt/user-data/outputs/` to your project:

```
src/
├── components/
│   └── ProgressionEditor/
│       ├── LoopTimeline.tsx          ← Main timeline component
│       └── timeline-analog.css       ← Analog warmth styling
└── hooks/
    └── useExpandableTimeline.ts      ← Timeline state management hook
```

---

## ✅ Step-by-Step Integration

### 1. Install Dependencies

Already installed in your project! ✓
```bash
# framer-motion - already in package.json
# lucide-react - already in package.json
```

### 2. Add Files to Project

```bash
# From your project root
cp /mnt/user-data/outputs/LoopTimeline.tsx src/components/ProgressionEditor/
cp /mnt/user-data/outputs/timeline-analog.css src/components/ProgressionEditor/
cp /mnt/user-data/outputs/useExpandableTimeline.ts src/hooks/
```

### 3. Update ProgressionEditor.tsx

Replace the placeholder timeline footer with the LoopTimeline component:

```tsx
// src/components/ProgressionEditor/ProgressionEditor.tsx

import { LoopTimeline } from './LoopTimeline';

export function ProgressionEditor() {
  return (
    <div className="h-screen bg-app flex flex-col">
      {/* Header */}
      <header className="panel border-b px-6 py-3 shadow-lg">
        {/* ... existing header ... */}
      </header>

      {/* Main Content */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="flex flex-col order-first w-56 gap-2 p-2 overflow-y-auto panel border-r">
          {/* ... existing sidebar ... */}
        </div>

        {/* Right Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden progression-editor-content">
          {/* ... existing encoders and pads ... */}
        </div>
      </div>

      {/* ✨ NEW: Expandable Timeline (replaces old footer) */}
      <LoopTimeline />
    </div>
  );
}
```

### 4. Remove Old Timeline Placeholder

Delete or comment out this section:

```tsx
// ❌ REMOVE THIS:
{/* Timeline Footer - Full Width Static (Bottom of Window) */}
<div className="h-30 px-6 py-4 panel border-t shrink-0">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold muted-text">
      Timeline: Progression Slots
    </h3>
    <button onClick={() => setShowSaveModal(true)}>
      <Save size={14} />
      Save
    </button>
  </div>

  <div className="flex items-center justify-center h-24 border border-gray-700 border-dashed rounded-lg">
    <div className="text-sm text-center muted-text">
      Song timeline placeholder — sections will appear here
    </div>
  </div>
</div>
```

### 5. Update CSS Class Structure

The timeline uses the `progression-editor-content` class to dim content when expanded. Ensure your main editor area has this class:

```tsx
<div className="flex flex-col flex-1 overflow-hidden progression-editor-content">
  {/* Your encoders, pads, progression strip */}
</div>
```

---

## 🎨 Verify Styling Integration

### Check Your globals.css

Ensure these CSS variables are defined (they should be from your existing theme):

```css
/* src/styles/globals.css */

:root {
  --color-background: /* your dark bg */
  --color-card: /* your card bg */
  --color-border: /* your border color */
  --color-primary: /* your accent color */
  --color-muted-foreground: /* your muted text */
}
```

The timeline CSS uses its own warm color palette but inherits these base variables for consistency.

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] Timeline appears at bottom of window
- [ ] Resize handle visible at top edge (drag works)
- [ ] Section cards show with warm paper texture
- [ ] Playhead has amber glow
- [ ] Buffer cards show with dashed borders

### Interaction Tests

- [ ] **Drag handle**: Smooth resize with tooltip
- [ ] **Size presets**: Min/Norm/Max/Full buttons work
- [ ] **Expand button**: Toggles Normal ↔ Expanded
- [ ] **Keyboard T**: Toggles expansion
- [ ] **Keyboard Shift+T**: Enters/exits fullscreen
- [ ] **Keyboard Esc**: Exits fullscreen
- [ ] **Ctrl+↑/↓**: Steps through modes

### Layout Tests

- [ ] Normal mode: Progression editor fully visible
- [ ] Expanded mode: Progression editor dimmed 70%
- [ ] Fullscreen mode: Backdrop overlay, content blurred
- [ ] Responsive: Works at 1024px and below

### Content Tests

- [ ] Sections from progressionStore display correctly
- [ ] Repeat badges show (×2, ×3, etc.)
- [ ] Bar/chord counts are accurate
- [ ] Buffer cards show 4 pre + 4 post
- [ ] Expanded detail shows only in expanded/fullscreen

---

## 🔧 Customization Points

### Adjust Timeline Heights

Edit in `useExpandableTimeline.ts`:

```typescript
const DEFAULT_SIZES: TimelineSize = {
  collapsed: 80,    // ← Change this
  normal: 200,      // ← Or this
  expanded: 400,    // ← Or this
  fullscreen: 0,    // (Always viewport height)
};
```

### Change Warm Color Palette

Edit CSS custom properties in `timeline-analog.css`:

```css
:root {
  --timeline-light-primary: hsl(30, 100%, 50%);  /* Amber glow */
  --timeline-paper-base: hsl(45, 12%, 12%);      /* Paper color */
  /* ... etc ... */
}
```

### Adjust Buffer Content

In `LoopTimeline.tsx`, customize the buffer card content:

```tsx
{/* Pre-buffer cards */}
<div className="buffer-card">
  <span className="buffer-title">🎵 Your Title</span>
  <div className="buffer-content">
    Your custom content here
  </div>
</div>
```

### Change Keyboard Shortcuts

Edit in `useExpandableTimeline.ts`, look for:

```typescript
if (e.key === 't' || e.key === 'T') {
  // Change 't' to your preferred key
}
```

---

## 🐛 Troubleshooting

### Timeline doesn't resize
**Check:** Is the progression editor area using `progression-editor-content` class?

### Styling looks wrong
**Check:** Is `timeline-analog.css` imported in `LoopTimeline.tsx`?

### Keyboard shortcuts don't work
**Check:** Are you focused on an input field? Shortcuts are disabled when typing.

### Sections not showing
**Check:** Does `useProgressionStore().sections` have data?

### Playhead position wrong
**Check:** Is `currentBeat` state being updated by transport?

---

## 🚀 Next Steps After Integration

### Phase 1: Get It Working
1. Add all files to project
2. Update ProgressionEditor.tsx
3. Test basic expand/collapse

### Phase 2: Connect to Store
4. Wire up real section data from progressionStore
5. Implement playhead sync with transport
6. Add drag-drop section reordering

### Phase 3: Advanced Features
7. Implement zoom controls (adjust px/beat)
8. Add snap-to-bar scrolling
9. Wire up Send to Live functionality
10. Add buffer content customization

### Phase 4: Polish
11. Add section edit panel (click info button)
12. Implement lyrics/metadata display
13. Add keyboard navigation (←/→ for bars)
14. Optimize performance with virtualization (if needed)

---

## 📊 File Structure After Integration

```
src/
├── components/
│   ├── ProgressionEditor/
│   │   ├── ProgressionEditor.tsx      ✅ Updated
│   │   ├── LoopTimeline.tsx           ✨ NEW
│   │   ├── timeline-analog.css        ✨ NEW
│   │   ├── ProgressionStrip.tsx       ✅ Existing
│   │   ├── ChordSlot.tsx             ✅ Existing
│   │   └── ChordPalette.tsx          ✅ Existing
│   └── ...
├── hooks/
│   └── useExpandableTimeline.ts       ✨ NEW
├── stores/
│   └── progressionStore.ts            ✅ Existing (used by timeline)
└── styles/
    └── globals.css                    ✅ Existing (base variables)
```

---

## 💡 Pro Tips

### Development Workflow
1. Start with timeline in **Normal mode** to see basic layout
2. Press **T** frequently while building to test transitions
3. Use **Fullscreen mode** to test multi-row grid layout
4. Check **Chrome DevTools** responsive mode for mobile

### Performance Optimization
- Timeline uses `memo()` internally for section cards
- Drag operations are debounced
- Only re-renders when mode or sections change
- No virtualization needed until 20+ sections

### Accessibility
- Resize handle has proper `cursor: ns-resize`
- Keyboard shortcuts work globally (except in inputs)
- Focus states on all interactive elements
- ARIA labels on transport controls

---

## 🎉 You're Ready!

Once integrated, you'll have a **professional-grade expandable timeline** with:

✅ Smooth drag-to-resize
✅ Four preset modes (collapsed → fullscreen)
✅ Keyboard shortcuts (T, Shift+T, Ctrl+arrows)
✅ Warm analog aesthetics
✅ Progressive detail disclosure
✅ Fullscreen overlay for complex arrangements

**Happy arranging!** 🎵

---

## 📞 Support

If you run into issues:

1. Check the browser console for errors
2. Verify all files copied correctly
3. Ensure imports match your project structure
4. Review the integration checklist above

The timeline is designed to work standalone - if sections display in ProgressionStrip, they'll display in LoopTimeline.
