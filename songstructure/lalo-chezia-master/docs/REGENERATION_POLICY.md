# RPP Regeneration Policy

This defines what gets regenerated, what is preserved, and what should be pruned.

## Modes

1. `spec-regenerate` (pre-freeze):
   - Source: `scripts/generators/make_rpp.py`
   - Purpose: refresh arrangement scaffolds.
2. `manual-evolve` (post-freeze):
   - Source: REAPER-saved `.rpp`
   - Purpose: real production work (recording/edit/mix).

## Regenerate vs Keep Matrix

Regenerate from script:

1. Section order and lengths.
2. Chord progressions in arrangement scaffold.
3. Marker/region structure.
4. Baseline MIDI placeholders.

Keep from current `.rpp` (do not overwrite casually):

1. Recorded media items.
2. Comping edits and item timing moves.
3. FX chains and automation.
4. Routing, buses, folder structure for production.
5. Track-level gain staging and sends.

## Prune Rules

Prune before committing:

1. Temporary REAPER files: `*.rpp-bak`, `*.rpp.autosave`, `*.reapeaks`.
2. Unused duplicate tracks with names ending `_tmp`, `_old`, `_print_test`.
3. Placeholder MIDI tracks that have been replaced by final performance tracks.
4. Obsolete test regions/markers not tied to arrangement decisions.

Do not prune:

1. Alternate takes needed for decisions.
2. Revision reference tracks used for A/B comparisons.

## Safe Regeneration Workflow

1. Duplicate song branch from latest `main` or phase branch.
2. Backup current song project:
   - `reaper/NN_song_slug.pre_regen.rpp`
3. Regenerate scaffold:
   - `python scripts/generators/make_rpp.py`
4. Re-apply standard template architecture for the pilot/base:
   - `python scripts/generators/build_v01_static_bloom_template.py`
5. Compare and manually port only intended arrangement changes.
6. Validate:
   - `python scripts/generators/qc_v01_template.py`
7. Delete backup only after validation.

## Commit Labels

1. `regen:` for script-driven arrangement regeneration.
2. `edit:` for REAPER manual production edits.
3. `prune:` for cleanup-only commits.
