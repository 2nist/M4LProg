"""
Generates REAPER .rpp project files for all 14 Lunar Static songs.
Each file contains:
  - Correct BPM and time signature
  - Two tracks: Chords and Drums (kick/snare)
  - Named MIDI items per section placed at correct positions
  - Region markers at each section boundary
"""

import os
import argparse

# ── REAPER MIDI uses ticks. 960 PPQ (standard)
PPQ = 960

NOTE_NAMES = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,
              'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}

def nn(name, octave):
    return 12 * (octave + 1) + NOTE_NAMES[name]

def ch(*notes): return list(notes)

V = {
    'Am':    ch(nn('A',3),nn('C',4),nn('E',4)),
    'Am7':   ch(nn('A',3),nn('C',4),nn('E',4),nn('G',4)),
    'A':     ch(nn('A',3),nn('C#',4),nn('E',4)),
    'Bm':    ch(nn('B',3),nn('D',4),nn('F#',4)),
    'Bm7b5': ch(nn('B',3),nn('D',4),nn('F',4),nn('A',4)),
    'B':     ch(nn('B',3),nn('D#',4),nn('F#',4)),
    'C':     ch(nn('C',4),nn('E',4),nn('G',4)),
    'C#m':   ch(nn('C#',3),nn('E',3),nn('G#',3)),
    'C#m7':  ch(nn('C#',3),nn('E',3),nn('G#',3),nn('B',3)),
    'Cm':    ch(nn('C',3),nn('Eb',3),nn('G',3)),
    'D':     ch(nn('D',3),nn('F#',3),nn('A',3)),
    'Dm':    ch(nn('D',3),nn('F',3),nn('A',3)),
    'D7':    ch(nn('D',3),nn('F#',3),nn('A',3),nn('C',4)),
    'Db':    ch(nn('Db',3),nn('F',3),nn('Ab',3)),
    'Eb':    ch(nn('Eb',3),nn('G',3),nn('Bb',3)),
    'E':     ch(nn('E',3),nn('G#',3),nn('B',3)),
    'E7':    ch(nn('E',3),nn('G#',3),nn('B',3),nn('D',4)),
    'Em':    ch(nn('E',3),nn('G',3),nn('B',3)),
    'Emaj7': ch(nn('E',3),nn('G#',3),nn('B',3),nn('D#',4)),
    'F':     ch(nn('F',3),nn('A',3),nn('C',4)),
    'F#':    ch(nn('F#',3),nn('A#',3),nn('C#',4)),
    'F#7':   ch(nn('F#',3),nn('A#',3),nn('C#',4),nn('E',4)),
    'F#m':   ch(nn('F#',3),nn('A',3),nn('C#',4)),
    'Fmaj7': ch(nn('F',3),nn('A',3),nn('C',4),nn('E',4)),
    'Fm':    ch(nn('F',3),nn('Ab',3),nn('C',4)),
    'G':     ch(nn('G',3),nn('B',3),nn('D',4)),
    'Gm':    ch(nn('G',3),nn('Bb',3),nn('D',4)),
    'G#':    ch(nn('G#',3),nn('C',4),nn('D#',4)),
    'G#m':   ch(nn('G#',3),nn('B',3),nn('D#',4)),
    'Gmaj7': ch(nn('G',3),nn('B',3),nn('D',4),nn('F#',4)),
    'Ab':    ch(nn('Ab',3),nn('C',4),nn('Eb',4)),
    'Bb':    ch(nn('Bb',2),nn('D',3),nn('F',3)),
    'Bbm':   ch(nn('Bb',2),nn('Db',3),nn('F',3)),
    'Bmaj7': ch(nn('B',2),nn('D#',3),nn('F#',3),nn('A#',3)),
    'Bm7':   ch(nn('B',3),nn('D',4),nn('F#',4),nn('A',4)),
    'Am7':   ch(nn('A',3),nn('C',4),nn('E',4),nn('G',4)),
    'D7':    ch(nn('D',3),nn('F#',3),nn('A',3),nn('C',4)),
}

KICK=36; SNARE=38

def beats_to_secs(beats, bpm):
    return beats * 60.0 / bpm

