// src/config.ts
export const CONFIG = {
  aiProvider: (process.env.AI_PROVIDER ?? 'off').toLowerCase(),
  aiEnabled: (process.env.AI_ENABLED ?? 'false').toLowerCase() === 'true',
  aiModel: process.env.AI_MODEL ?? '',
  apiKey: process.env.OPENAI_API_KEY ?? '',
  budgetCents: Number(process.env.AI_BUDGET_CENTS ?? '0'),
};

export function isAiAllowed(): boolean {
  if (!CONFIG.aiEnabled) return false;
  if (CONFIG.aiProvider !== 'openai') return false;
  if (!CONFIG.apiKey) return false;
  if (CONFIG.budgetCents <= 0) return false;
  return true;
}
