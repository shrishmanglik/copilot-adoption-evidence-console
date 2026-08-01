import { governedWorkflowReceiptInputSchema } from "./schemas";
import type { GovernedWorkflowReceipt } from "./types";

const holds = {
  BLOCKER_ACTION: ["customer_retest", "closure_review"],
  CUSTOMER_VALIDATION: ["customer_signature", "adoption_lead_review"],
  PLAYBOOK_CANDIDATE: ["second_account_evidence", "product_review"],
} as const;

export function createGovernedWorkflowReceipt(
  candidate: unknown,
  generatedAt = new Date().toISOString(),
): GovernedWorkflowReceipt {
  const input = governedWorkflowReceiptInputSchema.parse(candidate);
  return {
    ...input,
    receiptId: `draft-${input.kind.toLowerCase()}-${input.workflowId}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    status: "DRAFT_NOT_PERSISTED",
    heldFields: [...holds[input.kind]],
    humanApprovalRequired: true,
    externalAction: "NONE",
    synthetic: true,
  };
}
