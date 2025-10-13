// Structured prompt to request JSON-only output from the LLM.
export const rootCausePrompt = (serializedReport: string) => `
You are an AI QA assistant. Analyze the following normalized test report and produce a JSON object with the following shape:
{
"rootCauses": [{"id": string, "area": string, "description": string, "evidence": string[], "likelihood": number}],
"flakyCandidates": [{"testId": string, "reason": string, "evidence": string[], "confidence": number}],
"newTestIdeas": [{"title": string, "description": string, "targetArea": string, "priority": "low"|"medium"|"high"|"critical"}],
"actions": [{"title": string, "description": string, "ownerHint"?: string, "priority": "low"|"medium"|"high"|"critical"}]
}
DO NOT include markdown fences. JSON only.


Report:
${serializedReport}
`;