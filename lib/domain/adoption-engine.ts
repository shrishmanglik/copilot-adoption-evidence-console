import type { AdoptionState, DecisionReceipt, WorkflowEvidence } from "./types";

const criticalEvidenceGuardEnabled =
  process.env.DISABLE_CRITICAL_VALIDATOR !== "1";

function ageInDays(olderIso: string, newerIso: string): number {
  return Math.floor((Date.parse(newerIso) - Date.parse(olderIso)) / 86_400_000);
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

  if (criticalEvidenceGuardEnabled) {
    if (!input.usageSnapshotAt) {
      heldFields.push("current_usage_snapshot");
      reasons.push("Current usage evidence is missing");
      state = "UNKNOWN";
    } else if (
      ageInDays(input.usageSnapshotAt, input.asOf) > input.freshnessLimitDays
    ) {
      heldFields.push("current_usage_snapshot");
      reasons.push(
        `Usage evidence exceeds the ${input.freshnessLimitDays}-day freshness limit`,
      );
      state = "UNKNOWN";
    }

    if (
      !input.validatedProductVersion ||
      input.validatedProductVersion !== input.productVersion
    ) {
      heldFields.push("current_product_version_validation");
      reasons.push(
        "The current product version has not been customer-validated",
      );
      state = "UNKNOWN";
    }
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
