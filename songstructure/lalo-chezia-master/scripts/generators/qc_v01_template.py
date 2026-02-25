#!/usr/bin/env python3
"""QC checks for the Static Bloom v01 template."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = REPO_ROOT / "reaper" / "templates" / "lalo_standard_v01.rpp"

REQUIRED_NAMES = [
    "00_REF",
    "10_DRUMS",
    "20_BASS",
    "30_HARMONY",
    "40_LEADS",
    "50_VOX",
    "60_FX_PRINTS",
    "70_EDIT_BUILDER",
    "80_BUSES",
    "90_MIX_PRINT",
    "arr_chords_scaffold",
    "arr_drums_scaffold",
    "BUS_DRUM",
    "BUS_BASS",
    "BUS_MUSIC",
    "BUS_VOX",
    "BUS_FX",
    "BUS_PARALLEL",
    "BUS_PREMASTER",
    "mix_print_check",
]

LEGACY_TOKENS = [
    "GLOBAL_AUTO",
    "MASTER_PAN",
    "MASTER_MUTE",
    "MASTER_BYPASS",
    "MASTER_MIXENV",
    "MASTER_STEREOOUT",
]


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    sys.exit(1)


def main() -> int:
    if not TEMPLATE.exists():
        fail(f"Missing template file: {TEMPLATE}")

    text = TEMPLATE.read_text(encoding="utf-8")

    for token in LEGACY_TOKENS:
        if token in text:
            fail(f"Found unsupported token in template: {token}")

    for name in REQUIRED_NAMES:
        if f'NAME "{name}"' not in text:
            fail(f"Missing required track/folder name: {name}")

    markers = re.findall(r"^\s*MARKER\s+\d+\s+", text, flags=re.MULTILINE)
    if len(markers) < 7:
        fail(f"Expected at least 7 section markers, found {len(markers)}")

    # Routing sanity checks for contract buses.
    lines = text.splitlines()

    def get_track_chunks() -> dict[str, str]:
        chunks: dict[str, str] = {}
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
                            break
                    i += 1
                chunk_lines = lines[start : i + 1]
                chunk = "\n".join(chunk_lines)
                name_match = re.search(r'^\s*NAME "(.*?)"', chunk, flags=re.MULTILINE)
                if name_match:
                    chunks[name_match.group(1)] = chunk
            i += 1
        return chunks

    track_chunks = get_track_chunks()

    def require_aux(bus_name: str, minimum: int) -> None:
        chunk = track_chunks.get(bus_name)
        if not chunk:
            fail(f"Missing track chunk for {bus_name}")
        aux_count = len(re.findall(r"^\s*AUXRECV ", chunk, flags=re.MULTILINE))
        if aux_count < minimum:
            fail(f"{bus_name} expected >= {minimum} AUXRECV entries, found {aux_count}")

    require_aux("BUS_DRUM", 1)
    require_aux("BUS_BASS", 1)
    require_aux("BUS_MUSIC", 1)
    require_aux("BUS_VOX", 1)
    require_aux("BUS_FX", 1)
    require_aux("BUS_PREMASTER", 5)

    print("OK: v01 template QC passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
