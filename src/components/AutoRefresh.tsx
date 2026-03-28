"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";

/**
 * Rafraîchissement intelligent en arrière-plan.
 *
 * - Se pause automatiquement quand l'utilisateur interagit (frappe, focus input, modal ouverte)
 * - Reprend après un délai d'inactivité
 * - Adapte l'intervalle selon la page (terrain = rapide, profil = lent)
 * - Ne rafraîchit que si l'onglet est visible
 */

/** Pages qui n'ont pas besoin de refresh temps réel */
const SLOW_PAGES = ["/profile", "/parametres"];

/** Pages avec formulaires où le refresh doit être très prudent */
const FORM_PAGES = ["/terrain", "/programmes/nouveau", "/programmes/", "/modifier"];

function getIntervalForPath(pathname: string): number {
  if (SLOW_PAGES.some((p) => pathname.includes(p))) return 30_000; // 30s
  if (FORM_PAGES.some((p) => pathname.includes(p))) return 10_000; // 10s
  return 5_000; // 5s pour dashboards, listes
}

export function AutoRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const pausedUntil = useRef(0);
  const intervalMs = getIntervalForPath(pathname);

  // Pause le refresh pendant 15s après chaque interaction utilisateur
  const pauseRefresh = useCallback(() => {
    pausedUntil.current = Date.now() + 15_000;
  }, []);

  useEffect(() => {
    // Écouter les interactions qui indiquent que l'utilisateur est actif dans un formulaire
    const events = ["keydown", "mousedown", "touchstart", "focusin"];

    function handleInteraction(e: Event) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Pause seulement si l'interaction est dans un formulaire, modal ou dropdown
      const isFormInteraction =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON" ||
        target.closest("form") !== null ||
        target.closest("[role='dialog']") !== null ||
        target.closest("[data-no-refresh]") !== null;

      if (isFormInteraction) {
        pauseRefresh();
      }
    }

    events.forEach((evt) => document.addEventListener(evt, handleInteraction, true));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, handleInteraction, true));
    };
  }, [pauseRefresh]);

  useEffect(() => {
    const id = setInterval(() => {
      // Ne pas rafraîchir si :
      // 1. L'onglet n'est pas visible
      // 2. L'utilisateur est en train d'interagir
      if (document.visibilityState !== "visible") return;
      if (Date.now() < pausedUntil.current) return;

      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
