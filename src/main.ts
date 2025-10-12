// Entry point
// -----------
// Orchestrates reading -> analyzing -> formatting -> writing outputs.
// Keep this file as glue code. No AI calls here.

async function main() {
  // TODO: wire readers -> analyzers -> formatters
  // Example (later):
  // const report = await readPlaywrightReport(process.argv[2]);
  // const summary = summarizeReport(report);
  // const md = toMarkdown(summary);
  // writeFileSync('out/summary.md', md);
}

// Execute only when run directly (ts-node / compiled JS)
if (require.main === module) {
  main().catch(err => {
    console.error("[taskmanagerplus-ai-analyzer] Fatal error:", err);
    process.exit(1);
  });
}
