import { describe, expect, it } from "vitest";
import {
  evaluateAdoption,
  evaluateProofEligibility,
} from "@/lib/domain/adoption-engine";
import { buildEvidenceTrace } from "@/lib/domain/evidence-trace";
import { syntheticWorkflows } from "@/lib/fixtures/synthetic-data";

describe("critical adoption validator", () => {
  it("holds stale critical evidence as UNKNOWN", () => {
    const result = evaluateAdoption(syntheticWorkflows.staleEvidence);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("current_usage_snapshot");
  });

  it("does not treat internal resolution as customer-validated closure", () => {
    const result = evaluateAdoption(syntheticWorkflows.pendingValidation);
    expect(result.state).toBe("BLOCKED");
    expect(result.reasons).toContain("Customer validation is pending");
  });

  it("allows verified adoption only with repeat use and current human validation", () => {
    const result = evaluateAdoption(syntheticWorkflows.verified);
    expect(result.state).toBe("VERIFIED_ADOPTION");
    expect(result.authority).toBe("Customer champion + adoption lead");
  });

  it("fails closed when summary fields have no source records", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords = [];
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("current_product_release");
    expect(result.heldFields).toContain("current_usage_snapshot");
    expect(result.heldFields).toContain("current_product_version_validation");
  });

  it("rejects an invalid or future source timestamp", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords[0].observedAt = "2099-01-01T00:00:00.000Z";
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("valid_source_timestamps");
  });

  it("rejects evidence chronology when validation predates a source event", () => {
    for (const lateKind of ["ACTION", "RELEASE"] as const) {
      const input = structuredClone(syntheticWorkflows.verified);
      const source = input.sourceRecords.find(
        (record) => record.kind === lateKind,
      );
      if (!source) throw new Error(`fixture must include ${lateKind}`);
      source.observedAt = "2026-08-01T11:00:00.000Z";
      const result = evaluateAdoption(input);
      expect(result.state).toBe("UNKNOWN");
      expect(result.heldFields).toContain("evidence_chronology");
    }
  });

  it("rejects source evidence scoped to another account or segment", () => {
    for (const field of ["accountId", "segment"] as const) {
      const input = structuredClone(syntheticWorkflows.verified);
      input[field] = `different-${field}`;
      const result = evaluateAdoption(input);
      expect(result.state).toBe("UNKNOWN");
      expect(result.heldFields).toContain("source_scope_identity");
    }
  });

  it("rejects a usage summary that does not match its source version and counts", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    const current = input.sourceRecords.find(
      (source) => source.observedAt === input.usageSnapshotAt,
    );
    if (!current) throw new Error("fixture must include current usage source");
    current.productVersion = "2026.6";
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("current_usage_snapshot");
  });

  it("rejects repeat-use periods that exceed distinct evidenced periods", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.repeatUsePeriods = 4;
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("repeat_use_periods");
  });

  it("invalidates validation when the current product version changes", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.productVersion = "2026.8";
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("current_product_release");
    expect(result.heldFields).toContain("current_product_version_validation");
  });

  it("invalidates adoption when the baseline source is removed", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords = input.sourceRecords.filter(
      (source) => source.kind !== "BASELINE",
    );
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("baseline_source");
  });

  it("invalidates adoption when the clinic first-value source is removed", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords = input.sourceRecords.filter(
      (source) => source.kind !== "CLINIC",
    );
    const result = evaluateAdoption(input);
    expect(result.state).toBe("UNKNOWN");
    expect(result.heldFields).toContain("clinic_first_value_source");
  });

  it("invalidates adoption when blocker or action sources are removed", () => {
    for (const missingKind of ["BLOCKER", "ACTION"] as const) {
      const input = structuredClone(syntheticWorkflows.verified);
      input.sourceRecords = input.sourceRecords.filter(
        (source) => source.kind !== missingKind,
      );
      const result = evaluateAdoption(input);
      expect(result.state).toBe("UNKNOWN");
      expect(
        result.heldFields.some((field) =>
          field.startsWith(
            missingKind === "BLOCKER" ? "blocker_source" : "action_source",
          ),
        ),
      ).toBe(true);
    }
  });

  it("keeps proof held until each named approval source exists", () => {
    const adoption = evaluateAdoption(syntheticWorkflows.verified);
    const proof = evaluateProofEligibility(
      syntheticWorkflows.verified,
      adoption,
    );
    expect(proof.status).toBe("ELIGIBLE_HELD");
    expect(proof.heldGateIds).toEqual([
      "METRIC_APPROVAL",
      "CUSTOMER_PROOF_CONSENT",
      "PRIVACY",
      "WORDING",
      "PUBLICATION",
    ]);
  });

  it("makes proof eligible only from exact approval records", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    for (const approvalType of [
      "CUSTOMER",
      "METRIC",
      "PRIVACY",
      "WORDING",
      "PUBLICATION",
    ] as const) {
      input.sourceRecords.push({
        id: `src-approval-${approvalType.toLowerCase()}`,
        kind: "APPROVAL",
        version: "approval.v1",
        observedAt: input.asOf,
        scope: {
          accountId: input.accountId,
          segment: input.segment,
        },
        approval: {
          proofCandidateId: `proof-${input.id}`,
          type: approvalType,
          state: "APPROVED",
          requestedByActorId: "synthetic-requester",
          approverActorId: `synthetic-${approvalType.toLowerCase()}-reviewer`,
          expiresAt: "2026-09-01T00:00:00.000Z",
        },
        synthetic: true,
      });
    }
    const proof = evaluateProofEligibility(input, evaluateAdoption(input));
    expect(proof.status).toBe("ELIGIBLE");
    expect(proof.heldGateIds).toEqual([]);
  });

  it("rejects expired or self-approved proof records", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords.push({
      id: "src-approval-privacy-invalid",
      kind: "APPROVAL",
      version: "approval.v1",
      observedAt: input.asOf,
      scope: { accountId: input.accountId, segment: input.segment },
      approval: {
        proofCandidateId: `proof-${input.id}`,
        type: "PRIVACY",
        state: "APPROVED",
        requestedByActorId: "synthetic-same-actor",
        approverActorId: "synthetic-same-actor",
        expiresAt: "2026-07-31T00:00:00.000Z",
      },
      synthetic: true,
    });
    const proof = evaluateProofEligibility(input, evaluateAdoption(input));
    expect(proof.status).toBe("ELIGIBLE_HELD");
    expect(proof.heldGateIds).toContain("PRIVACY");
  });

  it("rejects an approval issued for another proof candidate", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords.push({
      id: "src-approval-wrong-candidate",
      kind: "APPROVAL",
      version: "approval.v1",
      observedAt: input.asOf,
      scope: { accountId: input.accountId, segment: input.segment },
      approval: {
        proofCandidateId: "proof-another-workflow",
        type: "CUSTOMER",
        state: "APPROVED",
        requestedByActorId: "synthetic-requester",
        approverActorId: "synthetic-customer-reviewer",
      },
      synthetic: true,
    });
    const proof = evaluateProofEligibility(input, evaluateAdoption(input));
    expect(proof.heldGateIds).toContain("CUSTOMER_PROOF_CONSENT");
  });

  it("keeps proof held when an explicit caveat record is absent", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords = input.sourceRecords.filter(
      (source) => source.kind !== "CAVEAT",
    );
    for (const approvalType of [
      "CUSTOMER",
      "METRIC",
      "PRIVACY",
      "WORDING",
      "PUBLICATION",
    ] as const) {
      input.sourceRecords.push({
        id: `src-caveat-test-${approvalType.toLowerCase()}`,
        kind: "APPROVAL",
        version: "approval.v1",
        observedAt: input.asOf,
        scope: { accountId: input.accountId, segment: input.segment },
        approval: {
          proofCandidateId: `proof-${input.id}`,
          type: approvalType,
          state: "APPROVED",
          requestedByActorId: "synthetic-requester",
          approverActorId: `synthetic-${approvalType.toLowerCase()}-reviewer`,
        },
        synthetic: true,
      });
    }
    const proof = evaluateProofEligibility(input, evaluateAdoption(input));
    expect(proof.status).toBe("ELIGIBLE_HELD");
    expect(proof.heldGateIds).toEqual(["CAVEATS"]);
  });

  it("builds every trace stage from exact IDs rather than array position", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    input.sourceRecords.reverse();
    const adoption = evaluateAdoption(input);
    const proof = evaluateProofEligibility(input, adoption);
    const trace = buildEvidenceTrace(input, adoption, proof);
    expect(
      trace.find((stage) => stage.id === "CLINIC_FIRST_VALUE")?.evidenceIds,
    ).toEqual(["src-clinic-303"]);
    expect(trace.find((stage) => stage.id === "BLOCKER")?.evidenceIds).toEqual([
      "src-blocker-303",
    ]);
    expect(trace.find((stage) => stage.id === "PLAYBOOK")?.evidenceIds).toEqual(
      ["src-playbook-303"],
    );
  });
});
