import { NormalizedReport } from "../types/playwright.js";

export function summarizeReport(report: NormalizedReport) {
  const notes: string[] = [];

  if (report.failed > 0) {
    const topFail = report.cases.find(c => c.status === "failed");
    if (topFail?.errorMessage) notes.push(`Example failure: ${topFail.title} → ${topFail.errorMessage}`);
  }
  if (report.skipped > 0) notes.push(`Skipped: ${report.skipped}`);
  if (report.passed === report.total) notes.push("All tests passed 🎉");

  return {
    total: report.total,
    passed: report.passed,
    failed: report.failed,
    skipped: report.skipped,
    notes
  };
}
