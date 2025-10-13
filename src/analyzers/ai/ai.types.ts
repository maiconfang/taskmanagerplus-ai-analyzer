import { AIAnalysisResult, NormalizedReport } from "../../types/analyzer.js";


export interface AIAnalyzerOptions {
provider: "null" | "openai";
}


export interface LLMGenerateOptions {
system?: string;
temperature?: number;
maxTokens?: number;
}


export interface LLMProvider {
name: string;
generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}


export interface AIAnalyzer {
analyze(input: NormalizedReport): Promise<AIAnalysisResult>;
}