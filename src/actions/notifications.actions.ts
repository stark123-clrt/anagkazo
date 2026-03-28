"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationItem, NotifPrefs, NotificationEvangeliste } from "@/types/notifications";
import { NOTIF_PREFS_DEFAUT } from "@/types/notifications";

function getInitiales(nom: string): string {
  return nom
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function tempsDepuis(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  return `Il y a ${diffJ}j`;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const session = await auth();
  if (!session?.user?.organizationId) return [];

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { notifPrefs: true },
  });
  const prefs: NotifPrefs = {
    ...NOTIF_PREFS_DEFAUT,
    ...(org?.notifPrefs as Partial<NotifPrefs> | null ?? {}),
  };

  type WhereClause = {
    organizationId: string;
    OR?: Array<Record<string, unknown>>;
  };

  const where: WhereClause = { organizationId: session.user.organizationId };

  if (!prefs.toutesRencontres) {
    const conditions: Array<Record<string, unknown>> = [];
    if (prefs.salut) conditions.push({ priereSalut: true });
    if (prefs.guerison) conditions.push({ guerison: true });
    if (prefs.priereSpontanee) conditions.push({ priereSpontanee: true });
    if (prefs.contact) conditions.push({ contact: { not: null } });
    if (conditions.length === 0) return [];
    where.OR = conditions;
  }

  const rencontres = await prisma.rencontre.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      personneNom: true,
      personneVille: true,
      priereSalut: true,
      guerison: true,
      contact: true,
      createdAt: true,
      evangeliste: { select: { nom: true } },
    },
  });

  return rencontres.map((r) => ({
    id: r.id,
    rencontreId: r.id,
    initiales: getInitiales(r.evangeliste.nom),
    titre: r.priereSalut ? "Prière du Salut" : r.guerison ? "Guérison" : "Nouvelle rencontre",
    description: `${r.evangeliste.nom} — ${r.personneNom}, ${r.personneVille}`,
    tempsEcoule: tempsDepuis(r.createdAt),
    salut: r.priereSalut,
  }));
}

export async function getNotifPrefs(): Promise<NotifPrefs> {
  const session = await auth();
  if (!session?.user?.organizationId) return { ...NOTIF_PREFS_DEFAUT };

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { notifPrefs: true },
  });
  return { ...NOTIF_PREFS_DEFAUT, ...(org?.notifPrefs as Partial<NotifPrefs> | null ?? {}) };
}

export async function sauvegarderNotifPrefs(prefs: NotifPrefs): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return { error: "Accès refusé." };

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { notifPrefs: prefs as object },
  });
  return {};
}

// ── Notifications évangéliste ─────────────────────────────────────────────

export async function getNotificationsEvangeliste(): Promise<NotificationEvangeliste[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const orgId = session.user.organizationId;

  // Récupérer la date de dernière lecture
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifVuAt: true },
  });
  const vuAt = user?.notifVuAt ?? new Date(0);

  const notifs: NotificationEvangeliste[] = [];

  // ── 1. Âmes mises en suivi (parmi ses rencontres) ─────────────────────
  const amesSuivies = await prisma.rencontre.findMany({
    where: { organizationId: orgId, evangelisteId: userId, suivi: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, personneNom: true, personneVille: true, createdAt: true },
  });

  for (const r of amesSuivies) {
    notifs.push({
      id: `suivi-${r.id}`,
      type: "suivi",
      titre: "Âme mise en suivi",
      description: `${r.personneNom} — ${r.personneVille}`,
      tempsEcoule: tempsDepuis(r.createdAt),
      isNew: r.createdAt > vuAt,
    });
  }

  // ── 2. Nouveaux programmes qui te concernent (tu es dans un groupe) ────
  const programmes = await prisma.programme.findMany({
    where: { organizationId: orgId, statut: { not: "termine" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      titre: true,
      lieu: true,
      date: true,
      statut: true,
      createdAt: true,
      repartitionGroupes: true,
    },
  });

  for (const p of programmes) {
    let groupes: { groupe: number; membres: string[] }[] = [];
    try {
      const raw = p.repartitionGroupes;
      if (Array.isArray(raw)) groupes = raw as typeof groupes;
      else if (raw && typeof raw === "object" && "groupes" in raw)
        groupes = (raw as { groupes: typeof groupes }).groupes ?? [];
    } catch { /* skip */ }

    const estDedans = groupes.some((g) => g.membres.includes(userId));
    if (!estDedans) continue;

    if (p.statut === "en_cours") {
      notifs.push({
        id: `encours-${p.id}`,
        type: "programme_en_cours",
        titre: "Sortie en cours !",
        description: `${p.titre} — ${p.lieu}`,
        tempsEcoule: tempsDepuis(p.date),
        isNew: p.date > vuAt,
      });
    } else {
      // a_venir : notifier si nouveau programme créé récemment
      notifs.push({
        id: `prog-${p.id}`,
        type: "programme_nouveau",
        titre: "Nouveau programme",
        description: `${p.titre} — ${p.lieu}`,
        tempsEcoule: tempsDepuis(p.createdAt),
        isNew: p.createdAt > vuAt,
      });
    }
  }

  // Trier : "en cours" en premier, puis par isNew, puis les autres
  notifs.sort((a, b) => {
    if (a.type === "programme_en_cours" && b.type !== "programme_en_cours") return -1;
    if (b.type === "programme_en_cours" && a.type !== "programme_en_cours") return 1;
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return 0;
  });

  return notifs.slice(0, 8);
}

export async function marquerNotifsEvangelisteVues(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notifVuAt: new Date() },
  });
}
