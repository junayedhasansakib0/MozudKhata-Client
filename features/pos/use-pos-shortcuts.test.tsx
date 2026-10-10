import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { usePosShortcuts, type PosShortcutHandlers } from "./use-pos-shortcuts";

function makeHandlers() {
  return {
    onFocusSearch: vi.fn(),
    onHold: vi.fn(),
    onDiscount: vi.fn(),
    onFastCash: vi.fn(),
    onPay: vi.fn(),
  };
}

function Harness({
  handlers,
  enabled,
}: {
  handlers: ReturnType<typeof makeHandlers>;
  enabled: boolean;
}) {
  usePosShortcuts(handlers as PosShortcutHandlers, enabled);
  return (
    <div>
      <button type="button" data-testid="tile">
        Tile
      </button>
      <div role="menuitem" tabIndex={0} data-testid="menuitem">
        Held order
      </div>
      <div data-testid="plain">Plain region</div>
    </div>
  );
}

describe("usePosShortcuts", () => {
  afterEach(cleanup);

  let handlers: ReturnType<typeof makeHandlers>;
  beforeEach(() => {
    handlers = makeHandlers();
  });

  it("fires fast-cash on F9 when enabled with no overlay", () => {
    render(<Harness handlers={handlers} enabled />);
    fireEvent.keyDown(document.body, { key: "F9" });
    expect(handlers.onFastCash).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    render(<Harness handlers={handlers} enabled={false} />);
    fireEvent.keyDown(document.body, { key: "F9" });
    fireEvent.keyDown(document.body, { key: "F3" });
    expect(handlers.onFastCash).not.toHaveBeenCalled();
    expect(handlers.onHold).not.toHaveBeenCalled();
  });

  it("suppresses F-keys while a Radix overlay (command palette / menu) is open", () => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("data-state", "open");
    document.body.appendChild(overlay);
    try {
      render(<Harness handlers={handlers} enabled />);
      fireEvent.keyDown(document.body, { key: "F9" });
      fireEvent.keyDown(document.body, { key: "F3" });
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(handlers.onFastCash).not.toHaveBeenCalled();
      expect(handlers.onHold).not.toHaveBeenCalled();
      expect(handlers.onFocusSearch).not.toHaveBeenCalled();
    } finally {
      overlay.remove();
    }
  });

  it("does not commit the sale when Enter is pressed on a menu item", () => {
    const { getByTestId } = render(<Harness handlers={handlers} enabled />);
    fireEvent.keyDown(getByTestId("menuitem"), { key: "Enter" });
    expect(handlers.onPay).not.toHaveBeenCalled();
  });

  it("does not commit the sale when Space is pressed on a product tile (button)", () => {
    const { getByTestId } = render(<Harness handlers={handlers} enabled />);
    fireEvent.keyDown(getByTestId("tile"), { key: " " });
    expect(handlers.onPay).not.toHaveBeenCalled();
  });

  it("commits the sale on Enter from a non-interactive region", () => {
    const { getByTestId } = render(<Harness handlers={handlers} enabled />);
    fireEvent.keyDown(getByTestId("plain"), { key: "Enter" });
    expect(handlers.onPay).toHaveBeenCalledTimes(1);
  });

  it("focuses search on '/' and Escape when no overlay is open", () => {
    render(<Harness handlers={handlers} enabled />);
    fireEvent.keyDown(document.body, { key: "/" });
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(handlers.onFocusSearch).toHaveBeenCalledTimes(2);
  });
});
