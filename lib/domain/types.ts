export const adoptionStates = [
  "DISCOVERED",
  "BASELINED",
  "ENABLED",
  "FIRST_VALUE",
  "REPEAT_USE",
  "VERIFIED_ADOPTION",
  "STALLED",
  "BLOCKED",
  "DISPUTED",
  "PAUSED",
  "UNKNOWN",
  "CLOSED_NOT_ADOPTED",
] as const;

export type AdoptionState = (typeof adoptionStates)[number];

export type ValidationState =
  "APPROVED" | "PENDING" | "WITHDRAWN" | "DISPUTED" | "UNKNOWN";

export type BlockerState =
  "OPEN" | "IN_PROGRESS" | "RESOLVED_PENDING_VALIDATION" | "VALIDATED_CLOSED";

export type BlockerCategory =
  | "ACCURACY_TRUST"
  | "UX_FRICTION"
  | "DATA_MODEL"
  | "WORKFLOW_FIT"
  | "ACCESS_PERMISSIONS"
  | "KNOWLEDGE_ENABLEMENT"
  | "TECHNICAL_RELIABILITY"
  | "OWNERSHIP"
  | "UNKNOWN";

export interface SourceRecord {
  id: string;
  kind: "CLINIC" | "USAGE_SNAPSHOT" | "RELEASE" | "VALIDATION" | "APPROVAL";
  version: string;
  observedAt: string;
  synthetic: true;
}

export interface AdoptionBlocker {
  id: string;
  category: BlockerCategory;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  state: BlockerState;
  ownerRole: string;
  dueAt: string;
  closureCondition: string;
}

export interface WorkflowEvidence {
  id: string;
  accountId: string;
  accountLabel: string;
  segment: string;
  workflowLabel: string;
  ownerRole: string;
  asOf: string;
  enabledAt?: string;
  firstValueAt?: string;
  usageSnapshotAt?: string;
  freshnessLimitDays: number;
  repeatRulePeriods: number;
  repeatUsePeriods: number;
  observationWindowComplete: boolean;
  eligibleUsers: number;
  firstValueUsers: number;
  repeatUsers: number;
  productVersion: string;
  validatedProductVersion?: string;
  customerValidation: ValidationState;
  customerValidationAt?: string;
  customerDisagrees: boolean;
  blockers: AdoptionBlocker[];
  sourceRecords: SourceRecord[];
  nextIntervention: string;
}

export interface DecisionReceipt {
  receiptId: string;
  workflowId: string;
  evaluatedAt: string;
  state: AdoptionState;
  reasons: string[];
  heldFields: string[];
  sourceRecordIds: string[];
  authority: string;
  rulesetVersion: "adoption-rules.v1";
  synthetic: true;
}

export interface MetricReceipt {
  metric: "ACTIVATION_RATE" | "REPEAT_USE_RATE" | "VALIDATED_CLOSURE_RATE";
  numerator: number;
  denominator: number;
  value: number | null;
  exclusions: string[];
  observationWindow: string;
  definition: string;
}

export interface ClinicReceiptInput {
  accountId: string;
  workflowId: string;
  attemptedTask: string;
  observedOutcome: string;
  expectedOutcome: string;
  friction: string;
  productVersion: string;
  systemOwnerAction: string;
  customerOwnerAction: string;
  nextTestAt: string;
  consentToOperationalNotes: boolean;
}

export interface ClinicReceipt extends ClinicReceiptInput {
  receiptId: string;
  generatedAt: string;
  status: "DRAFT_NOT_PERSISTED";
  heldFields: string[];
  humanApprovalRequired: true;
}
