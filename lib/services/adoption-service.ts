import { evaluateAdoption } from "@/lib/domain/adoption-engine";
import { activationMetric, repeatUseMetric } from "@/lib/domain/metrics";
import { workflowList } from "@/lib/fixtures/synthetic-data";

export function listAdoptionRecords() {
  return workflowList.map((workflow) => ({
    workflow,
    receipt: evaluateAdoption(workflow),
    activation: activationMetric(workflow),
    repeatUse: repeatUseMetric(workflow),
  }));
}

export function getAdoptionRecord(accountId: string) {
  const workflow = workflowList.find((item) => item.accountId === accountId);
  return workflow
    ? {
        workflow,
        receipt: evaluateAdoption(workflow),
        activation: activationMetric(workflow),
        repeatUse: repeatUseMetric(workflow),
      }
    : null;
}
