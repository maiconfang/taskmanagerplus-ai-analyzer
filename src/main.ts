import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { readPlaywrightReport } from "./readers/playwrightReader.js";
import { summarizeReport } from "./analyzers/summaryAnalyzer.js";
import { toMarkdown } from "./formatters/markdownFormatter.js";
import { createAIAnalyzer } from "./analyzers/ai/index.js";
import type { NormalizedReport } from "./types/analyzer.js"; // ✅ NEW

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

  // 5) Build a NormalizedReport for the AI step (adapter)
  //    Your summary likely doesn't have 'flaky' or 'tests' — we default them.
  const normalizedForAI: NormalizedReport = {
    // Optional metadata: fill if you have them in your pipeline
    commit: undefined,
    branch: undefined,
    startedAt: undefined,
    endedAt: undefined,
    environment: undefined,

    summary: {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      flaky: (summary as any).flaky ?? 0,     // default if not present
      skipped: summary.skipped ?? 0,
    },
    // If your Item 1 already exposes tests in the summary, map them here.
    // Otherwise, keep an empty array (AI mock still works).
    tests: Array.isArray((summary as any).tests)
      ? (summary as any).tests.map((t: any) => ({
          id: t.id ?? t.title ?? "unknown-test",
          title: t.title ?? t.id ?? "unknown-test",
          status: t.status,            // "passed" | "failed" | "flaky" | "skipped"
          durationMs: t.durationMs ?? 0,
          errorMessage: t.errorMessage,
          retries: t.retries,
          tags: t.tags,
        }))
      : [],
  };

  // 6) Run AI Analyzer (never break Item 1)
  try {
    const ai = createAIAnalyzer();
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

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error("[taskmanagerplus-ai-analyzer] Fatal error:", err);
    process.exit(1);
  });
}
