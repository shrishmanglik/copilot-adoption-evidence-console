import { describe, expect, it } from "vitest";
import { evaluateAdoption } from "@/lib/domain/adoption-engine";
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
});
