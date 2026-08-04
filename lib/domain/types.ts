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
  kind:
    | "BASELINE"
    | "ENABLEMENT"
    | "CLINIC"
    | "BLOCKER"
    | "ACTION"
    | "USAGE_SNAPSHOT"
    | "RELEASE"
    | "VALIDATION"
    | "PLAYBOOK"
    | "CAVEAT"
    | "APPROVAL";
  version: string;
  productVersion?: string;
  observedAt: string;
  scope: { accountId: string; segment: string };
  baseline?: { workflowId: string; eligibleUsers: number };
  enablement?: { workflowId: string };
  clinic?: { workflowId: string; outcome: "FIRST_VALUE" };
  blocker?: {
    blockerId: string;
    state: BlockerState;
    ownerRole: string;
    closureCondition: string;
  };
  action?: {
    blockerId: string;
    status: "PLANNED" | "IMPLEMENTED";
    ownerRole: string;
    description: string;
  };
  playbook?: {
    sourceWorkflowId: string;
    status: "CANDIDATE_HUMAN_REVIEW" | "APPROVED";
    sourceAccountCount: number;
  };
  periodId?: string;
  usage?: {
    eligibleUsers: number;
    firstValueUsers: number;
    repeatUsers: number;
  };
  validation?: {
    state: ValidationState;
    customerDisagrees: boolean;
  };
  caveat?: {
    proofCandidateId: string;
    scope: "PROOF";
    text: string;
    ownerActorId: string;
    expiresAt?: string;
  };
  approval?: {
    proofCandidateId: string;
    type: "CUSTOMER" | "METRIC" | "PRIVACY" | "WORDING" | "PUBLICATION";
    state: "APPROVED" | "REJECTED" | "WITHDRAWN";
    requestedByActorId: string;
    approverActorId: string;
    expiresAt?: string;
  };
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

export interface ProofGate {
  id:
    | "METRIC_SOURCE"
    | "METRIC_APPROVAL"
    | "CURRENT_VERSION"
    | "CUSTOMER_VALIDATION"
    | "CUSTOMER_PROOF_CONSENT"
    | "PLAYBOOK_SOURCE"
    | "CAVEATS"
    | "PRIVACY"
    | "WORDING"
    | "PUBLICATION";
  label: string;
  present: boolean;
  sourceRecordIds: string[];
}

export interface EvidenceTraceStage {
  id:
    | "BASELINE"
    | "ENABLEMENT_RELEASE"
    | "CLINIC_FIRST_VALUE"
    | "BLOCKER"
    | "ACTION"
    | "CUSTOMER_VALIDATION"
    | "REPEAT_USE"
    | "PLAYBOOK"
    | "PROOF";
  label: string;
  status: "COMPLETE" | "HELD" | "MISSING";
  evidenceIds: string[];
  detail: string;
}

export interface ProofDecisionReceipt {
  workflowId: string;
  proofCandidateId: string;
  status: "NOT_ELIGIBLE" | "ELIGIBLE_HELD" | "ELIGIBLE";
  gates: ProofGate[];
  heldGateIds: ProofGate["id"][];
  authority: "Named human approvers";
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

export type GovernedWorkflowKind =
  "BLOCKER_ACTION" | "CUSTOMER_VALIDATION" | "PLAYBOOK_CANDIDATE";

export interface GovernedWorkflowReceiptInput {
  kind: GovernedWorkflowKind;
  workflowId: string;
  productVersion: string;
  evidenceSummary: string;
  ownerAction: string;
  stopCondition: string;
  humanReviewAcknowledged: true;
}

export interface GovernedWorkflowReceipt extends GovernedWorkflowReceiptInput {
  receiptId: string;
  generatedAt: string;
  status: "DRAFT_NOT_PERSISTED";
  heldFields: string[];
  humanApprovalRequired: true;
  externalAction: "NONE";
  synthetic: true;
}
