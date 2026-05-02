export const dynamic = "force-dynamic";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { listerOrganisations } from "@/actions/super-admin.actions";
import { CelluleClient } from "./_components/CelluleClient";

export default async function CellulePage() {
  const organisations = await listerOrganisations();
  return (
    <>
      <Breadcrumb pageName="Organisations FIJ" />
      <CelluleClient organisations={organisations} />
    </>
  );
}
