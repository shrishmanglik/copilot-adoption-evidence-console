import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClinicReceipt } from "@/lib/domain/clinic-service";

export async function POST(request: Request) {
  try {
    const receipt = createClinicReceipt(await request.json());
    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Receipt validation failed",
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
