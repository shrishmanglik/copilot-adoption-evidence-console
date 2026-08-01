"use client";

import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import type {
  GovernedWorkflowKind,
  GovernedWorkflowReceipt,
} from "@/lib/domain/types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface WorkspaceProps {
  kind: GovernedWorkflowKind;
  heading: string;
  description: string;
  buttonLabel: string;
  testId: string;
  initial: {
    workflowId: string;
    evidenceSummary: string;
    ownerAction: string;
    stopCondition: string;
  };
}

export function GovernedWorkflowWorkspace({
  kind,
  heading,
  description,
  buttonLabel,
  testId,
  initial,
}: WorkspaceProps) {
  const initialForm = {
    ...initial,
    productVersion: "2026.7",
    humanReviewAcknowledged: true,
  };
  const [form, setForm] = useState(initialForm);
  const [receipt, setReceipt] = useState<GovernedWorkflowReceipt | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/workflows/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind }),
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

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{heading}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            NOT PERSISTED
          </span>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Workflow ID"
              value={form.workflowId}
              onChange={(value) => set("workflowId", value)}
            />
            <Field
              label="Product version"
              value={form.productVersion}
              onChange={(value) => set("productVersion", value)}
            />
          </div>
          <Field
            label="Evidence summary"
            value={form.evidenceSummary}
            onChange={(value) => set("evidenceSummary", value)}
            textarea
          />
          <Field
            label="Named owner action"
            value={form.ownerAction}
            onChange={(value) => set("ownerAction", value)}
            textarea
          />
          <Field
            label="Stop or rollback condition"
            value={form.stopCondition}
            onChange={(value) => set("stopCondition", value)}
            textarea
          />
          <label className="flex min-h-11 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.humanReviewAcknowledged}
              onChange={(event) =>
                set("humanReviewAcknowledged", event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-blue-700"
            />
            <span>
              <strong>Human review boundary acknowledged.</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                This draft cannot close a blocker, record customer approval,
                promote a playbook, or send externally.
              </span>
            </span>
          </label>
          {status === "error" && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              <AlertTriangle size={17} />
              {message}
              <button
                type="button"
                className="ml-auto font-semibold underline"
                onClick={() => setStatus("idle")}
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={status === "submitting"}>
              <Send size={16} />
              {status === "submitting" ? "Generating…" : buttonLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(initialForm);
                setReceipt(null);
                setStatus("idle");
              }}
            >
              <Undo2 size={16} /> Undo draft
            </Button>
          </div>
        </form>
      </Card>
      <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
        <div className="border-b border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Decision receipt
          </p>
          <h2 className="mt-2 text-xl font-semibold">Human-held outcome</h2>
        </div>
        {receipt ? (
          <div className="p-5" data-testid={testId}>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <CheckCircle2 size={18} /> Draft generated; no state change
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <ReceiptRow label="Receipt" value={receipt.receiptId} mono />
              <ReceiptRow label="Status" value={receipt.status} />
              <ReceiptRow
                label="External action"
                value={receipt.externalAction}
              />
              <ReceiptRow
                label="Held fields"
                value={receipt.heldFields.join(", ")}
              />
            </dl>
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <strong>Human authority required.</strong> Retry and undo are
              local; nothing was persisted, approved, promoted, or sent.
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <RotateCcw className="mx-auto text-slate-300" size={32} />
            <p className="mt-3 font-semibold text-slate-700">No receipt yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete the evidence fields to generate a deterministic review
              draft.
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
  const Control = textarea ? "textarea" : "input";
  return (
    <label className="block text-sm font-semibold">
      {label}
      <Control
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={textarea ? 3 : undefined}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal leading-6 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 break-all leading-6 text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
