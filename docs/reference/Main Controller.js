/**
 * Main Controller
 * The central hub orchestrating hardware, theory, and the LOM.
 */

const hw = require('./Hardware Bridge');
const theory = require('./Music Theory Engine');
const live = require('./Ableton LOM Bridge');
const progressionManager = require('./Progression Manager');

// State Management with Dict Persistence
let currentSection = {
    name: "Verse 1",
    progression: [],
    rootHeld: null,
    currentNotes: [],
    transitions: { type: "none", length: 2 }
};

const qualities = Object.keys(theory.CHORD_FORMULAS);
let currentQualityIndex = 0;
let currentDuration = 4; // Default 4 beats
let aiEnabled = false; // AI assistance toggle

// Voicing state
let currentInversion = 0; // 0 = root position, 1 = 1st inversion, etc.
let currentDropType = 0; // 0 = no drop, 1 = drop 2, 2 = drop 2&4, 3 = drop 3

progressionManager.initialize(max.getvalueof("song_data"));

// Load current section from dict
function loadCurrentSection() {
    const result = progressionManager.loadCurrentSection();
    currentSection = result.section;
    announceSection();
    publishSavedProgressions();
    publishProgressionPatterns();
}

// Save current section to dict
function saveCurrentSection() {
    progressionManager.saveCurrentSection(currentSection);
}

// Announce section change to UI
function announceSection() {
    const transitionName = theory.TRANSITION_PRESETS[currentSection.transitions.type].name;
    const displayText = `${currentSection.name} → ${transitionName}`;
    max.outlet(2, displayText);
    hw.updateDisplay(0, displayText, [127, 255, 127]);
}

function publishSavedProgressions() {
    const names = Object.keys(progressionManager.listSavedProgressions());
    const summary = names.length > 0 ? names.join(', ') : 'None';
    max.outlet('saved_progressions', summary);
}

function publishProgressionPatterns() {
    const matches = progressionManager.detectPatterns(
        currentSection.progression,
        currentSection.rootHeld || currentSection.progression[0]?.notes?.[0]
    );
    const summary = matches.length > 0 ? matches.map(match => match.name).join(', ') : 'None';
    max.outlet('analysis_status', matches.length > 0 ? `Detected: ${summary}` : 'No patterns detected');
}

/**
 * Handle MIDI Input from Max Patch
 */
max.addHandler("midi_in", (status, data1, data2) => {
    // Note On (Pad Press)
    if (status === 144 && data2 > 0) {
        const note = data1;
        if (note >= 36 && note <= 67) {
            handlePadPress(note);
        }
    }
    
    // Note Off (Pad Release)
    if (status === 128 || (status === 144 && data2 === 0)) {
        const note = data1;
        if (note === currentSection.rootHeld) {
            handlePadRelease(note);
        }
    }
    
    // Control Change (Encoders)
    if (status === 176) {
        hw.parseRelativeCC(data1, data2);
    }
});

/**
 * Handle Pad Press
 * Sets root and initial quality
 */
function handlePadPress(note) {
    currentSection.rootHeld = note;
    currentQualityIndex = 0; // Start with Major
    updateChordDisplay();
    hw.setPadState(note, 2); // Pulse pad
}

/**
 * Handle Pad Release
 * Clears root held state
 */
function handlePadRelease(note) {
    currentSection.rootHeld = null;
    hw.setPadState(note, 0); // Turn off pad
}

/**
 * Handle Encoder Delta
 * Encoder 0: Chord quality, Encoder 1: Duration, Encoder 2: Inversion, Encoder 3: Drop voicing
 */
max.addHandler("encoder_delta", (index, delta) => {
    if (index === 0 && currentSection.rootHeld) { // Encoder 1 (CC 14)
        currentQualityIndex = (currentQualityIndex + delta + qualities.length) % qualities.length;
        updateChordDisplay();
    } else if (index === 1) { // Encoder 2 (CC 15)
        currentDuration = Math.max(1, currentDuration + delta); // Min 1 beat
        updateChordDisplay();
    } else if (index === 2) { // Encoder 3 (CC 16) - Inversion
        currentInversion = Math.max(0, Math.min(3, currentInversion + delta)); // 0-3 range
        updateChordDisplay();
    } else if (index === 3) { // Encoder 4 (CC 17) - Drop voicing
        currentDropType = Math.max(0, Math.min(3, currentDropType + delta)); // 0-3 range
        updateChordDisplay();
    }
});

/**
 * Update Display and Notes for Current Chord
 */
function updateChordDisplay() {
    const root = currentSection.rootHeld;
    const quality = qualities[currentQualityIndex];
    
    // Get base chord notes
    let baseNotes = theory.getChordNotes(root, quality);
    
    // Apply voicing (inversion and drop voicing)
    currentSection.currentNotes = theory.applyVoicing(baseNotes, currentInversion, currentDropType);
    
    // Get voicing description
    const voicingDesc = theory.getVoicingDescription(currentInversion, currentDropType);
    
    hw.updateDisplay(1, `♪ ${root} ${quality} | ${currentDuration} beats | ${voicingDesc}`, [255, 127, 0]);
    
    // Send voicing info to individual displays
    const inversionNames = ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];
    const dropNames = ["None", "Drop 2", "Drop 2&4", "Drop 3"];
    
    max.outlet("display5", inversionNames[Math.min(currentInversion, 3)]);
    max.outlet("display6", dropNames[Math.min(currentDropType, 3)]);
    
    // Automatically get AI suggestions if enabled
    if (aiEnabled) {
        max.outlet("get_ai_suggestions"); // Trigger AI suggestion request
    }
}