def make_chord_events(prog, bpc, bars, bar_len, vel=80):
    """Returns list of (pitch, start_beat, dur_beats, velocity)"""
    events = []
    total = bars * bar_len
    b = 0.0; ci = 0
    while b < total - 0.01:
        chord_name = prog[ci % len(prog)]
        pitches = V.get(chord_name, [])
        dur = min(bpc, total - b) - 0.05
        for p in pitches:
            events.append((p, b, dur, vel))
        b += bpc; ci += 1
    return events

def make_drum_events(pattern, bars, bar_len):
    events = []
    for bar in range(bars):
        b = bar * bar_len
        if pattern == 'none': pass
        elif pattern == 'kick_only': events.append((KICK,b,0.35,90))
        elif pattern == 'standard':
            events+=[(KICK,b,0.35,100),(KICK,b+2,0.35,95),(SNARE,b+1,0.35,90),(SNARE,b+3,0.35,90)]
        elif pattern == 'driving':
            events+=[(KICK,b,0.35,105),(KICK,b+0.5,0.35,80),(KICK,b+2,0.35,100),(KICK,b+2.5,0.35,75),
                    (SNARE,b+1,0.35,95),(SNARE,b+3,0.35,95)]
        elif pattern == 'half_time':
            events+=[(KICK,b,0.35,90),(SNARE,b+2,0.35,80)]
        elif pattern == 'bridge_sparse':
            events+=[(KICK,b,0.35,85),(SNARE,b+2.5,0.35,75)]
        elif pattern == '78':
            events+=[(KICK,b,0.35,105),(KICK,b+2.5,0.35,90),(SNARE,b+1.5,0.35,95)]
        elif pattern == '68':
            events+=[(KICK,b,0.35,95),(SNARE,b+1.5,0.35,85)]
        elif pattern == '54':
            events+=[(KICK,b,0.35,100),(KICK,b+2,0.35,90),(SNARE,b+1,0.35,88),(SNARE,b+3,0.35,88)]
        elif pattern == 'intense':
            events+=[(KICK,b,0.35,110),(KICK,b+1,0.35,95),(KICK,b+2,0.35,105),(KICK,b+3,0.35,90),
                    (SNARE,b+1,0.35,100),(SNARE,b+3,0.35,100)]
        elif pattern == 'dnb':
            events+=[(KICK,b,0.35,110),(KICK,b+2.5,0.35,95),(SNARE,b+1.5,0.35,105)]
            if bar_len >= 4: events.append((SNARE,b+3.5,0.35,100))
    return events

def events_to_reaper_midi(events, clip_length_beats):
    """
    Convert note events to REAPER's inline MIDI format.
    REAPER MIDI events: E <tick_offset> <status> <note> <vel>
    Uses running tick offset from previous event.
    """
    # Build flat list of (tick, type, note, vel)
    # type: 9x = note on, 8x = note off
    flat = []
    for (pitch, start_b, dur_b, vel) in events:
        start_tick = int(round(start_b * PPQ))
        end_tick   = int(round((start_b + dur_b) * PPQ))
        flat.append((start_tick, 0x90, pitch, vel))
        flat.append((end_tick,   0x80, pitch, 0))

    # Add end-of-track marker
    end_tick = int(round(clip_length_beats * PPQ))
    flat.append((end_tick, 0xb0, 0x7b, 0))  # all notes off

    flat.sort(key=lambda x: (x[0], x[1]))

    lines = []
    prev_tick = 0
    for (tick, status, data1, data2) in flat:
        delta = tick - prev_tick
        lines.append(f'      E {delta} {status:02x} {data1:02x} {data2:02x}')
        prev_tick = tick

    return '\n'.join(lines)

def make_midi_item(name, position_secs, length_secs, events, clip_length_beats, color=0):
    """Generate a REAPER MIDI item block."""
    midi_data = events_to_reaper_midi(events, clip_length_beats)
    return f'''    <ITEM
      POSITION {position_secs:.6f}
      SNAPOFFS 0
      LENGTH {length_secs:.6f}
      LOOP 0
      ALLTAKES 0
      FADEIN 1 0 0 1 0 0 0
      FADEOUT 1 0 0 1 0 0 0
      MUTE 0 0
      SEL 0
      IGUID {{{generate_guid()}}}
      IID 1
      NAME "{name}"
      VOLPAN 1 0 1 -1
      SOFFS 0
      PLAYRATE 1 1 0 -1 0 0.0025
      CHANMODE 0
      GUID {{{generate_guid()}}}
      <SOURCE MIDI
        HASDATA 1 {PPQ} QN
        CCINTERP 32
        POOLEDEVTS {{{generate_guid()}}}
        LAST_REC_LAUNCHQUANT 0
{midi_data}
        CCEVT -1 0 0
      >
    >'''

