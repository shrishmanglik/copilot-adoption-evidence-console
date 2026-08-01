import type {
  AdoptionState,
  DecisionReceipt,
  ProofDecisionReceipt,
  ProofGate,
  SourceRecord,
  WorkflowEvidence,
} from "./types";

function ageInDays(olderIso: string, newerIso: string): number {
  return Math.floor((Date.parse(newerIso) - Date.parse(olderIso)) / 86_400_000);
}

interface EvidenceIssue {
  field: string;
  reason: string;
}

function isValidPastTimestamp(value: string, asOf: string): boolean {
  const observedAt = Date.parse(value);
  const evaluatedAt = Date.parse(asOf);
  return (
    Number.isFinite(observedAt) &&
    Number.isFinite(evaluatedAt) &&
    observedAt <= evaluatedAt
  );
}

function sameInstant(left?: string, right?: string): boolean {
  if (!left || !right) return false;
  return Date.parse(left) === Date.parse(right);
}

function currentVersionSources(
  input: WorkflowEvidence,
  kind: SourceRecord["kind"],
): SourceRecord[] {
  return input.sourceRecords.filter(
    (source) => source.kind === kind && source.version === input.productVersion,
  );
}

function detectRecordIntegrity(input: WorkflowEvidence): EvidenceIssue[] {
  const issues: EvidenceIssue[] = [];
  const ids = input.sourceRecords.map((source) => source.id);
  if (new Set(ids).size !== ids.length) {
    issues.push({
      field: "unique_source_records",
      reason: "Source record identifiers are not unique",
    });
  }
  if (
    input.sourceRecords.some(
      (source) => !isValidPastTimestamp(source.observedAt, input.asOf),
    )
  ) {
    issues.push({
      field: "valid_source_timestamps",
      reason:
        "A source record timestamp is invalid or later than evaluation time",
    });
  }
  return issues;
}

function detectCurrentRelease(input: WorkflowEvidence): EvidenceIssue[] {
  if (currentVersionSources(input, "RELEASE").length > 0) return [];
  return [
    {
      field: "current_product_release",
      reason: "No release record matches the current product version",
    },
  ];
}

function detectCurrentUsage(input: WorkflowEvidence): EvidenceIssue[] {
  if (!input.usageSnapshotAt) {
    return [
      {
        field: "current_usage_snapshot",
        reason: "Current usage evidence is missing",
      },
    ];
  }

  const currentSnapshots = currentVersionSources(input, "USAGE_SNAPSHOT");
  const exactSnapshot = currentSnapshots.find(
    (source) =>
      sameInstant(source.observedAt, input.usageSnapshotAt) &&
      source.usage?.eligibleUsers === input.eligibleUsers &&
      source.usage.firstValueUsers === input.firstValueUsers &&
      source.usage.repeatUsers === input.repeatUsers,
  );
  if (!exactSnapshot) {
    return [
      {
        field: "current_usage_snapshot",
        reason:
          "Usage summary is not backed by a matching current-version source record",
      },
    ];
  }
  if (ageInDays(input.usageSnapshotAt, input.asOf) > input.freshnessLimitDays) {
    return [
      {
        field: "current_usage_snapshot",
        reason: `Usage evidence exceeds the ${input.freshnessLimitDays}-day freshness limit`,
      },
    ];
  }
  return [];
}

function detectRepeatUse(input: WorkflowEvidence): EvidenceIssue[] {
  const evidencedPeriods = new Set(
    currentVersionSources(input, "USAGE_SNAPSHOT")
      .map((source) => source.periodId)
      .filter((period): period is string => Boolean(period)),
  ).size;
  if (evidencedPeriods >= input.repeatUsePeriods) return [];
  return [
    {
      field: "repeat_use_periods",
      reason: `${input.repeatUsePeriods} repeat periods are claimed but only ${evidencedPeriods} are evidenced`,
    },
  ];
}

function detectCustomerValidation(input: WorkflowEvidence): EvidenceIssue[] {
  if (input.customerValidation !== "APPROVED") return [];
  if (!input.customerValidationAt) {
    return [
      {
        field: "current_product_version_validation",
        reason: "Approved customer validation has no validation timestamp",
      },
    ];
  }
  const validation = currentVersionSources(input, "VALIDATION").find(
    (source) =>
      sameInstant(source.observedAt, input.customerValidationAt) &&
      source.validation?.state === input.customerValidation &&
      source.validation.customerDisagrees === input.customerDisagrees,
  );
  if (!validation || input.validatedProductVersion !== input.productVersion) {
    return [
      {
        field: "current_product_version_validation",
        reason:
          "Customer validation is not backed by a matching current-version source record",
      },
    ];
  }
  return [];
}

function baseState(input: WorkflowEvidence): AdoptionState {
  if (!input.enabledAt) return "BASELINED";
  if (!input.firstValueAt) return "ENABLED";
  if (
    input.repeatUsePeriods < input.repeatRulePeriods ||
    !input.observationWindowComplete
  ) {
    return "FIRST_VALUE";
  }
  if (input.customerValidation !== "APPROVED") return "REPEAT_USE";
  return "VERIFIED_ADOPTION";
}

