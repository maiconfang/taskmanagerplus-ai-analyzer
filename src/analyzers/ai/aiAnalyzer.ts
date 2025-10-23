// All comments in English as requested

import { AIAnalyzer, AIAnalyzerOptions, LLMProvider } from "./ai.types.js";
import {
  AIAnalysisResult,
  NormalizedReport,
  NormalizedTestResult,
  RootCauseHypothesis,
  FlakyCandidate,
  NewTestIdea,
  ActionItem,
} from "../../types/analyzer.js";
import { rootCausePrompt } from "./prompts/rootCausePrompt.js";

/** Detects rate-limit or quota-related errors from common SDK shapes. */
function isQuotaOrRateLimitError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || err?.error?.code || "").toLowerCase();
  return (
    err?.status === 429 ||
    code.includes("insufficient_quota") ||
    msg.includes("quota") ||
    msg.includes("rate limit")
  );
}

/** Robust JSON parsing with graceful fallback. Keeps fences like ```json out. */
function parseAsJson<T>(text: string): T {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as T;
}

/** Sanitize possibly-partial AI JSON into our strict types with safe defaults. */
function sanitizeAIResult(json: Partial<AIAnalysisResult>): AIAnalysisResult {
  const rc: RootCauseHypothesis[] = Array.isArray(json.rootCauses)
    ? json.rootCauses
        .filter(Boolean)
        .map((h: any, i: number): RootCauseHypothesis => ({
          id: String(h?.id ?? `ai-${i}`),
          area: String(h?.area ?? "general"),
          description: String(h?.description ?? "Unspecified"),
          evidence: Array.isArray(h?.evidence) ? h.evidence.map(String) : [],
          likelihood: typeof h?.likelihood === "number" ? h.likelihood : 0.5,
        }))
    : [];

  const flaky: FlakyCandidate[] = Array.isArray(json.flakyCandidates)
    ? json.flakyCandidates
        .filter(Boolean)
        .map((f: any, i: number): FlakyCandidate => ({
          testId: String(f?.testId ?? `test-${i}`),
          reason: String(f?.reason ?? "Potential timing / network sensitivity"),
          evidence: Array.isArray(f?.evidence) ? f.evidence.map(String) : [],
          confidence: typeof f?.confidence === "number" ? f.confidence : 0.5,
        }))
    : [];

  const ideas: NewTestIdea[] = Array.isArray(json.newTestIdeas)
    ? json.newTestIdeas
        .filter(Boolean)
        .map((t: any): NewTestIdea => ({
          title: String(t?.title ?? "New test idea"),
          description: String(t?.description ?? "Unspecified"),
          targetArea: String(t?.targetArea ?? "general"),
          priority: (["low", "medium", "high", "critical"] as const).includes(t?.priority)
            ? t.priority
            : "medium",
        }))
    : [];

  const actions: ActionItem[] = Array.isArray(json.actions)
    ? json.actions
        .filter(Boolean)
        .map((a: any): ActionItem => ({
          title: String(a?.title ?? "Action"),
          description: String(a?.description ?? "Unspecified"),
          ownerHint: a?.ownerHint ? String(a.ownerHint) : undefined,
          priority: (["low", "medium", "high", "critical"] as const).includes(a?.priority)
            ? a.priority
            : "medium",
        }))
    : [];

  return { rootCauses: rc, flakyCandidates: flaky, newTestIdeas: ideas, actions };
}

