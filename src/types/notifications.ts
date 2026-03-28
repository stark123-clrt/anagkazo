export interface NotificationItem {
  id: string;
  rencontreId: string;
  initiales: string;
  titre: string;
  description: string;
  tempsEcoule: string;
  salut: boolean;
}

export interface NotifPrefs {
  toutesRencontres: boolean;
  salut: boolean;
  guerison: boolean;
  contact: boolean;
  priereSpontanee: boolean;
}

export const NOTIF_PREFS_DEFAUT: NotifPrefs = {
  toutesRencontres: true,
  salut: true,
  guerison: true,
  contact: false,
  priereSpontanee: false,
};

// ── Notifications évangéliste ──────────────────────────────────────────────

export type NotifEvangType = "suivi" | "programme_nouveau" | "programme_en_cours";

export interface NotificationEvangeliste {
  id: string;             // identifiant unique de la notif (rencontreId ou programmeId)
  type: NotifEvangType;
  titre: string;
  description: string;
  tempsEcoule: string;
  isNew: boolean;         // true si créé après notifVuAt
}