export function evaluateAdoption(input: WorkflowEvidence): DecisionReceipt {
  const reasons: string[] = [];
  const heldFields: string[] = [];
  let state = baseState(input);

  const evidenceIssues = [
    ...detectRecordIntegrity(input), // MUTATION_POINT:RECORD_INTEGRITY
    ...detectCurrentRelease(input), // MUTATION_POINT:CURRENT_RELEASE
    ...detectCurrentUsage(input), // MUTATION_POINT:CURRENT_USAGE
    ...detectRepeatUse(input), // MUTATION_POINT:REPEAT_USE
    ...detectCustomerValidation(input), // MUTATION_POINT:CUSTOMER_VALIDATION
  ];
  if (evidenceIssues.length > 0) {
    for (const issue of evidenceIssues) {
      heldFields.push(issue.field);
      reasons.push(issue.reason);
    }
    state = "UNKNOWN";
  }

  if (input.customerDisagrees) {
    heldFields.push("customer_disagreement_resolution");
    reasons.push("Customer evidence disagrees with the operational signal");
    state = "DISPUTED";
  }

  const activeCriticalBlocker = input.blockers.find(
    (blocker) =>
      blocker.severity === "CRITICAL" && blocker.state !== "VALIDATED_CLOSED",
  );
  const pendingValidation = input.blockers.find(
    (blocker) => blocker.state === "RESOLVED_PENDING_VALIDATION",
  );

  if (activeCriticalBlocker && state !== "UNKNOWN" && state !== "DISPUTED") {
    reasons.push(
      `Critical blocker remains ${activeCriticalBlocker.state.toLowerCase()}`,
    );
    heldFields.push("critical_blocker_closure");
    state = "BLOCKED";
  } else if (pendingValidation && state !== "UNKNOWN" && state !== "DISPUTED") {
    reasons.push("Customer validation is pending");
    heldFields.push("customer_validation");
    state = "BLOCKED";
  }

  if (reasons.length === 0) {
    reasons.push(
      state === "VERIFIED_ADOPTION"
        ? "Repeat use, current product evidence, and named customer validation are present"
        : `Highest fully evidenced stage is ${state.toLowerCase().replaceAll("_", " ")}`,
    );
  }

  return {
    receiptId: `receipt-${input.id}-${input.asOf.slice(0, 10)}`,
    workflowId: input.id,
    evaluatedAt: input.asOf,
    state,
    reasons,
    heldFields: [...new Set(heldFields)],
    sourceRecordIds: input.sourceRecords.map((source) => source.id),
    authority:
      state === "VERIFIED_ADOPTION"
        ? "Customer champion + adoption lead"
        : "Adoption lead review required",
    rulesetVersion: "adoption-rules.v1",
    synthetic: true,
  };
}

export function evaluateProofEligibility(
  input: WorkflowEvidence,
  adoption: DecisionReceipt,
): ProofDecisionReceipt {
  const currentUsage = currentVersionSources(input, "USAGE_SNAPSHOT").filter(
    (source) => source.usage,
  );
  const release = currentVersionSources(input, "RELEASE");
  const validation = currentVersionSources(input, "VALIDATION").filter(
    (source) => source.validation?.state === "APPROVED",
  );
  const approvals = (
    approvalType: NonNullable<SourceRecord["approval"]>["type"],
  ) =>
    input.sourceRecords.filter(
      (source) =>
        source.kind === "APPROVAL" &&
        source.approval?.type === approvalType &&
        source.approval.state === "APPROVED" &&
        source.approval.requestedByActorId !==
          source.approval.approverActorId &&
        (!source.approval.expiresAt ||
          Date.parse(source.approval.expiresAt) > Date.parse(input.asOf)),
    );

  const gates: ProofGate[] = [
    {
      id: "METRIC_SOURCE",
      label: "Metric definition and source window",
      present: currentUsage.length >= input.repeatRulePeriods,
      sourceRecordIds: currentUsage.map((source) => source.id),
    },
    {
      id: "CURRENT_VERSION",
      label: "Current product version",
      present: release.length > 0,
      sourceRecordIds: release.map((source) => source.id),
    },
    {
      id: "CUSTOMER_VALIDATION",
      label: "Customer approval",
      present: validation.length > 0,
      sourceRecordIds: validation.map((source) => source.id),
    },
    ...(["PRIVACY", "WORDING", "PUBLICATION"] as const).map(
      (approvalType): ProofGate => {
        const records = approvals(approvalType);
        return {
          id: approvalType,
          label:
            approvalType === "PRIVACY"
              ? "Privacy review"
              : approvalType === "WORDING"
                ? "Permitted wording"
                : "Publication channel authority",
          present: records.length > 0,
          sourceRecordIds: records.map((source) => source.id),
        };
      },
    ),
  ];
  const heldGateIds = gates
    .filter((gate) => !gate.present)
    .map((gate) => gate.id);
  return {
    workflowId: input.id,
    status:
      adoption.state !== "VERIFIED_ADOPTION"
        ? "NOT_ELIGIBLE"
        : heldGateIds.length > 0
          ? "ELIGIBLE_HELD"
          : "ELIGIBLE",
    gates,
    heldGateIds,
    authority: "Named human approvers",
    synthetic: true,
  };
}
