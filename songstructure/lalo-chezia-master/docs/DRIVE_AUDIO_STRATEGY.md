# Google Drive Audio Strategy

Goal: keep large audio out of git, but make every audio artifact discoverable from the repo.

## Core Rule

1. Audio binaries live in Google Drive.
2. Git stores:
   - project/session metadata,
   - exact Drive paths,
   - version logs and decisions.

## Drive Folder Layout

Top folder:

`Lalo-Chezia-Audio/`

Per song:

`Lalo-Chezia-Audio/NN_song_slug/`

Per stage:

- `00_session_exports/` (quick refs while creating)
- `01_tracking/` (raw takes, comp sources)
- `02_edits/` (cleaned/edit passes)
- `03_mix_prints/` (mix revisions)
- `04_stems/` (deliverable stems)
- `05_master_prints/` (final masters)

## File Naming Standard

`NN_song_slug_<artifact>_vNN_YYYY-MM-DD.<ext>`

Examples:

- `07_rise_of_neon_dawn_refmix_v03_2026-02-20.wav`
- `07_rise_of_neon_dawn_vocal_comp_v02_2026-02-20.wav`
- `07_rise_of_neon_dawn_stems_v01_2026-03-01.zip`

## Recall Strategy (Git <-> Drive)

1. Update `docs/drive/INDEX.csv` whenever new major audio files are uploaded.
2. Log each creative session in `docs/session_logs/YYYY-MM-DD.md`.
3. Include:
   - branch name,
   - song slug,
   - brief change note,
   - Drive path,
   - version (`vNN`).

This gives two-way lookup:
- from commit -> find corresponding audio in Drive,
- from Drive file -> find context in git logs/session notes.

## Upload SOP

1. Render/export from REAPER.
2. Rename using naming standard before upload.
3. Upload to correct stage folder.
4. Append row in `docs/drive/INDEX.csv`.
5. Add brief session log entry.
6. Commit metadata updates in git.

## Milestone Snapshot Rule

At each milestone (`arrange-v1`, `track-v1`, `mix-v1`):

1. Tag git commit.
2. Create matching Drive folder:
   - `Lalo-Chezia-Audio/_milestones/<tag>/`
3. Copy approved reference prints into milestone folder.
4. Add entries to `docs/drive/INDEX.csv` with that tag in `git_ref`.
