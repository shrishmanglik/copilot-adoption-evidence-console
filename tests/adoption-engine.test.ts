import { describe, expect, it } from "vitest";
import {
  evaluateAdoption,
  evaluateProofEligibility,
} from "@/lib/domain/adoption-engine";
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

  it("rejects a usage summary that does not match its source version and counts", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    const current = input.sourceRecords.find(
      (source) => source.observedAt === input.usageSnapshotAt,
    );
    if (!current) throw new Error("fixture must include current usage source");
    current.version = "2026.6";
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

  it("keeps proof held until each named approval source exists", () => {
    const adoption = evaluateAdoption(syntheticWorkflows.verified);
    const proof = evaluateProofEligibility(
      syntheticWorkflows.verified,
      adoption,
    );
    expect(proof.status).toBe("ELIGIBLE_HELD");
    expect(proof.heldGateIds).toEqual(["PRIVACY", "WORDING", "PUBLICATION"]);
  });

  it("makes proof eligible only from exact approval records", () => {
    const input = structuredClone(syntheticWorkflows.verified);
    for (const approvalType of ["PRIVACY", "WORDING", "PUBLICATION"] as const) {
      input.sourceRecords.push({
        id: `src-approval-${approvalType.toLowerCase()}`,
        kind: "APPROVAL",
        version: "approval.v1",
        observedAt: input.asOf,
        approval: {
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
      approval: {
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
});
