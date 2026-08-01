# Security and privacy posture

## Implemented source controls

- Synthetic fixtures only; no external identifiers or employer/customer records.
- No credential or environment variable required for local operation.
- Zod validation at the clinic receipt boundary.
- Atomic import rejection and last-accepted-snapshot recovery.
- Tenant key on every persistence table.
- RLS enabled on every table with role- and operation-specific policies; the viewer role has no write path.
- Composite organization/account and organization/workflow foreign keys reject cross-tenant parent references before RLS policy success can create an inconsistent child.
- Evidence, adoption receipts, approvals, and audit events are append-only in the persistence contract.
- Approval inserts require the signed-in approver, an approval-specific role, and a different requester.
- Export payload declares versions, generation time, scope, held fields, and caveats.
- Customer proof stays held until customer and privacy approvals exist.

## Unknown until a real deployment exists

SSO, provider configuration, applied migrations, live RLS, backup/restore, retention, residency, incident response, penetration testing, audit-log durability, and regulatory applicability are all `UNKNOWN`. No source file can prove provider-owned state.

## Data minimization

A production adapter should ingest only approved account, product, support, and usage fields. Prompts, transcripts, finance data, and personal identifiers should remain outside the system unless a purpose, retention period, access model, and export policy are approved.
