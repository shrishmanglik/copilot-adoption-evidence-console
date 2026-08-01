import type {
  DecisionReceipt,
  EvidenceTraceStage,
  ProofDecisionReceipt,
  SourceRecord,
  WorkflowEvidence,
} from "./types";

function ids(records: SourceRecord[]) {
  return records.map((record) => record.id);
}

function current(input: WorkflowEvidence, kind: SourceRecord["kind"]) {
  return input.sourceRecords.filter(
    (record) =>
      record.kind === kind && record.productVersion === input.productVersion,
  );
}

export function buildEvidenceTrace(
  input: WorkflowEvidence,
  adoption: DecisionReceipt,
  proof: ProofDecisionReceipt,
): EvidenceTraceStage[] {
  const baseline = input.sourceRecords.filter(
    (record) =>
      record.kind === "BASELINE" &&
      record.baseline?.workflowId === input.id &&
      record.baseline?.eligibleUsers === input.eligibleUsers,
  );
  const enablement = current(input, "ENABLEMENT").filter(
    (record) =>
      record.enablement?.workflowId === input.id &&
      Date.parse(record.observedAt) === Date.parse(input.enabledAt ?? ""),
  );
  const release = current(input, "RELEASE");
  const clinic = current(input, "CLINIC").filter(
    (record) =>
      record.clinic?.workflowId === input.id &&
      record.clinic.outcome === "FIRST_VALUE" &&
      Date.parse(record.observedAt) === Date.parse(input.firstValueAt ?? ""),
  );
  const blocker = current(input, "BLOCKER").filter((record) =>
    input.blockers.some(
      (item) =>
        item.id === record.blocker?.blockerId &&
        item.state === record.blocker.state &&
        item.ownerRole === record.blocker.ownerRole &&
        item.closureCondition === record.blocker.closureCondition,
    ),
  );
  const action = current(input, "ACTION").filter((record) =>
    input.blockers.some(
      (item) =>
        item.id === record.action?.blockerId &&
        item.ownerRole === record.action.ownerRole &&
        input.nextIntervention === record.action.description,
    ),
  );
  const validation = current(input, "VALIDATION").filter(
    (record) =>
      record.validation?.state === input.customerValidation &&
      Date.parse(record.observedAt) ===
        Date.parse(input.customerValidationAt ?? ""),
  );
  const usage = current(input, "USAGE_SNAPSHOT").filter(
    (record) => record.periodId,
  );
  const playbook = current(input, "PLAYBOOK").filter(
    (record) => record.playbook?.sourceWorkflowId === input.id,
  );
  const proofSources = proof.gates.flatMap((gate) => gate.sourceRecordIds);

  const stage = (
    id: EvidenceTraceStage["id"],
    label: string,
    evidenceIds: string[],
    complete: boolean,
    detail: string,
    held = false,
  ): EvidenceTraceStage => ({
    id,
    label,
    evidenceIds,
    status: complete ? "COMPLETE" : held ? "HELD" : "MISSING",
    detail,
  });

  return [
    stage(
      "BASELINE",
      "Eligible workflow baselined",
      ids(baseline),
      baseline.length > 0,
      "Eligible-user count must match the baseline source.",
    ),
    stage(
      "ENABLEMENT_RELEASE",
      "Enablement linked to current release",
      ids([...enablement, ...release]),
      enablement.length > 0 && release.length > 0,
      "Enablement timestamp and release evidence must match the current product version.",
    ),
    stage(
      "CLINIC_FIRST_VALUE",
      "Clinic first value confirmed",
      ids(clinic),
      clinic.length > 0,
      "Clinic workflow, outcome, timestamp, and product version must match.",
    ),
    stage(
      "BLOCKER",
      "Blocker state recorded",
      ids(blocker),
      blocker.length === input.blockers.length,
      "Every blocker state must have an exact typed source record.",
    ),
    stage(
      "ACTION",
      "Owned action recorded",
      ids(action),
      action.length === input.blockers.length,
      "Every blocker must link to a planned or implemented action.",
    ),
    stage(
      "CUSTOMER_VALIDATION",
      "Customer validation recorded",
      ids(validation),
      validation.length > 0 && input.customerValidation === "APPROVED",
      "Validation must match workflow, product version, state, and timestamp.",
      input.customerValidation !== "APPROVED",
    ),
    stage(
      "REPEAT_USE",
      "Repeat use evidenced",
      ids(usage),
      usage.length >= input.repeatRulePeriods,
      "Distinct version-bound usage periods support the repeat-use claim.",
    ),
    stage(
      "PLAYBOOK",
      "Playbook candidate sourced",
      ids(playbook),
      playbook.length > 0,
      "A candidate remains human-held until cross-account promotion evidence exists.",
      playbook.length > 0,
    ),
    stage(
      "PROOF",
      "Proof decision receipt",
      [adoption.receiptId, ...new Set(proofSources)],
      proof.status === "ELIGIBLE",
      "Eligibility is separate from privacy, wording, and publication authority.",
      proof.status === "ELIGIBLE_HELD",
    ),
  ];
}