/** Deterministic fallback if AI fails (quota exceeded, rate limit, etc.). */
function buildDeterministicFallback(input: NormalizedReport, reason: string): AIAnalysisResult {
  const totals = input?.summary ?? { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 };
  const tests = Array.isArray(input?.tests) ? input.tests : [];

  const rootCauses: RootCauseHypothesis[] = [];
  const flakyCandidates: FlakyCandidate[] = [];
  const newTestIdeas: NewTestIdea[] = [];
  const actions: ActionItem[] = [];

  // Helpers
  const makeHypothesis = (description: string, area = "general", likelihood = 0.5): RootCauseHypothesis => ({
    id: `fallback-${Math.random().toString(36).slice(2, 8)}`,
    area,
    description,
    evidence: ["deterministic fallback heuristic"],
    likelihood,
  });

  const makeFlaky = (t: NormalizedTestResult, reason: string, confidence = 0.5): FlakyCandidate => ({
    testId: t.id,
    reason,
    evidence: [t.title, ...(t.tags ?? [])],
    confidence,
  });

  const makeIdea = (title: string, description: string, targetArea = "general", priority: NewTestIdea["priority"] = "medium"): NewTestIdea => ({
    title,
    description,
    targetArea,
    priority,
  });

  const makeAction = (
    title: string,
    description: string,
    priority: ActionItem["priority"] = "medium",
    ownerHint?: string
  ): ActionItem => ({
    title,
    description,
    ownerHint,
    priority,
  });

  // Heuristics
  const failureRatio = totals.total > 0 ? totals.failed / totals.total : 0;
  const hasManyFailures = totals.failed > 0 && failureRatio >= 0.1;
  const hasFlaky = totals.flaky > 0;

  if (hasManyFailures) {
    rootCauses.push(makeHypothesis("High failure ratio suggests environment/auth or infra instability", "backend", 0.6));
    newTestIdeas.push(
      makeIdea("Smoke: Auth & Flags", "Add smoke tests for login, feature flags and critical APIs", "backend", "high")
    );
    actions.push(
      makeAction("Re-run smoke on clean env", "Run a minimal smoke suite in an isolated env to detect infra issues", "high", "QA")
    );
    actions.push(
      makeAction("Limit retries to idempotent ops", "Apply retries only to known idempotent API calls", "medium", "Backend")
    );
  }

  if (hasFlaky) {
    rootCauses.push(makeHypothesis("Flakiness indicates timing or network sensitivity", "frontend", 0.55));
    // Mark all flaky tests (status === 'flaky' OR retries > 0)
    tests
      .filter((t) => t.status === "flaky" || (t.retries ?? 0) > 0)
      .slice(0, 10)
      .forEach((t) => flakyCandidates.push(makeFlaky(t, "Intermittent behavior detected", 0.6)));

    actions.push(
      makeAction("Replace arbitrary waits", "Use explicit assertions and stable waits for UI/network", "high", "QA")
    );
    actions.push(
      makeAction("Stub external services", "Stub flaky external dependencies in CI to improve determinism", "medium", "DevOps")
    );
  }

  if (!hasManyFailures && !hasFlaky) {
    rootCauses.push(makeHypothesis("AI disabled or quota exceeded; no ML-based insights available", "general", 0.4));
    actions.push(
      makeAction("Restore AI quota", "Fix quota/keys or set AI_PROVIDER=none to skip LLM temporarily", "medium", "DevOps")
    );
  }

  // Always recommend a re-run after fixes
  actions.push(
    makeAction("Re-run analysis after fixes", "Re-execute after restoring AI or stabilizing infra to get deeper insights", "low", "QA")
  );

  return { rootCauses, flakyCandidates, newTestIdeas, actions };
}

/** Default AI analyzer that uses an LLM provider, with safe fallback. */
export class DefaultAIAnalyzer implements AIAnalyzer {
  constructor(private readonly provider: LLMProvider) {}

  async analyze(input: NormalizedReport): Promise<AIAnalysisResult> {
    const payload = JSON.stringify(input);
    const prompt = rootCausePrompt(payload);

    // ===== Verbose diagnostics (non-breaking) =====
    const enabled = process.env.AI_ENABLED === "true";
    const providerName = process.env.AI_PROVIDER || "off";
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const budget = Number(process.env.AI_BUDGET_CENTS ?? "0");
    const totals = input?.summary ?? { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 };

    console.log("[AI Analyzer] enabled=", enabled, "provider=", providerName, "model=", model, "budget=", budget);
    console.log("[AI Analyzer] report totals:", totals);

    // We DO NOT early-return here to avoid changing existing behavior.
    // The try/catch below will keep the current fallback model intact.

    try {
      const raw = await this.provider.generate(prompt, {
        system: "You are a senior QA engineer specialized in root cause analysis.",
        temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
        maxTokens: Number(process.env.OPENAI_MAX_TOKENS ?? 1200),
      });

      // Sanitize AI JSON to match strict types
      const json = parseAsJson<Partial<AIAnalysisResult>>(raw);
      const result = sanitizeAIResult(json);

      console.log("[AI Analyzer] AI responded. rc=%d flaky=%d new=%d actions=%d",
        result.rootCauses.length, result.flakyCandidates.length, result.newTestIdeas.length, result.actions.length);

      return result;
    } catch (err: any) {
      const reason = isQuotaOrRateLimitError(err)
        ? "insufficient_quota_or_rate_limit"
        : `ai_error_${String(err?.code || "unknown")}`;
      console.error("[AI Analyzer] Error caught, using deterministic fallback. reason=", reason, "message=", err?.message || String(err));
      // Never throw — always provide a valid deterministic result
      return buildDeterministicFallback(input, reason);
    }
  }
}
