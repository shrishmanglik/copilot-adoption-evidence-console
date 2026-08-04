import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createGovernedWorkflowReceipt } from "@/lib/domain/workflow-receipt-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json(
      createGovernedWorkflowReceipt(await request.json()),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Workflow receipt validation failed",
          fields: error.issues.map((issue) => issue.path.join(".")),
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Receipt generation failed; no state changed" },
      { status: 500 },
    );
  }
}
