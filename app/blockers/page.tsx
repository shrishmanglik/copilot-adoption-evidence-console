import { ScreenHeader } from "@/components/screen-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { workflowList } from "@/lib/fixtures/synthetic-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blockers" };
export default function BlockersPage() {
  const blockers = workflowList.flatMap((w) =>
    w.blockers.map((b) => ({
      ...b,
      accountLabel: w.accountLabel,
      workflowLabel: w.workflowLabel,
    })),
  );
  return (
    <>
      <ScreenHeader
        eyebrow="Cross-workflow register"
        title="Internal resolution is not adoption closure"
        description="Blockers remain open to the adoption system until the affected workflow, action, owner, current product version, and customer validation all reconnect."
      />
      <Card className="mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Blocker",
                  "Category",
                  "Affected workflow",
                  "Severity",
                  "State",
                  "Owner / due",
                  "Closure condition",
                ].map((h) => (
                  <th className="border-b border-slate-200 px-4 py-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blockers.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="border-b border-slate-100 px-4 py-4">
                    <p className="font-semibold">{b.title}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">
                      {b.id}
                    </p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {b.category.replaceAll("_", " ")}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <p>{b.workflowLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {b.accountLabel}
                    </p>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 font-semibold">
                    {b.severity}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <StatusBadge state={b.state} />
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <p>{b.ownerRole}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(b.dueAt)}
                    </p>
                  </td>
                  <td className="max-w-[260px] border-b border-slate-100 px-4 py-4 leading-6 text-slate-600">
                    {b.closureCondition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
