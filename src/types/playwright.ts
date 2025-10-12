// Types: Playwright normalized structures
// ---------------------------------------
// Define minimal interfaces for the normalized report you plan to use.

export interface NormalizedTestCase {
  id: string;
  title: string;
  status: "passed" | "failed" | "skipped" | "flaky" | "unknown";
  durationMs?: number;
  file?: string;
  project?: string;
  errorMessage?: string;
}

export interface NormalizedReport {
  startedAt?: string;
  finishedAt?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cases: NormalizedTestCase[];
  meta?: Record<string, unknown>;
}
