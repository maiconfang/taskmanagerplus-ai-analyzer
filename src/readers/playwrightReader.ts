// src/readers/playwrightReader.ts
// Drop-in replacement: mesma função/assinatura, mas suporta o formato moderno do Playwright.
// Se o JSON já for um array (seu sample antigo), continua funcionando igual.

import { promises as fs } from "node:fs";
import { resolve } from "node:path";

type AnyJson = any;
type CanonicalStatus = "passed" | "failed" | "flaky" | "skipped";

let seq = 0;
const nextId = () => String(++seq);

function mapStatus(s: string): CanonicalStatus {
  if (s === "passed") return "passed";
  if (s === "skipped") return "skipped";
  // Trate timeouts/interruptions como failed para relatório determinístico
  if (s === "failed" || s === "timedOut" || s === "interrupted") return "failed";
  return "failed";
}

export async function readPlaywrightReport(inputPath: string): Promise<{
  startedAt?: string;
  finishedAt?: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cases: Array<{
    id: string;               // ✅ agora sempre string
    title: string;
    status: CanonicalStatus;
    durationMs?: number;
    file?: string;
    project?: string;
    errorMessage?: string;
  }>;
  meta: { source: string };
}> {
  const full = resolve(inputPath);
  const raw = await fs.readFile(full, "utf-8");
  const data: AnyJson = JSON.parse(raw);

  const cases: Array<{
    id: string;
    title: string;
    status: CanonicalStatus;
    durationMs?: number;
    file?: string;
    project?: string;
    errorMessage?: string;
  }> = [];

  // ---------------------------
  // 1) Compat: se for um ARRAY (sample antigo), mantém comportamento anterior
  // ---------------------------
  if (Array.isArray(data)) {
    data.forEach((t: AnyJson, i: number) => {
      cases.push({
        id: t.id ? String(t.id) : nextId(),        // ✅ garante string
        title: String(t.title ?? "Untitled"),
        status: mapStatus(t.status ?? "skipped"),
        durationMs: t.durationMs,
        file: t.file,
        project: t.project,
        errorMessage: t.errorMessage,
      });
    });
  } else {
    // ---------------------------
    // 2) Formato moderno: suites → specs → tests → results
    // ---------------------------
    function collectFromSuite(suite: AnyJson) {
      if (!suite) return;

      if (Array.isArray(suite.specs)) {
        for (const spec of suite.specs) {
          const title: string = spec?.title ?? "(no title)";
          const tests: AnyJson[] = spec?.tests ?? [];
          for (const t of tests) {
            const project: string | undefined = t?.projectName ?? t?.projectId ?? undefined;
            const results: AnyJson[] = t?.results ?? [];
            if (results.length === 0) {
              cases.push({
                id: nextId(),                       // ✅ add id
                title,
                status: "skipped",
                project,
              });
            } else {
              for (const r of results) {
                cases.push({
                  id: nextId(),                     // ✅ add id
                  title,
                  status: mapStatus(r?.status ?? "skipped"),
                  durationMs: typeof r?.duration === "number" ? r.duration : undefined,
                  project,
                  errorMessage:
                    (Array.isArray(r?.errors) && r.errors[0]?.message) ||
                    r?.error?.message ||
                    undefined,
                });
              }
            }
          }
        }
      }

      if (Array.isArray(suite.suites)) {
        for (const child of suite.suites) collectFromSuite(child);
      }
    }

    if (Array.isArray(data?.suites)) {
      for (const s of data.suites) collectFromSuite(s);
    }

    // Fallback: alguns relatos antigos têm top-level "tests"
    if (cases.length === 0 && Array.isArray(data?.tests)) {
      for (const t of data.tests) {
        const title: string = t?.title ?? "(no title)";
        const project: string | undefined = t?.projectName ?? t?.projectId ?? undefined;
        const results: AnyJson[] = t?.results ?? [];
        if (results.length === 0) {
          cases.push({
            id: nextId(),                           // ✅ add id
            title,
            status: "skipped",
            project,
          });
        } else {
          for (const r of results) {
            cases.push({
              id: nextId(),                         // ✅ add id
              title,
              status: mapStatus(r?.status ?? "skipped"),
              durationMs: typeof r?.duration === "number" ? r.duration : undefined,
              project,
              errorMessage:
                (Array.isArray(r?.errors) && r.errors[0]?.message) ||
                r?.error?.message ||
                undefined,
            });
          }
        }
      }
    }
  }

  if (cases.length === 0) {
    throw new Error("Unsupported Playwright report shape: no test results found.");
  }

  const totals = cases.reduce(
    (acc, c) => {
      acc.total++;
      if (c.status === "passed") acc.passed++;
      else if (c.status === "failed") acc.failed++;
      else if (c.status === "skipped") acc.skipped++;
      return acc;
    },
    { total: 0, passed: 0, failed: 0, skipped: 0 }
  );

  return {
    startedAt: undefined,
    finishedAt: undefined,
    ...totals,
    cases,
    meta: { source: full },
  };
}
