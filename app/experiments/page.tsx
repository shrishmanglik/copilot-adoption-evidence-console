import { FlaskConical, LockKeyhole } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Experiments" };
export default function ExperimentsPage() {
  return (
    <>
      <ScreenHeader
        eyebrow="Intervention evidence"
        title="Test a product or enablement change without inventing causality"
        description="Each experiment binds the eligible cohort, baseline, change, guardrails, observation window, result, caveats, and human decision."
      />
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="text-blue-700" size={19} />
              <h2 className="font-semibold">Expose source freshness inline</h2>
            </div>
            <StatusBadge state="PROPOSED" />
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <Row
              label="Hypothesis"
              value="Visibility of source freshness reduces the verification stall in the synthetic planning workflow."
            />
            <Row
              label="Eligible cohort"
              value="Synthetic planning team A; 12 eligible roles."
            />
            <Row
              label="Baseline"
              value="8 reached first value; current repeat-use evidence is stale and therefore UNKNOWN."
            />
            <Row
              label="Guardrail"
              value="Do not infer sentiment or causality; retain the prior accepted snapshot on import failure."
            />
            <Row
              label="Observation window"
              value="Two distinct approved planning periods after the change."
            />
          </dl>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <LockKeyhole size={16} />
            Decision remains with Product + customer champion.
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Method boundary
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            What this console will not claim
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {[
              "A post-change increase is not causation without an approved method.",
              "An incomplete observation window is neither failure nor success.",
              "A customer disagreement blocks proof promotion.",
              "An AI-generated cluster cannot set the blocker cause.",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {x}
              </li>
            ))}
          </ul>
        </Card>
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
      <dd className="mt-1 leading-6 text-slate-800">{value}</dd>
    </div>
  );
}
