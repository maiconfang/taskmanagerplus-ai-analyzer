import { AIAnalyzer, AIAnalyzerOptions, LLMProvider } from "./ai.types.js";
import { AIAnalysisResult, NormalizedReport } from "../../types/analyzer.js";
import { rootCausePrompt } from "./prompts/rootCausePrompt.js";


function parseAsJson<T>(text: string): T {
// Robust JSON parsing with graceful fallback.
try {
// Strip code fences if any (defensive):
const cleaned = text.replace(/^```(json)?/i, "").replace(/```$/i, "");
return JSON.parse(cleaned) as T;
} catch (err) {
throw new Error(`AI response is not valid JSON: ${String(err)}`);
}
}


export class DefaultAIAnalyzer implements AIAnalyzer {
constructor(private readonly provider: LLMProvider) {}


async analyze(input: NormalizedReport): Promise<AIAnalysisResult> {
// Serialize the report to feed into the LLM.
const payload = JSON.stringify(input);
const prompt = rootCausePrompt(payload);


const raw = await this.provider.generate(prompt, {
system: "You are a senior QA engineer specialized in root cause analysis.",
temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
maxTokens: Number(process.env.OPENAI_MAX_TOKENS ?? 1200)
});


const json = parseAsJson<AIAnalysisResult>(raw);


// Light sanity checks to keep output consistent for formatters.
return {
rootCauses: json.rootCauses ?? [],
flakyCandidates: json.flakyCandidates ?? [],
newTestIdeas: json.newTestIdeas ?? [],
actions: json.actions ?? []
};
}
}