# Production SOP

This SOP is designed for fast creative sessions with reliable recall.

## Source Of Truth

1. Pre-arrangement freeze: `scripts/generators/make_rpp.py` may be used to regenerate baseline `.rpp` files.
2. Post-arrangement freeze: REAPER-saved `.rpp` files are the source of truth.
3. Commit `.rpp` and intentional `.mid` updates to git; keep large audio in Google Drive.

## Session Cadence

1. Start session:
   - Pull latest branch.
   - Open target song project in `reaper/`.
   - Create a short intent note in `docs/session_logs/YYYY-MM-DD.md`.
2. During session:
   - Work freely in REAPER.
   - At each meaningful checkpoint, render a quick reference bounce to Google Drive.
   - Add one log line: what changed and where the bounce lives.
3. End session:
   - Save `.rpp` and any `.mid` updates.
   - Run `python scripts/generators/validate_catalog.py`.
   - Commit with scope-first message: `song-xx: <change>`.
   - Push branch.

## Commit Rhythm

1. One musical idea group per commit (arrangement, performance, mix move, etc.).
2. Use branch types:
   - `song/<nn_slug>` for focused song work.
   - `arrange`, `track`, `mix` for phase work.
3. Merge to `main` only at clear milestones.

## Naming Rules

1. Song slug format: `NN_song_slug`.
2. Version tag format for bounces/stems: `vNN` (e.g., `v03`).
3. Date format: `YYYY-MM-DD` only.

## Minimal Session Log Format

Create file: `docs/session_logs/YYYY-MM-DD.md`

Use this format:

```md
# YYYY-MM-DD

- Branch: song/07_rise_of_neon_dawn
- Focus: tighten chorus transition + vocal pocket
- Changes:
  - Adjusted chorus drum accents bars 65-81.
  - Nudged lead vocal items earlier by 12 ms.
- Drive:
  - Ref bounce: `07_rise_of_neon_dawn/v03/07_rise_of_neon_dawn_refmix_v03_2026-02-20.wav`
- Next:
  - Check low-end buildup at bridge.
```
