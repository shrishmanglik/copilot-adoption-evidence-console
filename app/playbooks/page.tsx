import { BookOpenCheck, Clock3, ShieldCheck } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Playbooks" };
export default function PlaybooksPage() {
  const items = [
    {
      title: "Variance analysis briefing",
      version: "2026.7",
      status: "APPROVED FOR SYNTHETIC DEMO",
      limits:
        "Only the defined executive finance workflow; no cross-segment claim.",
      expiry: "2026-09-01",
    },
    {
      title: "Forecast freshness check",
      version: "2026.7",
      status: "DRAFT — EVIDENCE STALE",
      limits:
        "Do not promote until current usage evidence and customer retest exist.",
      expiry: "UNKNOWN",
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
        {items.map((item, i) => (
          <Card className="p-5" key={item.title}>
            <div className="flex items-center gap-2 text-blue-700">
              {i === 0 ? <ShieldCheck size={19} /> : <Clock3 size={19} />}
              <span className="text-xs font-bold uppercase tracking-wide">
                {item.status}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Product version" value={item.version} />
              <Row label="Limitations" value={item.limits} />
              <Row label="Review expiry" value={item.expiry} />
              <Row label="Human owner" value="Product Adoption Lead" />
            </dl>
            <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <BookOpenCheck size={15} />
              Synthetic work sample only
            </div>
          </Card>
        ))}
      </div>
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
