# Architecture and decision boundaries

## Product invariant

An adoption claim is valid only when the evidence chain is intact:

`segment -> workflow -> baseline -> clinic -> blocker -> owner -> action -> customer validation -> repeat use -> playbook -> proof decision`

The rules engine returns the highest fully evidenced state. Summary fields cannot promote a workflow by themselves: baseline and enablement must match the workflow and eligible count; clinic first value must match workflow, timestamp, and product version; every blocker must match owner, state, closure condition, and owned action; current usage must match version, observation time, counts, and distinct periods; and customer validation must match the current product version and validation record. Removing or mismatching any required source regresses the state to `UNKNOWN`.

## Boundaries

| Boundary         | Contract                              | Failure behavior                                          |
| ---------------- | ------------------------------------- | --------------------------------------------------------- |
| UI to API        | JSON validated at the route edge      | 422 with named invalid fields; no state change            |
| API to service   | Typed application functions           | No direct fixture/database access from components         |
| Service to rules | `WorkflowEvidence -> DecisionReceipt` | Deterministic state, reasons, held fields, and source IDs |
| Adapter to store | Versioned snapshot rows               | Reject candidate atomically; retain accepted snapshot     |
| Store to tenant  | `organization_id` plus membership     | RLS policy on every table; provider proof remains UNKNOWN |
| Receipt to human | Ruleset output plus named authority   | Receipt cannot self-approve adoption, privacy, or proof   |

## State regression

Adoption can regress when evidence becomes stale, the product version changes, a critical blocker reopens, validation is withdrawn, or customer evidence disagrees with telemetry. The engine computes state from current evidence; it never treats a previous badge as authority.

## Persistence posture

The public build deliberately uses synthetic fixtures so it runs without credentials. `supabase/migrations/0001_adoption_evidence.sql` is a production persistence contract, not proof of a live database. It includes organization membership, customer accounts, workflow definitions, evidence, blockers, receipts, approvals, and audit events. Child rows use composite organization/parent foreign keys so an operator cannot pass one tenant's RLS while referencing another tenant's parent. Policies are role- and operation-specific; viewers are read-only; evidence, receipts, approvals, and audit events are append-only; and an approver must be the signed-in user, hold the approval-specific role, and differ from the requester.

## AI boundary

No AI API is called at runtime. A future assistant may draft or cluster against approved source records, but its output must retain source IDs, tool/model/contract versions, reviewer, and unresolved claims. It cannot mutate source observations, metrics, approvals, or adoption state.
