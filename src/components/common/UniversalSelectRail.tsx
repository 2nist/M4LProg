import { useMemo, useRef } from "react";

interface UniversalSelectRailOption {
  value: number;
  label: string;
  shortLabel?: string;
}

interface UniversalSelectRailProps {
  value: number;
  options: UniversalSelectRailOption[];
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
}

export function UniversalSelectRail({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: UniversalSelectRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const draggingPointerIdRef = useRef<number | null>(null);

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value],
  );

  const selectByPointer = (clientX: number) => {
    const rail = railRef.current;
    if (!rail || options.length === 0) return;
    const rect = rail.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const nextIndex = Math.min(
      options.length - 1,
      Math.max(0, Math.floor((x / rect.width) * options.length)),
    );
    const nextValue = options[nextIndex]?.value;
    if (nextValue !== undefined && nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className={`universal-select-rail ${className || ""}`}>
      <div
        ref={railRef}
        className="universal-select-rail-track"
        role="radiogroup"
        aria-label={ariaLabel}
        style={{ gridTemplateColumns: `repeat(${Math.max(1, options.length)}, minmax(0, 1fr))` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          draggingPointerIdRef.current = event.pointerId;
          selectByPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (draggingPointerIdRef.current !== event.pointerId) return;
          selectByPointer(event.clientX);
        }}
        onPointerUp={(event) => {
          if (draggingPointerIdRef.current === event.pointerId) {
            draggingPointerIdRef.current = null;
          }
        }}
        onPointerCancel={(event) => {
          if (draggingPointerIdRef.current === event.pointerId) {
            draggingPointerIdRef.current = null;
          }
        }}
      >
        <div
          className="universal-select-rail-active"
          style={{
            width: `${100 / Math.max(1, options.length)}%`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
          aria-hidden="true"
        />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`universal-select-rail-segment ${value === option.value ? "is-active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            <span className="universal-select-rail-label">
              {options.length > 8 ? (option.shortLabel || option.label) : option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
