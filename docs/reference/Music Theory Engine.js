/**
 * Theory Engine (V8)
 * Handles Diatonic stacking, Modal Signature shifts, and chord interval math.
 */

// Basic chord formulas (intervals in semitones relative to root)
const CHORD_FORMULAS = {
    "Maj": [0, 4, 7],
    "min": [0, 3, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "Maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "Dom7": [0, 4, 7, 10],
    "dim7": [0, 3, 6, 9],
    "m7b5": [0, 3, 6, 10], // Half-diminished
    "Maj9": [0, 4, 7, 11, 14],
    "min9": [0, 3, 7, 10, 14]
};

/**
 * Modal Signatures
 * Defined by their characteristic semitone steps from the root.
 * Used to determine the quality of chords built on scale degrees.
 */
const MODAL_PROFILES = {
    "Ionian":     { steps: [2, 2, 1, 2, 2, 2, 1], type: "Major" },
    "Dorian":     { steps: [2, 1, 2, 2, 2, 1, 2], type: "minor" },
    "Phrygian":   { steps: [1, 2, 2, 2, 1, 2, 2], type: "minor" },
    "Lydian":     { steps: [2, 2, 2, 1, 2, 2, 1], type: "Major" },
    "Mixolydian": { steps: [2, 2, 1, 2, 2, 1, 2], type: "Major" },
    "Aeolian":    { steps: [2, 1, 2, 2, 1, 2, 2], type: "minor" },
    "Locrian":    { steps: [1, 2, 2, 1, 2, 2, 2], type: "diminished" }
};

/**
 * Get the notes for a chord based on a root and a specific formula
 */
function getChordNotes(root, qualityKey) {
    const intervals = CHORD_FORMULAS[qualityKey] || CHORD_FORMULAS["Maj"];
    return intervals.map(interval => root + interval);
}

/**
 * Diatonic Logic: Returns the default quality for a scale degree
 * @param {number} degree - 1-7
 * @param {string} modeName - Current active mode (default Ionian)
 */
function getDiatonicQuality(degree, modeName = "Ionian") {
    const profile = MODAL_PROFILES[modeName];
    if (!profile) return "Maj";

    // Standard mapping for Major (Ionian)
    const majorMap = ["Maj", "min", "min", "Maj", "Dom7", "min", "m7b5"];
    
    // Rotate the map based on the mode's position in the Major scale
    const modeOffsets = {
        "Ionian": 0, "Dorian": 1, "Phrygian": 2, "Lydian": 3, 
        "Mixolydian": 4, "Aeolian": 5, "Locrian": 6
    };
    
    const offset = modeOffsets[modeName] || 0;
    const index = (degree - 1 + offset) % 7;
    
    return majorMap[index];
}

/**
 * Modal Signature Shift (Modal Interchange)
 * Borrowing a chord quality from a parallel mode for the same root.
 * @param {number} root - MIDI note
 * @param {string} targetMode - The mode to borrow from (e.g., 'Aeolian')
 * @param {number} degree - The degree of the current scale we are borrowing for
 */
function getBorrowedChord(root, targetMode, degree) {
    const borrowedQuality = getDiatonicQuality(degree, targetMode);
    return {
        notes: getChordNotes(root, borrowedQuality),
        name: `${borrowedQuality} (from ${targetMode})`
    };
}

/**
 * Calculate Extensions
 * Adds 7, 9, 11, or 13 based on a complexity index from an encoder
 */
function applyExtensions(baseNotes, complexity) {
    let extendedNotes = [...baseNotes];
    const root = baseNotes[0];
    
    if (complexity >= 1) extendedNotes.push(root + 10); // Simple 7th logic
    if (complexity >= 2) extendedNotes.push(root + 14); // 9th
    
    return extendedNotes;
}

/**
 * Apply Chord Inversion
 * Rearranges chord notes to start from a different root position
 * @param {Array<number>} notes - Original chord notes (MIDI)
 * @param {number} inversion - Inversion level (0 = root position, 1 = 1st inversion, etc.)
 * @returns {Array<number>} Inverted chord notes
 */
function applyInversion(notes, inversion) {
    if (!notes || notes.length === 0 || inversion === 0) return [...notes];
    
    // Sort notes to ensure proper ordering
    const sortedNotes = [...notes].sort((a, b) => a - b);
    
    // For inversion, we move the specified number of notes from bottom to top (octave higher)
    const invertedNotes = [...sortedNotes];
    for (let i = 0; i < inversion && i < sortedNotes.length; i++) {
        invertedNotes[i] += 12; // Move to next octave
    }
    
    // Re-sort to maintain proper voicing order
    return invertedNotes.sort((a, b) => a - b);
}

/**
 * Apply Drop Voicing
 * Creates drop voicings by moving upper notes down an octave
 * @param {Array<number>} notes - Original chord notes (MIDI)
 * @param {number} dropType - Drop voicing type (0 = none, 1 = drop 2, 2 = drop 2&4, 3 = drop 3, etc.)
 * @returns {Array<number>} Drop-voiced chord notes
 */
function applyDropVoicing(notes, dropType) {
    if (!notes || notes.length < 4 || dropType === 0) return [...notes];
    
    // Sort notes to ensure proper ordering (bass to treble)
    const sortedNotes = [...notes].sort((a, b) => a - b);
    const dropNotes = [...sortedNotes];
    
    // Drop voicings move upper voices down an octave
    if (dropType === 1 && sortedNotes.length >= 4) {
        // Drop 2: Move the second highest note down an octave
        dropNotes[sortedNotes.length - 2] -= 12;
    } else if (dropType === 2 && sortedNotes.length >= 4) {
        // Drop 2&4: Move second and fourth highest notes down an octave
        dropNotes[sortedNotes.length - 2] -= 12; // Second highest
        dropNotes[0] -= 12; // Fourth highest (lowest note)
    } else if (dropType === 3 && sortedNotes.length >= 4) {
        // Drop 3: Move the third highest note down an octave
        dropNotes[sortedNotes.length - 3] -= 12;
    }
    
    // Re-sort to maintain proper voicing order
    return dropNotes.sort((a, b) => a - b);
}

/**
 * Apply Complete Voicing
 * Combines inversion and drop voicing for full voicing control
 * @param {Array<number>} baseNotes - Base chord notes
 * @param {number} inversion - Inversion level (0-3)
 * @param {number} dropType - Drop voicing type (0-3)
 * @returns {Array<number>} Fully voiced chord notes
 */
function applyVoicing(baseNotes, inversion, dropType) {
    let notes = [...baseNotes];
    
    // Apply inversion first
    if (inversion > 0) {
        notes = applyInversion(notes, inversion);
    }
    
    // Then apply drop voicing
    if (dropType > 0) {
        notes = applyDropVoicing(notes, dropType);
    }
    
    return notes;
}

/**
 * Get Voicing Description
 * Returns a human-readable description of the current voicing settings
 * @param {number} inversion - Inversion level
 * @param {number} dropType - Drop voicing type
 * @returns {string} Description string
 */
function getVoicingDescription(inversion, dropType) {
    let description = "";
    
    if (inversion > 0) {
        const inversionNames = ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];
        description += inversionNames[Math.min(inversion, 3)];
    } else {
        description += "Root Position";
    }
    
    if (dropType > 0) {
        const dropNames = ["", " Drop 2", " Drop 2&4", " Drop 3"];
        description += dropNames[Math.min(dropType, 3)];
    }
    
    return description;
}

