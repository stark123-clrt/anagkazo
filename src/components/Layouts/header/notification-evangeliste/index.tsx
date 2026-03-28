"use client";

import { getNotificationsEvangeliste, marquerNotifsEvangelisteVues } from "@/actions/notifications.actions";
import type { NotificationEvangeliste } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "../notification/icons";

function IconType({ type }: { type: NotificationEvangeliste["type"] }) {
  if (type === "programme_en_cours") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green/15">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-green opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-green" />
        </span>
      </div>
    );
  }
  if (type === "programme_nouveau") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // suivi
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF9C55]/15 text-[#FF9C55]">
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function NotificationEvangeliste() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvangeliste[]>([]);
  const [nbNew, setNbNew] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function charger() {
    try {
      const data = await getNotificationsEvangeliste();
      setNotifications(data);
      setNbNew(data.filter((n) => n.isNew).length);
    } catch { /* silencieux */ }
  }

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  async function handleOpen() {
    const wasOpen = isOpen;
    setIsOpen((v) => !v);
    if (!wasOpen && nbNew > 0) {
      setNbNew(0);
      await marquerNotifsEvangelisteVues();
    }
  }

  function handleClickNotif(notif: NotificationEvangeliste) {
    setIsOpen(false);
    if (notif.type === "suivi") {
      // Extraire l'id de la rencontre (format: "suivi-{id}")
      const rencontreId = notif.id.replace("suivi-", "");
      router.push(`/evangeliste/ames`);
      // highlight côté client non dispo ici, juste naviguer
      void rencontreId;
    } else {
      router.push("/evangeliste/programmes");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        aria-label="Voir les notifications"
        className="grid size-10 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
      >
        <span className="relative">
          <BellIcon />
          {nbNew > 0 && (
            <span className="absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3">
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-1rem))] rounded-xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-stroke px-4 py-3 dark:border-dark-3">
            <span className="text-sm font-semibold text-dark dark:text-white">Notifications</span>
            {nbNew > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                {nbNew} nouveau{nbNew > 1 ? "x" : ""}
              </span>
            )}
          </div>

          {/* Liste */}
          <ul className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-dark-5 dark:text-dark-6">
                Aucune notification pour le moment.
              </li>
            ) : (
              notifications.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => handleClickNotif(notif)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-1 dark:hover:bg-dark-2 ${notif.isNew ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <IconType type={notif.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-dark dark:text-white">
                          {notif.titre}
                        </p>
                        {notif.isNew && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="truncate text-[11px] text-dark-5 dark:text-dark-6">
                        {notif.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-dark-5 dark:text-dark-6">
                        {notif.tempsEcoule}
                      </p>
                    </div>
                    {notif.type === "programme_en_cours" && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-green/15 px-1.5 py-0.5 text-[9px] font-bold text-green">
                        En cours
                      </span>
                    )}
                    {notif.type === "suivi" && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-[#FF9C55]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#FF9C55]">
                        Suivi
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Pied */}
          <div className="border-t border-stroke px-4 py-2.5 dark:border-dark-3">
            <button
              onClick={() => { setIsOpen(false); router.push("/evangeliste/ames"); }}
              className="block w-full text-center text-xs font-semibold text-primary hover:underline"
            >
              Voir mes âmes →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
