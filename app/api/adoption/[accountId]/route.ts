import { NextResponse } from "next/server";
import { getAdoptionRecord } from "@/lib/services/adoption-service";

export function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  return context.params.then(({ accountId }) => {
    const record = getAdoptionRecord(accountId);
    return record
      ? NextResponse.json(record)
      : NextResponse.json({ error: "Account not found" }, { status: 404 });
  });
}