/**
 * Transition Presets
 * Predefined harmonic bridges between sections
 */
const TRANSITION_PRESETS = {
    "none": { name: "None", notes: [] },
    "backdoor_dominant": { 
        name: "Backdoor Dominant", 
        description: "bVII7 → I (e.g., Db7 → C)",
        build: (root) => getChordNotes(root - 1, "Dom7") // bVII7
    },
    "plagal": { 
        name: "Plagal Cadence", 
        description: "IV → I (e.g., F → C)",
        build: (root) => getChordNotes(root + 5, "Maj") // IV
    },
    "modal_borrow": { 
        name: "Modal Borrow (Aeolian IV)", 
        description: "iv from Aeolian (e.g., Fm in C Major)",
        build: (root, mode = "Aeolian") => getBorrowedChord(root + 5, mode, 4).notes // iv from Aeolian
    },
    // Advanced Probabilistic Transitions
    "jazz_cadence": {
        name: "Jazz Cadence",
        type: "probabilistic",
        description: "Random jazz progressions with configurable weights",
        options: [
            { name: "ii-V-I", weight: 0.4, sequence: ["ii7", "V7", "I"] },
            { name: "iii-vi-ii-V", weight: 0.3, sequence: ["iii7", "vi7", "ii7", "V7"] },
            { name: "I-vi-ii-V", weight: 0.2, sequence: ["I", "vi7", "ii7", "V7"] },
            { name: "tritone_sub", weight: 0.1, sequence: ["bII7", "I"] }
        ],
        build: (root) => buildProbabilisticTransition(root, TRANSITION_PRESETS.jazz_cadence)
    },
    "blues_turnaround": {
        name: "Blues Turnaround",
        type: "probabilistic",
        description: "Classic blues progressions",
        options: [
            { name: "I-IV-I-V", weight: 0.5, sequence: ["I7", "IV7", "I7", "V7"] },
            { name: "ii-V-I-IV", weight: 0.3, sequence: ["ii7", "V7", "I7", "IV7"] },
            { name: "quick_change", weight: 0.2, sequence: ["I7", "bIII7", "ii7", "V7"] }
        ],
        build: (root) => buildProbabilisticTransition(root, TRANSITION_PRESETS.blues_turnaround)
    }
};

