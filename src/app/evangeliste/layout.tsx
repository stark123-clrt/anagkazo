import { SidebarEvangeliste } from "@/components/Layouts/sidebar/SidebarEvangeliste";
import { HeaderEvangeliste } from "@/components/Layouts/header/header-evangeliste";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { AutoRefresh } from "@/components/AutoRefresh";
import { InstallPWA } from "@/components/InstallPWA";
import { PushNotifications } from "@/components/PushNotifications";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";

export default function EvangelisteLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <NextTopLoader color="#5750F1" showSpinner={false} />
      <div className="flex min-h-screen">
        <SidebarEvangeliste />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <HeaderEvangeliste />
          <AutoRefresh />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
      <InstallPWA />
      <PushNotifications />
    </SidebarProvider>
  );
}
