import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FloatingOption {
  value: number | string;
  label: string;
}

interface FloatingOptionPickerProps {
  value: number | string;
  options: FloatingOption[];
  onChange: (value: number | string) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}

export function FloatingOptionPicker({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  disabled = false,
}: FloatingOptionPickerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  const positionPanel = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelWidth = 132;
    const leftAnchorFar = rect.left - panelWidth - 10;
    const leftAnchorNear = rect.right - panelWidth + 2;
    const preferredLeft = (leftAnchorFar + leftAnchorNear) / 2;
    const left = Math.min(
      window.innerWidth - panelWidth - 12,
      Math.max(12, preferredLeft),
    );
    const top = rect.top + rect.height / 2;
    const maxHeight = Math.max(120, Math.min(360, window.innerHeight - 24));
    setPanelStyle({ top, left, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) return;
    positionPanel();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => positionPanel();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className={`floating-option-picker ${className || ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`floating-option-trigger ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="floating-option-trigger-label">{selected?.label || "Select"}</span>
        <span className="floating-option-trigger-caret" aria-hidden="true">
          {open ? "◀" : "▼"}
        </span>
      </button>

      {open && panelStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="floating-option-panel"
              role="listbox"
              aria-label={ariaLabel}
              style={{
                top: `${panelStyle.top}px`,
                left: `${panelStyle.left}px`,
                maxHeight: `${panelStyle.maxHeight}px`,
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`floating-option-item ${option.value === value ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
