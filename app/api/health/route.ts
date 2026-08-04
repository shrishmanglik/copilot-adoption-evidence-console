import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "copilot-adoption-evidence-console",
    persistence: "synthetic-memory-only",
    providerState: "UNKNOWN",
  });
}
