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
    expect(sql).toContain(
      "evidence, receipts, receipt sources, proof candidates, approvals, and audit events are append-only",
    );
  });

  it("never grants all operations to generic organization membership", () => {
    expect(sql).not.toMatch(
      /create policy [\s\S]*? for all [\s\S]*?is_org_member/,
    );
    expect(sql).not.toMatch(/has_org_role\([^)]*array\[[^\]]*'viewer'/);
  });

  it("keeps consequential evidence, receipts, and approvals append-only", () => {
    for (const table of [
      "evidence_records",
      "adoption_receipts",
      "adoption_receipt_sources",
      "proof_candidates",
      "approvals",
    ]) {
      expect(sql).toContain(`before update or delete on public.${table}`);
    }
    expect(sql).not.toMatch(
      /create policy \w+ on public\.(evidence_records|adoption_receipts|adoption_receipt_sources|proof_candidates|approvals) for (update|delete)/,
    );
  });

  it("binds approvals to the signed-in approver and separates requester authority", () => {
    expect(sql).toContain("check (requested_by_user_id <> approver_user_id)");
    expect(sql).toContain("approver_user_id = auth.uid()");
    expect(sql).toContain("requested_by_user_id <> auth.uid()");
    expect(sql).toContain(
      "public.is_org_user(organization_id, requested_by_user_id)",
    );
    expect(sql).toContain(
      "approval_type = 'privacy' and public.has_org_role(organization_id, array['privacy_reviewer'])",
    );
    expect(sql).toContain(
      "approval_type = 'wording' and public.has_org_role(organization_id, array['marketing_reviewer'])",
    );
    expect(sql).toContain(
      "approval_type = 'publication' and public.has_org_role(organization_id, array['marketing_reviewer'])",
    );
  });

  it("limits receipt creation to the adoption lead and source creation to named operators", () => {
    expect(sql).toContain(
      "create policy receipts_lead_insert on public.adoption_receipts for insert",
    );
    expect(sql).toContain(
      "created_by = auth.uid() and public.has_org_role(organization_id, array['adoption_lead'])",
    );
    expect(sql).toContain(
      "create policy evidence_operator_insert on public.evidence_records for insert",
    );
  });

  it("binds every child row to a parent in the same tenant", () => {
    expect(sql).toContain("unique (organization_id, id)");
    expect(sql).toContain(
      "foreign key (organization_id, account_id) references public.customer_accounts(organization_id, id)",
    );
    for (const table of [
      "evidence_records",
      "blockers",
      "adoption_receipts",
      "approvals",
      "audit_events",
    ]) {
      const tableDefinition = sql.match(
        new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`),
      )?.[1];
      expect(tableDefinition).toContain(
        "foreign key (organization_id, workflow_id) references public.workflow_definitions(organization_id, id)",
      );
    }
    expect(sql).not.toContain("references public.customer_accounts(id)");
    expect(sql).not.toContain("references public.workflow_definitions(id)");
  });

  it("binds every persisted actor to membership in the same tenant", () => {
    for (const relationship of [
      "foreign key (organization_id, owner_user_id) references public.memberships(organization_id, user_id)",
      "foreign key (organization_id, created_by) references public.memberships(organization_id, user_id)",
      "foreign key (organization_id, requested_by_user_id) references public.memberships(organization_id, user_id)",
      "foreign key (organization_id, approver_user_id) references public.memberships(organization_id, user_id)",
      "foreign key (organization_id, actor_user_id) references public.memberships(organization_id, user_id)",
    ]) {
      expect(sql).toContain(relationship);
    }
    expect(sql.match(/references auth\.users\(id\)/g)).toHaveLength(1);
  });

  it("normalizes receipt evidence and proof approval references", () => {
    expect(sql).not.toContain("source_record_ids jsonb");
    expect(sql).not.toContain("subject_id uuid");
    expect(sql).not.toContain("subject_type text");
    expect(sql).toContain(
      "foreign key (organization_id, workflow_id, receipt_id) references public.adoption_receipts(organization_id, workflow_id, id)",
    );
    expect(sql).toContain(
      "foreign key (organization_id, workflow_id, evidence_record_id) references public.evidence_records(organization_id, workflow_id, id)",
    );
    expect(sql).toContain(
      "foreign key (organization_id, workflow_id, proof_candidate_id) references public.proof_candidates(organization_id, workflow_id, id)",
    );
    expect(sql).toContain(
      "foreign key (organization_id, workflow_id, caveat_evidence_record_id) references public.evidence_records(organization_id, workflow_id, id)",
    );
  });
});
