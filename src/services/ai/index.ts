/**
 * AI Services
 * Collection of AI-related services for the application
 */

// Export Gemini AI service
export { GeminiService, geminiService } from './GeminiService';

// Export File service
export { FileService, fileService } from './FileService';

// Re-export types
export type { GeminiRequest, GeminiResponse, GeminiConfig } from './GeminiService';
export type { FileSaveOptions, FileLoadOptions } from './FileService';