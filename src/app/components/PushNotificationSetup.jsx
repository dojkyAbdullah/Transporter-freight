"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function PushNotificationSetup() {
  const [state, setState] = useState("idle");
  const [showPrompt, setShowPrompt] = useState(false);
  const [session, setSession] = useState(null);

  const subscribe = async () => {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublic || !session) return;
    setState("subscribing");
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setState("idle");
            return;
          }
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
      }
      const payload = sub.toJSON ? sub.toJSON() : { endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64url(sub.getKey("p256dh")), auth: arrayBufferToBase64url(sub.getKey("auth")) } };
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowPrompt(false);
        setState("subscribed");
        toast.success("Notifications enabled");
      }
    } catch (e) {
      console.warn("[PushNotificationSetup]", e);
      toast.error("Could not enable notifications");
    }
    setState("idle");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublic) return;

    let mounted = true;
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted || !s?.user) return;
      setSession(s);
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return;

      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (sub) {
          setShowPrompt(false);
          return;
        }
        if (Notification.permission === "default") {
          setShowPrompt(true);
          return;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
        const payload = sub.toJSON ? sub.toJSON() : { endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64url(sub.getKey("p256dh")), auth: arrayBufferToBase64url(sub.getKey("auth")) } };
        const res = await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.access_token}` },
          body: JSON.stringify(payload),
        });
        if (res.ok) setShowPrompt(false);
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  if (!showPrompt || !session) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9998] bg-slate-800 text-white rounded-xl shadow-lg p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">Get notified of new requests and rates</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={subscribe}
          disabled={state === "subscribing"}
          className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-60"
        >
          {state === "subscribing" ? "Enabling…" : "Enable notifications"}
        </button>
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="py-2 px-3 text-slate-400 hover:text-white text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
