import type { MetricReceipt, WorkflowEvidence } from "./types";

function divide(numerator: number, denominator: number): number | null {
  return denominator === 0
    ? null
    : Number((numerator / denominator).toFixed(4));
}

export function activationMetric(input: WorkflowEvidence): MetricReceipt {
  return {
    metric: "ACTIVATION_RATE",
    numerator: input.firstValueUsers,
    denominator: input.eligibleUsers,
    value: divide(input.firstValueUsers, input.eligibleUsers),
    exclusions: [],
    observationWindow: `As of ${input.asOf.slice(0, 10)}`,
    definition: "users completing first value / eligible users",
  };
}

export function repeatUseMetric(input: WorkflowEvidence): MetricReceipt {
  const completeWindow = input.observationWindowComplete;
  return {
    metric: "REPEAT_USE_RATE",
    numerator: completeWindow ? input.repeatUsers : 0,
    denominator: completeWindow ? input.firstValueUsers : 0,
    value: completeWindow
      ? divide(input.repeatUsers, input.firstValueUsers)
      : null,
    exclusions: completeWindow ? [] : ["Incomplete observation window"],
    observationWindow: `${input.repeatRulePeriods} distinct approved periods`,
    definition:
      "activated users meeting repeat rule / activated users with complete observation window",
  };
}

export function validatedClosureMetric(
  workflows: WorkflowEvidence[],
): MetricReceipt {
  const resolved = workflows
    .flatMap((workflow) => workflow.blockers)
    .filter((blocker) =>
      ["RESOLVED_PENDING_VALIDATION", "VALIDATED_CLOSED"].includes(
        blocker.state,
      ),
    );
  const validated = resolved.filter(
    (blocker) => blocker.state === "VALIDATED_CLOSED",
  );
  return {
    metric: "VALIDATED_CLOSURE_RATE",
    numerator: validated.length,
    denominator: resolved.length,
    value: divide(validated.length, resolved.length),
    exclusions: [],
    observationWindow: "Current synthetic fixture snapshot",
    definition: "blockers with customer validation / blockers marked resolved",
  };
}
