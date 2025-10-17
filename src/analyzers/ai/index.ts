import { DefaultAIAnalyzer } from "./aiAnalyzer.js";
import { AIAnalyzer, AIAnalyzerOptions, LLMProvider } from "./ai.types.js";
import { NullProvider } from "./providers/null.js";
import { OpenAIProvider } from "./providers/openai.js";


export function createAIAnalyzer(opts?: Partial<AIAnalyzerOptions>): AIAnalyzer {
    const providerName = opts?.provider ?? (process.env.AI_PROVIDER as any) ?? "null";


    let provider: LLMProvider;
    if (providerName === "openai") {
        provider = new OpenAIProvider(
            process.env.OPENAI_API_KEY ?? "",
            process.env.OPENAI_MODEL ?? "gpt-4o-mini"
        );
    } else {
        provider = new NullProvider();
    }


    return new DefaultAIAnalyzer(provider);
}