import { BookOpenCheck, Clock3 } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { GovernedWorkflowWorkspace } from "@/components/governed-workflow-workspace";
import { Card } from "@/components/ui/card";
import { syntheticWorkflows } from "@/lib/fixtures/synthetic-data";

export const metadata = { title: "Playbooks" };
export default function PlaybooksPage() {
  const playbookSource = syntheticWorkflows.verified.sourceRecords.find(
    (source) => source.kind === "PLAYBOOK",
  );
  if (!playbookSource?.playbook) {
    throw new Error("Synthetic playbook source is unavailable");
  }
  const items = [
    {
      title: "Variance analysis briefing",
      version: playbookSource.productVersion ?? "UNKNOWN",
      status: `${playbookSource.playbook.status.replaceAll("_", " ")} — SECOND ACCOUNT REQUIRED`,
      limits:
        "One source account only; candidate cannot be promoted or applied cross-segment.",
      expiry: "2026-09-01",
      sourceId: playbookSource.id,
    },
    {
      title: "Forecast freshness check",
      version: "2026.7",
      status: "DRAFT — EVIDENCE STALE",
      limits:
        "Do not promote until current usage evidence and customer retest exist.",
      expiry: "UNKNOWN",
      sourceId: "NO CURRENT PLAYBOOK SOURCE",
    },
  ];
  return (
    <>
      <ScreenHeader
        eyebrow="Reusable workflow guidance"
        title="A playbook is reviewed evidence, not a good-sounding prompt"
        description="Guidance stays bound to a workflow, product version, sources, limitations, owner, expiry, and review history."
      />
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Card className="p-5" key={item.title}>
            <div className="flex items-center gap-2 text-blue-700">
              <Clock3 size={19} />
              <span className="text-xs font-bold uppercase tracking-wide">
                {item.status}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Product version" value={item.version} />
              <Row label="Limitations" value={item.limits} />
              <Row label="Review expiry" value={item.expiry} />
              <Row label="Source record" value={item.sourceId} />
              <Row label="Human owner" value="Product Adoption Lead" />
            </dl>
            <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <BookOpenCheck size={15} />
              Synthetic work sample only
            </div>
          </Card>
        ))}
      </div>
      <GovernedWorkflowWorkspace
        kind="PLAYBOOK_CANDIDATE"
        heading="Draft a playbook candidate"
        description="A candidate may preserve reviewed guidance but cannot be promoted from one account or without product review."
        buttonLabel="Generate playbook candidate receipt"
        testId="playbook-receipt"
        initial={{
          workflowId: "wf-variance-analysis",
          evidenceSummary:
            "One synthetic workflow has current repeat-use and customer-validation records; cross-account evidence is absent.",
          ownerAction:
            "Product Adoption Lead records limitations and seeks a second account before promotion.",
          stopCondition:
            "Withdraw the candidate if product behavior changes or another account does not reproduce the workflow.",
        }}
      />
    </>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 leading-6">{value}</dd>
    </div>
  );
}
