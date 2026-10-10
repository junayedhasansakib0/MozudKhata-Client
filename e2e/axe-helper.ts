import type { Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

// Playwright transpiles specs to CommonJS, so Node's `require` is available here.
// Resolve the already-installed (transitive) axe-core 4.x — no extra dependency added.
const axePath: string = require.resolve("axe-core/axe.min.js");

type AxeNode = { target: string[]; failureSummary?: string };
type AxeViolation = {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
};
type AxeResults = { violations: AxeViolation[] };

/**
 * Inject axe-core into the current page and run a WCAG 2.1 A/AA audit.
 * Returns the violations so callers can assert on them. Only serious/critical
 * impacts fail the build; minor/moderate are reported for triage.
 */
export async function runAxe(
  page: Page,
  options: { include?: string; disableRules?: string[] } = {},
): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: axePath });
  const results = (await page.evaluate(
    async ({ include, disableRules }) => {
      // axe is attached to window by the injected script.
      const axe = (
        window as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<AxeResults> } }
      ).axe;
      const context = include ? { include: [[include]] } : document;
      const rules: Record<string, { enabled: boolean }> = {};
      for (const id of disableRules ?? []) rules[id] = { enabled: false };
      return axe.run(context, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules,
      });
    },
    { include: options.include, disableRules: options.disableRules },
  )) as AxeResults;
  return results.violations;
}

const BLOCKING = new Set(["serious", "critical"]);

/** Assert that a page has no serious/critical accessibility violations. */
export async function expectNoA11yViolations(
  page: Page,
  testInfo: TestInfo,
  options: { include?: string; disableRules?: string[] } = {},
): Promise<void> {
  const violations = await runAxe(page, options);
  const blocking = violations.filter((v) => BLOCKING.has(v.impact ?? ""));
  if (violations.length > 0) {
    const summary = violations
      .map(
        (v) =>
          `  [${v.impact ?? "n/a"}] ${v.id}: ${v.help}\n    ${v.nodes
            .slice(0, 4)
            .map((n) => n.target.join(" "))
            .join("\n    ")}`,
      )
      .join("\n");
    await testInfo.attach("axe-violations", { body: summary, contentType: "text/plain" });
  }
  expect(blocking, blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join("; ")).toEqual([]);
}
