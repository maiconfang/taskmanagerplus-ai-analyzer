import { describe, it, expect } from "vitest";
import { toMarkdown } from "../../src/formatters/markdownFormatter";

describe("markdownFormatter", () => {
  it("should render a readable markdown summary", () => {
    const md = toMarkdown({
      total: 3, passed: 1, failed: 1, skipped: 1,
      notes: ["Example failure: X", "Skipped: 1"]
    });

    expect(md).toContain("# Test Summary");
    expect(md).toContain("- Total: 3");
    expect(md).toContain("- Failed: 1");
    expect(md).toContain("## Notes");
    expect(md).toContain("Example failure");
  });
});
