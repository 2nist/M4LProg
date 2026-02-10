const theory = require('./Music Theory Engine');

// Storage keys inside the Max dict
const PATTERN_DICT_KEY = 'progression_patterns';
const SAVED_PROGRESSIONS_KEY = 'saved_progressions';

// Default pattern definitions (degrees are scale degrees inside a major scale)
const DEFAULT_PATTERNS = [
    {
        id: 'pop_1-5-6-4',
        name: 'I-V-vi-IV (Pop Cadence)',
        description: 'Classic pop progression with a hopeful resolution',
        degrees: ['1', '5', '6', '4'],
        qualities: ['Maj', 'Maj', 'min', 'Maj'],
        duration: 4
    },
    {
        id: 'sensitive_vi-iv-i-v',
        name: 'vi-IV-I-V (Sensitive Loop)',
        description: 'Emotionally charged loop used in ballads',
        degrees: ['6', '4', '1', '5'],
        qualities: ['min', 'Maj', 'Maj', 'Maj'],
        duration: 4
    },
    {
        id: '50s_i-vi-ii-v',
        name: 'I-vi-ii-V (50s Turnaround)',
        description: 'Jazz/blues turnaround popular in classic progressions',
        degrees: ['1', '6', '2', '5'],
        qualities: ['Maj', 'min', 'min', 'Maj'],
        duration: 4
    }
].map(pattern => ({
    ...pattern,
    semitones: pattern.degrees.map(deg => normalizeDegree(deg))
}));

let songDict;

function normalizeDegree(degree) {
    return ((theory.parseDegree(degree) || 0) % 12 + 12) % 12;
}

function initialize(dictRef) {
    if (!dictRef || typeof dictRef.get !== 'function' || typeof dictRef.set !== 'function') {
        throw new Error('Progression Manager requires a valid dict-like object');
    }
    songDict = dictRef;
    ensureSectionsStore();
    ensurePatternStore();
    ensureSavedProgressionStore();
}

function ensureSectionsStore() {
    if (!songDict) return;
    let sections = songDict.get('sections');
    if (!Array.isArray(sections) || sections.length === 0) {
        sections = [createEmptySection('Section 1')];
        songDict.set('sections', sections);
    }
    if (typeof songDict.get('current_section_index') !== 'number') {
        songDict.set('current_section_index', 0);
    }
}

function createEmptySection(name = 'New Section') {
    return {
        name,
        progression: [],
        rootHeld: null,
        currentNotes: [],
        transitions: { type: 'none', length: 2 }
    };
}

function cloneSection(section) {
    return {
        name: section.name,
        progression: cloneProgression(section.progression),
        rootHeld: section.rootHeld,
        currentNotes: Array.isArray(section.currentNotes) ? [...section.currentNotes] : [],
        transitions: { ...section.transitions }
    };
}

function cloneProgression(progression = []) {
    return progression.map(chord => ({
        notes: Array.isArray(chord.notes) ? [...chord.notes] : [],
        duration: chord.duration,
        metadata: chord.metadata ? { ...chord.metadata } : undefined
    }));
}

function getCurrentSectionIndex() {
    if (!songDict) return 0;
    let index = songDict.get('current_section_index');
    if (typeof index !== 'number') {
        index = 0;
        songDict.set('current_section_index', index);
    }
    const sections = songDict.get('sections');
    if (!Array.isArray(sections) || sections.length === 0) {
        ensureSectionsStore();
        return 0;
    }
    if (index < 0 || index >= sections.length) {
        index = 0;
        songDict.set('current_section_index', index);
    }
    return index;
}

function getSections() {
    ensureSectionsStore();
    return songDict.get('sections');
}

function loadCurrentSection() {
    ensureSectionsStore();
    const index = getCurrentSectionIndex();
    const sections = getSections();
    return { section: cloneSection(sections[index]), index };
}

function saveCurrentSection(section, overrideIndex) {
    ensureSectionsStore();
    const index = typeof overrideIndex === 'number' ? overrideIndex : getCurrentSectionIndex();
    const sections = getSections();
    sections[index] = cloneSection(section);
    songDict.set('sections', sections);
    return { section: cloneSection(sections[index]), index };
}

function moveSection(offset) {
    ensureSectionsStore();
    const sections = getSections();
    let index = getCurrentSectionIndex();
    index = Math.max(0, Math.min(sections.length - 1, index + offset));
    songDict.set('current_section_index', index);
    return loadCurrentSection();
}

function createSection(name) {
    ensureSectionsStore();
    const sections = getSections();
    const newSection = createEmptySection(name || `Section ${sections.length + 1}`);
    sections.push(newSection);
    songDict.set('sections', sections);
    songDict.set('current_section_index', sections.length - 1);
    return { section: cloneSection(newSection), index: sections.length - 1 };
}