import uuid
def generate_guid():
    return str(uuid.uuid4()).upper()

def make_track(name, color_r, color_g, color_b, items_text):
    color = color_r + (color_g << 8) + (color_b << 16) + 0x1000000
    return f'''  <TRACK {{{generate_guid()}}}
    NAME "{name}"
    PEAKCOL {color}
    BEAT -1
    AUTOMODE 0
    VOLPAN 1 0 0.6 -1
    MUTESOLO 0 0 0
    IPHASE 0
    PLAYOFFS 0 1
    ISBUS 0 0
    BUSCOMP 0 0 0 0 0
    SHOWINMIX 1 0.6667 0.5 1 0.5 0 0 0
    FREEMODE 0
    SEL 0
    REC 0 0 1 0 0 0 0
    VU 2
    TRACKHEIGHT 0 0 0 0 0 0
    INQ 0 0 0 0.5 100 0 0 100
    NCHAN 2
    FX 1
    TRACKID {{{generate_guid()}}}
    PERF 0
    MIDIOUT -1
    MAINSEND 1 0
{items_text}
  >'''

def make_regions(sections, starts_secs, bpm):
    """Generate REAPER region markers."""
    lines = []
    for i, (sec, start) in enumerate(zip(sections, starts_secs)):
        bar_len = sec['_bar_len']
        length_secs = sec['bars'] * bar_len * 60.0 / bpm
        end = start + length_secs
        region_id = i + 1
        lines.append(f'  MARKER {region_id} {start:.6f} "{sec["name"]}" 1 0 1 B {{{generate_guid()}}} 0')
    return '\n'.join(lines)

def build_rpp(output_dir, filename, song_title, bpm, sections):
    # Compute section start times in beats and seconds
    starts_beats = []
    cursor = 0.0
    for sec in sections:
        ts_den_pow = sec.get('ts_den_pow', 2)
        bar_len = sec['ts_num'] * (1.0 if ts_den_pow == 2 else 0.5)
        sec['_bar_len'] = bar_len
        starts_beats.append(cursor)
        cursor += sec['bars'] * bar_len

    starts_secs = [b * 60.0 / bpm for b in starts_beats]
    total_beats = cursor
    total_secs  = total_beats * 60.0 / bpm

    # First section time sig for project
    first_ts_num = sections[0].get('ts_num', 4)
    first_ts_den = sections[0].get('ts_den_pow', 2)

    # Build items for each track
    chord_items = ''
    drum_items  = ''

    for i, sec in enumerate(sections):
        start_secs  = starts_secs[i]
        bar_len     = sec['_bar_len']
        length_beats = sec['bars'] * bar_len
        length_secs  = length_beats * 60.0 / bpm

        c_events = make_chord_events(sec['prog'], sec['bpc'], sec['bars'], bar_len, sec.get('vel',80))
        d_events = make_drum_events(sec.get('drum','standard'), sec['bars'], bar_len)

        chord_items += make_midi_item(sec['name'], start_secs, length_secs, c_events, length_beats) + '\n'
        drum_items  += make_midi_item(sec['name'], start_secs, length_secs, d_events, length_beats) + '\n'

    chord_track = make_track('Chords', 82, 130, 255, chord_items)
    drum_track  = make_track('Drums (Kick+Snare)', 255, 100, 80, drum_items)

    regions = make_regions(sections, starts_secs, bpm)

    rpp = f'''<REAPER_PROJECT 0.1 "6.82/OSX64" 1708000000
  RIPPLE 0
  GROUPOVERRIDE 0 0 0
  AUTOXFADE 129
  ENVATTACH 3
  POOLEDENVATTACH 0
  MIXERUIFLAGS 11 48
  PEAKGAIN 1
  FEEDBACK 0
  PANLAW 1
  PROJOFFS 0 0 0
  MAXPROJLEN 0 {total_secs + 4:.6f}
  GRID 3199 8 1 8 1 0 0 0
  TIMEMODE 1 5 -1 30 0 0 -1
  VIDEO_CONFIG 0 0 256
  PANMODE 3
  CURSOR 0
  ZOOM 100 0 0
  VZOOMEX 6 0
  USE_REC_CFG 0
  RECMODE 1
  SMPTESYNC 0 30 100 40 1000 300 0 0 0 0 0
  LOOP 0
  LOOPGRAN 0
  RECORD_PATH "" ""
  <RECORD_CFG
    ZXZhdw==
  >
  <APPLYFX_CFG
  >
  RENDER_FILE ""
  RENDER_PATTERN ""
  RENDER_FMT 0 2 0
  RENDER_1X 0
  RENDER_RANGE 1 0 0 18 1000
  RENDER_RESAMPLE 3 0 1
  RENDER_ADDTOPROJ 0
  RENDER_STEMS 0
  RENDER_DITHER 0
  TIMELOCKMODE 1
  TEMPOENVLOCKMODE 1
  ITEMMIX 1
  DEFPITCHMODE 589824 0
  TAKELANE 1
  SAMPLERATE 48000 0 0
  <RENDER_CFG2
  >
  LOCK 1
  <METRONOME 6 2
    VOL 0.25 0.125
    FREQ 800 1600 1
    BEATLEN 4
    SAMPLES "" ""
    PATTERN 2863311530 2863311530
    MULT 1
  >
  MASTER_NCH 2
  MASTER_VOLUME 1
  MASTER_FX 1
  MASTER_SEL 0
  <TEMPOENVEX
    ACT 0 -1
    VIS 1 0 1
    LANEHEIGHT 0 0
    ARM 0
    DEFSHAPE 0 -1 -1
    PT 0 {bpm} 0
  >
  <PROJBAY
  >
  {regions}
{chord_track}
{drum_track}
>'''

    out_path = os.path.join(output_dir, f'{filename}.rpp')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(rpp)
    print(f'✓ {filename}.rpp  ({total_secs/60:.1f} min, {bpm} BPM)')

