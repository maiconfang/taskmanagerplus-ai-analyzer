/**
 * Mock AI Provider
 * ----------------
 * This provider simulates AI analysis without making any real API calls.
 * It is 100% free to use and safe for local testing.
 */

export async function analyzeWithMock(summary: any) {
  // Simulated delay (just for realism)
  await new Promise((r) => setTimeout(r, 300));

  return {
    provider: "mock",
    insights: [
      "Mock Insight: Most of the failed tests are related to login validation issues.",
      "Mock Insight: Some tests could be flaky due to network timeouts or missing waits.",
      "Mock Insight: The average test duration increased compared to the previous run.",
    ],
    suggestions: [
      "Add proper synchronization (waits or retries) for unstable selectors.",
      "Review login-related test cases for incorrect credentials or missing preconditions.",
      "Use a test data reset or cleanup step before starting each suite.",
    ],
    notes: [
      "This mock response is generated locally — no AI provider was contacted.",
      "Switch AI_PROVIDER to 'openai' and set AI_ENABLED=true to use real AI analysis later."
    ],
  };
}
