# 🎬 Expandable Timeline Feature

## Overview

The LoopTimeline can be **pulled up** to overlay the progression editor, giving you more vertical space and detail when arranging your song. Think of it like Ableton's arrangement view toggle - seamless expansion when you need it.

---

## 🎯 Four Timeline Modes

### 1. **Collapsed** (80px)
```
┌────────────────────────────────────────────────┐
│ [Controls] Bar: 12  00:24/02:45  🔁 Loop      │ ← Nav strip only
├────────────────────────────────────────────────┤
│ [Section 1] [Section 2] [...]   ← Minimal peek│
└────────────────────────────────────────────────┘
```
**Use when:** You're focused on chord editing in the progression editor

### 2. **Normal** (200px) - Default
```
┌────────────────────────────────────────────────┐
│ [Controls] Bar: 12  00:24/02:45  🔁 Loop      │
├────────────────────────────────────────────────┤
│                     ▼ Playhead                 │
│ [~Buffer] [Section 1] [CMaj] [GMaj]...        │
│           └─ Shows section name, repeat count  │
│              bar count, chord count            │
├────────────────────────────────────────────────┤
│ Zoom: [───●───] 30px  [Fit][2x][Auto]         │
│ Buffer: Pre[4] Post[4]  Snap: ●Bar ○Beat      │
└────────────────────────────────────────────────┘
```
**Use when:** Normal song arrangement work

### 3. **Expanded** (400px)
```
┌────────────────────────────────────────────────┐
│ [Controls] Bar: 12  00:24/02:45  🔁 Loop      │
├────────────────────────────────────────────────┤
│                     ▼ Playhead                 │
│ ┌──────────────┐  ┌──────────────┐            │
│ │ Section 1    │  │ Section 2    │            │
│ │ ████████     │  │ ████         │            │
│ │ ×2  8 bars   │  │ ×1  4 bars   │            │
│ │              │  │              │            │
│ │ Progression: │  │ Progression: │ ← EXPANDED │
│ │ [CMaj][GMaj] │  │ [FMaj][CMaj] │   DETAILS  │
│ │ [Amin][FMaj] │  │ [GMaj][CMaj] │            │
│ │ 16 beats     │  │ 8 beats      │            │
│ └──────────────┘  └──────────────┘            │
│                                                │
│ [More sections wrap to new rows...]           │
├────────────────────────────────────────────────┤
│ Zoom & Controls...                             │
└────────────────────────────────────────────────┘
```
**Use when:** You want to see chord details without clicking into sections

### 4. **Fullscreen** (100vh)
```
┌────────────────────────────────────────────────┐ ← Overlays everything
│                                          [×]   │
│ [Controls] Bar: 12  00:24/02:45  🔁 Loop      │
├────────────────────────────────────────────────┤
│                                                │
│                     ▼ Playhead                 │
│                                                │
│ ┌──────────────┐  ┌──────────────┐  ┌────...  │
│ │ Section 1    │  │ Section 2    │  │         │
│ │ [Full detail]│  │ [Full detail]│  │         │
│ └──────────────┘  └──────────────┘  └────...  │
│                                                │
│ ┌──────────────┐  ┌──────────────┐  ┌────...  │
│ │ Section 3    │  │ Section 4    │  │         │
│ └──────────────┘  └──────────────┘  └────...  │
│                                                │
│                                                │
│ [Multi-row grid layout with scrolling]        │
│                                                │
├────────────────────────────────────────────────┤
│ Zoom & Controls...                             │
└────────────────────────────────────────────────┘
```
**Use when:** Arranging complex songs, getting a bird's-eye view

---

## 🎮 Interaction Methods

### 1. **Drag the Resize Handle**
```
     ═══════════════════════════════  ← Drag this edge
┌────────────────────────────────────────────────┐
│ Timeline content...                            │
```
- **Grab the top edge** of the timeline (subtle handle with dots)
- **Drag up** to expand, **drag down** to collapse
- **Auto-snaps** to preset sizes when close
- Shows **tooltip** with current height while dragging

### 2. **Quick Size Buttons**
```
[Min] [Norm] [Max] [Full]  ← Click to jump to size
```
- **Min**: Collapsed (80px)
- **Norm**: Normal (200px)
- **Max**: Expanded (400px)
- **Full**: Fullscreen overlay

### 3. **Expand/Collapse Button**
```
[↑ Expand]  ← Toggles between Normal ↔ Expanded
```

### 4. **Keyboard Shortcuts**
```
T               → Toggle Normal ↔ Expanded
Shift + T       → Toggle Fullscreen
Ctrl + ↑        → Expand one level
Ctrl + ↓        → Collapse one level
Esc             → Exit fullscreen
```

---

## 💡 Smart Behaviors

### Auto-Snap While Dragging
```
Dragging height: 195px → Snaps to 200px (Normal)
Dragging height: 405px → Snaps to 400px (Expanded)
```
**Snap threshold:** 20px from preset size

