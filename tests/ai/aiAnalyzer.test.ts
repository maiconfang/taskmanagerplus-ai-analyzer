import { describe, it, expect } from "vitest";
import { createAIAnalyzer } from "../../src/analyzers/ai";
import { NormalizedReport } from "../../src/types/analyzer";


// Using the default provider = null (offline mock). No env needed.


describe("AI Analyzer (null provider)", () => {
it("should return structured analysis from a minimal report", async () => {
const analyzer = createAIAnalyzer({ provider: "null" });


const report: NormalizedReport = {
commit: "abc123",
branch: "main",
summary: { total: 3, passed: 1, failed: 1, flaky: 1, skipped: 0 },
tests: [
{
id: "ui/login.spec.ts:should login with valid user",
title: "should login with valid user",
status: "flaky",
durationMs: 8123,
retries: 1,
tags: ["ui", "auth"]
},
{
id: "api/tasks.spec.ts:create task",
title: "create task",
status: "failed",
durationMs: 1345,
errorMessage: "500 Internal Server Error",
tags: ["api", "tasks"]
},
{
id: "ui/dashboard.spec.ts:shows list",
title: "shows list",
status: "passed",
durationMs: 945,
tags: ["ui"]
}
]
};


const out = await analyzer.analyze(report);


expect(out.rootCauses.length).toBeGreaterThan(0);
expect(out.flakyCandidates.length).toBeGreaterThan(0);
expect(out.newTestIdeas.length).toBeGreaterThan(0);
expect(out.actions.length).toBeGreaterThan(0);


// A quick shape check:
expect(out.rootCauses[0]).toHaveProperty("description");
expect(out.actions[0]).toHaveProperty("priority");
});
});