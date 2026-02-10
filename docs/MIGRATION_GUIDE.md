# Migration Guide - Porting M4L to Electron

This guide shows how to port the remaining M4L JavaScript files to TypeScript using VS Code + Copilot.

## ✅ Completed

- [x] **Music_Theory_Engine.js** → `src/services/musicTheory/MusicTheoryEngine.ts`
  - All core chord functions ported
  - Proper TypeScript types added
  - Tested and working

- [x] **Type Definitions** created:
  - `src/types/chord.ts`
  - `src/types/pattern.ts`
  - `src/types/progression.ts`

## 🚧 Next: Progression_Manager.js

### Reference File
`docs/reference/Progression_Manager.js`

### Destination
`src/services/progression/ProgressionManager.ts`

### Porting Steps with Copilot

1. **Open split view in VS Code:**
   - Left: `docs/reference/Progression_Manager.js` (reference)
   - Right: `src/services/progression/ProgressionManager.ts` (new file)

2. **Start with imports:**
```typescript
/**
 * Progression Manager
 * Manages song sections, progressions, and pattern detection
 * 
 * Ported from: docs/reference/Progression_Manager.js
 */

import { Pattern, DetectedPattern, ApplyPatternOptions } from '@types/pattern';
import { Section, ProgressionSnapshot, TransitionConfig } from '@types/progression';
import { Chord, Progression } from '@types/chord';
import * as MusicTheory from '@services/musicTheory/MusicTheoryEngine';

// Copilot will start suggesting based on the reference file...
```

3. **Copy constants, Copilot will type them:**
```typescript
// From reference file, type this comment:
// Default pattern definitions

// Copilot suggests:
const DEFAULT_PATTERNS: Pattern[] = [
  // Copilot fills in from reference...
];
```

4. **Port functions one by one:**
   - Type the function signature with types
   - Let Copilot suggest the implementation
   - Verify against reference file

Example:
```typescript
// Type this:
export function detectPatterns(
  progression: Progression,
  keyRoot: number
): DetectedPattern[] {
  // Copilot suggests implementation based on reference
```

### Key Changes from JS to TS

**Before (JS):**
```javascript
function detectPatterns(progression, keyRoot) {
    if (!Array.isArray(progression) || progression.length === 0) {
        return [];
    }
    // ...
}
```

**After (TS):**
```typescript
export function detectPatterns(
  progression: Progression,
  keyRoot: number
): DetectedPattern[] {
  if (!progression || progression.length === 0) {
    return [];
  }
  // ...
}
```

### Testing the Port

Create `src/services/progression/ProgressionManager.test.ts`:
```typescript
import { detectPatterns, applyPattern } from './ProgressionManager';

// Test with known progression
const testProgression = [
  { notes: [60, 64, 67], duration: 4 },  // C Major
  { notes: [67, 71, 74], duration: 4 },  // G Major
  // ...
];

const detected = detectPatterns(testProgression, 60);
console.log('Detected patterns:', detected);
```

## 🚧 After Progression Manager: Hardware_Bridge.js

### Reference File
`docs/reference/Hardware_Bridge.js`

### Destination
`src/services/hardware/AtomSqService.ts`

### Key Concepts

1. **SysEx Format** - Already documented in reference file
2. **Native Mode Handshake** - Port to Web MIDI API
3. **Display Updates** - Format messages for ATOM SQ LCD

### Porting Strategy

Since this uses MIDI, we'll use **Web MIDI API** instead of Max's `midiout`:

```typescript
// Before (Max):
max.outlet("midi", ...NATIVE_MODE_HANDSHAKE);

// After (Web MIDI):
export class AtomSqService {
  private midiOutput: MIDIOutput | null = null;
  
  async initialize() {
    const access = await navigator.requestMIDIAccess();
    // Find ATOM SQ output...
  }
  
  sendNativeModeHandshake() {
    if (this.midiOutput) {
      this.midiOutput.send([0x8F, 0x00, 0x7F]);
    }
  }
}
```

## 🚧 M4L Helper Bridge

### When to Create This
After Electron app has:
- ✅ Progression editing working
- ✅ Pattern library functional
- ✅ OSC service implemented

### Minimal M4L Device Structure

```
ChordGen Bridge.amxd
├── udpreceive @port 9001
├── route /live/create_clip /live/transport ...
├── [js oscRouter.js]
└── [js clipCreator.js] (uses Ableton_LOM_Bridge.js patterns)
```

The M4L helper is ~200 lines total - just:
1. Receive OSC messages
2. Route to appropriate handler
3. Call Live API
4. Send confirmation back via OSC

## 💡 Copilot Tips

### Get Better Suggestions

**✅ DO:**
- Open reference file in split view
- Write detailed JSDoc comments
- Type function signatures completely
- Use semantic variable names

**❌ DON'T:**
- Copy-paste large blocks (let Copilot suggest)
- Use vague comments
- Skip type annotations

### Example: Good vs Bad

**Bad (vague):**
```typescript
// apply pattern
function apply(p, o) {
```

**Good (specific):**
```typescript
/**
 * Apply a chord pattern to create a progression
 * @param patternId - Pattern identifier to apply
 * @param options - Options for root, duration, voicing
 * @returns Generated chord progression
 */
export function applyPattern(
  patternId: string,
  options: ApplyPatternOptions
): Progression {
```

### Copilot Chat Commands

Use `/` commands in Copilot Chat:

```
@workspace /explain what does detectPatterns do in docs/reference/Progression_Manager.js

@workspace /convert the applyPattern function from Progression_Manager.js to TypeScript

@workspace /tests write tests for the ProgressionManager
```

## 📋 Complete Migration Checklist

### Phase 2: Progression Logic (Current)
- [ ] Port Progression_Manager.js
- [ ] Create ProgressionStore (Zustand)
- [ ] Build basic progression editor UI
- [ ] Test pattern detection

### Phase 3: Hardware Integration
- [ ] Port Hardware_Bridge.js
- [ ] Implement Web MIDI service
- [ ] Create ATOM SQ service
- [ ] Test display updates

### Phase 4: Live Integration
- [ ] Create OSC service (Electron)
- [ ] Build minimal M4L helper
- [ ] Test Electron → M4L communication
- [ ] Test clip creation in Live

### Phase 5: AI Integration
- [ ] Port Gemini request/response logic
- [ ] Create GeminiService
- [ ] Add AI suggestions UI
- [ ] Integrate with progression editor

### Phase 6: Polish
- [ ] MIDI export functionality
- [ ] Save/load progressions
- [ ] Settings panel
- [ ] Keyboard shortcuts
- [ ] Error handling
- [ ] Documentation

## 🎯 Current Priority

**Start with Progression_Manager.js** - This is the next logical step because:
1. ✅ Types are already defined
2. ✅ Music theory engine is ready
3. ✅ It has no external dependencies
4. ⭐ It's needed for the UI to be useful

Once ProgressionManager is ported, you can build a functional progression editor UI!

---

**Remember:** The original M4L code in `docs/reference/` is your safety net. Reference it anytime you need clarity on how something works.
