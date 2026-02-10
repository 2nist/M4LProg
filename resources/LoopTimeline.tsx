/**
 * LoopTimeline Component
 * 
 * Expandable timeline with analog warmth styling
 * Features: drag-to-resize, multiple view modes, drag-drop sections
 */

import { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Maximize2, X } from 'lucide-react';
import { useExpandableTimeline, TimelineMode } from './useExpandableTimeline';
import { useProgressionStore } from '../stores/progressionStore';
import './timeline-analog.css';

export function LoopTimeline() {
  const { sections } = useProgressionStore();
  
  const {
    mode,
    height,
    isDragging,
    changeMode,
    toggle,
    handlers,
    sizes,
  } = useExpandableTimeline({
    initialMode: 'normal',
    onModeChange: (newMode) => {
      console.log('Timeline mode changed:', newMode);
    },
  });

  // Playhead state (will be controlled by transport)
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Calculate current bar:beat position
  const beatsPerBar = 4;
  const currentBar = Math.floor(currentBeat / beatsPerBar) + 1;
  const currentBeatInBar = (currentBeat % beatsPerBar) + 1;

  return (
    <>
      {/* Overlay backdrop for fullscreen */}
      {mode === 'fullscreen' && (
        <div 
          className="timeline-overlay-backdrop"
          onClick={() => changeMode('normal')}
        />
      )}

      <div 
        className={`timeline-container ${mode}`}
        style={{ height: mode === 'fullscreen' ? '100vh' : `${height}px` }}
      >
        {/* Resize handle */}
        <div 
          className={`timeline-resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handlers.onDragStart}
        >
          {isDragging && (
            <div className="resize-tooltip">
              {Math.round(height)}px
            </div>
          )}
        </div>

        {/* Size presets */}
        <div className="timeline-size-presets">
          <button
            className={`size-preset-btn ${mode === 'collapsed' ? 'active' : ''}`}
            onClick={() => changeMode('collapsed')}
            title="Collapsed (80px)"
          >
            Min
          </button>
          <button
            className={`size-preset-btn ${mode === 'normal' ? 'active' : ''}`}
            onClick={() => changeMode('normal')}
            title="Normal (200px)"
          >
            Norm
          </button>
          <button
            className={`size-preset-btn ${mode === 'expanded' ? 'active' : ''}`}
            onClick={() => changeMode('expanded')}
            title="Expanded (400px)"
          >
            Max
          </button>
          <button
            className={`size-preset-btn ${mode === 'fullscreen' ? 'active' : ''}`}
            onClick={() => changeMode('fullscreen')}
            title="Fullscreen (Shift+T)"
          >
            Full
          </button>
        </div>

        {/* Expand/collapse button */}
        <button 
          className="timeline-expand-btn"
          onClick={toggle}
          title={mode === 'normal' ? 'Expand timeline (T)' : 'Collapse timeline (T)'}
        >
          {mode === 'normal' || mode === 'collapsed' ? (
            <>
              <ChevronUp size={14} />
              Expand
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Collapse
            </>
          )}
        </button>

        {/* Fullscreen close button */}
        <button
          className="timeline-fullscreen-close"
          onClick={() => changeMode('normal')}
          title="Exit fullscreen (Esc)"
        >
          <X size={20} />
        </button>

        {/* Timeline content */}
        <div className="timeline-content">
          {/* Navigation strip */}
          <div className="timeline-nav-strip">
            <div className="timeline-transport-controls">
              <button className="transport-btn" title="Skip to start">
                ⏮
              </button>
              <button className="transport-btn" title="Previous bar">
                ⏪
              </button>
              <button 
                className={`transport-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="transport-btn" title="Next bar">
                ⏩
              </button>
              <button className="transport-btn" title="Skip to end">
                ⏭
              </button>
            </div>

            <div className="position-display">
              <span>Bar: {currentBar}</span>
              <span className="position-separator">|</span>
              <span>Beat: {currentBeatInBar}</span>
              <span className="position-separator">|</span>
              <span>00:00 / 02:30</span>
            </div>

            <div className="loop-toggle active" title="Loop enabled">
              🔁 Loop
            </div>
          </div>

          {/* Main timeline track */}
          <div className="timeline-track-wrapper">
            <div className="timeline-track">
              <div className="timeline-scroll-container">
                {/* Pre-buffer cards */}
                <div className="buffer-card">
                  <span className="buffer-title">Song Overview</span>
                  <div className="buffer-content">
                    {sections.length} sections, 48 total beats
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">Key & Tempo</span>
                  <div className="buffer-content">
                    C Major, 120 BPM, 4/4
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">Pattern Info</span>
                  <div className="buffer-content">
                    I-V-vi-IV detected in Section 1
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">💡 Theory Tip</span>
                  <div className="buffer-content">
                    This progression creates tension and release
                  </div>
                </div>

                {/* Section cards */}
                {sections.map((section, index) => (
                  <div 
                    key={index}
                    className="section-card chord-quality-maj"
                  >
                    <div className="drag-handle" />
                    
                    <span className="section-name">{section.name}</span>
                    
                    <div className="duration-indicator">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div 
                          key={i}
                          className={`duration-beat ${i < 3 ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                    
                    <div className="section-meta">
                      <div className="section-meta-item">
                        <span className="repeat-badge">×{section.repeats || 1}</span>
                      </div>
                      <div className="section-meta-item">
                        <span>{Math.ceil((section.progression.reduce((s, c) => s + c.duration, 0) * (section.repeats || 1)) / (section.beatsPerBar || 4))} bars</span>
                      </div>
                      <div className="section-meta-item">
                        <span>{section.progression.length} chords</span>
                      </div>
                    </div>

                    {/* Expanded detail (only shown in expanded/fullscreen modes) */}
                    <div className="section-detail-expanded">
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Progression:</strong>
                      </div>
                      <div className="chord-list-compact">
                        {section.progression.map((chord, chordIdx) => (
                          <div key={chordIdx} className="chord-chip">
                            {chord.metadata?.quality || '?'}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
                        {section.progression.reduce((s, c) => s + c.duration, 0)} beats total
                      </div>
                    </div>
                  </div>
                ))}

                {/* Post-buffer cards */}
                <div className="buffer-card">
                  <span className="buffer-title">🔄 Looping back...</span>
                  <div className="buffer-content">
                    Repeating from Section 1
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">📝 Metadata</span>
                  <div className="buffer-content">
                    Saved: 2026-02-10, Tags: Pop
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">🎼 Harmonic Summary</span>
                  <div className="buffer-content">
                    Diatonic: 85%, Borrowed: 15%
                  </div>
                </div>
                <div className="buffer-card">
                  <span className="buffer-title">💡 Suggestion</span>
                  <div className="buffer-content">
                    Try adding a pre-chorus section
                  </div>
                </div>
              </div>

              {/* Fixed playhead */}
              <div 
                className="playhead-dial"
                data-position={`${currentBar}:${currentBeatInBar}`}
              >
                <div className="playhead-position">
                  {currentBar}:{currentBeatInBar}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline controls panel */}
          <div className="timeline-controls-panel">
            <div className="control-group">
              <span className="control-label">Zoom</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                defaultValue="0.5"
                className="zoom-slider"
                title="Zoom level"
              />
              <span style={{ fontSize: '11px', color: 'hsl(45, 30%, 65%)' }}>
                30 px/beat
              </span>
            </div>

            <div className="control-group">
              <button className="preset-btn">Fit</button>
              <button className="preset-btn">2x</button>
              <button className="preset-btn active">Auto</button>
            </div>

            <div className="control-group">
              <label className="checkbox-toggle">
                <input type="checkbox" defaultChecked />
                <span className="checkbox-label">Show Buffer</span>
              </label>
            </div>

            <div className="control-group">
              <span className="control-label">Pre:</span>
              <input 
                type="number" 
                min="2" 
                max="8" 
                defaultValue="4" 
                className="buffer-input"
                title="Pre-buffer bars"
              />
            </div>

            <div className="control-group">
              <span className="control-label">Post:</span>
              <input 
                type="number" 
                min="2" 
                max="8" 
                defaultValue="4" 
                className="buffer-input"
                title="Post-buffer bars"
              />
            </div>

            <div className="control-group">
              <span className="control-label">Snap</span>
              <label className="checkbox-toggle">
                <input type="radio" name="snap" defaultChecked />
                <span className="checkbox-label">Bar</span>
              </label>
              <label className="checkbox-toggle">
                <input type="radio" name="snap" />
                <span className="checkbox-label">Beat</span>
              </label>
            </div>

            <div className="control-group">
              <label className="checkbox-toggle">
                <input type="checkbox" />
                <span className="checkbox-label">Stop at end</span>
              </label>
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="timeline-shortcut-hint">
          Press T to toggle • Shift+T for fullscreen • Drag edge to resize
        </div>
      </div>
    </>
  );
}
