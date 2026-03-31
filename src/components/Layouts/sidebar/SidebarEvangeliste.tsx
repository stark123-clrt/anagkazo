"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import * as Icons from "./icons";

const NAV_EVANGELISTE = [
  {
    title: "Tableau de bord",
    url: "/evangeliste",
    icon: Icons.HomeIcon,
  },
  {
    title: "Terrain",
    url: "/evangeliste/terrain",
    icon: Icons.MapPin,
  },
  {
    title: "Programmes",
    url: "/evangeliste/programmes",
    icon: Icons.Calendar,
  },
  {
    title: "Annuaire des Âmes",
    url: "/evangeliste/ames",
    icon: Icons.BookOpen,
  },
  {
    title: "Mon Profil",
    url: "/evangeliste/profil",
    icon: Icons.User,
  },
];

export function SidebarEvangeliste() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Navigation évangéliste"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          {/* Logo */}
          <div className="relative pr-4.5">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Fermer le menu</span>
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            <div className="mb-6">
              <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                MON ESPACE
              </h2>
              <nav role="navigation" aria-label="Menu évangéliste">
                <ul className="space-y-2">
                  {NAV_EVANGELISTE.map((item) => (
                    <li key={item.title}>
                      <MenuItem
                        className="flex items-center gap-3 py-3"
                        as="link"
                        href={item.url}
                        isActive={pathname === item.url}
                        onClick={() => isMobile && toggleSidebar()}
                      >
                        <item.icon className="size-6 shrink-0" aria-hidden="true" />
                        <span>{item.title}</span>
                      </MenuItem>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
