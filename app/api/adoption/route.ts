import { NextResponse } from "next/server";
import { listAdoptionRecords } from "@/lib/services/adoption-service";

export function GET() {
  return NextResponse.json({
    data: listAdoptionRecords(),
    meta: {
      source: "synthetic-fixtures.v1",
      persisted: false,
      providerTruth: "UNKNOWN",
    },
  });
}
