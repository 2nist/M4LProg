/**
 * File Service
 * Handles saving and loading files in the Electron app
 *
 * Ported from: docs/reference/file_saver.js
 * Adapted for Electron with file system access
 */

import { writeFile, readFile } from 'fs/promises';
import { dialog } from 'electron';
import { BrowserWindow } from 'electron';

export interface FileSaveOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface FileLoadOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/**
 * File Service Class
 */
export class FileService {
  private mainWindow: BrowserWindow | null = null;

  /**
   * Set the main window reference for dialog ownership
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Save MIDI file data to disk
   */
  async saveMidiFile(
    data: Uint8Array | number[],
    options: FileSaveOptions = {}
  ): Promise<string | null> {
    try {
      const defaultOptions: FileSaveOptions = {
        title: 'Save MIDI File',
        filters: [
          { name: 'MIDI Files', extensions: ['mid', 'midi'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        ...options
      };

      const result = await dialog.showSaveDialog(this.mainWindow!, defaultOptions);

      if (result.canceled || !result.filePath) {
        return null;
      }

      // Convert to Uint8Array if needed
      const byteArray = Array.isArray(data) ? new Uint8Array(data) : data;

      // Write file
      await writeFile(result.filePath, byteArray);

      console.log(`MIDI file saved to: ${result.filePath}`);
      return result.filePath;

    } catch (error) {
      console.error('Error saving MIDI file:', error);
      throw new Error(`Failed to save MIDI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load file data from disk
   */
  async loadFile(options: FileLoadOptions = {}): Promise<{ data: Uint8Array; path: string } | null> {
    try {
      const defaultOptions: FileLoadOptions = {
        title: 'Load File',
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ],
        ...options
      };

      const result = await dialog.showOpenDialog(this.mainWindow!, {
        ...defaultOptions,
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      const data = await readFile(filePath);

      console.log(`File loaded from: ${filePath}`);
      return { data, path: filePath };

    } catch (error) {
      console.error('Error loading file:', error);
      throw new Error(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save text content to a file
   */
  async saveTextFile(
    content: string,
    options: FileSaveOptions = {}
  ): Promise<string | null> {
    try {
      const defaultOptions: FileSaveOptions = {
        title: 'Save Text File',
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        ...options
      };

      const result = await dialog.showSaveDialog(this.mainWindow!, defaultOptions);

      if (result.canceled || !result.filePath) {
        return null;
      }

      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      await writeFile(result.filePath, data);

      console.log(`Text file saved to: ${result.filePath}`);
      return result.filePath;

    } catch (error) {
      console.error('Error saving text file:', error);
      throw new Error(`Failed to save text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load text content from a file
   */
  async loadTextFile(options: FileLoadOptions = {}): Promise<{ content: string; path: string } | null> {
    try {
      const result = await this.loadFile(options);

      if (!result) {
        return null;
      }

      // Convert Uint8Array to string
      const decoder = new TextDecoder();
      const content = decoder.decode(result.data);

      return { content, path: result.path };

    } catch (error) {
      console.error('Error loading text file:', error);
      throw new Error(`Failed to load text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export progression data as JSON
   */
  async exportProgression(
    progressionData: any,
    filename?: string
  ): Promise<string | null> {
    const jsonContent = JSON.stringify(progressionData, null, 2);
    return this.saveTextFile(jsonContent, {
      title: 'Export Progression',
      defaultPath: filename || 'progression.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
  }

  /**
   * Import progression data from JSON
   */
  async importProgression(): Promise<any | null> {
    const result = await this.loadTextFile({
      title: 'Import Progression',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!result) {
      return null;
    }

    try {
      return JSON.parse(result.content);
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }
}

// Export singleton instance
export const fileService = new FileService();