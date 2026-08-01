import { Check, LockKeyhole, X } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Proof" };
export default function ProofPage() {
  const gates = [
    { label: "Metric definition and source window", ok: true },
    { label: "Current product version", ok: true },
    { label: "Customer approval", ok: true },
    { label: "Privacy review", ok: false },
    { label: "Permitted wording", ok: false },
    { label: "Publication channel authority", ok: false },
  ];
  return (
    <>
      <ScreenHeader
        eyebrow="Customer proof boundary"
        title="Eligible does not mean publishable"
        description="The synthetic executive workflow is eligible for review. It remains held until every approval, caveat, privacy control, wording constraint, and publication authority is explicit."
      />
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Candidate proof-001
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Variance-analysis workflow adoption
              </h2>
            </div>
            <StatusBadge state="ELIGIBLE_HELD" />
          </div>
          <div className="mt-6 grid gap-3">
            {gates.map((g) => (
              <div
                key={g.label}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 p-3"
              >
                {g.ok ? (
                  <Check className="text-teal-700" size={18} />
                ) : (
                  <X className="text-red-700" size={18} />
                )}
                <span className="text-sm font-medium">{g.label}</span>
                <span
                  className={`ml-auto text-xs font-bold ${g.ok ? "text-teal-700" : "text-red-700"}`}
                >
                  {g.ok ? "PRESENT" : "HELD"}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="h-fit p-5">
          <LockKeyhole className="text-slate-700" />
          <h2 className="mt-4 text-xl font-semibold">
            Publication is outside this product
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The console can assemble a proof candidate and its receipt. It
            cannot publish, send, schedule, or infer approval.
          </p>
          <div className="mt-5 rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-300">
            <strong className="text-white">Commercial hypothesis:</strong> teams
            with complex AI-enabled workflows may pay for evidence-bound
            adoption operations. This repository contains no demand, pricing,
            revenue, or customer proof.
          </div>
        </Card>
      </div>
    </>
  );
}
