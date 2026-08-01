"use client";

import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import type { ClinicReceipt } from "@/lib/domain/types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const initial = {
  accountId: "syn-planning-a",
  workflowId: "wf-planning-refresh",
  attemptedTask: "Refresh the approved planning forecast",
  observedOutcome:
    "The refresh completed, but source freshness was not visible.",
  expectedOutcome:
    "The operator can verify source freshness before accepting the output.",
  friction:
    "The team could not establish whether the source snapshot was current.",
  productVersion: "2026.7",
  systemOwnerAction: "Expose source freshness beside the generated output.",
  customerOwnerAction: "Retest with the next approved snapshot.",
  nextTestAt: "2026-08-05T14:00",
  consentToOperationalNotes: true,
};

export function ClinicWorkspace() {
  const [form, setForm] = useState(initial);
  const [receipt, setReceipt] = useState<ClinicReceipt | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/clinics/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nextTestAt: new Date(form.nextTestAt).toISOString(),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Receipt generation failed");
      setReceipt(body);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Receipt generation failed",
      );
    }
  }

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Clinic observation</h2>
            <p className="mt-1 text-xs text-slate-500">
              Draft operational evidence. Source language is not overwritten.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            NOT PERSISTED
          </span>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Synthetic account"
              value={form.accountId}
              onChange={(v) => set("accountId", v)}
            />
            <Field
              label="Product version"
              value={form.productVersion}
              onChange={(v) => set("productVersion", v)}
            />
          </div>
          <Field
            label="Workflow attempted"
            value={form.attemptedTask}
            onChange={(v) => set("attemptedTask", v)}
            textarea
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Observed outcome"
              value={form.observedOutcome}
              onChange={(v) => set("observedOutcome", v)}
              textarea
            />
            <Field
              label="Expected outcome"
              value={form.expectedOutcome}
              onChange={(v) => set("expectedOutcome", v)}
              textarea
            />
          </div>
          <Field
            label="Point of friction"
            value={form.friction}
            onChange={(v) => set("friction", v)}
            textarea
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="System owner action"
              value={form.systemOwnerAction}
              onChange={(v) => set("systemOwnerAction", v)}
              textarea
            />
            <Field
              label="Customer owner action"
              value={form.customerOwnerAction}
              onChange={(v) => set("customerOwnerAction", v)}
              textarea
            />
          </div>
          <label className="block text-sm font-semibold">
            Retest date and time
            <input
              type="datetime-local"
              value={form.nextTestAt}
              onChange={(e) => set("nextTestAt", e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex min-h-11 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-blue-700"
              checked={form.consentToOperationalNotes}
              onChange={(e) =>
                set("consentToOperationalNotes", e.target.checked)
              }
            />
            <span>
              <strong>Operational notes consent recorded.</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                This demo never authorizes transcript export or customer proof.
              </span>
            </span>
          </label>
          {status === "error" && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
            >
              <AlertTriangle size={17} />
              {message}
              <button
                className="ml-auto underline"
                type="button"
                onClick={() => setStatus("idle")}
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={status === "submitting"}>
              <Send size={16} />
              {status === "submitting"
                ? "Generating…"
                : "Generate follow-up receipt"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(initial);
                setReceipt(null);
                setStatus("idle");
              }}
            >
              <Undo2 size={16} />
              Undo draft
            </Button>
          </div>
        </form>
      </Card>
      <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
        <div className="border-b border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Plain-language receipt
          </p>
          <h2 className="mt-2 text-xl font-semibold">What happens next</h2>
        </div>
        {receipt ? (
          <div className="p-5" data-testid="clinic-receipt">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <CheckCircle2 size={18} />
              Draft generated; no external send
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <ReceiptRow
                label="What the team tried"
                value={receipt.attemptedTask}
              />
              <ReceiptRow
                label="What happened"
                value={receipt.observedOutcome}
              />
              <ReceiptRow
                label="What the system owner owns"
                value={receipt.systemOwnerAction}
              />
              <ReceiptRow
                label="What the customer role owns"
                value={receipt.customerOwnerAction}
              />
              <ReceiptRow
                label="When it is tested again"
                value={new Date(receipt.nextTestAt).toLocaleString("en-CA")}
              />
            </dl>
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <strong>Held:</strong> facilitator review and customer
              confirmation. This draft cannot change adoption state.
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <RotateCcw className="mx-auto text-slate-300" size={32} />
            <p className="mt-3 font-semibold text-slate-700">No receipt yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete the clinic record to generate a reviewable, non-persisted
              receipt.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  const C = textarea ? "textarea" : "input";
  return (
    <label className="block text-sm font-semibold">
      {label}
      <C
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal leading-6 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        rows={textarea ? 3 : undefined}
      />
    </label>
  );
}
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 leading-6 text-slate-800">{value}</dd>
    </div>
  );
}
