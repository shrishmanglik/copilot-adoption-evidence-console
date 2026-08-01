import { z } from "zod";

export const clinicReceiptInputSchema = z.object({
  accountId: z.string().min(1).max(80),
  workflowId: z.string().min(1).max(80),
  attemptedTask: z.string().min(8).max(500),
  observedOutcome: z.string().min(8).max(1000),
  expectedOutcome: z.string().min(8).max(1000),
  friction: z.string().min(8).max(1000),
  productVersion: z.string().min(1).max(80),
  systemOwnerAction: z.string().min(8).max(500),
  customerOwnerAction: z.string().min(8).max(500),
  nextTestAt: z.iso.datetime(),
  consentToOperationalNotes: z.literal(true),
});

export type ClinicReceiptPayload = z.infer<typeof clinicReceiptInputSchema>;

export const governedWorkflowReceiptInputSchema = z.object({
  kind: z.enum(["BLOCKER_ACTION", "CUSTOMER_VALIDATION", "PLAYBOOK_CANDIDATE"]),
  workflowId: z.string().min(1).max(80),
  productVersion: z.string().min(1).max(80),
  evidenceSummary: z.string().min(12).max(1000),
  ownerAction: z.string().min(12).max(500),
  stopCondition: z.string().min(12).max(500),
  humanReviewAcknowledged: z.literal(true),
});
