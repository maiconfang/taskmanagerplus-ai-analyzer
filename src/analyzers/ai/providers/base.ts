import { LLMGenerateOptions, LLMProvider } from "../ai.types.js";


export abstract class BaseLLMProvider implements LLMProvider {
abstract name: string;
abstract generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}