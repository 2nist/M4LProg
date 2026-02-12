# Timeline Sync and Looping Fixes

Date: 2026-02-12

## Scope
This update focused on footer timeline playback smoothness/loop continuity and matching top-header timeline behavior.

## Key Changes

### Footer timeline (`src/components/ProgressionEditor/LoopTimeline.tsx`)
- Fixed section visual width/beat rendering to include `repeats`, aligning visual cards with playhead math.
- Removed legacy buffer-card loop content from active cycle rendering to avoid projection conflicts.
- Reworked loop architecture to use repeated cycle windows (`prev/middle/next`) with song-start markers.
- Replaced stop/start auto-scroll behavior with a continuous RAF-driven scroll loop.
- Added beat unwrap logic for loop resets so transport wrap does not cause backward snap.
- Added tempo-based per-frame beat prediction for smoother motion between transport updates.
- Added PLL-style transport correction:
  - gradual phase correction (`TRANSPORT_CORRECTION_ALPHA`)
  - hard snap threshold for large discontinuities (`TRANSPORT_HARD_SNAP_BEATS`)
- Removed cumulative drift sources (feedback/bias and recenter correction paths that introduced long-run jitter).
- Updated loop projection math to spread buffer-progress across loop phase so transition at loop boundary is continuous.
- Made bar/beat display use active section time-signature context instead of fixed 4/4-only logic.
- Replaced static `00:00` with real transport time display derived from beat + tempo.

### Header timeline (`src/components/App.tsx`)
- Replaced raw beat-only header motion with the same prediction/correction style used by footer.
- Added tempo-driven frame prediction + gentle phase correction to reduce jitter.
- Keeps header timeline motion visually consistent with footer playback behavior.

### Shared playhead behavior (`src/hooks/usePlayheadSync.ts`)
- Updated offline/mock playhead behavior to use shared module-level state so multiple consumers stay in sync.

### Styling and structure
- Header glass/timeline layers and footer timeline CSS were aligned to support continuous cycle rendering.
- Added/used invisible cycle markers for deterministic projection calculations.

## Result
- Loop boundaries no longer hard-jump backward.
- Playback motion is significantly smoother and less lurchy.
- Header and footer timeline motion are now behaviorally aligned.

## Notes
- Repository currently contains unrelated pre-existing TypeScript issues outside this scope.
- These timeline changes were kept isolated from unrelated modified files in the worktree.
