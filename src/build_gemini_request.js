/**
 * Build Gemini Request
 * Formats prompts for Gemini API calls
 */

function buildGeminiRequest(prompt, apiKey) {
  if (!prompt || !apiKey) {
    max.outlet(0, "ERROR: Missing prompt or API key");
    return;
  }

  const request = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  // Output JSON string for jit.uldl
  max.outlet(0, JSON.stringify(request));
}

// Handle input from Max
max.addHandler("build_request", (prompt) => {
  // Get API key from inlet 1
  const apiKey = max.getinletassist ? max.getinletassist(1) : null;
  buildGeminiRequest(prompt, apiKey);
});

// Default handler for single inlet
max.addHandler("anything", (prompt) => {
  buildGeminiRequest(prompt, null);
});
