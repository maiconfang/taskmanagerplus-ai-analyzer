// NOTE: This is a lightweight adapter skeleton. It does not import SDKs directly
// to keep the project vendor-agnostic. You can plug your HTTP client of choice
// here (e.g., fetch/axios) if desired.


import { BaseLLMProvider } from "./base.js";
import { LLMGenerateOptions } from "../ai.types.js";



export class OpenAIProvider extends BaseLLMProvider {
name = "openai" as const;


constructor(
private readonly apiKey: string,
private readonly model: string,
) { super(); }


async generate(prompt: string, options?: LLMGenerateOptions): Promise<string> {
if (!this.apiKey) throw new Error("OPENAI_API_KEY is required");


// Minimal HTTP call sketch (pseudo-implementation):
// Replace with your HTTP client.
const body = {
model: this.model,
messages: [
options?.system ? { role: "system", content: options.system } : undefined,
{ role: "user", content: prompt }
].filter(Boolean),
temperature: options?.temperature ?? Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
max_tokens: options?.maxTokens ?? Number(process.env.OPENAI_MAX_TOKENS ?? 1200)
};


// const res = await fetch("https://api.openai.com/v1/chat/completions", {
// method: "POST",
// headers: {
// "Content-Type": "application/json",
// "Authorization": `Bearer ${this.apiKey}`
// },
// body: JSON.stringify(body)
// });
// const json = await res.json();
// const text = json.choices?.[0]?.message?.content ?? "{}";
// return text;


// Placeholder to keep tests green without network:
return JSON.stringify({ note: "OpenAI call would happen here." });
}
}