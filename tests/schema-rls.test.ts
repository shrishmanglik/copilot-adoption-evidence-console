import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "supabase/migrations/0001_adoption_evidence.sql",
  "utf8",
).toLowerCase();
const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map(
  (match) => match[1],
);

describe("Supabase schema contract", () => {
  it("enables RLS on every created table", () => {
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables)
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
  });

  it("declares at least one policy for every created table", () => {
    for (const table of tables)
      expect(sql).toMatch(
        new RegExp(`create policy [\\s\\S]+? on public\\.${table} `),
      );
  });

  it("makes the audit event store append-only", () => {
    expect(sql).toContain("before update or delete on public.audit_events");
    expect(sql).toContain("audit_events are append-only");
  });
});
