import { describe, expect, it } from "vitest";
import { createClinicReceipt } from "@/lib/domain/clinic-service";

const valid = {
  accountId: "syn-planning-a",
  workflowId: "wf-planning-refresh",
  attemptedTask: "Refresh the approved planning forecast",
  observedOutcome: "The refresh completed but freshness was not visible",
  expectedOutcome:
    "The operator can see source freshness before accepting output",
  friction: "The team could not verify whether the source snapshot was current",
  productVersion: "2026.7",
  systemOwnerAction: "Expose source freshness beside the generated output",
  customerOwnerAction: "Retest the workflow with the next approved snapshot",
  nextTestAt: "2026-08-05T14:00:00.000Z",
  consentToOperationalNotes: true,
};

describe("clinic receipt boundary", () => {
  it("creates a held draft and never self-approves", () => {
    const receipt = createClinicReceipt(valid, "2026-08-01T12:00:00.000Z");
    expect(receipt.status).toBe("DRAFT_NOT_PERSISTED");
    expect(receipt.humanApprovalRequired).toBe(true);
    expect(receipt.heldFields).toEqual([
      "facilitator_review",
      "customer_confirmation",
    ]);
  });

  it("rejects missing operational consent", () => {
    expect(() =>
      createClinicReceipt({ ...valid, consentToOperationalNotes: false }),
    ).toThrow();
  });

  it("rejects an under-specified observed outcome", () => {
    expect(() =>
      createClinicReceipt({ ...valid, observedOutcome: "unclear" }),
    ).toThrow();
  });
});
