import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { readPlaywrightReport } from "./readers/playwrightReader";
import { summarizeReport } from "./analyzers/summaryAnalyzer";
import { toMarkdown } from "./formatters/markdownFormatter";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npm run dev -- <path-to-report.json>");
    process.exit(1);
  }

  const report = await readPlaywrightReport(inputPath);
  const summary = summarizeReport(report);
  const md = toMarkdown(summary);

  const outDir = resolve("out");
  await fs.mkdir(outDir, { recursive: true });

  await fs.writeFile(resolve(outDir, "summary.json"), JSON.stringify(summary, null, 2), "utf-8");
  await fs.writeFile(resolve(outDir, "summary.md"), md, "utf-8");

  console.log("✅ Wrote:");
  console.log(" - out/summary.json");
  console.log(" - out/summary.md");
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error("[taskmanagerplus-ai-analyzer] Fatal error:", err);
    process.exit(1);
  });
}
