// All comments in English by preference.
export type Severity = "low" | "medium" | "high" | "critical";


export interface FlakyCandidate {
testId: string;
reason: string;
evidence: string[];
confidence: number; // 0..1
}


export interface RootCauseHypothesis {
id: string;
area: string; // e.g., "frontend", "backend", "network", "data"
description: string;
evidence: string[];
likelihood: number; // 0..1
}


export interface NewTestIdea {
title: string;
description: string;
targetArea: string;
priority: Severity;
}


export interface ActionItem {
title: string;
description: string;
ownerHint?: string; // e.g., "QA", "Backend", "DevOps"
priority: Severity;
}


export interface AIAnalysisResult {
rootCauses: RootCauseHypothesis[];
flakyCandidates: FlakyCandidate[];
newTestIdeas: NewTestIdea[];
actions: ActionItem[];
}


// Minimal normalized result expected from summary step (Item 1)
export interface NormalizedTestResult {
id: string; // stable test identifier (e.g., file + name)
title: string;
status: "passed" | "failed" | "flaky" | "skipped";
durationMs: number;
errorMessage?: string;
retries?: number;
tags?: string[]; // labels like: ["ui", "smoke", "auth"]
}


export interface NormalizedReport {
commit?: string;
branch?: string;
startedAt?: string;
endedAt?: string;
environment?: Record<string, string>;
summary: {
total: number;
passed: number;
failed: number;
flaky: number;
skipped: number;
};
tests: NormalizedTestResult[];
}