function ensurePatternStore() {
    if (!songDict) return;
    const store = songDict.get(PATTERN_DICT_KEY);
    if (!store || typeof store !== 'object') {
        songDict.set(PATTERN_DICT_KEY, {});
    }
}

function ensureSavedProgressionStore() {
    if (!songDict) return;
    const store = songDict.get(SAVED_PROGRESSIONS_KEY);
    if (!store || typeof store !== 'object') {
        songDict.set(SAVED_PROGRESSIONS_KEY, {});
    }
}

function getCustomPatternStore() {
    ensurePatternStore();
    return songDict.get(PATTERN_DICT_KEY) || {};
}

function listCustomPatterns() {
    return Object.values(getCustomPatternStore());
}

function getPatternDefinitions() {
    return [...DEFAULT_PATTERNS, ...listCustomPatterns()];
}

function detectPatterns(progression, keyRoot) {
    if (!Array.isArray(progression) || progression.length === 0) {
        return [];
    }
    const baseRoot = typeof keyRoot === 'number' ? keyRoot : progression[0]?.notes?.[0] || 60;
    const offsets = progression
        .map(chord => chord && Array.isArray(chord.notes) && chord.notes.length > 0 ? chord.notes[0] : null)
        .filter(note => typeof note === 'number')
        .map(note => ((note - baseRoot) % 12 + 12) % 12);
    if (offsets.length < 2) return [];
    const definitions = getPatternDefinitions();
    const matches = [];
    definitions.forEach(pattern => {
        if (!Array.isArray(pattern.semitones) || pattern.semitones.length === 0) return;
        const signature = pattern.semitones;
        if (signature.length > offsets.length) return;
        for (let start = 0; start <= offsets.length - signature.length; start++) {
            let match = true;
            for (let i = 0; i < signature.length; i++) {
                if (signature[i] !== offsets[start + i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matches.push({
                    id: pattern.id,
                    name: pattern.name,
                    description: pattern.description,
                    startIndex: start,
                    length: signature.length,
                    root: baseRoot
                });
            }
        }
    });
    return matches;
}

function findPattern(idOrName) {
    const normalized = idOrName && idOrName.toLowerCase();
    return getPatternDefinitions().find(pattern =>
        pattern.id.toLowerCase() === normalized || pattern.name.toLowerCase() === normalized
    );
}

function applyPattern(patternId, options = {}) {
    const pattern = findPattern(patternId);
    if (!pattern) return null;
    const root = typeof options.root === 'number' ? options.root : 60;
    const duration = options.duration || pattern.duration || 4;
    return pattern.degrees.map((degree, index) => {
        const quality = (Array.isArray(pattern.qualities) && pattern.qualities[index]) || pattern.defaultQuality || 'Maj';
        const chordRoot = root + normalizeDegree(degree);
        return {
            notes: theory.getChordNotes(chordRoot, quality),
            duration
        };
    });
}

function saveCustomPattern(name, degreeSequence, description = '') {
    if (!name || !degreeSequence) return null;
    const degrees = degreeSequence
        .trim()
        .split(/\s+/)
        .filter(token => token.length > 0);
    if (degrees.length < 2) return null;
    const semitones = degrees.map(degree => normalizeDegree(degree));
    const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const pattern = { id, name, description, degrees, semitones, custom: true, duration: 4 };
    const store = { ...getCustomPatternStore(), [id]: pattern };
    songDict.set(PATTERN_DICT_KEY, store);
    return pattern;
}

function listSavedProgressions() {
    ensureSavedProgressionStore();
    return songDict.get(SAVED_PROGRESSIONS_KEY) || {};
}

function saveProgressionSnapshot(name, progression, metadata = {}) {
    if (!name) return null;
    ensureSavedProgressionStore();
    const store = { ...listSavedProgressions() };
    store[name] = {
        name,
        progression: cloneProgression(progression),
        metadata: { ...metadata, savedAt: Date.now() }
    };
    songDict.set(SAVED_PROGRESSIONS_KEY, store);
    return store[name];
}

function loadProgressionSnapshot(name) {
    const store = listSavedProgressions();
    const snapshot = store[name];
    if (!snapshot) return null;
    return {
        name: snapshot.name,
        progression: cloneProgression(snapshot.progression),
        metadata: { ...snapshot.metadata }
    };
}

function deleteProgressionSnapshot(name) {
    const store = { ...listSavedProgressions() };
    if (!(name in store)) return false;
    delete store[name];
    songDict.set(SAVED_PROGRESSIONS_KEY, store);
    return true;
}

module.exports = {
    initialize,
    loadCurrentSection,
    saveCurrentSection,
    moveSection,
    createSection,
    detectPatterns,
    getPatternDefinitions,
    applyPattern,
    saveCustomPattern,
    listCustomPatterns,
    listSavedProgressions,
    saveProgressionSnapshot,
    loadProgressionSnapshot,
    deleteProgressionSnapshot
};