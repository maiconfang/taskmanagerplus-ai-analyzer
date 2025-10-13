import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPlaywrightReport } from "./readers/playwrightReader.js";
import { summarizeReport } from "./analyzers/summaryAnalyzer.js";
import { toMarkdown } from "./formatters/markdownFormatter.js";
import { createAIAnalyzer } from "./analyzers/ai/index.js";
import type { NormalizedReport } from "./types/analyzer.js";

/**
 * Build a NormalizedReport for the AI step from the Item 1 summary.
 * This keeps main.ts independent from internal summary shapes.
 */
function toNormalizedReportFromSummary(summary: any): NormalizedReport {
  return {
    commit: summary.commit,
    branch: summary.branch,
    startedAt: summary.startedAt,
    endedAt: summary.endedAt,
    environment: summary.environment,

    summary: {
      total: summary.total ?? summary?.summary?.total ?? 0,
      passed: summary.passed ?? summary?.summary?.passed ?? 0,
      failed: summary.failed ?? summary?.summary?.failed ?? 0,
      flaky: summary.flaky ?? summary?.summary?.flaky ?? 0,
      skipped: summary.skipped ?? summary?.summary?.skipped ?? 0,
    },

    tests: Array.isArray(summary.tests)
      ? summary.tests.map((t: any) => ({
          id: t.id ?? t.title ?? "unknown-test",
          title: t.title ?? t.id ?? "unknown-test",
          status: t.status, // "passed" | "failed" | "flaky" | "skipped"
          durationMs: t.durationMs ?? 0,
          errorMessage: t.errorMessage,
          retries: t.retries,
          tags: t.tags,
        }))
      : [],
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npm run dev -- <path-to-report.json>");
    process.exit(1);
  }

  // 1) Read raw report
  const report = await readPlaywrightReport(inputPath);

  // 2) Normalize/summary (Item 1)
  const summary = summarizeReport(report);
  const md = toMarkdown(summary);

  // 3) Ensure output dir
  const outDir = resolve("out");
  await fs.mkdir(outDir, { recursive: true });

  // 4) Write Item 1 outputs
  await fs.writeFile(resolve(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf-8");
  await fs.writeFile(resolve(outDir, "summary.md"), md, "utf-8");

  // 5) Run AI Analyzer (Item 2). Never break Item 1 outputs.
  try {
    const ai = createAIAnalyzer(); // provider comes from env (AI_PROVIDER)
    const normalizedForAI = toNormalizedReportFromSummary(summary);
    const aiResult = await ai.analyze(normalizedForAI);

    await fs.writeFile(
      resolve(outDir, "ai-analysis.json"),
      JSON.stringify(aiResult, null, 2),
      "utf-8"
    );

    console.log("✅ Wrote:");
    console.log(" - out/summary.json");
    console.log(" - out/summary.md");
    console.log(" - out/ai-analysis.json");
  } catch (err) {
    console.warn("[AI Analyzer] Skipped due to error:", err);
    console.log("✅ Wrote:");
    console.log(" - out/summary.json");
    console.log(" - out/summary.md");
  }
}

// ESM-safe: run only if executed directly
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");

if (isMainModule) {
  main().catch(err => {
    console.error("[taskmanagerplus-ai-analyzer] Fatal error:", err);
    process.exit(1);
  });
}
