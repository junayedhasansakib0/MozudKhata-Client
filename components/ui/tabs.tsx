"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Minimal controlled tabs (no Radix dependency). Mirrors the UI-UX drawer tab bar:
 * a horizontal trigger row with an active underline + switchable panels.
 */
interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  id: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

function Tabs({ value, onValueChange, className, children }: TabsProps) {
  const id = React.useId();
  const ctx = React.useMemo(() => ({ value, setValue: onValueChange, id }), [id, value, onValueChange]);
  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("flex items-center gap-6 overflow-x-auto border-b border-border", className)}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: active, setValue, id: tabsId } = useTabs();
    const selected = active === value;

    function moveFocus(direction: "next" | "previous" | "first" | "last") {
      const triggers = Array.from(
        document.querySelectorAll<HTMLButtonElement>(`[data-tabs-id="${tabsId}"][role="tab"]`),
      );
      if (triggers.length === 0) return;
      const currentIndex = Math.max(0, triggers.indexOf(document.activeElement as HTMLButtonElement));
      const nextIndex =
        direction === "first"
          ? 0
          : direction === "last"
            ? triggers.length - 1
            : (currentIndex + (direction === "next" ? 1 : -1) + triggers.length) % triggers.length;
      const next = triggers[nextIndex];
      if (!next) return;
      setValue(next.dataset.tabValue ?? value);
      next.focus();
    }

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${tabsId}-tab-${value}`}
        data-tabs-id={tabsId}
        data-tab-value={value}
        aria-selected={selected}
        aria-controls={`${tabsId}-panel-${value}`}
        tabIndex={selected ? 0 : -1}
        onClick={() => setValue(value)}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
              event.preventDefault();
              moveFocus("next");
              break;
            case "ArrowLeft":
            case "ArrowUp":
              event.preventDefault();
              moveFocus("previous");
              break;
            case "Home":
              event.preventDefault();
              moveFocus("first");
              break;
            case "End":
              event.preventDefault();
              moveFocus("last");
              break;
          }
        }}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const { value: active, id: tabsId } = useTabs();
  return (
    <div
      id={`${tabsId}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${tabsId}-tab-${value}`}
      tabIndex={0}
      hidden={active !== value}
      className={className}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
