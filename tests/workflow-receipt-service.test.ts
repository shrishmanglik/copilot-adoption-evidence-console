import { describe, expect, it } from "vitest";
import { createGovernedWorkflowReceipt } from "@/lib/domain/workflow-receipt-service";

const common = {
  workflowId: "wf-report-accuracy",
  productVersion: "2026.7",
  evidenceSummary:
    "A current synthetic source record supports a human review draft.",
  ownerAction:
    "The named owner preserves source language and coordinates the next review.",
  stopCondition:
    "Stop when product version or customer evidence no longer matches.",
  humanReviewAcknowledged: true,
} as const;

describe("governed workflow receipt boundary", () => {
  it.each([
    ["BLOCKER_ACTION", ["customer_retest", "closure_review"]],
    ["CUSTOMER_VALIDATION", ["customer_signature", "adoption_lead_review"]],
    ["PLAYBOOK_CANDIDATE", ["second_account_evidence", "product_review"]],
  ] as const)(
    "keeps %s deterministic, non-persisted, and human-held",
    (kind, heldFields) => {
      const receipt = createGovernedWorkflowReceipt(
        { ...common, kind },
        "2026-08-01T12:00:00.000Z",
      );
      expect(receipt.status).toBe("DRAFT_NOT_PERSISTED");
      expect(receipt.externalAction).toBe("NONE");
      expect(receipt.humanApprovalRequired).toBe(true);
      expect(receipt.heldFields).toEqual(heldFields);
    },
  );

  it("rejects a draft when the human boundary is not acknowledged", () => {
    expect(() =>
      createGovernedWorkflowReceipt({
        ...common,
        kind: "CUSTOMER_VALIDATION",
        humanReviewAcknowledged: false,
      }),
    ).toThrow();
  });
});
