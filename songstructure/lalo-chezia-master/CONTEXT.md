# CONTEXT.md — lalo-chezia

> Read this first in any new coding session.

---

## What This Is

Album production repo. Working title: **Lunar Static**. 14-song LP.  
Repo: https://github.com/2nist/lalo-chezia.git

Operational docs:

- `docs/SOP.md`
- `docs/DRIVE_AUDIO_STRATEGY.md`
- `docs/PROJECT_STRATEGY.md`
- `docs/REGENERATION_POLICY.md`
- `docs/REAPER_STANDARD.md`

---

## Source of Truth

1. **Google Drive** — arrangement docs (prose)  
   https://drive.google.com/drive/folders/1ajenAZRFy4m1IqP9KMQl-dYnh_3rPIVf

2. **`scripts/generators/make_rpp.py`** — code representation of all arrangements.  
   Each song defined as a list of `S()` calls. Regenerate any time.

---

## Scripts

| Script | What it does | Run |
|--------|-------------|-----|
| `scripts/generators/make_rpp.py` | Generates all 14 `.rpp` files → `reaper/` | `python scripts/generators/make_rpp.py` |
| `scripts/generators/validate_catalog.py` | Verifies expected `.rpp` + `.mid` inventory exists | `python scripts/generators/validate_catalog.py` |
| `scripts/generators/build_v01_static_bloom_template.py` | Builds/applies standardized v01 template for `01_Static_Bloom` | `python scripts/generators/build_v01_static_bloom_template.py` |
| `scripts/generators/qc_v01_template.py` | Validates v01 template naming/routing/marker contract | `python scripts/generators/qc_v01_template.py` |

---

## S() Format

```python
S(name, bars, chord_progression, beats_per_chord, drum_pattern, velocity, ts_numerator, ts_den_power)
```

**Drum patterns:** `none` `kick_only` `standard` `half_time` `driving`  
`bridge_sparse` `intense` `dnb` `78` `68` `54`

Chord voicings live in the `V` dict in `make_rpp.py` — add new ones there.

---

## Branching

- `main` — milestone commits only
- `arrange` — active arrangement work  
- `song/[name]` — per-song deep edits
- `mix-v1`, `mix-v2` — pre-mix snapshots

---

## Current State (Feb 2026)

- ✅ All 14 arrangements documented in Google Drive
- ✅ `.rpp` files generated for all 14 songs
- ✅ `.mid` files generated for all 14 songs
- 🔄 RPP files being tested in REAPER
- ⬜ Tracking not started
- ⬜ `reaper-toolkit` repo not yet created
- ✅ Legacy planning docs normalized under `docs/source_material/`

---

## What Lives Where

| Thing | Location |
|-------|----------|
| General JSFX effects | reaper-toolkit repo |
| Arrangement/chord tools | reaper-toolkit repo |
| Album-specific JSFX | `scripts/reaper/` |
| Rendered audio | Google Drive (not git) |
| Stems / masters | Google Drive + Git LFS (TBD) |
| Drive file index | `docs/drive/INDEX.csv` |
| Session notes | `docs/session_logs/` |
