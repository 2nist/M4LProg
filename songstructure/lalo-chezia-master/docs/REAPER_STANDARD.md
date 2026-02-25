# REAPER Session Standard

This document defines the implemented v01 baseline template.

Canonical file:

- `reaper/templates/lalo_standard_v01.rpp`

Pilot files:

- `reaper/01_Static_Bloom.v01_template.rpp`
- `reaper/01_Static_Bloom.rpp`

## Build + QC

1. Build/apply v01 for Static Bloom:
   - `python scripts/generators/build_v01_static_bloom_template.py`
2. Run v01 quality checks:
   - `python scripts/generators/qc_v01_template.py`

## Top-Level Folder Order

1. `00_REF`
2. `10_DRUMS`
3. `20_BASS`
4. `30_HARMONY`
5. `40_LEADS`
6. `50_VOX`
7. `60_FX_PRINTS`
8. `70_EDIT_BUILDER`
9. `80_BUSES`
10. `90_MIX_PRINT`

## Core Tracks Per Folder

1. `00_REF`: `ref_mix_a`, `ref_mix_b`
2. `10_DRUMS`: `drm_kick`, `drm_snare`, `drm_hats`, `drm_toms`, `drm_oh`, `drm_room`, `drm_perc`
3. `20_BASS`: `bas_di`, `bas_amp`, `bas_synth`
4. `30_HARMONY`: `gtr_rhythm_l`, `gtr_rhythm_r`, `keys_main`, `syn_pad`, `syn_arp`
5. `40_LEADS`: `gtr_lead`, `syn_lead`, `inst_lead_alt`
6. `50_VOX`: `vox_lead_main`, `vox_double`, `vox_bgv_l`, `vox_bgv_r`, `vox_adlib`
7. `60_FX_PRINTS`: `fx_riser`, `fx_downer`, `fx_impact`, `fx_transitions`
8. `70_EDIT_BUILDER`: `edit_midi_builder`, `edit_audio_builder`, `arr_chords_scaffold`, `arr_drums_scaffold`
9. `80_BUSES`: `BUS_DRUM`, `BUS_BASS`, `BUS_MUSIC`, `BUS_VOX`, `BUS_FX`, `BUS_PARALLEL`, `BUS_PREMASTER`
10. `90_MIX_PRINT`: `mix_print_check`

## Routing Contract (Implemented)

The v01 template uses explicit `AUXRECV` routing in the `.rpp`:

1. `drm_* + arr_drums_scaffold -> BUS_DRUM`
2. `bas_* -> BUS_BASS`
3. `gtr_*, keys_*, syn_*, inst_lead_alt + arr_chords_scaffold -> BUS_MUSIC`
4. `vox_* -> BUS_VOX`
5. `fx_* -> BUS_FX`
6. `BUS_DRUM/BASS/MUSIC/VOX/FX/PARALLEL -> BUS_PREMASTER`
7. `BUS_PREMASTER -> Master`

## Marker + MIDI Compatibility

1. Marker/region map is preserved from generated scaffold.
2. `arr_chords_scaffold` and `arr_drums_scaffold` are preserved (muted/parked) inside `70_EDIT_BUILDER`.
3. Scaffold tracks are available for regeneration delta porting.

## Baseline FX Slots (Stock-Only Placeholder)

v01 uses stock-compatible empty `<FXCHAIN>` placeholders on source tracks and buses.

Intended slot order for loading stock plugins:

1. Source tracks: EQ -> Compression -> Saturation/Color -> Utility
2. Buses: Glue Compression -> Tone EQ -> Metering
3. Premaster: Metering -> Light Bus Compression -> Safety Limiter

No third-party plugins are required in v01.
