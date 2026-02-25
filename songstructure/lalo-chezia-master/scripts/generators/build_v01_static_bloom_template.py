#!/usr/bin/env python3
"""Build the v01 core-balanced template and apply it to Static Bloom."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_RPP = REPO_ROOT / "reaper" / "01_Static_Bloom.rpp"
TEMPLATE_DIR = REPO_ROOT / "reaper" / "templates"
TEMPLATE_RPP = TEMPLATE_DIR / "lalo_standard_v01.rpp"
PILOT_TEMPLATE_RPP = REPO_ROOT / "reaper" / "01_Static_Bloom.v01_template.rpp"
PILOT_ACTIVE_RPP = REPO_ROOT / "reaper" / "01_Static_Bloom.rpp"


@dataclass
class TrackSpec:
    name: str
    kind: str = "normal"  # parent, normal, end
    mainsend: int = 1
    fxchain: bool = False
    mute: int = 0
    source_group: str | None = None
    is_bus: bool = False
    chunk: str | None = None
    auxrecv_from: list[str] = field(default_factory=list)


def new_guid() -> str:
    return str(uuid.uuid4()).upper()


def split_project(text: str) -> tuple[list[str], list[str], list[str]]:
    lines = text.splitlines()
    track_ranges: list[tuple[int, int]] = []
    i = 0
    while i < len(lines):
        if lines[i].startswith("  <TRACK "):
            start = i
            depth = 1
            i += 1
            while i < len(lines):
                s = lines[i].strip()
                if s.startswith("<"):
                    depth += 1
                elif s == ">":
                    depth -= 1
                    if depth == 0:
                        track_ranges.append((start, i))
                        break
                i += 1
        i += 1

    if not track_ranges:
        raise RuntimeError("No TRACK chunks found in source RPP")

    first_start = track_ranges[0][0]
    last_end = track_ranges[-1][1]
    header = lines[:first_start]
    tracks = ["\n".join(lines[s : e + 1]) for s, e in track_ranges]
    footer = lines[last_end + 1 :]
    return header, tracks, footer


def folder_tokens(kind: str) -> tuple[str, str]:
    if kind == "parent":
        return "1 1", "2 1 0 0 0"
    if kind == "end":
        return "2 -1", "0 0 0 0 0"
    return "0 0", "0 0 0 0 0"


def make_track_chunk(spec: TrackSpec, auxrecv_lines: list[str]) -> str:
    isbus, buscomp = folder_tokens(spec.kind)
    track_guid = new_guid()
    lines = [
        f"  <TRACK {{{track_guid}}}",
        f'    NAME "{spec.name}"',
        "    PEAKCOL 33554431",
        "    BEAT -1",
        "    AUTOMODE 0",
        f"    MUTESOLO {spec.mute} 0 0",
        "    IPHASE 0",
        "    PLAYOFFS 0 1",
        f"    ISBUS {isbus}",
        f"    BUSCOMP {buscomp}",
        "    SHOWINMIX 1 0.6667 0.5 1 0.5 0 0 0",
        "    SEL 0",
        "    REC 0 0 1 0 0 0 0",
        "    VU 2",
        "    TRACKHEIGHT 0 0 0 0 0 0",
        "    INQ 0 0 0 0.5 100 0 0 100",
        "    NCHAN 2",
        f"    FX {1 if spec.fxchain else 0}",
        f"    TRACKID {{{new_guid()}}}",
        "    PERF 0",
        "    MIDIOUT -1",
    ]
    lines.extend(auxrecv_lines)
    lines.append(f"    MAINSEND {spec.mainsend} 0")
    if spec.fxchain:
        lines.extend(
            [
                "    <FXCHAIN",
                "      SHOW 0",
                "      LASTSEL 0",
                "      DOCKED 0",
                "    >",
            ]
        )
    lines.append("  >")
    return "\n".join(lines)


def tweak_scaffold_chunk(chunk: str, name: str, kind: str) -> str:
    chunk = re.sub(r'NAME ".*?"', f'NAME "{name}"', chunk, count=1)
    chunk = re.sub(r"MUTESOLO \d+ 0 0", "MUTESOLO 1 0 0", chunk, count=1)
    isbus, buscomp = folder_tokens(kind)
    chunk = re.sub(r"ISBUS .*", f"ISBUS {isbus}", chunk, count=1)
    chunk = re.sub(r"BUSCOMP .*", f"BUSCOMP {buscomp}", chunk, count=1)
    chunk = re.sub(r"MAINSEND \d+ 0", "MAINSEND 1 0", chunk, count=1)
    return chunk


def build_track_specs(scaffold_tracks: list[str]) -> list[TrackSpec]:
    specs: list[TrackSpec] = []

    def add_folder(folder: str, children: list[TrackSpec]) -> None:
        specs.append(TrackSpec(name=folder, kind="parent", mainsend=0))
        for idx, child in enumerate(children):
            child.kind = "end" if idx == len(children) - 1 else "normal"
            specs.append(child)

    add_folder(
        "00_REF",
        [
            TrackSpec("ref_mix_a", mainsend=1),
            TrackSpec("ref_mix_b", mainsend=1),
        ],
    )
    add_folder(
        "10_DRUMS",
        [
            TrackSpec("drm_kick", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_snare", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_hats", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_toms", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_oh", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_room", mainsend=1, fxchain=True, source_group="drums"),
            TrackSpec("drm_perc", mainsend=1, fxchain=True, source_group="drums"),
        ],
    )
    add_folder(
        "20_BASS",
        [
            TrackSpec("bas_di", mainsend=1, fxchain=True, source_group="bass"),
            TrackSpec("bas_amp", mainsend=1, fxchain=True, source_group="bass"),
            TrackSpec("bas_synth", mainsend=1, fxchain=True, source_group="bass"),
        ],
    )
    add_folder(
        "30_HARMONY",
        [
            TrackSpec("gtr_rhythm_l", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("gtr_rhythm_r", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("keys_main", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("syn_pad", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("syn_arp", mainsend=1, fxchain=True, source_group="music"),
        ],
    )
    add_folder(
        "40_LEADS",
        [
            TrackSpec("gtr_lead", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("syn_lead", mainsend=1, fxchain=True, source_group="music"),
            TrackSpec("inst_lead_alt", mainsend=1, fxchain=True, source_group="music"),
        ],
    )
    add_folder(
        "50_VOX",
        [
            TrackSpec("vox_lead_main", mainsend=1, fxchain=True, source_group="vox"),
            TrackSpec("vox_double", mainsend=1, fxchain=True, source_group="vox"),
            TrackSpec("vox_bgv_l", mainsend=1, fxchain=True, source_group="vox"),
            TrackSpec("vox_bgv_r", mainsend=1, fxchain=True, source_group="vox"),
            TrackSpec("vox_adlib", mainsend=1, fxchain=True, source_group="vox"),
        ],
    )
    add_folder(
        "60_FX_PRINTS",
        [
            TrackSpec("fx_riser", mainsend=1, fxchain=True, source_group="fx"),
            TrackSpec("fx_downer", mainsend=1, fxchain=True, source_group="fx"),
            TrackSpec("fx_impact", mainsend=1, fxchain=True, source_group="fx"),
            TrackSpec("fx_transitions", mainsend=1, fxchain=True, source_group="fx"),
        ],
    )

    scaffold_chords = tweak_scaffold_chunk(scaffold_tracks[0], "arr_chords_scaffold", "normal")
    scaffold_drums = tweak_scaffold_chunk(scaffold_tracks[1], "arr_drums_scaffold", "end")
    add_folder(
        "70_EDIT_BUILDER",
        [
            TrackSpec("edit_midi_builder", mainsend=1, fxchain=False),
            TrackSpec("edit_audio_builder", mainsend=1, fxchain=False),
            TrackSpec("arr_chords_scaffold", mainsend=1, fxchain=True, source_group="music", chunk=scaffold_chords),
            TrackSpec("arr_drums_scaffold", mainsend=1, fxchain=True, source_group="drums", chunk=scaffold_drums),
        ],
    )
    add_folder(
        "80_BUSES",
        [
            TrackSpec("BUS_DRUM", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_BASS", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_MUSIC", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_VOX", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_FX", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_PARALLEL", mainsend=0, fxchain=True, is_bus=True),
            TrackSpec("BUS_PREMASTER", mainsend=1, fxchain=True, is_bus=True),
        ],
    )
    add_folder(
        "90_MIX_PRINT",
        [
            TrackSpec("mix_print_check", mainsend=0, fxchain=True),
        ],
    )

    return specs


def add_routing(specs: list[TrackSpec]) -> None:
    name_to_index = {s.name: idx for idx, s in enumerate(specs)}
    group_sources: dict[str, list[str]] = {"drums": [], "bass": [], "music": [], "vox": [], "fx": []}
    for spec in specs:
        if spec.source_group:
            group_sources[spec.source_group].append(spec.name)

    bus_map = {
        "BUS_DRUM": group_sources["drums"],
        "BUS_BASS": group_sources["bass"],
        "BUS_MUSIC": group_sources["music"],
        "BUS_VOX": group_sources["vox"],
        "BUS_FX": group_sources["fx"],
        "BUS_PREMASTER": ["BUS_DRUM", "BUS_BASS", "BUS_MUSIC", "BUS_VOX", "BUS_FX", "BUS_PARALLEL"],
        "mix_print_check": ["BUS_PREMASTER"],
    }

    for spec in specs:
        inputs = bus_map.get(spec.name, [])
        spec.auxrecv_from = [src for src in inputs if src in name_to_index]


def emit_project(header: list[str], footer: list[str], specs: list[TrackSpec]) -> str:
    name_to_index = {s.name: idx for idx, s in enumerate(specs)}

    track_chunks = []
    for spec in specs:
        if spec.chunk:
            track_chunks.append(spec.chunk)
            continue
        aux_lines = []
        for src in spec.auxrecv_from:
            src_idx = name_to_index[src]
            aux_lines.append(f"    AUXRECV {src_idx} 0 1 0 0 0 0 0 1 -1:U 0 -1 ''")
        track_chunks.append(make_track_chunk(spec, aux_lines))

    full = []
    full.extend(header)
    full.extend(track_chunks)
    full.extend(footer)
    return "\n".join(full) + "\n"


def main() -> None:
    src_text = SOURCE_RPP.read_text(encoding="utf-8")
    header, tracks, footer = split_project(src_text)
    if len(tracks) < 2:
        raise RuntimeError("Expected at least two scaffold tracks in source RPP")

    scaffolds = tracks[:2]
    specs = build_track_specs(scaffolds)
    add_routing(specs)
    out_text = emit_project(header, footer, specs)

    TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
    TEMPLATE_RPP.write_text(out_text, encoding="utf-8")
    PILOT_TEMPLATE_RPP.write_text(out_text, encoding="utf-8")
    PILOT_ACTIVE_RPP.write_text(out_text, encoding="utf-8")

    print(f"wrote {TEMPLATE_RPP}")
    print(f"wrote {PILOT_TEMPLATE_RPP}")
    print(f"wrote {PILOT_ACTIVE_RPP}")


if __name__ == "__main__":
    main()
