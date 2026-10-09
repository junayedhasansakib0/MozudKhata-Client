"use client";

import * as React from "react";

export interface PosShortcutHandlers {
  onFocusSearch: () => void;
  onHold: () => void;
  onDiscount: () => void;
  onFastCash: () => void;
  onPay: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Keyboard-first POS shortcuts (PRD §3): "/" or F2 focus search, F3 hold, F4 discount,
 * F9 fast cash, Enter/Space proceed to payment, Esc returns the cursor to search.
 * Disabled while a dialog is open so it never fights modal input.
 */
export function usePosShortcuts(handlers: PosShortcutHandlers, enabled: boolean) {
  const latest = React.useRef({ handlers, enabled });
  React.useEffect(() => {
    latest.current = { handlers, enabled };
  });

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const { handlers: h, enabled: on } = latest.current;
      if (!on) return;

      if ((event.key === "/" || event.key === "F2") && !isTyping(event.target)) {
        event.preventDefault();
        h.onFocusSearch();
        return;
      }
      if (event.key === "Escape") {
        h.onFocusSearch();
        return;
      }
      if (isTyping(event.target)) return;

      switch (event.key) {
        case "F3":
          event.preventDefault();
          h.onHold();
          break;
        case "F4":
          event.preventDefault();
          h.onDiscount();
          break;
        case "F9":
          event.preventDefault();
          h.onFastCash();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          h.onPay();
          break;
        default:
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
