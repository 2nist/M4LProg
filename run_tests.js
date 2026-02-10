/**
 * Hardware Bridge Test Runner
 * Runs the hardware tests in a Node.js environment with Max mocks
 */

// Mock the Max environment
global.max = {
    outlet: function(type, ...args) {
        // Store messages for testing
        if (!this.messages) this.messages = [];
        this.messages.push({type, args, timestamp: Date.now()});
    }
};

global.post = function(message) {
    console.log(message.replace(/\n$/, ''));
};

// Mock require for the Hardware Bridge
global.require = function(moduleName) {
    if (moduleName === "Hardware Bridge.js") {
        // Simulate loading the Hardware Bridge module
        return {
            initializeNativeMode: function() {
                max.outlet("midi", 0x8F, 0x00, 0x7F);
                this.updateDisplay(0, "CHORD GEN", [127, 255, 127]);
            },

            updateDisplay: function(line, content, rgb = [127, 127, 127]) {
                let textBytes;
                if (Array.isArray(content)) {
                    textBytes = content;
                } else {
                    let processedContent = content;
                    processedContent = processedContent.replace(/♪/g, String.fromCharCode(0x0B));
                    textBytes = processedContent.split('').map(c => c.charCodeAt(0));
                }

                const alignment = 0x01;
                const msg = [
                    0xF0, 0x00, 0x01, 0x06, 0x22, 0x12, // SYSEX_HEADER
                    line,
                    rgb[0], rgb[1], rgb[2],
                    alignment,
                    ...textBytes,
                    0xF7
                ];
                max.outlet("sysex", ...msg);
            },

            parseRelativeCC: function(cc, value) {
                let delta = 0;
                if (value <= 64) {
                    delta = value;
                } else {
                    delta = value - 128;
                }

                const encoderIndex = cc - 14; // ENCODER_BASE_CC
                max.outlet("encoder_delta", encoderIndex, delta);
            },

            setPadState: function(note, mode) {
                max.outlet("midi", 0x90, note, mode);
            },

            NOTE_ICON_BYTE: 0x0B
        };
    }
    throw new Error("Module not found: " + moduleName);
};

// Load and run the tests
try {
    console.log("Running Hardware Bridge Tests...\n");
    const hardwareTests = require('./tests/hardware_tests.js');
    hardwareTests.runHardwareBridgeTests();

    console.log("\nRunning Advanced Transitions Tests...\n");
    const advancedTests = require('./tests/advanced_transitions_tests.js');
    advancedTests.runAdvancedTransitionsTests();
} catch (error) {
    console.error("Error running tests:", error.message);
    console.error(error.stack);
}