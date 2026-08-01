import {
  evaluateAdoption,
  evaluateProofEligibility,
} from "@/lib/domain/adoption-engine";
import { buildEvidenceTrace } from "@/lib/domain/evidence-trace";
import { activationMetric, repeatUseMetric } from "@/lib/domain/metrics";
import { workflowList } from "@/lib/fixtures/synthetic-data";

function assembleAdoptionRecord(workflow: (typeof workflowList)[number]) {
  const receipt = evaluateAdoption(workflow);
  const proof = evaluateProofEligibility(workflow, receipt);
  return {
    workflow,
    receipt,
    proof,
    trace: buildEvidenceTrace(workflow, receipt, proof),
    activation: activationMetric(workflow),
    repeatUse: repeatUseMetric(workflow),
  };
}

export function listAdoptionRecords() {
  return workflowList.map(assembleAdoptionRecord);
}

export function getAdoptionRecord(accountId: string) {
  const workflow = workflowList.find((item) => item.accountId === accountId);
  return workflow ? assembleAdoptionRecord(workflow) : null;
}
