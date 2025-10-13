// Comments in English per your preference.
import { describe, it, expect } from "vitest";
import { summarizeReport } from "../../src/analyzers/summaryAnalyzer";
import type { NormalizedReport } from "../../src/types/playwright";

describe("summaryAnalyzer", () => {
  it("should summarize totals and add helpful notes", () => {
    const report: NormalizedReport = {
      total: 3,
      passed: 1,
      failed: 1,
      skipped: 1,
      cases: [
        { id: "t1", title: "Login › shows title", status: "passed" },
        { id: "t2", title: "Login › invalid password", status: "failed", errorMessage: "Expected 401" },
        { id: "t3", title: "Dashboard › loads widgets", status: "skipped" }
      ]
    };

    const summary = summarizeReport(report);

    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.notes).toContain("Skipped: 1");
    expect(summary.notes.some(n => n.includes("invalid password"))).toBe(true);
  });

  it("should add celebration note when all tests pass", () => {
    const report: NormalizedReport = {
      total: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      cases: [
        { id: "a", title: "ok 1", status: "passed" },
        { id: "b", title: "ok 2", status: "passed" }
      ]
    };
    const summary = summarizeReport(report);
    expect(summary.notes.join(" ")).toMatch(/All tests passed/i);
  });
});