max.addHandler("add_chord", () => { // No duration param, use current
    if (!currentSection.rootHeld) return;
    
    const chord = {
        notes: [...currentSection.currentNotes], // Copy current notes
        duration: currentDuration
    };
    
    currentSection.progression.push(chord);
    saveCurrentSection(); // Persist changes
    hw.updateDisplay(2, `Chords: ${currentSection.progression.length}`, [127, 127, 255]);
    publishProgressionPatterns();
});

max.addHandler("progression_save", (name) => {
    const cleanName = name && name.trim();
    if (!cleanName) {
        hw.updateDisplay(3, "Save name required", [255, 0, 0]);
        return;
    }
    const saved = progressionManager.saveProgressionSnapshot(cleanName, currentSection.progression, { root: currentSection.rootHeld });
    if (saved) {
        hw.updateDisplay(3, `Saved: ${cleanName}`, [0, 255, 0]);
        publishSavedProgressions();
    } else {
        hw.updateDisplay(3, `Save failed`, [255, 0, 0]);
    }
});

max.addHandler("progression_load", (name) => {
    const cleanName = name && name.trim();
    const loaded = progressionManager.loadProgressionSnapshot(cleanName);
    if (loaded) {
        currentSection.progression = loaded.progression;
        const lastChord = loaded.progression[loaded.progression.length - 1];
        currentSection.currentNotes = lastChord ? [...lastChord.notes] : [];
        saveCurrentSection();
        publishProgressionPatterns();
        hw.updateDisplay(3, `Loaded: ${cleanName}`, [0, 255, 0]);
    } else {
        hw.updateDisplay(3, `Not found: ${cleanName}`, [255, 0, 0]);
    }
});

max.addHandler("progression_delete", (name) => {
    const cleanName = name && name.trim();
    const deleted = progressionManager.deleteProgressionSnapshot(cleanName);
    hw.updateDisplay(3, deleted ? `Deleted: ${cleanName}` : `Missing: ${cleanName}`, deleted ? [0, 255, 0] : [255, 0, 0]);
    publishSavedProgressions();
});

max.addHandler("list_saved_progressions", () => {
    publishSavedProgressions();
});

max.addHandler("apply_pattern", (patternId) => {
    const matches = progressionManager.applyPattern(patternId, {
        root: currentSection.rootHeld || 60,
        duration: currentDuration
    });
    if (Array.isArray(matches)) {
        currentSection.progression = matches;
        saveCurrentSection();
        publishProgressionPatterns();
        hw.updateDisplay(3, `Pattern applied`, [0, 255, 0]);
    } else {
        hw.updateDisplay(3, `Pattern not found`, [255, 0, 0]);
    }
});

max.addHandler("detect_patterns", () => {
    publishProgressionPatterns();
});

max.addHandler("commit_to_live", (trackIdx) => {
    live.createArrangementProgression(currentSection.progression, trackIdx);
    saveCurrentSection(); // Ensure latest state is saved
});

max.addHandler("next_section", () => {
    const result = progressionManager.moveSection(1);
    currentSection = result.section;
    announceSection();
    publishSavedProgressions();
    publishProgressionPatterns();
});

max.addHandler("prev_section", () => {
    const result = progressionManager.moveSection(-1);
    currentSection = result.section;
    announceSection();
    publishSavedProgressions();
    publishProgressionPatterns();
});

max.addHandler("new_section", (name) => {
    const result = progressionManager.createSection(name);
    currentSection = result.section;
    announceSection();
    publishSavedProgressions();
    publishProgressionPatterns();
});

max.addHandler("set_transition_type", (type) => {
    currentSection.transitions.type = type;
    saveCurrentSection();
    announceSection();
});

max.addHandler("set_probabilistic_weights", (transitionType, ...weights) => {
    // Update weights for probabilistic transitions
    const preset = theory.TRANSITION_PRESETS[transitionType];
    if (preset && preset.type === "probabilistic") {
        preset.options.forEach((option, index) => {
            if (weights[index] !== undefined) {
                option.weight = weights[index];
            }
        });
    }
    saveCurrentSection();
});

max.addHandler("create_custom_transition", (name, sequenceStr) => {
    const customTransition = theory.createCustomTransition(name, sequenceStr);
    if (customTransition) {
        theory.saveCustomTransition(name.toLowerCase().replace(/\s+/g, '_'), customTransition);
        hw.updateDisplay(3, `Saved: ${name}`, [0, 255, 0]);
    } else {
        hw.updateDisplay(3, "Invalid sequence", [255, 0, 0]);
    }
});

