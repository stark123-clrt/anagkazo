"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { envoyerPushNotification, PushPayload } from "@/lib/webpush";

export async function abonnerPush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorisé" };

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { p256dh: subscription.p256dh, auth: subscription.auth },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      userId: session.user.id,
    },
  });

  return { success: true };
}

export async function desabonnerPush(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { success: true };
}

// Envoyer une notification à un user spécifique
export async function notifierUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    const result = await envoyerPushNotification(sub, payload);
    if (result === "expired") {
      await prisma.pushSubscription.delete({ where: { id: sub.id } });
    }
  }
}

// Envoyer une notification à tous les admins d'une organisation
export async function notifierAdmins(orgId: string, payload: PushPayload) {
  const admins = await prisma.user.findMany({
    where: { organizationId: orgId, role: { in: ["ADMIN", "SUPER_ADMIN"] }, actif: true },
    include: { pushSubscriptions: true },
  });

  for (const admin of admins) {
    for (const sub of admin.pushSubscriptions) {
      const result = await envoyerPushNotification(sub, payload);
      if (result === "expired") {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

// Envoyer une notification à tous les évangélistes d'une organisation
export async function notifierEvangelistes(orgId: string, payload: PushPayload) {
  const evangelistes = await prisma.user.findMany({
    where: { organizationId: orgId, role: "EVANGELISTE", actif: true },
    include: { pushSubscriptions: true },
  });

  for (const ev of evangelistes) {
    for (const sub of ev.pushSubscriptions) {
      const result = await envoyerPushNotification(sub, payload);
      if (result === "expired") {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

// Envoyer à toute l'organisation
export async function notifierOrganisation(orgId: string, payload: PushPayload) {
  await notifierAdmins(orgId, payload);
  await notifierEvangelistes(orgId, payload);
}
