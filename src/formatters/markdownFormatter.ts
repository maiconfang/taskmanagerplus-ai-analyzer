export function toMarkdown(summary: { total: number; passed: number; failed: number; skipped: number; notes: string[] }) {
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
