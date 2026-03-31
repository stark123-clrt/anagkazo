import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import NextTopLoader from "nextjs-toploader";

export default async function SuperAdminLayout({ children }: PropsWithChildren) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (role !== "SUPER_ADMIN") redirect("/");

  return (
    <>
      <NextTopLoader color="#5750F1" showSpinner={false} />
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <Header />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