def S(name, bars, prog, bpc, drum, vel=80, ts_num=4, ts_den_pow=2):
    return {'name':name,'bars':bars,'prog':prog,'bpc':bpc,'drum':drum,
            'vel':vel,'ts_num':ts_num,'ts_den_pow':ts_den_pow}

def parse_args():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    default_output_dir = os.path.join(repo_root, 'reaper')
    parser = argparse.ArgumentParser(description='Generate REAPER .rpp files for all songs.')
    parser.add_argument(
        '--output-dir',
        default=default_output_dir,
        help='Directory to write generated .rpp files (default: %(default)s)',
    )
    return parser.parse_args()

def main():
    args = parse_args()
    output_dir = os.path.abspath(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    # ── ALL 14 SONGS ──────────────────────────────────────────────────────────
    build_rpp(output_dir, '01_Static_Bloom', 'Static Bloom', 120, [
    S('Intro',    8,  ['Bm7b5','E7','Am7'],    4, 'standard', 65),
    S('Verse 1',  16, ['Am','G','F','E'],       4, 'driving',  78),
    S('Chorus 1', 16, ['C','G','Am','F'],       4, 'driving',  92),
    S('Verse 2',  16, ['Am','G','F','E'],       4, 'driving',  78),
    S('Bridge',   12, ['Am','Fmaj7','Em','Dm'], 3.5,'78',      72, 7, 3),
    S('Chorus 2', 16, ['C','G','Am','F'],       4, 'driving',  95),
    S('Outro',    8,  ['C','G','Am','F'],       4, 'standard', 70),
    ])
    build_rpp(output_dir, '02_Skywritting', 'Skywritting', 70, [
    S('Intro',    4,  ['Dm'],               4, 'kick_only',    55),
    S('Verse 1',  16, ['Dm','C','Bb','A'],  4, 'half_time',    75),
    S('Chorus 1', 16, ['F','C','G','Am'],   4, 'standard',     90),
    S('Verse 2',  16, ['Dm','C','Bb','A'],  4, 'half_time',    75),
    S('Bridge',   8,  ['Gm','Dm','Am','E'], 4, 'bridge_sparse',65),
    S('Chorus 2', 16, ['F','C','G','Am'],   4, 'standard',     90),
    S('Outro',    8,  ['Dm','C','Bb','A'],  4, 'half_time',    60),
    ])
    build_rpp(output_dir, '03_Twin_Fish', 'Twin Fish', 60, [
    S('Intro',    8,  ['Em'],              4, 'kick_only',     60),
    S('Verse 1',  16, ['Em','D','C','B'],  4, 'half_time',     72),
    S('Chorus 1', 16, ['Am','B','Em','D'], 4, 'standard',      88),
    S('Verse 2',  16, ['Em','D','C','B'],  4, 'half_time',     72),
    S('Bridge',   8,  ['C','G','D','Am'],  2, 'bridge_sparse', 65),
    S('Chorus 2', 16, ['Am','B','Em','D'], 4, 'driving',       92),
    S('Outro',    8,  ['Em','D','C','B'],  2, 'half_time',     60),
    ])
    build_rpp(output_dir, '04_Binary_Heart', 'Binary Heart', 100, [
    S('Intro',    8,  ['Fm','Cm','Bbm','Eb'],  2, 'standard',    65),
    S('Verse 1',  16, ['Fm','Db','Ab','Eb'],   4, 'standard',    78),
    S('Chorus 1', 16, ['Bbm','Eb','Ab','Db'],  4, 'driving',     92),
    S('Verse 2',  16, ['Fm','Db','Ab','Eb'],   4, 'standard',    78),
    S('Bridge',   8,  ['Cm','Fm','Bbm','Eb'],  3, '68',          70, 6, 3),
    S('Chorus 2', 16, ['Bbm','Eb','Ab','Db'],  4, 'driving',     95),
    S('Outro',    8,  ['Fm','Db','Ab','Eb'],   2, 'half_time',   65),
    ])
    build_rpp(output_dir, '05_Electric_Pickle', 'Electric Pickle', 128, [
    S('Intro',    8,  ['Am','G','F','E'],       2, 'standard', 65),
    S('Verse 1',  16, ['Am','G','F','E'],       4, 'driving',  82),
    S('Chorus 1', 16, ['Am','G','C','F'],       4, 'driving',  95),
    S('Verse 2',  16, ['Am','G','F','E'],       4, 'driving',  82),
    S('Bridge',   12, ['Am','Fmaj7','Em','Dm'], 3.5,'78',      72, 7, 3),
    S('Chorus 2', 16, ['Am','G','C','F'],       4, 'driving',  100),
    S('Outro',    8,  ['Am','G','C','F'],       2, 'standard', 75),
    ])
    jazz = ['C#m7','F#7','Bmaj7','Emaj7','Am7','D7','Gmaj7','C#m7']
    build_rpp(output_dir, '06_Kaleidoscope_Mind', 'Kaleidoscope Mind', 130, [
    S('Intro',  4,  ['C#m7'], 4, 'half_time', 60),
    S('Head 1', 16, jazz,     2, 'standard',  82),
    S('Solo 1', 16, jazz,     2, 'standard',  78),
    S('Solo 2', 16, jazz,     2, 'standard',  78),
    S('Head 2', 16, jazz,     2, 'standard',  85),
    S('Outro',  4,  ['C#m7'], 4, 'half_time', 60),
    ])
    build_rpp(output_dir, '07_Rise_of_Neon_Dawn', 'Rise of the Neon Dawn', 140, [
    S('Intro',    8,  ['E','B','C#m','A'],   2, 'standard', 70),
    S('Verse 1',  16, ['E','A','B','E'],     4, 'driving',  85),
    S('Chorus 1', 16, ['A','B','E','C#m'],   4, 'driving',  100),
    S('Verse 2',  16, ['E','A','B','E'],     4, 'driving',  85),
    S('Bridge',   8,  ['C#m','A','B','E'],   2, 'half_time',70),
    S('Chorus 2', 16, ['A','B','E','C#m'],   4, 'intense',  105),
    S('Outro',    8,  ['E','B','C#m','A'],   2, 'standard', 80),
    ])
    build_rpp(output_dir, '08_Whispers_at_a_Void', 'Whispers at a Void', 90, [
    S('Intro',     8,  ['Dm'],               4, 'kick_only', 55),
    S('Section 1', 16, ['Dm','C','Gm','F'],  4, 'half_time', 70),
    S('Section 2', 16, ['Dm','Am','Bb','C'], 4, 'driving',   88),
    S('Section 3', 16, ['Dm','C','Gm','F'],  4, 'half_time', 65),
    S('Outro',     8,  ['Dm'],               4, 'none',       50),
    ])
    build_rpp(output_dir, '09_Oddysea', 'Oddysea', 95, [
    S('Section 1', 8,  ['Cm','Gm'],           4, 'none',      60),
    S('Section 2', 12, ['Am','Dm','G'],        4, 'half_time', 75),
    S('Section 3', 16, ['C#m','G#','A','E'],   4, 'intense',   95),
    S('Silence',   4,  ['Cm'],                4, 'none',       40),
    S('Section 5', 12, ['Fm','Cm','Ab','Eb'],  4, 'standard',  72),
    S('Section 6', 8,  ['Am','E','F','C'],    4, 'driving',    88),
    S('Outro',     4,  ['Am'],                4, 'none',        45),
    ])
    build_rpp(output_dir, '10_Echoes_in_the_Static', 'Echoes in the Static', 100, [
    S('Intro',    12, ['Gm','Dm','Eb','Bb'],  4, 'none',          60),
    S('Verse 1',  16, ['Gm','Bb','F','Eb'],   4, 'half_time',     75),
    S('Chorus 1', 16, ['Cm','Gm','Bb','Eb'],  4, 'standard',      90),
    S('Verse 2',  16, ['Gm','Bb','F','Eb'],   4, 'half_time',     75),
    S('Bridge',   12, ['Dm','Am','Bb','Eb'],  4, 'bridge_sparse', 65),
    S('Chorus 2', 16, ['Cm','Gm','Bb','Eb'],  4, 'driving',       95),
    S('Outro',    12, ['Gm','Dm','Eb','Bb'],  4, 'half_time',     55),
    ])
    build_rpp(output_dir, '11_Foul_Beast', 'Foul Beast', 140, [
    S('Intro',    4, ['G#m'],               4, 'kick_only', 70),
    S('Verse 1',  8, ['G#m','E','F#','D#'], 2, 'intense',   95),
    S('Chorus 1', 4, ['G#m','F#','E','D#'], 1, 'intense',   110),
    S('Verse 2',  8, ['G#m','E','F#','D#'], 2, 'intense',   100),
    S('Chorus 2', 4, ['G#m','F#','E','D#'], 1, 'intense',   115),
    S('Outro',    4, ['G#m'],               4, 'driving',   80),
    ])
    build_rpp(output_dir, '12_The_Somnium_Shift', 'The Somnium Shift', 120, [
    S('Intro',    4, ['C#m','G#','A','E'],  1, 'half_time', 65),
    S('Verse 1',  8, ['C#m','A','G#','E'],  2, 'standard',  78),
    S('Chorus 1', 8, ['C#m','F#m','A','E'], 2, '54',        90, 5, 2),
    S('Verse 2',  8, ['C#m','A','G#','E'],  2, 'standard',  80),
    S('Chorus 2', 8, ['C#m','F#m','A','E'], 2, '54',        95, 5, 2),
    S('Outro',    4, ['C#m'],               4, 'none',       55),
    ])
    build_rpp(output_dir, '13_Benson_and_Hedges', 'Benson and Hedges', 80, [
    S('Intro',    4, ['D'],              4, 'kick_only', 55),
    S('Verse 1',  8, ['D','A','Bm','G'], 2, 'half_time', 72),
    S('Chorus 1', 4, ['D','G','A','D'],  1, 'standard',  88),
    S('Verse 2',  8, ['D','A','Bm','G'], 2, 'half_time', 75),
    S('Chorus 2', 4, ['D','G','A','D'],  1, 'standard',  92),
    S('Outro',    4, ['D'],              4, 'none',       55),
    ])
    build_rpp(output_dir, '14_Politician', 'Politician', 170, [
    S('Intro',    4,  ['Am','G','F','E'],   2, 'dnb',       72),
    S('Verse 1',  16, ['Am','G','F','E'],   4, 'dnb',       85),
    S('Chorus 1', 16, ['C','G','Am','F'],   4, 'dnb',       100),
    S('Verse 2',  16, ['Am','G','F','E'],   4, 'dnb',       85),
    S('Bridge',   8,  ['Dm','Am','E','Am'], 2, 'half_time', 72),
    S('Chorus 2', 16, ['C','G','Am','F'],   4, 'dnb',       105),
    S('Outro',    8,  ['Am','G','F','E'],   2, 'dnb',       70),
    ])
    print(f'\n✅ All 14 REAPER .rpp files generated in: {output_dir}')

if __name__ == '__main__':
    main()
