# Project Strategy

## Phases

1. Arrange: lock song structures, key, BPM, and transitions.
2. Track: record final performances against frozen arrangement snapshots.
3. Edit: comp, timing, cleanup, and tuning.
4. Mix: level, space, tone, automation, and revision rounds.
5. Master: final sequence, loudness, and delivery formats.

## Versioning

1. `main`: milestone-only merges.
2. `arrange`, `track`, `mix`: active phase branches.
3. `song/<nn_slug>`: focused song branches for deep changes.
4. Tags at major handoffs: `arrange-v1`, `track-v1`, `mix-v1`.

## Session Rules

1. Keep `.rpp` and `.mid` in git; keep renders out of git.
2. After arrangement freeze, treat REAPER-saved `.rpp` as source of truth.
3. Use `make_rpp.py` only when arrangement-spec regeneration is needed.
4. Use consistent song numbering prefixes (`01_...14_...`) everywhere.
5. Record one change per commit with clear scope in the message.
6. Run `python scripts/generators/validate_catalog.py` before merging.
7. Follow `docs/SOP.md` for daily working cadence.
8. Track Drive audio artifacts in `docs/drive/INDEX.csv`.

## Operating Docs

1. `docs/SOP.md`: daily creative workflow and commit rhythm.
2. `docs/DRIVE_AUDIO_STRATEGY.md`: Drive foldering, naming, and recall strategy.
3. `docs/REGENERATION_POLICY.md`: regeneration vs keep/prune rules.
4. `docs/REAPER_STANDARD.md`: standard track list/routing/fx conventions.
5. `docs/session_logs/`: chronological production notes.
