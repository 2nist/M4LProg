# Musical Hierarchy & Arrangement Reference
*Agentic Reference Guide for Music Theory, Progressions, Sections, and Song Structure*

---

## Overview

This document defines the hierarchical relationships between musical elements from fundamental chord theory up to complete song arrangements. Each level builds upon the previous, creating a structured framework for understanding and generating music programmatically.

## Hierarchy Levels

```
Song (Arrangement)
├── Sections (Verse, Chorus, Bridge, etc.)
    ├── Core Progression(s) [repeat 2-4 times within section]
    ├── Transitions [between progressions/sections]  
    ├── Fills [harmonic embellishments]
    └── Variations [modified progressions]
        ├── Individual Chords
            └── Chord Theory (Notes, Intervals, Functions)
```

### Structural Relationship
- **Progressions** are **building blocks** that repeat within sections
- **Sections** are **containers** that organize multiple repetitions plus additional material
- **Songs** are **sequences** of sections with overall narrative arc

---

## 1. Chord Theory (Foundation Level)

### Core Components
- **Notes**: The 12-tone chromatic system (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- **Intervals**: Mathematical relationships between notes (unison, 2nd, 3rd, 4th, 5th, 6th, 7th, octave)
- **Scales**: Organized collections of notes following specific interval patterns
- **Key Centers**: Tonal frameworks that establish harmonic context

### Chord Construction Rules
- **Triads**: Root + 3rd + 5th (Major, Minor, Diminished, Augmented)
- **Extended Chords**: Add 7ths, 9ths, 11ths, 13ths
- **Alterations**: #5, b5, #9, b9, #11, b13
- **Inversions**: Root position, 1st, 2nd, 3rd inversions

### Functional Harmony
- **Tonic Function**: Stability, resolution (I, vi, iii)
- **Subdominant Function**: Departure, preparation (IV, ii, vi)
- **Dominant Function**: Tension, return (V, vii°, V7)

---

## 2. Individual Chords (Building Blocks)

### Chord Representation
```json
{
  "symbol": "Cmaj7",
  "root": "C",
  "quality": "major7",
  "notes": ["C", "E", "G", "B"],
  "function": "tonic",
  "inversion": "root",
  "voicing": "close",
  "tension": 0.2
}
```

### Chord Categories
- **Primary Triads**: I, IV, V (establish key center)
- **Secondary Triads**: ii, iii, vi (color and movement)
- **Extended Chords**: Add harmonic sophistication
- **Borrowed Chords**: From parallel modes or related keys
- **Substitute Chords**: Functional equivalents (tritone subs, etc.)

### Voice Leading Principles
- **Smooth Voice Leading**: Minimize movement between chord tones
- **Common Tones**: Hold notes that appear in successive chords
- **Stepwise Motion**: Move remaining voices by steps when possible
- **Avoid Parallel Motion**: In perfect 5ths and octaves (traditional rules)

---

## 3. Chord Progressions (Phrase Level)

### Progression Structure
A progression is a **repeatable harmonic unit** - typically 2, 4, or 8 bars that cycles within a section.

```json
{
  "name": "vi-IV-I-V",
  "key": "C major",
  "length": "4 bars",
  "chords": [
    {"chord": "Am", "duration": "1 bar", "function": "tonic"},
    {"chord": "F", "duration": "1 bar", "function": "subdominant"},
    {"chord": "C", "duration": "1 bar", "function": "tonic"},
    {"chord": "G", "duration": "1 bar", "function": "dominant"}
  ],
  "harmonic_rhythm": "1 chord per bar",
  "cadence_type": "half_cadence",
  "repeatable": true,
  "tension_curve": [0.3, 0.6, 0.2, 0.8]
}
```

### Key Characteristics
- **Cyclic Nature**: Designed to repeat seamlessly (last chord leads back to first)
- **Self-Contained**: Complete harmonic thought within the cycle
- **Functional Unity**: Serves one primary harmonic function per cycle
- **Standard Lengths**: 2, 4, 8 bars (occasionally 6 or other lengths)

### Common Progression Types
- **Circle of Fifths**: vi-ii-V-I, iii-vi-ii-V-I
- **Pop Progressions**: I-V-vi-IV, vi-IV-I-V
- **Blues Progressions**: I-I-I-I-IV-IV-I-I-V-V-I-I
- **Jazz Standards**: ii-V-I, I-vi-ii-V
- **Modal Progressions**: Based on modes other than major/minor

### Progression Functions
- **Cyclic Foundation**: Core harmonic material that defines section character
- **Repetition Unit**: Designed to loop seamlessly within sections
- **Harmonic Capsule**: Complete functional statement (setup → tension → partial resolution)
- **Sectional Building Block**: Combined with fills/transitions to create complete sections

---

## Progression Repetition & Section Building

### How Progressions Build Sections

#### **Basic Repetition Model**
```
4-bar progression × 4 repetitions = 16-bar verse section
Example: |Am-F-C-G| × 4 = complete verse
```

#### **Repetition with Fills**
```
Bars 1-4:   Am-F-C-G     (core progression)
Bars 5-8:   Am-F-C-G     (exact repeat)  
Bars 9-12:  Am-F-C-G     (with rhythmic/melodic fill)
Bars 13-16: Am-F-C-G     (into transition)
```

#### **Repetition with Variation**
```
Bars 1-4:   vi-IV-I-V    (Am-F-C-G)
Bars 5-8:   vi-IV-I-V    (Am-F-C-G)
Bars 9-12:  vi-ii-I-V    (Am-Dm-C-G - substitute IV with ii)
Bars 13-16: vi-IV-I-V    (back to original)
```

### Fill Types (Within Sections)
- **Harmonic Fills**: Substitute chords or chromatic passing chords
- **Rhythmic Fills**: Same chords, different rhythmic pattern  
- **Melodic Fills**: Additional melody over same chord progression
- **Textural Fills**: Change instrumentation while keeping harmony

### Transition Types (Between Elements)
- **Inter-Progression**: Smooth connection between repetitions of same progression
- **Inter-Section**: Bridge from one section type to another (verse → chorus)
- **Turnarounds**: Return to beginning of section or progression cycle
- **Modulatory**: Change key or harmonic center

---

## 4. Sections (Structural Components)

### Section vs. Progression Relationship
**Critical Distinction**: A section contains:
1. **Core Progression(s)**: 1-3 progressions that repeat multiple times
2. **Transitions**: Harmonic bridges between repetitions or to other sections  
3. **Fills**: Short harmonic embellishments that break up repetition
4. **Variations**: Modified versions of the core progression

```json
{
  "section": "verse",
  "total_length": "16 bars",
  "structure": {
    "core_progression": {
      "pattern": "vi-IV-I-V",
      "length": "4 bars", 
      "repetitions": 3
    },
    "transitions": [
      {
        "position": "bar 12-13",
        "function": "setup_for_pre_chorus",
        "chords": "V-V7"
      }
    ],
    "fills": [
      {
        "position": "bar 8",
        "function": "break_repetition", 
        "chords": "vi/G-F#dim"
      }
    ],
    "variations": [
      {
        "repetition": 2,
        "modification": "substitute IV with ii7"
      }
    ]
  }
}
```

### Section Types & Internal Structure

#### **Verse**
- **Core Progression**: Usually 4-8 bars, repeats 2-4 times
- **Function**: Narrative delivery, moderate harmonic activity
- **Typical Structure**: 
  ```
  [4-bar progression] × 2 + [2-bar transition] + [4-bar progression] × 2
  = 16 total bars
  ```
- **Common Progressions**: vi-IV-I-V, I-vi-IV-V
- **Transitions**: Often lead to pre-chorus or directly to chorus

#### **Chorus/Refrain**
- **Core Progression**: Strong, memorable 4-8 bar cycle
- **Function**: Emotional peak, main harmonic statement
- **Typical Structure**:
  ```
  [4-bar progression] × 3 + [4-bar ending/transition]
  = 16 total bars
  ```
- **Common Progressions**: I-V-vi-IV, vi-IV-I-V
- **Ending Variations**: Last repetition often has different cadence

#### **Bridge**
- **Core Progression**: Contrasting progression, may not repeat traditionally
- **Function**: Harmonic departure from main progressions
- **Typical Structure**:
  ```
  [4-bar new progression] + [4-bar development] + [4-bar return transition]
  = 12 total bars
  ```
- **Unique Elements**: 
  - Often modulates or uses non-diatonic chords
  - May break from repetition pattern entirely
  - Transition back usually longer and more elaborate

#### **Pre-Chorus**
- **Core Progression**: Short, building pattern (2-4 bars)
- **Function**: Tension builder, setup for chorus
- **Typical Structure**:
  ```
  [2-4 bar progression] + [2-4 bar intensification/transition]
  = 4-8 total bars
  ```
- **Common Pattern**: Ends on dominant (V or V7) to lead to chorus

### Section Internal Dynamics

#### **Repetition Patterns**
```
Simple: [A] [A] [A] [A]
With Fill: [A] [A] [Fill] [A] [A]  
With Variation: [A] [A] [A'] [A']
With Transition: [A] [A] [A] [Trans]
```

#### **Transition Types**
- **Turnaround**: Returns to beginning of same section
- **Setup**: Prepares for different section
- **Modulatory**: Changes key for next section
- **Deceptive**: Unexpected harmonic direction

#### **Fill Functions**
- **Rhythmic Break**: Same harmony, different rhythm
- **Harmonic Color**: Substitute or chromatic chords
- **Voice Leading**: Smooth connection between repetitions
- **Dynamic Contrast**: Change texture while maintaining progression

### Section Relationships
```
Typical 16-bar Verse Structure:
Bars 1-4:   Core progression (establishment)
Bars 5-8:   Core progression (repetition + possible fill)
Bars 9-12:  Core progression or variation (development)  
Bars 13-16: Transition to next section

Energy Arc Within Section:
Start → Repetition builds familiarity → Fill/variation adds interest → 
Transition creates anticipation for next section
```

---

## 5. Song Arrangement (Complete Structure)

### Arrangement Architecture
```json
{
  "title": "Example Song",
  "key": "C major",
  "tempo": 120,
  "time_signature": "4/4",
  "structure": [
    {
      "section": "intro", 
      "total_bars": 8,
      "core_progression": {"pattern": "I-vi-IV-V", "length": 4, "repetitions": 2}
    },
    {
      "section": "verse1", 
      "total_bars": 16,
      "core_progression": {"pattern": "vi-IV-I-V", "length": 4, "repetitions": 3},
      "transition": {"bars": "13-16", "pattern": "ii-V7", "function": "setup_pre_chorus"}
    },
    {
      "section": "pre_chorus", 
      "total_bars": 4,
      "core_progression": {"pattern": "ii-V", "length": 2, "repetitions": 2}
    },
    {
      "section": "chorus", 
      "total_bars": 16,
      "core_progression": {"pattern": "I-V-vi-IV", "length": 4, "repetitions": 4}
    }
  ],
  "total_duration": "3:30"
}
```

### Arrangement Considerations

#### **Progression Distribution**
- **Verse**: 1 main progression + transitions/fills
- **Chorus**: 1 strong progression, minimal variation  
- **Bridge**: New progression(s), may not follow repetition pattern
- **Pre-Chorus**: Short progression designed to build tension

#### **Repetition Management**
- **Within Sections**: 2-4 repetitions of core progression
- **Between Sections**: Sections themselves repeat (verse 1, verse 2, etc.)
- **Variation Strategy**: Subtle changes on repetition to maintain interest

#### **Transition Planning**
- **Section-to-Section**: Harmonic bridges between different sections
- **Within-Section**: Fills and turnarounds within repeated progressions
- **Key Modulations**: Planned key changes, often in transitions

---

## Practical Implementation Notes

### For Agentic Systems

#### **Chord Generation**
1. Establish key center and mode
2. Select functional chord categories (T, SD, D)
3. Apply voice leading rules
4. Consider harmonic rhythm and context

#### **Progression Building**
1. Define section function and energy level
2. Choose appropriate progression length (2, 4, 8 bars)
3. Select chords that support the functional goal
4. Test voice leading between chords

#### **Section Construction**
1. Match progression type to section function
2. Consider contrast with adjacent sections
3. Plan transition points and cadences
4. Balance repetition with variation

#### **Arrangement Assembly**
1. Plan overall energy/tension arc
2. Select section order and repetition pattern
3. Ensure harmonic consistency across sections
4. Plan modulations and key relationships

### Analysis Framework
```python
def analyze_harmonic_relationship(element1, element2):
    """
    Returns relationship strength and type between any two musical elements
    """
    return {
        "similarity": 0.0-1.0,  # How similar harmonically
        "tension": 0.0-1.0,     # Amount of harmonic tension
        "function": "tonic|subdominant|dominant",
        "transition_quality": "smooth|abrupt|surprising"
    }
```

---

## Reference Tables

### Circle of Fifths Relationships
```
C - G - D - A - E - B - F# - C# - G# - D# - A# - F - C
```

### Common Progressions by Genre
- **Pop/Rock**: I-V-vi-IV, vi-IV-I-V, I-vi-IV-V
- **Jazz**: ii-V-I, I-vi-ii-V, iii-vi-ii-V
- **Blues**: I-I-I-I-IV-IV-I-I-V-V-I-I
- **Gospel**: I-V-vi-iii-IV-I-IV-V
- **Electronic**: i-VII-VI-VII, i-v-iv-v

### Tension Values by Chord Function
- **Tonic (I, vi)**: 0.0-0.3 (stable, resolved)
- **Subdominant (IV, ii)**: 0.3-0.6 (moderate movement)
- **Dominant (V, vii°)**: 0.6-1.0 (high tension, needs resolution)

---

## Cross-Level Relationship Matrix

### How Each Level Influences Others

| **From/To** | **Chord Theory** | **Individual Chords** | **Progressions** | **Sections** | **Song** |
|-------------|------------------|----------------------|------------------|--------------|----------|
| **Chord Theory** | - | Defines construction rules, voicing options | Establishes functional relationships | Sets harmonic vocabulary | Determines overall tonal framework |
| **Individual Chords** | Must follow theory constraints | - | Creates harmonic motion, voice leading | Provides harmonic color within repetitions | Establishes harmonic language |
| **Progressions** | Uses functional harmony | Sequences chords logically | - | **Repeats 2-4 times per section**, provides core harmonic identity | Creates harmonic narrative through section sequence |
| **Sections** | Applies theory at structural level | Groups chords into functional units | **Contains multiple progression repetitions + transitions/fills** | - | Builds overall song architecture and energy arc |
| **Song** | Unifies tonal center | Manages chord distribution | Balances progression variety across sections | Sequences sections logically | - |

### Dependencies and Constraints

#### **Bottom-Up Constraints** (Theory → Song)
- Chord theory limits available harmonic materials
- Individual chord choices constrain voice leading options
- Progression patterns influence section character
- Section functions determine arrangement possibilities

#### **Top-Down Constraints** (Song → Theory)
- Song form influences section requirements
- Section needs determine progression choices
- Progression goals guide chord selection
- Chord context affects theoretical application

### Agentic Decision Points

#### **When Building Bottom-Up:**
1. **Start with Key/Mode** → Available chord palette
2. **Select Chord Functions** → Progression possibilities  
3. **Choose Progressions** → Section character options
4. **Arrange Sections** → Overall song form

#### **When Building Top-Down:**
1. **Define Song Form** → Required section types
2. **Plan Section Functions** → Needed progression types
3. **Select Progressions** → Required chord functions
4. **Voice Chords** → Apply theoretical constraints

---

## Implementation Pseudocode

```python
class MusicalHierarchy:
    def __init__(self, key="C", mode="major"):
        self.theory = ChordTheory(key, mode)
        self.chord_palette = self.theory.generate_diatonic_chords()
        
    def generate_song(self, form="verse_chorus", style="pop"):
        # Top-down approach
        sections = self.plan_sections(form)
        for section in sections:
            progression = self.create_progression(section.function, style)
            section.chords = self.voice_progression(progression)
        return Song(sections)
    
    def analyze_coherence(self, song):
        # Cross-level consistency checking
        theory_score = self.check_theoretical_consistency(song)
        voice_leading_score = self.analyze_voice_leading(song)
        form_score = self.evaluate_song_structure(song)
        return {
            "theory": theory_score,
            "voice_leading": voice_leading_score, 
            "structure": form_score,
            "overall": (theory_score + voice_leading_score + form_score) / 3
        }
```

---

*This reference provides the foundational framework for understanding musical hierarchy in agentic music systems. Each level informs and constrains the possibilities at higher levels, while the relationship matrix shows how decisions at any level propagate throughout the entire musical structure.*
