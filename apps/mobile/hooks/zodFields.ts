import type { ZodError } from "zod";

export function zodFields(error: ZodError): Record<string, string> {
  const next: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!next[key]) next[key] = issue.message;
  }
  return next;
}
