"use client";

import { getNotifications } from "@/actions/notifications.actions";
import type { NotificationItem } from "@/types/notifications";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "./icons";

function Initiales({ nom, salut }: { nom: string; salut: boolean }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        salut ? "bg-green/15 text-green" : "bg-primary/10 text-primary",
      )}
    >
      {nom}
    </div>
  );
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastCount, setLastCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function charger() {
    try {
      const data = await getNotifications();
      setNotifications(data);
      if (data.length > lastCount) setIsDotVisible(true);
      setLastCount(data.length);
    } catch { /* silencieux */ }
  }

  // Chargement initial + polling toutes les 30s
  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fermer si clic en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  function handleOpen() {
    setIsOpen((v) => !v);
    if (!isOpen) setIsDotVisible(false);
  }

  function handleClickNotif(rencontreId: string) {
    setIsOpen(false);
    router.push(`/ames?highlight=${rencontreId}`);
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
          {isDotVisible && (
            <span className="absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3">
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </button>

      {/* Dropdown — ancré à droite, largeur max 320px */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-1rem))] rounded-xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b border-stroke px-4 py-3 dark:border-dark-3">
            <span className="text-sm font-semibold text-dark dark:text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
              <Link
                href="/parametres/notifications"
                onClick={() => setIsOpen(false)}
                title="Paramètres"
                className="text-dark-5 hover:text-primary dark:text-dark-6"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth={1.8}/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth={1.8}/>
                </svg>
              </Link>
            </div>
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
                    onClick={() => handleClickNotif(notif.rencontreId)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-1 dark:hover:bg-dark-2"
                  >
                    <Initiales nom={notif.initiales} salut={notif.salut} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-dark dark:text-white">
                        {notif.titre}
                      </p>
                      <p className="truncate text-[11px] text-dark-5 dark:text-dark-6">
                        {notif.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-dark-5 dark:text-dark-6">
                        {notif.tempsEcoule}
                      </p>
                    </div>
                    {notif.salut && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-green/15 px-1.5 py-0.5 text-[9px] font-bold text-green">
                        Salut
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Pied */}
          <div className="border-t border-stroke px-4 py-2.5 dark:border-dark-3">
            <Link
              href="/ames"
              onClick={() => setIsOpen(false)}
              className="block text-center text-xs font-semibold text-primary hover:underline"
            >
              Voir toutes les âmes →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
