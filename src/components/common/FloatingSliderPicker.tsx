import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FloatingSliderPickerProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}

export function FloatingSliderPicker({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  ariaLabel,
  disabled = false,
  formatValue,
}: FloatingSliderPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const valueRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const closeTimeoutRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number } | null>(
    null,
  );

  const values = useMemo(() => {
    const result: number[] = [];
    for (let n = min; n <= max; n += step) {
      result.push(n);
    }
    return result;
  }, [min, max, step]);

  const positionPanel = () => {
    const anchor = containerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelWidth = 74;
    const left = Math.max(8, rect.left - panelWidth - 8);
    const top = rect.top + rect.height / 2;
    setPanelStyle({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    positionPanel();
    const onResize = () => positionPanel();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = valueRefs.current[value];
    const panel = panelRef.current;
    if (node && panel) {
      const targetTop = node.offsetTop - panel.clientHeight / 2 + node.clientHeight / 2;
      panel.scrollTo({
        top: Math.max(0, targetTop),
        behavior: isDraggingRef.current ? "auto" : "smooth",
      });
    }
  }, [open, value]);

  useEffect(() => {
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  const closeWithDelay = () => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 170);
  };

  const openNow = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const isPointerNearThumb = (clientX: number, clientY: number) => {
    const slider = containerRef.current?.querySelector(
      ".floating-slider-input",
    ) as HTMLInputElement | null;
    if (!slider) return false;
    const rect = slider.getBoundingClientRect();
    const ratio = (value - min) / Math.max(1, max - min);
    const thumbX = rect.left + rect.width * Math.min(1, Math.max(0, ratio));
    const thumbY = rect.top + rect.height / 2;
    const dx = Math.abs(clientX - thumbX);
    const dy = Math.abs(clientY - thumbY);
    return dx <= 12 && dy <= 12;
  };

  return (
    <div
      ref={containerRef}
      className={`floating-slider-picker ${className || ""}`}
      onMouseLeave={closeWithDelay}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        className={`floating-slider-input ${disabled ? "is-disabled" : ""}`}
        disabled={disabled}
        onMouseMove={(event) => {
          if (disabled) return;
          if (isPointerNearThumb(event.clientX, event.clientY)) {
            openNow();
          }
        }}
        onPointerDown={() => {
          if (!disabled) {
            isDraggingRef.current = true;
            openNow();
          }
        }}
        onFocus={() => {
          if (!disabled) openNow();
        }}
        onBlur={closeWithDelay}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      {open && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="floating-slider-panel"
              style={{ top: `${panelStyle.top}px`, left: `${panelStyle.left}px` }}
              role="listbox"
              aria-label={`${ariaLabel} values`}
            >
              {values.map((n) => (
                <button
                  key={n}
                  ref={(el) => {
                    valueRefs.current[n] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={n === value}
                  className={`floating-slider-item ${n === value ? "is-selected" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(n)}
                >
                  {formatValue ? formatValue(n) : n}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