/**
 * Build Transition
 * Generates MIDI notes for a transition preset
 * @param {number} root - Target section root
 * @param {string} type - Preset key
 * @param {number} length - Transition length in beats
 */
function buildTransition(root, type, length = 2) {
    const preset = TRANSITION_PRESETS[type];
    if (!preset || type === "none") return { notes: [], length: 0 };
    
    const chordNotes = preset.build(root);
    // For simplicity, one chord for the transition
    const notes = chordNotes.map(note => ({
        pitch: note,
        start_time: 0,
        duration: length,
        velocity: 100,
        mute: 0
    }));
    
    return { notes, length };
}

/**
 * Build Probabilistic Transition
 * Selects from multiple chord sequences based on probability weights
 * @param {number} root - Target section root
 * @param {object} preset - Probabilistic transition preset
 * @param {number} length - Total transition length in beats
 */
function buildProbabilisticTransition(root, preset, length = 4) {
    if (!preset || !preset.options || preset.options.length === 0) return [];
    
    // Select option based on weights
    const selectedOption = selectWeightedOption(preset.options);
    if (!selectedOption) return [];
    
    // Parse chord sequence and build notes
    const chords = parseChordSequence(selectedOption.sequence, root);
    const notesPerChord = Math.floor(length / chords.length);
    const remainder = length % chords.length;
    
    let allNotes = [];
    let currentTime = 0;
    
    chords.forEach((chordNotes, index) => {
        const chordDuration = notesPerChord + (index < remainder ? 1 : 0);
        const chordNotesWithTiming = chordNotes.map(note => ({
            pitch: note,
            start_time: currentTime,
            duration: chordDuration,
            velocity: 100,
            mute: 0
        }));
        allNotes.push(...chordNotesWithTiming);
        currentTime += chordDuration;
    });
    
    return allNotes;
}

/**
 * Select Weighted Option
 * Randomly selects an option based on probability weights
 * @param {Array} options - Array of objects with 'weight' property
 * @returns {object} Selected option
 */
