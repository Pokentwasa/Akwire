import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { CsvImportForm } from "@/app/(app)/discover/csv-import-form";
import { GooglePlacesSearch } from "@/app/(app)/discover/google-places-search";

export default async function DiscoverPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Discover</h1>
        <p className="text-ink-muted">
          Find companies for {organisation.name}. Every import is scored immediately.
        </p>
      </div>
      <GooglePlacesSearch />
      <CsvImportForm />
    </main>
  );
}
