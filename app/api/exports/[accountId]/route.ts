import { NextResponse } from "next/server";
import { getAdoptionRecord } from "@/lib/services/adoption-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params;
  const record = getAdoptionRecord(accountId);
  if (!record)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json(
    {
      schemaVersion: "adoption-export.v1",
      generatedAt: new Date().toISOString(),
      scope: { accountId, workflowId: record.workflow.id, synthetic: true },
      sourceVersions: record.workflow.sourceRecords.map(
        ({ id, version, kind }) => ({ id, version, kind }),
      ),
      heldFields: record.receipt.heldFields,
      decisionReceipt: record.receipt,
      caveats: [
        "Synthetic fixture data",
        "No provider or customer system connected",
        "Not publication approval",
      ],
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${accountId}-adoption-receipt.json"`,
      },
    },
  );
}