max.addHandler("load_custom_transition", (key) => {
    const customTransition = theory.loadCustomTransition(key);
    if (customTransition) {
        currentSection.transitions.type = `custom_${key}`;
        // Add to TRANSITION_PRESETS temporarily
        theory.TRANSITION_PRESETS[`custom_${key}`] = customTransition;
        saveCurrentSection();
        announceSection();
        hw.updateDisplay(3, `Loaded: ${customTransition.name}`, [0, 255, 0]);
    } else {
        hw.updateDisplay(3, "Transition not found", [255, 0, 0]);
    }
});

max.addHandler("get_transition_types", () => {
    const basicTypes = Object.keys(theory.TRANSITION_PRESETS).filter(key => 
        !theory.TRANSITION_PRESETS[key].type || theory.TRANSITION_PRESETS[key].type === "basic"
    );
    const probabilisticTypes = Object.keys(theory.TRANSITION_PRESETS).filter(key => 
        theory.TRANSITION_PRESETS[key].type === "probabilistic"
    );
    const customTypes = Object.keys(theory.getAllCustomTransitions()).map(key => `custom_${key}`);
    
    max.outlet("transition_types", {
        basic: basicTypes,
        probabilistic: probabilisticTypes,
        custom: customTypes
    });
});

max.addHandler("trigger_transition", () => {
    if (currentSection.transitions.type !== "none") {
        // Assume root is from last chord or current
        const lastChord = currentSection.progression[currentSection.progression.length - 1];
        const root = lastChord ? lastChord.notes[0] : (currentSection.rootHeld || 60); // Default C4
        
        const preset = theory.TRANSITION_PRESETS[currentSection.transitions.type];
        if (preset) {
            let transitionNotes = [];
            
            if (preset.type === "probabilistic") {
                // Handle probabilistic transitions
                transitionNotes = preset.build(root, currentSection.transitions.length || 4);
            } else if (preset.type === "custom") {
                // Handle custom transitions
                transitionNotes = preset.build(root, currentSection.transitions.length || 4);
            } else {
                // Handle basic transitions
                const transition = theory.buildTransition(root, currentSection.transitions.type, currentSection.transitions.length || 2);
                transitionNotes = transition.notes;
            }
            
            if (transitionNotes.length > 0) {
                // Convert to chord format and add to progression
                const transitionChord = {
                    notes: transitionNotes.map(n => n.pitch),
                    duration: currentSection.transitions.length || 4
                };
                currentSection.progression.push(transitionChord);
                saveCurrentSection();
                hw.updateDisplay(2, `Transition added: ${preset.name}`, [255, 127, 0]);
            }
        }
    }
});

max.addHandler("toggle_ai", (enabled) => {
    aiEnabled = enabled === 1;
    hw.updateDisplay(3, `AI: ${aiEnabled ? 'ON' : 'OFF'}`, aiEnabled ? [0, 255, 0] : [255, 0, 0]);
});

max.addHandler("get_ai_suggestions", () => {
    if (!currentSection.rootHeld || !aiEnabled) return;
    
    const energyLevel = theory.analyzeSectionEnergy(currentSection.progression);
    theory.suggestVoicingsWithAI(currentSection.currentNotes, energyLevel, (error, suggestions) => {
        if (error) {
            hw.updateDisplay(4, `AI Error: ${error.message}`, [255, 0, 0]);
            return;
        }
        
        // Display suggestions on screen
        const displayText = suggestions.length > 0 ? `AI: ${suggestions[0]}` : "AI: No suggestions";
        hw.updateDisplay(4, displayText, [127, 255, 127]);
        
        // Store suggestions for potential use
        currentSection.aiSuggestions = suggestions;
        saveCurrentSection();
    });
});

// Handle Gemini response from patcher
max.addHandler("gemini_response", (response) => {
    theory.handleGeminiResponse(response);
});

// MIDI Export Handlers

max.addHandler("export_midi", (filename) => {
    if (!filename || filename.trim() === "") {
        filename = `chord_progression_${currentSection.name.replace(/\s+/g, '_')}.mid`;
    }
    
    try {
        const midiData = theory.exportProgressionToMidi(currentSection.progression);
        theory.saveMidiFile(midiData, filename);
        hw.updateDisplay(3, `Exported: ${filename}`, [0, 255, 0]);
    } catch (error) {
        hw.updateDisplay(3, `Export failed: ${error.message}`, [255, 0, 0]);
    }
});

max.addHandler("export_midi_with_settings", (filename, tempo, timeSigNum, timeSigDen) => {
    if (!filename || filename.trim() === "") {
        filename = `chord_progression_${currentSection.name.replace(/\s+/g, '_')}.mid`;
    }
    
    try {
        const midiData = theory.exportProgressionToMidi(
            currentSection.progression, 
            tempo || 120, 
            timeSigNum || 4, 
            timeSigDen || 4
        );
        theory.saveMidiFile(midiData, filename);
        hw.updateDisplay(3, `Exported: ${filename}`, [0, 255, 0]);
    } catch (error) {
        hw.updateDisplay(3, `Export failed: ${error.message}`, [255, 0, 0]);
    }
});

// Init on load
loadCurrentSection();
hw.initializeNativeMode();