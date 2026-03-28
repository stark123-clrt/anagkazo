import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifPrefs } from "@/actions/notifications.actions";
// types viennent de @/types/notifications via le composant client
import NotifPrefsClient from "./_components/NotifPrefsClient";

export default async function ParametresNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/programmes");

  const prefs = await getNotifPrefs();

  return (
    <>
      <Breadcrumb pageName="Paramètres des notifications" />
      <NotifPrefsClient prefs={prefs} />
    </>
  );
}
