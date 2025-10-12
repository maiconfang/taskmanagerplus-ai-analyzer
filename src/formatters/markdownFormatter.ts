// Formatter: Markdown
// -------------------
// Purpose: take an analysis object and output Markdown for human-friendly reading.
// Note: Keep it pure. No file writes here.

export function toMarkdown(summary: { total: number; passed: number; failed: number; skipped: number; notes: string[] }) {
  // TODO: build real Markdown later.
  const lines = [
    "# Test Summary",
    `- Total: ${summary.total}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Skipped: ${summary.skipped}`,
    "",
    "## Notes",
    ...(summary.notes?.length ? summary.notes.map(n => `- ${n}`) : ["(none)"]),
  ];
  return lines.join("\n");
}
