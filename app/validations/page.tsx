import { GovernedWorkflowWorkspace } from "@/components/governed-workflow-workspace";
import { ScreenHeader } from "@/components/screen-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { workflowList } from "@/lib/fixtures/synthetic-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Validations" };

export default function ValidationsPage() {
  return (
    <>
      <ScreenHeader
        eyebrow="Human validation register"
        title="Record customer evidence without inferring approval"
        description="Validation is bound to one workflow, product version, source timestamp, and named human authority. A draft cannot promote adoption."
      />
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {workflowList.map((workflow) => (
          <Card key={workflow.id} className="p-5">
            <StatusBadge
              state={
                workflow.customerValidation === "APPROVED"
                  ? "VALIDATED_CLOSED"
                  : "RESOLVED_PENDING_VALIDATION"
              }
            />
            <h2 className="mt-3 font-semibold">{workflow.workflowLabel}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {workflow.accountLabel}
            </p>
            <dl className="mt-4 grid gap-3 text-xs">
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">
                  Product version
                </dt>
                <dd className="mt-1">
                  {workflow.validatedProductVersion ?? "UNKNOWN"}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">
                  Recorded at
                </dt>
                <dd className="mt-1">
                  {formatDate(workflow.customerValidationAt)}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      <GovernedWorkflowWorkspace
        kind="CUSTOMER_VALIDATION"
        heading="Draft a validation receipt"
        description="Capture the evidence and stop condition. A customer signature and adoption-lead review remain required."
        buttonLabel="Generate validation receipt"
        testId="validation-receipt"
        initial={{
          workflowId: "wf-report-accuracy",
          evidenceSummary:
            "The current release is ready for the customer champion to repeat the management-report narrative workflow.",
          ownerAction:
            "Customer Success coordinates the retest and records the customer's exact response without paraphrasing approval.",
          stopCondition:
            "Do not validate if the product version changes, the customer disagrees, or the retest is incomplete.",
        }}
      />
    </>
  );
}
