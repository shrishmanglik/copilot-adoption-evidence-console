import {
  evaluateAdoption,
  evaluateProofEligibility,
} from "@/lib/domain/adoption-engine";
import { activationMetric, repeatUseMetric } from "@/lib/domain/metrics";
import { workflowList } from "@/lib/fixtures/synthetic-data";

function assembleAdoptionRecord(workflow: (typeof workflowList)[number]) {
  const receipt = evaluateAdoption(workflow);
  return {
    workflow,
    receipt,
    proof: evaluateProofEligibility(workflow, receipt),
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
