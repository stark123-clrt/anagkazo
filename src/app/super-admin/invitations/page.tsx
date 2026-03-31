import { listerInvitationsAdmin } from "@/actions/invitation-admin.actions";
import { InvitationsClient } from "./_components/InvitationsClient";

export default async function InvitationsPage() {
  const invitations = await listerInvitationsAdmin();
  return <InvitationsClient invitations={invitations} />;
}
