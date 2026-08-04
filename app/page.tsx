import { AdoptionDashboard } from "@/components/adoption-dashboard";
import { ScreenHeader } from "@/components/screen-header";
import { listAdoptionRecords } from "@/lib/services/adoption-service";

export default function AdoptionPage() {
  return (
    <>
      <ScreenHeader
        eyebrow="Adoption truth"
        title="What is adopted—and what only looks adopted?"
        description="A deterministic evidence register connecting workflow eligibility, first value, blockers, owners, customer validation, repeat use, and proof eligibility. Every record below is synthetic."
      />
      <AdoptionDashboard records={listAdoptionRecords()} />
    </>
  );
}
