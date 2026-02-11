/**
 * Gemini AI Service
 * Handles communication with Google's Gemini API for chord progression suggestions
 *
 * Ported from: docs/reference/build_gemini_request.js and parse_gemini_response.js
 */

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

/**
 * Gemini API Service Class
 */
export class GeminiService {
  private apiKey: string = "";
  private model: string = "gemini-pro";
  private temperature: number = 0.7;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";

  /**
   * Configure the Gemini service
   */
  configure(config: GeminiConfig): void {
    this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
  }

  /**
   * Set API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Build a Gemini API request from a text prompt
   */
  buildRequest(prompt: string): GeminiRequest | null {
    if (!this.apiKey) {
      throw new Error("No API key set for Gemini service");
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    return {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };
  }

  /**
   * Send a request to Gemini API
   */
  async sendRequest(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error("No API key configured");
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          generationConfig: {
            temperature: this.temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      return data;

    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini API response and extract text
   */
  parseResponse(response: GeminiResponse): string {
    try {
      if (response.error) {
        throw new Error(`Gemini API error: ${response.error.message}`);
      }

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in Gemini response");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("Invalid response format from Gemini API");
      }

      return candidate.content.parts[0].text || "";

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw error;
    }
  }

  /**
   * Generate chord progression suggestions using Gemini
   */
  async generateProgressionSuggestion(
    currentProgression: string,
    genre?: string,
    mood?: string
  ): Promise<string> {
    const prompt = this.buildProgressionPrompt(currentProgression, genre, mood);
    const request = this.buildRequest(prompt);

    if (!request) {
      throw new Error("Failed to build Gemini request");
    }

    const response = await this.sendRequest(request);
    return this.parseResponse(response);
  }

  /**
   * Build a prompt for chord progression suggestions
   */
  private buildProgressionPrompt(
    currentProgression: string,
    genre?: string,
    mood?: string
  ): string {
    let prompt = `You are a music theory expert. Analyze this chord progression and suggest improvements or variations: "${currentProgression}"`;

    if (genre) {
      prompt += `\n\nConsider the ${genre} genre style.`;
    }

    if (mood) {
      prompt += `\n\nThe desired mood is: ${mood}`;
    }

    prompt += `\n\nProvide:
1. Analysis of the current progression
2. Suggested improvements or variations
3. Alternative chord voicings
4. Why these changes work musically

Keep your response focused on music theory and practical suggestions.`;

    return prompt;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Get current configuration (without exposing API key)
   */
  getConfig(): Omit<GeminiConfig, 'apiKey'> & { configured: boolean } {
    return {
      configured: this.isConfigured(),
      model: this.model,
      temperature: this.temperature,
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();