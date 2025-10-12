import { promises as fs } from "node:fs";
import { NormalizedReport, NormalizedTestCase } from "../types/playwright";

export async function readPlaywrightReport(inputPath: string): Promise<NormalizedReport> {
  const raw = await fs.readFile(inputPath, "utf-8");
  const data = JSON.parse(raw);

  // Expecting a simple array of test-like items (ver exemplo sample-report.json)
  if (!Array.isArray(data)) {
    throw new Error("Unsupported report shape: expected an array of test results.");
  }

  const cases: NormalizedTestCase[] = data.map((t: any, i: number) => ({
    id: String(t.id ?? i),
    title: String(t.title ?? "Untitled"),
    status: (t.status ?? "unknown"),
    durationMs: t.durationMs,
    file: t.file,
    project: t.project,
    errorMessage: t.errorMessage
  }));

  const total   = cases.length;
  const passed  = cases.filter(c => c.status === "passed").length;
  const failed  = cases.filter(c => c.status === "failed").length;
  const skipped = cases.filter(c => c.status === "skipped").length;

  return {
    startedAt: undefined,
    finishedAt: undefined,
    total, passed, failed, skipped,
    cases,
    meta: { source: inputPath }
  };
}
