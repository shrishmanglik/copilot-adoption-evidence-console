import { Database, FileCheck2, GitBranch, UserRoundCheck } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { Card } from "@/components/ui/card";
import { auditEvents } from "@/lib/fixtures/synthetic-data";

export const metadata = { title: "Audit" };
export default function AuditPage() {
  return (
    <>
      <ScreenHeader
        eyebrow="Append-only history"
        title="Every consequential state change leaves a receipt"
        description="This demo audit stream is immutable fixture data. A production adapter would append corrections rather than overwrite source language or prior decisions."
      />
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card className="h-fit p-5">
          <h2 className="font-semibold">Truth boundaries</h2>
          <div className="mt-4 space-y-4 text-sm">
            <Boundary
              icon={<FileCheck2 />}
              label="Local source"
              value="Implemented and testable"
            />
            <Boundary
              icon={<GitBranch />}
              label="GitHub"
              value="PR evidence after push"
            />
            <Boundary
              icon={<Database />}
              label="Provider / persistence"
              value="UNKNOWN — not connected"
            />
            <Boundary
              icon={<UserRoundCheck />}
              label="Customer / revenue"
              value="UNKNOWN — no claims"
            />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-semibold">Synthetic event stream</h2>
            <p className="mt-1 text-xs text-slate-500">
              Source, ruleset, and human authority remain distinct.
            </p>
          </div>
          <ol className="divide-y divide-slate-100">
            {auditEvents.map((event) => (
              <li
                key={event.id}
                className="grid gap-2 p-5 sm:grid-cols-[150px_1fr]"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-blue-700">
                    {event.id}
                  </p>
                  <time className="mt-1 block text-xs text-slate-500">
                    {event.at.replace("T", " ").replace("Z", " UTC")}
                  </time>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {event.type.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    {event.detail}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Authority: {event.actor}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
function Boundary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {
        <span className="mt-0.5 text-blue-700 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      }
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{value}</p>
      </div>
    </div>
  );
}
