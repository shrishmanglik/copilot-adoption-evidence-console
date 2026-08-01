"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Filter,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReturnTypeOfList } from "@/lib/view-types";
import { formatDate, formatRate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function AdoptionDashboard({ records }: { records: ReturnTypeOfList }) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = records.find((record) => record.workflow.id === selectedId);
  const filtered = useMemo(
    () =>
      records.filter(({ workflow, receipt }) => {
        const matchesText =
          `${workflow.accountLabel} ${workflow.workflowLabel} ${workflow.segment}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return (
          matchesText &&
          (stateFilter === "ALL" || receipt.state === stateFilter)
        );
      }),
    [query, records, stateFilter],
  );

  const cards = [
    {
      label: "Stale evidence",
      value: records.filter((r) =>
        r.receipt.heldFields.includes("current_usage_snapshot"),
      ).length,
      note: "Current state held UNKNOWN",
      tone: "text-amber-700",
    },
    {
      label: "Pending customer validation",
      value: records.filter((r) =>
        r.receipt.heldFields.includes("customer_validation"),
      ).length,
      note: "Internal resolution is insufficient",
      tone: "text-red-700",
    },
    {
      label: "Verified adoption",
      value: records.filter((r) => r.receipt.state === "VERIFIED_ADOPTION")
        .length,
      note: "Repeat use + current validation",
      tone: "text-teal-700",
    },
    {
      label: "Proof eligible, held",
      value: 1,
      note: "Publication approvals incomplete",
      tone: "text-blue-700",
    },
  ];

  return (
    <>
      <section
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Adoption exception counters"
      >
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {card.label}
            </p>
            <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
              {card.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
          </Card>
        ))}
      </section>
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Workflow evidence register
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Every state opens its deterministic reasons and exact source
              records.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search workflows</span>
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:w-64"
                placeholder="Search workflows"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Filter by state</span>
              <Filter
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-8 text-sm font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option>ALL</option>
                <option>UNKNOWN</option>
                <option>BLOCKED</option>
                <option>VERIFIED_ADOPTION</option>
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr>
                {[
                  "Account / segment",
                  "Workflow",
                  "Adoption state",
                  "Last validated",
                  "Repeat rule",
                  "Open blocker",
                  "Owner",
                  "Next intervention",
                  "Evidence",
                ].map((h) => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ workflow, receipt, repeatUse }) => (
                <tr key={workflow.id} className="align-top hover:bg-blue-50/30">
                  <td className="border-b border-slate-100 px-4 py-4">
                    <Link
                      href={`/accounts/${workflow.accountId}`}
                      className="font-semibold text-slate-950 underline-offset-4 hover:text-blue-700 hover:underline"
                    >
                      {workflow.accountLabel}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">
                      {workflow.segment}
                    </div>
                  </td>
                  <td className="max-w-[230px] border-b border-slate-100 px-4 py-4 font-medium text-slate-700">
                    {workflow.workflowLabel}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <StatusBadge state={receipt.state} />
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {formatDate(workflow.customerValidationAt)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <div className="font-semibold">
                      {workflow.repeatUsePeriods}/{workflow.repeatRulePeriods}{" "}
                      periods
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatRate(repeatUse.value)}
                    </div>
                  </td>
                  <td className="max-w-[190px] border-b border-slate-100 px-4 py-4 text-slate-600">
                    {workflow.blockers.find(
                      (b) => b.state !== "VALIDATED_CLOSED",
                    )?.title ?? "None"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                    {workflow.ownerRole}
                  </td>
                  <td className="max-w-[220px] border-b border-slate-100 px-4 py-4 text-slate-600">
                    {workflow.nextIntervention}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <button
                      onClick={() => setSelectedId(workflow.id)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Inspect <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <ShieldAlert className="mx-auto text-slate-400" />
            <p className="mt-3 font-semibold">
              No workflow matches this filter.
            </p>
            <button
              className="mt-2 text-sm font-semibold text-blue-700"
              onClick={() => {
                setQuery("");
                setStateFilter("ALL");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/35"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-title"
        >
          <button
            className="absolute inset-0 cursor-default"
            aria-label="Close evidence inspector"
            onClick={() => setSelectedId(null)}
          />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                  Decision receipt
                </p>
                <h2 id="evidence-title" className="mt-2 text-2xl font-semibold">
                  Why this state?
                </h2>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-md p-2 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <div className="mt-5">
              <StatusBadge state={selected.receipt.state} />
            </div>
            <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Receipt</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {selected.receipt.receiptId}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Ruleset</dt>
                <dd className="mt-1">{selected.receipt.rulesetVersion}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Human authority
                </dt>
                <dd className="mt-1">{selected.receipt.authority}</dd>
              </div>
            </dl>
            <h3 className="mt-7 font-semibold">Deterministic reasons</h3>
            <ul className="mt-3 space-y-2">
              {selected.receipt.reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <Clock3
                    className="mt-0.5 shrink-0 text-amber-600"
                    size={17}
                  />
                  {reason}
                </li>
              ))}
            </ul>
            <h3 className="mt-7 font-semibold">Source records</h3>
            <div className="mt-3 space-y-2">
              {selected.workflow.sourceRecords.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold">
                      {source.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {source.kind} · v{source.version}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDate(source.observedAt)}
                  </span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-7 w-full">
              <Link href={`/accounts/${selected.workflow.accountId}`}>
                Trace complete workflow <ArrowRight size={16} />
              </Link>
            </Button>
          </aside>
        </div>
      )}
    </>
  );
}