### Progression Editor Dimming
```
Normal mode:    Progression editor fully visible
Expanded mode:  Progression editor 70% opacity, not clickable
Fullscreen:     Progression editor blurred out completely
```
**Why?** Visual focus - you're in timeline mode

### Expanded Detail Progressive Disclosure
```
Normal mode:     Section name, repeat count, bar count
Expanded mode:   + Full chord list, beat totals
Fullscreen mode: + Additional metadata, lyrics, notes
```
**Why?** Show more info when you have more space

---

## 🎨 Visual Feedback

### Resize Handle States
```
Default:   ─────  (Subtle gray line)
Hover:     ═════  (Glows warm amber)
Dragging:  █████  (Bright with tooltip)
```

### Mode Transitions
```
Smooth height animation: 0.4s ease
Opacity fade: 0.3s ease
Content reflow: Instant (no jank)
```

### Backdrop Overlay
```
Fullscreen: Semi-transparent dark backdrop
            + Blur effect on background
            + Click to exit
```

---

## 📐 Layout Integration

### How It Sits in the UI
```
┌──────────────────────────────────────────────────────────────┐
│ ChordGen Pro Header                                          │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  Left Panel  │  Progression Editor                          │
│  (Section    │  (Encoders, ATOM SQ pads, ProgressionStrip) │
│   info)      │                                               │
│              │                                               │
├──────────────┴───────────────────────────────────────────────┤
│                                                              │
│  LOOP TIMELINE (expands over progression editor)            │ ← Pulls up
│  [Can drag this edge to resize ═══════════════════════════] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Fullscreen Overlay
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                   LOOP TIMELINE FULLSCREEN                   │
│                  (covers entire window)                      │
│                                                              │
│              Press Esc or click backdrop to exit             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ↓
    Dark backdrop + blur
         ↓
    [Hidden UI underneath]
```

---

## 🔧 Usage Example

```tsx
// In ProgressionEditor.tsx

import { LoopTimeline } from './ProgressionEditor/LoopTimeline';

export function ProgressionEditor() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header>...</header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-56">...</div>

        {/* Right content - progression editor */}
        <div className="flex-1 progression-editor-content">
          {/* Encoders */}
          {/* ATOM SQ pads */}
          {/* ProgressionStrip */}
        </div>
      </div>

      {/* Expandable timeline at bottom */}
      <LoopTimeline />
    </div>
  );
}
```

---

## 🎯 User Workflows

### Workflow 1: Building a Song Structure
1. Start in **Normal mode**
2. Drag sections from pattern library
3. Press **T** to expand when you want to see chord details
4. Press **Shift+T** for fullscreen when arranging 10+ sections
5. Press **Esc** to return to editing

### Workflow 2: Quick Timeline Reference
1. Keep timeline **Collapsed** while editing chords
2. Drag handle up briefly to check song structure
3. Release to snap back to Collapsed

### Workflow 3: Detailed Arrangement
1. Expand to **Fullscreen**
2. See all sections in grid layout
3. Drag-drop to reorder
4. See full chord progressions inline
5. Click backdrop or press Esc when done

---

## 🎨 Styling Details

### Warm Analog Aesthetic
- **Paper texture** on timeline cards (subtle SVG noise)
- **Amber glow** on playhead and hover states
- **Studio lighting** gradient (top-lit cylinder effect)
- **Brushed metal** playhead with warm reflection

### Animation Timing
```css
Height transitions:     0.4s cubic-bezier(0.4, 0, 0.2, 1)
Opacity fades:          0.3s ease
Hover brightening:      0.2s ease
Drag handle feedback:   Instant
```

---

## 🚀 Advanced Features (Future)

- [ ] **Remember last mode** per session (localStorage)
- [ ] **Snap to section boundaries** when scrolling
- [ ] **Minimize to tab** in expanded mode
- [ ] **Picture-in-picture** timeline while editing
- [ ] **Split view** (timeline + progression side-by-side)

---

## 🎹 Integration with ATOM SQ

The timeline respects hardware workflows:

- **Upper pads (52-67)**: Still control slots in ProgressionEditor
- **Touch strip**: Controls timeline zoom level
- **Shift + pad**: Jump to section in timeline
- **Bank buttons**: Cycle through timeline modes

Hardware users get the best of both worlds: quick slot editing + visual timeline overview.

---

## 📊 Summary

| Feature | Benefit |
|---------|---------|
| **4 size modes** | Adapt to task (editing vs arranging) |
| **Drag to resize** | Custom heights between presets |
| **Auto-snap** | Quick preset alignment |
| **Keyboard shortcuts** | Fast mode switching (T, Shift+T) |
| **Progressive disclosure** | More detail in expanded modes |
| **Fullscreen overlay** | Distraction-free arranging |
| **Warm analog styling** | Beautiful, tactile interface |

The expandable timeline gives you **maximum flexibility** - work in compact mode while editing individual chords, then pull it up for a complete song overview when arranging sections.
