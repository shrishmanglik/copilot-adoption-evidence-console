# Operator runbook

## Start and verify

```bash
npm ci
npm run test:mutation
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

No environment file is required for the fixture-backed build. `/api/health` reports `synthetic-memory-only` and provider state `UNKNOWN`.

## Primary workflow

1. Inspect the adoption register and open a decision receipt.
2. Trace the source records before accepting the displayed state.
3. Open Clinics, record the observed and expected behavior, assign both sides' actions, and set a retest date.
4. Generate the draft receipt. Confirm it says `DRAFT_NOT_PERSISTED` and lists both human holds.
5. Route the receipt to the facilitator and customer champion; the application does not send it.

## Recovery

| Fault                | Required behavior             | Rollback / retry                                                   |
| -------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Invalid clinic input | 422; form remains present     | Correct fields and retry, or undo draft                            |
| Failed import        | Entire candidate rejected     | Keep prior accepted snapshot; fix row errors and replay            |
| Telemetry delayed    | Current state becomes UNKNOWN | Refresh through the versioned adapter; never backfill by inference |
| Version changed      | Prior validation held stale   | Retest affected workflow on the current version                    |
| Customer disagrees   | State becomes DISPUTED        | Preserve both sources and route to human review                    |
| Migration fails      | Stop provider rollout         | Execute reviewed rollback migration under provider authority       |

## Rollback scope

Application rollback is a Git revert on the task branch before merge, or platform rollback after an authorized deployment. Database rollback SQL is supplied but must not be run against a provider without separate authority and a backup/restore gate.

## Claim ceiling

Local health, tests, and screenshots are not deployment, provider, customer, or revenue proof. Keep those states `UNKNOWN` until the owning evidence exists.
