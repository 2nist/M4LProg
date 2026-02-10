/**
 * Build Gemini API Request
 * Formats the prompt and API key into a proper Gemini API request
 */

let apiKey = "";

function setApiKey(key) {
    apiKey = key;
}

function buildRequest(prompt) {
    if (!apiKey) {
        outlet(0, "ERROR: No API key set");
        return;
    }
    
    const request = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    };
    
    // Output the JSON request
    outlet(0, JSON.stringify(request));
}

// Handle input
function msg_int(value) {
    // If it's 1, might be a trigger, but we'll handle in inlet
}

function anything() {
    const args = arrayfromargs(arguments);
    if (inlet === 0) {
        // Prompt from controller
        buildRequest(args.join(" "));
    } else if (inlet === 1) {
        // API key
        setApiKey(args.join(" "));
    }
}