import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/screen-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdoptionRecord } from "@/lib/services/adoption-service";
import { formatDate, formatRate } from "@/lib/utils";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const record = getAdoptionRecord((await params).accountId);
  if (!record) notFound();
  const { workflow, receipt, activation, repeatUse, trace } = record;
  return (
    <>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <ArrowLeft size={16} />
        Back to adoption register
      </Link>
      <div className="mt-3">
        <ScreenHeader
          eyebrow={`${workflow.segment} · synthetic record`}
          title={workflow.accountLabel}
          description={workflow.workflowLabel}
          action={
            <Button asChild variant="secondary">
              <a href={`/api/exports/${workflow.accountId}`} download>
                <Download size={16} />
                Export receipt JSON
              </a>
            </Button>
          }
        />
      </div>
      <section className="mt-7 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Current deterministic state
            </p>
            <div className="mt-3">
              <StatusBadge state={receipt.state} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {receipt.reasons.join(" ")}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Activation
                </dt>
                <dd className="mt-1 text-xl font-semibold">
                  {formatRate(activation.value)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Repeat use
                </dt>
                <dd className="mt-1 text-xl font-semibold">
                  {formatRate(repeatUse.value)}
                </dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Authority
            </p>
            <p className="mt-3 font-semibold">{receipt.authority}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No ruleset, AI summary, internal ticket, or UI action can
              self-approve adoption or customer proof.
            </p>
          </Card>
        </div>
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                End-to-end evidence trace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                One workflow, no disconnected dashboard claims.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {receipt.receiptId}
            </span>
          </div>
          <ol className="mt-7 grid gap-0">
            {trace.map((stage, index) => {
              return (
                <li key={stage.id} className="grid grid-cols-[28px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    {stage.status === "HELD" ? (
                      <Circle className="text-amber-500" size={18} />
                    ) : stage.status === "MISSING" ? (
                      <ShieldAlert className="text-red-600" size={18} />
                    ) : (
                      <CheckCircle2 className="text-teal-600" size={18} />
                    )}
                    {index < trace.length - 1 && (
                      <span className="h-10 w-px bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{stage.label}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {stage.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {stage.detail}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-blue-700">
                      {stage.evidenceIds.length > 0
                        ? stage.evidenceIds.join(" · ")
                        : "NO MATCHING SOURCE RECORD"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-700" />
            <h2 className="font-semibold">Blocker contract</h2>
          </div>
          {workflow.blockers.map((blocker) => (
            <div
              key={blocker.id}
              className="mt-4 rounded-lg border border-slate-200 p-4"
            >
              <StatusBadge state={blocker.state} />
              <h3 className="mt-3 font-semibold">{blocker.title}</h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">
                    Owner
                  </dt>
                  <dd className="mt-1">{blocker.ownerRole}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Due</dt>
                  <dd className="mt-1">{formatDate(blocker.dueAt)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-500">
                    Closure condition
                  </dt>
                  <dd className="mt-1 leading-6">{blocker.closureCondition}</dd>
                </div>
              </dl>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Exact source records</h2>
            <span className="text-xs text-slate-500">
              {workflow.sourceRecords.length} records
            </span>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {workflow.sourceRecords.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="font-mono text-xs font-semibold">{source.id}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {source.kind} · contract {source.version}
                    {source.productVersion
                      ? ` · product ${source.productVersion}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {formatDate(source.observedAt)}
                  <ExternalLink size={14} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
