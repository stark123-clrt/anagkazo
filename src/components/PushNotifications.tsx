"use client";

import { useEffect } from "react";
import { abonnerPush } from "@/actions/push.actions";


export function PushNotifications() {

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await abonnerPush({
            endpoint: existing.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(existing.getKey("p256dh")!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(existing.getKey("auth")!))),
          });
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await abonnerPush({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        });
      } catch (err) {
        console.error("Push setup error:", err);
      }
    }

    setup();
  }, []);

  return null;
}
