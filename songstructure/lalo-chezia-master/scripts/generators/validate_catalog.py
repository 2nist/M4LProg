#!/usr/bin/env python3
"""Validate expected album file coverage for MIDI and REAPER projects."""

from pathlib import Path
import sys


EXPECTED_RPP = [
    "01_Static_Bloom.rpp",
    "02_Skywritting.rpp",
    "03_Twin_Fish.rpp",
    "04_Binary_Heart.rpp",
    "05_Electric_Pickle.rpp",
    "06_Kaleidoscope_Mind.rpp",
    "07_Rise_of_Neon_Dawn.rpp",
    "08_Whispers_at_a_Void.rpp",
    "09_Oddysea.rpp",
    "10_Echoes_in_the_Static.rpp",
    "11_Foul_Beast.rpp",
    "12_The_Somnium_Shift.rpp",
    "13_Benson_and_Hedges.rpp",
    "14_Politician.rpp",
]

EXPECTED_MIDI = [
    "static_bloom_chords.mid",
    "static_bloom_drums.mid",
    "skywritting_chords.mid",
    "skywritting_drums.mid",
    "03_twin_fish_chords.mid",
    "03_twin_fish_drums.mid",
    "04_binary_heart_chords.mid",
    "04_binary_heart_drums.mid",
    "05_electric_pickle_chords.mid",
    "05_electric_pickle_drums.mid",
    "06_kaleidoscope_mind_chords.mid",
    "06_kaleidoscope_mind_drums.mid",
    "07_rise_of_neon_dawn_chords.mid",
    "07_rise_of_neon_dawn_drums.mid",
    "08_whispers_at_a_void_chords.mid",
    "08_whispers_at_a_void_drums.mid",
    "09_oddysea_chords.mid",
    "09_oddysea_drums.mid",
    "10_echoes_in_the_static_chords.mid",
    "10_echoes_in_the_static_drums.mid",
    "11_foul_beast_chords.mid",
    "11_foul_beast_drums.mid",
    "12_the_somnium_shift_chords.mid",
    "12_the_somnium_shift_drums.mid",
    "13_benson_and_hedges_chords.mid",
    "13_benson_and_hedges_drums.mid",
    "14_politician_chords.mid",
    "14_politician_drums.mid",
]


def check_files(root: Path, folder: str, expected: list[str]) -> list[str]:
    target = root / folder
    missing = []
    for name in expected:
        if not (target / name).exists():
            missing.append(f"{folder}/{name}")
    return missing


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    missing = []
    missing.extend(check_files(repo_root, "reaper", EXPECTED_RPP))
    missing.extend(check_files(repo_root, "midi", EXPECTED_MIDI))

    if missing:
        print("Missing files:")
        for item in missing:
            print(f"  - {item}")
        return 1

    print("OK: Catalog has all expected REAPER and MIDI files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
