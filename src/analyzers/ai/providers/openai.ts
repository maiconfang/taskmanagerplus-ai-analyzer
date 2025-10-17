// src/analyzers/ai/providers/openai.ts
import OpenAI from "openai";
import { BaseLLMProvider } from "./base.js";
import { LLMGenerateOptions } from "../ai.types.js";

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

  async generate(prompt: string, _options?: LLMGenerateOptions): Promise<string> {
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
      temperature: 0.2,
      max_tokens: 800,
    });

    return response.choices?.[0]?.message?.content ?? "{}";
  }
}

/**
 * (Optional) Keep a function-style helper for direct calls elsewhere.
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

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You analyze automated test reports for QA teams." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0.2,
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
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
}
