import type { ClinicReceipt } from "./types";
import { clinicReceiptInputSchema, type ClinicReceiptPayload } from "./schemas";

export function createClinicReceipt(
  raw: unknown,
  generatedAt = new Date().toISOString(),
): ClinicReceipt {
  const input: ClinicReceiptPayload = clinicReceiptInputSchema.parse(raw);
  return {
    ...input,
    receiptId: `clinic-${input.accountId}-${input.workflowId}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    status: "DRAFT_NOT_PERSISTED",
    heldFields: ["facilitator_review", "customer_confirmation"],
    humanApprovalRequired: true,
  };
}
