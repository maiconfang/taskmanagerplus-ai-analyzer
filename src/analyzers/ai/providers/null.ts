import { BaseLLMProvider } from "./base.js";
import { LLMGenerateOptions } from "../ai.types.js";


// Offline mock provider. Useful for CI and local runs without API keys.
export class NullProvider extends BaseLLMProvider {
name = "null" as const;


async generate(prompt: string, _options?: LLMGenerateOptions): Promise<string> {
// Returns a deterministic JSON based on the prompt's high-level cues.
// It allows unit tests to be stable.
const simulated = {
rootCauses: [
{
id: "rc-1",
area: "frontend",
description: "UI timing sensitivity around asynchronous loaders.",
evidence: ["multiple failures in tests tagged 'ui'", "timeouts > 5s"],
likelihood: 0.72
}
],
flakyCandidates: [
{
testId: "ui/login.spec.ts:should login with valid user",
reason: "Intermittent timeout on CI only.",
evidence: ["passed locally", "fails on CI with timeout"],
confidence: 0.68
}
],
newTestIdeas: [
{
title: "Stress test for auth service",
description: "Simulate burst of parallel logins and token refresh flows.",
targetArea: "backend",
priority: "high"
}
],
actions: [
{
title: "Add explicit waits for UI spinner disappearance",
description: "Replace fixed delays with condition-based waits in login and dashboard tests.",
ownerHint: "QA",
priority: "medium"
}
]
};
return JSON.stringify(simulated);
}
}