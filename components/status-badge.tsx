import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock3,
} from "lucide-react";
import type { AdoptionState, BlockerState } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type State = AdoptionState | BlockerState | "ELIGIBLE_HELD" | "PROPOSED";

const styles: Record<string, string> = {
  VERIFIED_ADOPTION: "border-teal-200 bg-teal-50 text-teal-800",
  VALIDATED_CLOSED: "border-teal-200 bg-teal-50 text-teal-800",
  REPEAT_USE: "border-blue-200 bg-blue-50 text-blue-800",
  FIRST_VALUE: "border-blue-200 bg-blue-50 text-blue-800",
  ENABLED: "border-slate-200 bg-slate-50 text-slate-700",
  BASELINED: "border-slate-200 bg-slate-50 text-slate-700",
  DISCOVERED: "border-slate-200 bg-slate-50 text-slate-700",
  UNKNOWN: "border-slate-300 bg-slate-100 text-slate-700",
  BLOCKED: "border-red-200 bg-red-50 text-red-800",
  OPEN: "border-red-200 bg-red-50 text-red-800",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  RESOLVED_PENDING_VALIDATION: "border-amber-200 bg-amber-50 text-amber-900",
  DISPUTED: "border-amber-200 bg-amber-50 text-amber-900",
  ELIGIBLE_HELD: "border-amber-200 bg-amber-50 text-amber-900",
  PROPOSED: "border-violet-200 bg-violet-50 text-violet-800",
};

function StateIcon({ state }: { state: State }) {
  if (["VERIFIED_ADOPTION", "VALIDATED_CLOSED"].includes(state))
    return <CheckCircle2 aria-hidden size={14} />;
  if (["BLOCKED", "OPEN"].includes(state)) return <Ban aria-hidden size={14} />;
  if (["UNKNOWN", "DISPUTED"].includes(state))
    return <AlertTriangle aria-hidden size={14} />;
  if (["RESOLVED_PENDING_VALIDATION", "ELIGIBLE_HELD"].includes(state))
    return <Clock3 aria-hidden size={14} />;
  return <CircleDashed aria-hidden size={14} />;
}

export function StatusBadge({
  state,
  className,
}: {
  state: State;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        styles[state] ?? styles.UNKNOWN,
        className,
      )}
    >
      <StateIcon state={state} />
      {state.replaceAll("_", " ")}
    </span>
  );
}
