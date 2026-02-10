/**
 * Parse Gemini API Response
 * Extracts the text from Gemini API response JSON
 */

function parseResponse(jsonString) {
    try {
        const response = JSON.parse(jsonString);
        
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            const text = response.candidates[0].content.parts[0].text;
            outlet(0, text);
        } else if (response.error) {
            outlet(0, `ERROR: ${response.error.message}`);
        } else {
            outlet(0, "ERROR: Unexpected response format");
        }
    } catch (error) {
        outlet(0, `ERROR: Failed to parse response - ${error.message}`);
    }
}

function anything() {
    const args = arrayfromargs(arguments);
    parseResponse(args.join(" "));
}