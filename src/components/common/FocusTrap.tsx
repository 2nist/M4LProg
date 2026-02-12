import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
  children: React.ReactNode;
};

// Simple focus trap: when `active` is true, trap tab focus inside the container.
export default function FocusTrap({ active, children }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || !rootRef.current) return;

    const container = rootRef.current;
    const focusableSelector = `a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])`;

    const focusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

    const previouslyActive = document.activeElement as HTMLElement | null;

    // Focus first focusable element or the container
    if (focusables.length) {
      focusables[0].focus();
    } else {
      container.focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previouslyActive && previouslyActive.focus) previouslyActive.focus();
    };
  }, [active]);

  return (
    <div ref={rootRef} tabIndex={-1} aria-hidden={!active}>
      {children}
    </div>
  );
}
