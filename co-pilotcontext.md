# ChordGen Pro - Copilot Context

## Project Overview
Converting M4L chord progression generator to Electron + React + TypeScript app.

## What's Already Done ✅
- Music Theory Engine (src/services/musicTheory/MusicTheoryEngine.ts)
- Progression Manager (src/services/progression/ProgressionManager.ts)
- State Management (src/stores/progressionStore.ts)
- Type Definitions (src/types/*.ts)
- Demo UI (src/components/ProgressionDemo.tsx)

## What's Next 🚧
- Enhanced UI components (ProgressionEditor, PatternLibrary)
- Hardware integration (ATOM SQ via Web MIDI)
- Live integration (OSC service + M4L helper)
- AI integration (Gemini API)

## Code Patterns

### Importing
```typescript
import { Chord, ChordQuality } from '@types/chord';
import * as MusicTheory from '@services/musicTheory/MusicTheoryEngine';
import { useProgressionStore } from '@stores/progressionStore';
```

### State Management
```typescript
// Use Zustand actions, not direct mutations
const { addChord, getCurrentSection } = useProgressionStore();
addChord(newChord); // ✅ Auto-persists
```

### Porting M4L Code
1. Open reference file in docs/reference/
2. Create new TypeScript file in appropriate src/ folder
3. Import required types from @types/
4. Convert to TypeScript with proper types
5. Replace Max dict with Zustand store
6. Replace Max MIDI with Web MIDI API (when porting hardware)

## Architecture
- Electron: UI, business logic, hardware I/O
- M4L Helper: ~200 lines, Live API access only
- OSC: Bidirectional communication
```

---

## ✅ **After Script Runs**

Your structure will look like:
```
C:\Users\CraftAuto-Sales\M4LProg\
├── .vscode\
│   ├── extensions.json  ✅
│   └── settings.json    ✅
├── docs\
│   ├── reference\       ← Put original .js files here
│   └── README.md
├── electron\
│   └── services\
├── src\
│   ├── components\      ← Put React components here
│   ├── services\        ← Put ported TypeScript logic here
│   ├── stores\          ← Put Zustand stores here
│   ├── types\           ← Put type definitions here
│   └── styles\
├── m4l-helper\
│   └── code\
├── .gitignore           ✅
└── setup-project.ps1    ← The script