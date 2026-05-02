import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function envoyerPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
  } catch (err: any) {
    // Subscription expirée ou invalide → on ignore
    if (err.statusCode === 410 || err.statusCode === 404) return 'expired';
    throw err;
  }
}
