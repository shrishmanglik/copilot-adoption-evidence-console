import { ClinicWorkspace } from "@/components/clinic-workspace";
import { ScreenHeader } from "@/components/screen-header";

export const metadata = { title: "Clinics" };
export default function ClinicsPage() {
  return (
    <>
      <ScreenHeader
        eyebrow="Customer workflow clinic"
        title="Capture the attempt, not a polished summary"
        description="Record what was tried, what happened, who owns the next action, and when the workflow will be tested again. Receipt generation is deterministic and remains human-held."
      />
      <ClinicWorkspace />
    </>
  );
}
