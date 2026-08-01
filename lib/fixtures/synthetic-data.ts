import type { WorkflowEvidence } from "@/lib/domain/types";

const common = {
  asOf: "2026-08-01T12:00:00.000Z",
  freshnessLimitDays: 14,
  repeatRulePeriods: 2,
  observationWindowComplete: true,
  productVersion: "2026.7",
  customerDisagrees: false,
} as const;

const staleEvidence: WorkflowEvidence = {
  ...common,
  id: "wf-planning-refresh",
  accountId: "syn-planning-a",
  accountLabel: "Synthetic planning team A",
  segment: "Planning",
  workflowLabel: "Forecast refresh and variance explanation",
  ownerRole: "Customer Success",
  enabledAt: "2026-06-10T14:00:00.000Z",
  firstValueAt: "2026-06-11T15:10:00.000Z",
  usageSnapshotAt: "2026-06-30T12:00:00.000Z",
  repeatUsePeriods: 1,
  eligibleUsers: 12,
  firstValueUsers: 8,
  repeatUsers: 3,
  validatedProductVersion: "2026.7",
  customerValidation: "APPROVED",
  customerValidationAt: "2026-06-12T10:00:00.000Z",
  blockers: [
    {
      id: "blk-data-freshness",
      category: "DATA_MODEL",
      title: "Source-data freshness is not visible at decision time",
      severity: "HIGH",
      state: "OPEN",
      ownerRole: "Product Manager",
      dueAt: "2026-08-05",
      closureCondition: "Freshness is shown and the workflow is revalidated",
    },
  ],
  sourceRecords: [
    {
      id: "src-clinic-101",
      kind: "CLINIC",
      version: "1",
      observedAt: "2026-06-11",
      synthetic: true,
    },
    {
      id: "src-usage-101",
      kind: "USAGE_SNAPSHOT",
      version: "1",
      observedAt: "2026-06-30",
      synthetic: true,
    },
    {
      id: "src-validation-101",
      kind: "VALIDATION",
      version: "1",
      observedAt: "2026-06-12",
      synthetic: true,
    },
  ],
  nextIntervention: "Reconfirm source freshness and rerun the forecast clinic",
};

const pendingValidation: WorkflowEvidence = {
  ...common,
  id: "wf-report-accuracy",
  accountId: "syn-reporting-b",
  accountLabel: "Synthetic reporting team B",
  segment: "Reporting",
  workflowLabel: "Management report narrative review",
  ownerRole: "Engineering Owner",
  enabledAt: "2026-07-08T13:00:00.000Z",
  firstValueAt: "2026-07-09T14:20:00.000Z",
  usageSnapshotAt: "2026-07-30T12:00:00.000Z",
  repeatUsePeriods: 2,
  eligibleUsers: 9,
  firstValueUsers: 7,
  repeatUsers: 5,
  validatedProductVersion: "2026.7",
  customerValidation: "PENDING",
  blockers: [
    {
      id: "blk-accuracy-language",
      category: "ACCURACY_TRUST",
      title: "Narrative labels required product-version clarification",
      severity: "HIGH",
      state: "RESOLVED_PENDING_VALIDATION",
      ownerRole: "Engineering Owner",
      dueAt: "2026-08-04",
      closureCondition:
        "Customer champion repeats the workflow and confirms the labels",
    },
  ],
  sourceRecords: [
    {
      id: "src-clinic-202",
      kind: "CLINIC",
      version: "2",
      observedAt: "2026-07-09",
      synthetic: true,
    },
    {
      id: "src-release-202",
      kind: "RELEASE",
      version: "2026.7",
      observedAt: "2026-07-25",
      synthetic: true,
    },
    {
      id: "src-usage-202",
      kind: "USAGE_SNAPSHOT",
      version: "3",
      observedAt: "2026-07-30",
      synthetic: true,
    },
  ],
  nextIntervention: "Customer champion retests the corrected narrative labels",
};

const verified: WorkflowEvidence = {
  ...common,
  id: "wf-variance-analysis",
  accountId: "syn-executive-c",
  accountLabel: "Synthetic executive cohort C",
  segment: "Executive finance",
  workflowLabel: "Variance analysis and action briefing",
  ownerRole: "Product Adoption Lead",
  enabledAt: "2026-07-02T13:00:00.000Z",
  firstValueAt: "2026-07-03T14:00:00.000Z",
  usageSnapshotAt: "2026-07-31T12:00:00.000Z",
  repeatUsePeriods: 3,
  eligibleUsers: 6,
  firstValueUsers: 6,
  repeatUsers: 5,
  validatedProductVersion: "2026.7",
  customerValidation: "APPROVED",
  customerValidationAt: "2026-07-31T15:00:00.000Z",
  blockers: [
    {
      id: "blk-workflow-context",
      category: "WORKFLOW_FIT",
      title: "Briefing output needed an explicit decision owner",
      severity: "MEDIUM",
      state: "VALIDATED_CLOSED",
      ownerRole: "Product Manager",
      dueAt: "2026-07-24",
      closureCondition:
        "Decision owner is present and customer champion confirms repeat use",
    },
  ],
  sourceRecords: [
    {
      id: "src-clinic-303",
      kind: "CLINIC",
      version: "2",
      observedAt: "2026-07-03",
      synthetic: true,
    },
    {
      id: "src-release-303",
      kind: "RELEASE",
      version: "2026.7",
      observedAt: "2026-07-20",
      synthetic: true,
    },
    {
      id: "src-usage-303",
      kind: "USAGE_SNAPSHOT",
      version: "3",
      observedAt: "2026-07-31",
      synthetic: true,
    },
    {
      id: "src-validation-303",
      kind: "VALIDATION",
      version: "2",
      observedAt: "2026-07-31",
      synthetic: true,
    },
    {
      id: "src-approval-303",
      kind: "APPROVAL",
      version: "1",
      observedAt: "2026-07-31",
      synthetic: true,
    },
  ],
  nextIntervention: "Review proof eligibility and keep publication held",
};

export const syntheticWorkflows = {
  staleEvidence,
  pendingValidation,
  verified,
};
export const workflowList = [staleEvidence, pendingValidation, verified];

export const auditEvents = [
  {
    id: "audit-001",
    at: "2026-08-01T12:00:00Z",
    type: "STATE_EVALUATED",
    actor: "ruleset adoption-rules.v1",
    detail: "Planning workflow held UNKNOWN because usage evidence is stale.",
  },
  {
    id: "audit-002",
    at: "2026-08-01T12:00:00Z",
    type: "CLOSURE_HELD",
    actor: "ruleset adoption-rules.v1",
    detail: "Reporting blocker remains pending customer validation.",
  },
  {
    id: "audit-003",
    at: "2026-07-31T15:00:00Z",
    type: "VALIDATION_RECORDED",
    actor: "Synthetic customer champion role",
    detail:
      "Executive workflow validation recorded for product version 2026.7.",
  },
  {
    id: "audit-004",
    at: "2026-07-31T12:00:00Z",
    type: "USAGE_SNAPSHOT_ACCEPTED",
    actor: "versioned adapter usage.v1",
    detail: "Three synthetic snapshot rows accepted atomically.",
  },
] as const;