function selectWeightedOption(options) {
    const totalWeight = options.reduce((sum, option) => sum + (option.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
        random -= option.weight || 1;
        if (random <= 0) {
            return option;
        }
    }
    
    return options[0]; // Fallback
}

/**
 * Parse Chord Sequence
 * Converts chord symbols to MIDI notes relative to root
 * @param {Array<string>} sequence - Array of chord symbols (e.g., ["ii7", "V7", "I"])
 * @param {number} root - Root note (MIDI)
 * @returns {Array<Array<number>>} Array of chord note arrays
 */
function parseChordSequence(sequence, root) {
    const chords = [];
    
    for (const symbol of sequence) {
        const chordNotes = parseChordSymbol(symbol, root);
        if (chordNotes && chordNotes.length > 0) {
            chords.push(chordNotes);
        }
    }
    
    return chords;
}

/**
 * Parse Chord Symbol
 * Converts a chord symbol to MIDI notes
 * @param {string} symbol - Chord symbol (e.g., "ii7", "V", "bVII7", "I", "IV")
 * @param {number} root - Root note (MIDI)
 * @returns {Array<number>} MIDI note numbers
 */
function parseChordSymbol(symbol, root) {
    // Convert Roman numerals to degree numbers with quality hints
    let degreeStr = symbol;
    let impliedQuality = ""; // Default quality
    
    // Handle Roman numerals (preserve case for quality hints)
    const romanMatch = symbol.match(/^([ivIV]+)(.*)$/);
    if (romanMatch) {
        const roman = romanMatch[1];
        const suffix = romanMatch[2];
        
        // Determine implied quality from Roman numeral case
        if (roman === roman.toLowerCase()) {
            impliedQuality = "min"; // lowercase = minor
        } else {
            impliedQuality = "Maj"; // uppercase = major
        }
        
        const romanMap = {
            'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7',
            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7'
        };
        
        if (romanMap[roman.toLowerCase()]) {
            degreeStr = romanMap[roman.toLowerCase()] + suffix;
        }
    }
    
    // Parse degree and quality
    const degreeMatch = degreeStr.match(/^([b#]?\d)(.*)$/);
    if (!degreeMatch) return [];
    
    degreeStr = degreeMatch[1];
    let qualityStr = degreeMatch[2];
    
    // Combine implied quality with explicit quality
    if (impliedQuality && qualityStr) {
        // For example, "min" + "7" = "min7"
        qualityStr = impliedQuality + qualityStr;
    } else if (impliedQuality && !qualityStr) {
        qualityStr = impliedQuality;
    } else if (!qualityStr) {
        qualityStr = "Maj";
    }
    
    // If no explicit quality suffix but we have implied quality, use it
    if (!degreeMatch[2] && impliedQuality) {
        qualityStr = impliedQuality;
    }
    
    // Convert degree to semitone offset from root
    const degree = parseDegree(degreeStr);
    const chordRoot = root + degree;
    
    // Get chord quality
    const quality = mapQualityString(qualityStr);
    
    return getChordNotes(chordRoot, quality);
}

/**
 * Parse Degree
 * Converts degree notation to semitone offset
 * @param {string} degreeStr - Degree string (e.g., "1", "b3", "#4")
 * @returns {number} Semitone offset
 */
function parseDegree(degreeStr) {
    const degreeMap = {
        "1": 0, "2": 2, "3": 4, "4": 5, "5": 7, "6": 9, "7": 11
    };
    
    let degree = degreeStr.replace(/[b#]/g, '');
    let offset = degreeMap[degree] || 0;
    
    // Apply accidentals
    if (degreeStr.includes('b')) offset -= 1;
    if (degreeStr.includes('#')) offset += 1;
    
    return offset;
}

/**
 * Map Quality String
 * Maps chord quality strings to internal quality keys
 * @param {string} qualityStr - Quality string (e.g., "7", "m7", "maj7")
 * @returns {string} Internal quality key
 */
function mapQualityString(qualityStr) {
    const qualityMap = {
        "": "Maj",
        "7": "Dom7",
        "m": "min",
        "m7": "min7",
        "min7": "min7",
        "maj7": "Maj7",
        "dim": "dim",
        "dim7": "dim7",
        "m7b5": "m7b5",
        "9": "Dom7", // Simplified
        "maj9": "Maj9",
        "min": "min",
        "maj": "Maj",
        "dom": "Dom7"
    };
    
    return qualityMap[qualityStr] || qualityMap[qualityStr.toLowerCase()] || "Maj";
}

/**
 * Create Custom Transition
 * Creates a custom transition from chord sequence string
 * @param {string} name - Name of the custom transition
 * @param {string} sequenceStr - Space-separated chord sequence (e.g., "Dm7 G7 Cmaj7")
 * @param {Array<number>} weights - Probability weights for each chord (optional)
 * @returns {object} Custom transition object
 */
function createCustomTransition(name, sequenceStr, weights = []) {
    const symbols = sequenceStr.trim().split(/\s+/).filter(s => s.length > 0);
    if (symbols.length === 0) return null;
    
    // If no weights provided, use equal weights
    const defaultWeights = symbols.map(() => 1 / symbols.length);
    const finalWeights = weights.length === symbols.length ? weights : defaultWeights;
    
    return {
        name: name,
        type: "custom",
        description: `Custom transition: ${sequenceStr}`,
        options: [{
            name: name,
            weight: 1.0,
            sequence: symbols,
            weights: finalWeights
        }],
        build: (root) => buildCustomTransition(root, symbols, finalWeights)
    };
}

/**
 * Build Custom Transition
 * Builds notes for a custom chord sequence
 * @param {number} root - Root note
 * @param {Array<string>} symbols - Chord symbols
 * @param {Array<number>} weights - Duration weights
 * @param {number} totalLength - Total transition length
 * @returns {Array} MIDI notes with timing
 */
function buildCustomTransition(root, symbols, weights, totalLength = 4) {
    const chords = parseChordSequence(symbols, root);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let allNotes = [];
    let currentTime = 0;
    
    chords.forEach((chordNotes, index) => {
        const weight = weights[index] || 1;
        const duration = (weight / totalWeight) * totalLength;
        
        const chordNotesWithTiming = chordNotes.map(note => ({
            pitch: note,
            start_time: currentTime,
            duration: duration,
            velocity: 100,
            mute: 0
        }));
        
        allNotes.push(...chordNotesWithTiming);
        currentTime += duration;
    });
    
    return allNotes;
}

/**
 * Save Custom Transition
 * Saves a custom transition to the dict
 * @param {string} key - Dict key for the transition
 * @param {object} transition - Custom transition object
 */
function saveCustomTransition(key, transition) {
    if (typeof customTransitionsDict !== 'undefined') {
        customTransitionsDict.set(key, transition);
    } else {
        // Fallback: store in global object
        if (!global.customTransitions) global.customTransitions = {};
        global.customTransitions[key] = transition;
    }
}

/**
 * Load Custom Transition
 * Loads a custom transition from the dict
 * @param {string} key - Dict key for the transition
 * @returns {object} Custom transition object or null
 */
function loadCustomTransition(key) {
    if (typeof customTransitionsDict !== 'undefined') {
        return customTransitionsDict.get(key) || null;
    } else {
        // Fallback: load from global object
        return global.customTransitions ? global.customTransitions[key] || null : null;
    }
}

/**
 * Get All Custom Transitions
 * Returns all saved custom transitions
 * @returns {object} Object with all custom transitions
 */
function getAllCustomTransitions() {
    if (typeof customTransitionsDict !== 'undefined') {
        // In Max, we'd iterate through the dict
        return {}; // Placeholder
    } else {
        return global.customTransitions || {};
    }
}

/**
 * Analyze Section Energy Level
 * Determines energy based on chord dissonance in the current section
 * @param {Array} progression - Array of chord objects with notes
 * @returns {string} "high", "medium", or "low"
 */
function analyzeSectionEnergy(progression) {
    if (!progression || progression.length === 0) return "medium";
    
    let dissonanceScore = 0;
    const dissonantQualities = ["dim", "dim7", "m7b5", "Dom7", "min7"];
    
    progression.forEach(chord => {
        // Simple heuristic: count intervals that create tension
        const notes = chord.notes || [];
        if (notes.length >= 4) dissonanceScore += 2; // 7th chords are more tense
        if (notes.length >= 5) dissonanceScore += 1; // Extensions add tension
        
        // Check for tritones (diminished fifths) - very dissonant
        for (let i = 0; i < notes.length - 1; i++) {
            for (let j = i + 1; j < notes.length; j++) {
                const interval = Math.abs(notes[j] - notes[i]) % 12;
                if (interval === 6) dissonanceScore += 3; // Tritone
            }
        }
    });
    
    const avgDissonance = dissonanceScore / progression.length;
    if (avgDissonance >= 3) return "high";
    if (avgDissonance >= 1) return "medium";
    return "low";
}

/**
 * AI-Assisted Voicing Suggestions
 * Uses Gemini API to suggest alternative chord voicings based on energy level
 * @param {Array<number>} chordNotes - Current chord notes (MIDI)
 * @param {string} energyLevel - "high", "medium", or "low"
 * @param {function} callback - Callback function to handle suggestions
 */
function suggestVoicingsWithAI(chordNotes, energyLevel, callback) {
    // Cache key based on chord and energy
    const cacheKey = `${chordNotes.join(',')}_${energyLevel}`;
    if (aiCache[cacheKey]) {
        callback(null, aiCache[cacheKey]);
        return;
    }
    
    // Convert MIDI notes to note names for the prompt
    const noteNames = chordNotes.map(note => midiToNoteName(note)).join(', ');
    
    // Create prompt based on energy level
    let prompt = `Suggest 3 alternative chord voicings for the chord with notes: ${noteNames}. `;
    
    if (energyLevel === "high") {
        prompt += "The musical context has high energy/tension. Suggest voicings that maintain or increase tension, such as inverted voicings, added tensions, or polychords. Focus on complex, dissonant alternatives.";
    } else if (energyLevel === "low") {
        prompt += "The musical context has low energy/stability. Suggest voicings that are consonant and stable, such as root position triads, open voicings, or simple extensions.";
    } else {
        prompt += "The musical context has medium energy. Suggest balanced voicings that fit well in a typical chord progression.";
    }
    
    prompt += " Return only the chord symbols or note lists, one per line, no explanations.";
    
    // Make API call to Gemini
    makeGeminiRequest(prompt, (error, response) => {
        if (error) {
            callback(error, null);
            return;
        }
        
        // Parse response - expect lines of chord symbols or note lists
        const suggestions = parseGeminiResponse(response);
        aiCache[cacheKey] = suggestions;
        callback(null, suggestions);
    });
}

/**
 * Convert MIDI note to note name
 * @param {number} midiNote
 * @returns {string}
 */
function midiToNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    return noteNames[noteIndex] + octave;
}

/**
 * Make HTTP request to Gemini API
 * @param {string} prompt
 * @param {function} callback
 */
function makeGeminiRequest(prompt, callback) {
    // This will be handled by the Max patcher using jit.uldl
    // Send the prompt to Max for HTTP request
    if (typeof max !== 'undefined') {
        max.outlet("gemini_request", prompt);
        // Store callback for when response comes back
        pendingCallbacks.push(callback);
    } else {
        // Fallback for testing
        callback(new Error("Max environment not available"), null);
    }
}

/**
 * Parse Gemini API response
 * @param {string} response
 * @returns {Array<string>}
 */
function parseGeminiResponse(response) {
    // Split by lines and clean up
    return response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 3); // Take first 3 suggestions
}

/**
 * Handle Gemini response from Max
 * @param {string} response
 */
function handleGeminiResponse(response) {
    const callback = pendingCallbacks.shift();
    if (callback) {
        if (response.startsWith("ERROR:")) {
            callback(new Error(response.substring(6)), null);
        } else {
            callback(null, response);
        }
    }
}

// Cache for AI suggestions
const aiCache = {};
// Pending callbacks for async responses
const pendingCallbacks = [];

// MIDI Export Functions

/**
 * Export progression to MIDI file
 * @param {Array} progression - Array of chord objects with notes and duration
 * @param {number} tempo - BPM (default 120)
 * @param {number} timeSignatureNumerator - Time signature numerator (default 4)
 * @param {number} timeSignatureDenominator - Time signature denominator (default 4)
 * @returns {ArrayBuffer} MIDI file data as ArrayBuffer
 */
function exportProgressionToMidi(progression, tempo = 120, timeSignatureNumerator = 4, timeSignatureDenominator = 4) {
    const midiData = generateMidiFile(progression, tempo, timeSignatureNumerator, timeSignatureDenominator);
    return midiData;
}

/**
 * Generate MIDI file binary data
 * @param {Array} progression - Array of chord objects
 * @param {number} tempo - BPM
 * @param {number} timeSigNum - Time signature numerator
 * @param {number} timeSigDen - Time signature denominator
 * @returns {ArrayBuffer} MIDI file data
 */
function generateMidiFile(progression, tempo, timeSigNum, timeSigDen) {
    const division = 480; // Ticks per quarter note
    const microsecondsPerQuarter = Math.round(60000000 / tempo); // Microseconds per quarter note
    
    // Build track events with absolute timing
    const events = [];
    
    // Time signature meta event (at time 0)
    events.push({
        absoluteTime: 0,
        type: 'meta',
        metaType: 0x58, // Time signature
        data: [timeSigNum, Math.log2(timeSigDen), 24, 8] // nn, dd, cc, bb
    });
    
    // Tempo meta event (at time 0)
    const tempoBytes = [];
    let tempValue = microsecondsPerQuarter;
    for (let i = 2; i >= 0; i--) {
        tempoBytes[i] = tempValue & 0xFF;
        tempValue >>= 8;
    }
    events.push({
        absoluteTime: 0,
        type: 'meta',
        metaType: 0x51, // Set tempo
        data: tempoBytes
    });
    
    let currentTime = 0;
    
    // Process each chord in the progression
    progression.forEach((chord) => {
        const notes = chord.notes || [];
        const duration = chord.duration || 4; // Default 4 beats
        const noteDurationTicks = duration * division; // Convert beats to ticks
        
        // Note on events for all notes in the chord (simultaneous at chord start)
        notes.forEach((note) => {
            const velocity = 100; // Default velocity
            
            events.push({
                absoluteTime: currentTime,
                type: 'midi',
                status: 0x90, // Note on, channel 0
                data1: note,
                data2: velocity
            });
        });
        
        // Note off events (simultaneous at end of chord)
        const endTime = currentTime + noteDurationTicks;
        notes.forEach((note) => {
            events.push({
                absoluteTime: endTime,
                type: 'midi',
                status: 0x80, // Note off, channel 0
                data1: note,
                data2: 0 // Release velocity
            });
        });
        
        // Advance time by chord duration
        currentTime += noteDurationTicks;
    });
    
    // End of track meta event
    events.push({
        absoluteTime: currentTime,
        type: 'meta',
        metaType: 0x2F, // End of track
        data: []
    });
    
    // Sort events by absolute time
    events.sort((a, b) => a.absoluteTime - b.absoluteTime);
    
    // Convert absolute times to delta times
    let previousTime = 0;
    events.forEach(event => {
        event.deltaTime = event.absoluteTime - previousTime;
        previousTime = event.absoluteTime;
    });
    
    // Convert events to MIDI track data
    const trackData = eventsToMidiBytes(events);
    
    // Build MIDI file
    const header = createMidiHeader(0, 1, division); // Format 0, 1 track
    const track = createMidiTrack(trackData);
    
    // Combine header and track
    const totalLength = header.length + track.length;
    const midiFile = new Uint8Array(totalLength);
    midiFile.set(header, 0);
    midiFile.set(track, header.length);
    
    return midiFile.buffer;
}

/**
 * Create MIDI header chunk
 * @param {number} format - MIDI format (0, 1, or 2)
 * @param {number} tracks - Number of tracks
 * @param {number} division - Ticks per quarter note
 * @returns {Uint8Array} Header chunk bytes
 */
function createMidiHeader(format, tracks, division) {
    const header = new Uint8Array(14);
    
    // MThd
    header[0] = 0x4D; // M
    header[1] = 0x54; // T
    header[2] = 0x68; // h
    header[3] = 0x64; // d
    
    // Length (always 6)
    header[4] = 0x00;
    header[5] = 0x00;
    header[6] = 0x00;
    header[7] = 0x06;
    
    // Format
    header[8] = 0x00;
    header[9] = format;
    
    // Number of tracks
    header[10] = 0x00;
    header[11] = tracks;
    
    // Division (ticks per quarter note)
    header[12] = (division >> 8) & 0xFF;
    header[13] = division & 0xFF;
    
    return header;
}

/**
 * Create MIDI track chunk
 * @param {Uint8Array} trackData - Track event data
 * @returns {Uint8Array} Track chunk bytes
 */
function createMidiTrack(trackData) {
    const trackLength = trackData.length;
    const track = new Uint8Array(8 + trackLength);
    
    // MTrk
    track[0] = 0x4D; // M
    track[1] = 0x54; // T
    track[2] = 0x72; // r
    track[3] = 0x6B; // k
    
    // Track data length (big-endian)
    track[4] = (trackLength >> 24) & 0xFF;
    track[5] = (trackLength >> 16) & 0xFF;
    track[6] = (trackLength >> 8) & 0xFF;
    track[7] = trackLength & 0xFF;
    
    // Track data
    track.set(trackData, 8);
    
    return track;
}

/**
 * Convert events to MIDI bytes
 * @param {Array} events - Array of MIDI events
 * @returns {Uint8Array} MIDI track data bytes
 */
function eventsToMidiBytes(events) {
    const bytes = [];
    
    events.forEach(event => {
        // Write delta time (variable length)
        writeVariableLengthQuantity(bytes, event.deltaTime);
        
        if (event.type === 'midi') {
            // MIDI event
            bytes.push(event.status);
            bytes.push(event.data1);
            if (event.data2 !== undefined) {
                bytes.push(event.data2);
            }
        } else if (event.type === 'meta') {
            // Meta event
            bytes.push(0xFF);
            bytes.push(event.metaType);
            writeVariableLengthQuantity(bytes, event.data.length);
            event.data.forEach(byte => bytes.push(byte));
        }
    });
    
    return new Uint8Array(bytes);
}

/**
 * Write variable length quantity to byte array
 * @param {Array} bytes - Byte array to write to
 * @param {number} value - Value to write
 */
function writeVariableLengthQuantity(bytes, value) {
    if (value === 0) {
        bytes.push(0);
        return;
    }
    
    const buffer = [];
    while (value > 0) {
        buffer.unshift(value & 0x7F);
        value >>= 7;
    }
    
    for (let i = 0; i < buffer.length - 1; i++) {
        bytes.push(buffer[i] | 0x80);
    }
    bytes.push(buffer[buffer.length - 1]);
}

/**
 * Save MIDI file to disk (Max environment)
 * @param {ArrayBuffer} midiData - MIDI file data
 * @param {string} filename - Output filename
 */
function saveMidiFile(midiData, filename) {
    if (typeof max !== 'undefined') {
        // Convert ArrayBuffer to array of bytes for Max
        const uint8Array = new Uint8Array(midiData);
        const byteArray = Array.from(uint8Array);
        
        // Send to Max for file saving
        max.outlet("save_midi_file", filename, byteArray);
    } else {
        // Node.js fallback (for testing)
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(process.cwd(), filename);
        fs.writeFileSync(outputPath, Buffer.from(midiData));
        console.log(`MIDI file saved to: ${outputPath}`);
    }
}

exports.getChordNotes = getChordNotes;
exports.getDiatonicQuality = getDiatonicQuality;
exports.getBorrowedChord = getBorrowedChord;
exports.applyExtensions = applyExtensions;
exports.applyInversion = applyInversion;
exports.applyDropVoicing = applyDropVoicing;
exports.applyVoicing = applyVoicing;
exports.getVoicingDescription = getVoicingDescription;
exports.MODAL_PROFILES = MODAL_PROFILES;
exports.CHORD_FORMULAS = CHORD_FORMULAS;
exports.TRANSITION_PRESETS = TRANSITION_PRESETS;
exports.buildTransition = buildTransition;
exports.buildProbabilisticTransition = buildProbabilisticTransition;
exports.selectWeightedOption = selectWeightedOption;
exports.parseChordSequence = parseChordSequence;
exports.parseChordSymbol = parseChordSymbol;
exports.parseDegree = parseDegree;
exports.mapQualityString = mapQualityString;
exports.createCustomTransition = createCustomTransition;
exports.saveCustomTransition = saveCustomTransition;
exports.loadCustomTransition = loadCustomTransition;
exports.getAllCustomTransitions = getAllCustomTransitions;
exports.analyzeSectionEnergy = analyzeSectionEnergy;
exports.suggestVoicingsWithAI = suggestVoicingsWithAI;
exports.handleGeminiResponse = handleGeminiResponse;
exports.exportProgressionToMidi = exportProgressionToMidi;
exports.generateMidiFile = generateMidiFile;
exports.saveMidiFile = saveMidiFile;