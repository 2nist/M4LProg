/**
 * useExpandableTimeline Hook
 *
 * Manages timeline expand/collapse state, drag-to-resize, and keyboard shortcuts
 * Usage: const { height, mode, handlers } = useExpandableTimeline();
 */

import { useState, useCallback, useEffect, useRef } from "react";

export type TimelineMode = "collapsed" | "normal" | "expanded" | "fullscreen";

interface TimelineSize {
  collapsed: number;
  normal: number;
  expanded: number;
  fullscreen: number;
}

const DEFAULT_SIZES: TimelineSize = {
  collapsed: 80,
  normal: 200,
  expanded: 400,
  fullscreen: 0, // Will use viewport height
};

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 800;

interface UseExpandableTimelineOptions {
  initialMode?: TimelineMode;
  sizes?: Partial<TimelineSize>;
  onModeChange?: (mode: TimelineMode) => void;
}

export function useExpandableTimeline(
  options: UseExpandableTimelineOptions = {},
) {
  const { initialMode = "normal", sizes = {}, onModeChange } = options;

  const timelineSizes = { ...DEFAULT_SIZES, ...sizes };

  const [mode, setMode] = useState<TimelineMode>(initialMode);
  const [customHeight, setCustomHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // Get current height
  const height = customHeight ?? timelineSizes[mode];

  // Change mode
  const changeMode = useCallback(
    (newMode: TimelineMode) => {
      setMode(newMode);
      setCustomHeight(null); // Reset custom height when changing modes
      onModeChange?.(newMode);
    },
    [onModeChange],
  );

  // Toggle between normal and expanded
  const toggle = useCallback(() => {
    const newMode = mode === "normal" ? "expanded" : "normal";
    changeMode(newMode);
  }, [mode, changeMode]);

  // Cycle through modes
  const cycle = useCallback(() => {
    const modes: TimelineMode[] = [
      "collapsed",
      "normal",
      "expanded",
      "fullscreen",
    ];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    changeMode(modes[nextIndex]);
  }, [mode, changeMode]);

  // Start drag resize
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartHeight.current = height;
    },
    [height],
  );

  // Handle drag resize
  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = dragStartY.current - e.clientY; // Inverted (drag up = increase)
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, dragStartHeight.current + deltaY),
      );

      setCustomHeight(newHeight);

      // Auto-snap to preset sizes
      const snapThreshold = 20;
      Object.entries(timelineSizes).forEach(([modeName, size]) => {
        if (modeName === "fullscreen") return;
        if (Math.abs(newHeight - size) < snapThreshold) {
          setCustomHeight(size);
          setMode(modeName as TimelineMode);
        }
      });
    },
    [isDragging, timelineSizes],
  );

  // End drag resize
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if timeline area is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT";

      if (isInputFocused) return;

      // T: Toggle timeline
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggle();
      }

      // Shift + T: Fullscreen
      if (e.shiftKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        changeMode(mode === "fullscreen" ? "normal" : "fullscreen");
      }

      // Escape: Exit fullscreen
      if (e.key === "Escape" && mode === "fullscreen") {
        e.preventDefault();
        changeMode("normal");
      }

      // Ctrl/Cmd + Up: Expand
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
        e.preventDefault();
        if (mode === "collapsed") changeMode("normal");
        else if (mode === "normal") changeMode("expanded");
        else if (mode === "expanded") changeMode("fullscreen");
      }

      // Ctrl/Cmd + Down: Collapse
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
        e.preventDefault();
        if (mode === "fullscreen") changeMode("expanded");
        else if (mode === "expanded") changeMode("normal");
        else if (mode === "normal") changeMode("collapsed");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, toggle, changeMode]);

  // Mouse drag handlers
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  return {
    mode,
    height,
    isDragging,
    changeMode,
    toggle,
    cycle,
    handlers: {
      onDragStart: handleDragStart,
    },
    sizes: timelineSizes,
  };
}
