// src/analyzers/ai/providers/openai.ts
// All comments in English, keeping behavior intact while adding usage logs.

import OpenAI from "openai";
import { BaseLLMProvider } from "./base.js";
import { LLMGenerateOptions } from "../ai.types.js";

/** Simple per‑1k token price table (USD). Adjust if your org has custom pricing. */
const PRICES_PER_1K: Record<string, { in: number; out: number }> = {
  // Approx public pricing; keep small and simple
  "gpt-4o-mini": { in: 0.00015, out: 0.00060 },
  "gpt-4o": { in: 0.005, out: 0.015 },
};

/** Estimates cost (USD) based on model and returned usage. */
function estimateCostUSD(model: string, promptTokens: number, completionTokens: number): number {
  const key = model in PRICES_PER_1K ? model : "gpt-4o-mini";
  const price = PRICES_PER_1K[key];
  const costIn = (promptTokens / 1000) * price.in;
  const costOut = (completionTokens / 1000) * price.out;
  const total = +(costIn + costOut).toFixed(6);
  return total;
}

/**
 * OpenAIProvider (class)
 * ----------------------
 * Fits your provider architecture (used via `new OpenAIProvider(apiKey, model)`).
 * Returns JSON string via `generate(prompt)`.
 */
export class OpenAIProvider extends BaseLLMProvider {
  name = "openai" as const;
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model || "gpt-4o-mini";
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
    const temperature = typeof options?.temperature === "number" ? options!.temperature : 0.2;
    const maxTokens = typeof options?.maxTokens === "number" ? options!.maxTokens : 800;

    try {
      console.log("[OpenAI] Sending request → model=%s, temp=%s, maxTokens=%s", this.model, temperature, maxTokens);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a QA test-report analyst. Always return a valid JSON object (no markdown, no prose).",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices?.[0]?.message?.content ?? "{}";

      // ---- Usage logging (tokens + cost) ----
      const usage = (response as any).usage || {};
      const promptTokens = Number(usage.prompt_tokens ?? 0);
      const completionTokens = Number(usage.completion_tokens ?? 0);
      const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens);
      const estCost = estimateCostUSD(this.model, promptTokens, completionTokens);

      console.log("[OpenAI] Tokens used: total=%d (prompt=%d, completion=%d)", totalTokens, promptTokens, completionTokens);
      console.log("[OpenAI] Estimated cost: $%s USD (%s)", estCost.toFixed(6), this.model);

      return content;
    } catch (err: any) {
      console.error("[OpenAI] Error:", err?.message || String(err));
      // Preserve existing behavior: return empty JSON so callers can fallback deterministically.
      return "{}";
    }
  }
}

/**
 * (Optional) Keep a function-style helper for direct calls elsewhere.
 * Includes the same usage logging.
 */
type AiInput = { summary: any; model: string; apiKey: string; maxTokens?: number };
export async function analyzeWithOpenAI({ summary, model, apiKey, maxTokens = 600 }: AiInput) {
  const client = new OpenAI({ apiKey });
  const prompt = [
    "You are a QA test-report analyst. Read the JSON summary and produce insights & suggestions.",
    "Return a strict JSON with keys: insights[], suggestions[], risks[], provider.",
    "Focus on root causes, flaky patterns, coverage gaps, and high-value follow-ups.",
    "",
    "=== SUMMARY JSON ===",
    JSON.stringify(summary).slice(0, 18000),
  ].join("\n");

  try {
    console.log("[OpenAI] Sending helper request → model=%s, maxTokens=%s", model || "gpt-4o-mini", maxTokens);
    const resp = await client.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You analyze automated test reports for QA teams." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    const raw = resp.choices?.[0]?.message?.content || "{}";

    // ---- Usage logging (tokens + cost) ----
    const usage = (resp as any).usage || {};
    const promptTokens = Number(usage.prompt_tokens ?? 0);
    const completionTokens = Number(usage.completion_tokens ?? 0);
    const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens);
    const estCost = estimateCostUSD(model || "gpt-4o-mini", promptTokens, completionTokens);

    console.log("[OpenAI] Tokens used: total=%d (prompt=%d, completion=%d)", totalTokens, promptTokens, completionTokens);
    console.log("[OpenAI] Estimated cost: $%s USD (%s)", estCost.toFixed(6), model || "gpt-4o-mini");

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return {
      provider: "openai",
      insights: parsed.insights ?? [],
      suggestions: parsed.suggestions ?? [],
      risks: parsed.risks ?? [],
      raw,
    };
  } catch (err: any) {
    console.error("[OpenAI] Error (helper):", err?.message || String(err));
    return {
      provider: "openai",
      insights: [],
      suggestions: [],
      risks: [],
      raw: "{}",
      error: err?.message || String(err),
    };
  }
}
