"use client";

import { useEffect, useState, useRef } from "react";
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
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const autoRequested = useRef(false);
  const autoRequestTimeout = useRef(null);
  const hasSubscriptionRef = useRef(false);

  const subscribe = async () => {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublic) {
      toast.error("Push notifications are not configured. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable.");
      return;
    }
    if (!session) return;
    setState("subscribing");
    try {
      // Request permission first (browser shows prompt on user gesture)
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        setState("idle");
        if (permission === "denied") {
          toast.error("Notifications blocked. Enable them in your browser settings.");
        }
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
      }
      const payload = sub.toJSON
        ? sub.toJSON()
        : {
            endpoint: sub.endpoint,
            keys: {
              p256dh: arrayBufferToBase64url(sub.getKey("p256dh")),
              auth: arrayBufferToBase64url(sub.getKey("auth")),
            },
          };
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowPrompt(false);
        setAlreadySubscribed(true);
        setState("subscribed");
        toast.success("Notifications enabled");
      } else {
        toast.error(data.error || "Could not enable notifications");
      }
    } catch (e) {
      console.warn("[PushNotificationSetup]", e);
      toast.error("Could not enable notifications. Check the console.");
    }
    setState("idle");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const hasSupport = "serviceWorker" in navigator && "PushManager" in window;

    let mounted = true;
    let showTimeoutId = null;

    (async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!mounted || !s?.user) return;
      setSession(s);
      if (!hasSupport) return;
      if (Notification.permission === "denied") {
        setShowPrompt(true);
        return;
      }

      // Check for existing subscription (need SW ready)
      const checkSub = async () => {
        try {
          const reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
          ]);
          const sub = await reg.pushManager.getSubscription();
          if (sub && mounted) {
            hasSubscriptionRef.current = true;
            setAlreadySubscribed(true);
            return true;
          }
        } catch (_) {}
        return false;
      };

      const hadSub = await checkSub();
      if (mounted && hadSub) {
        hasSubscriptionRef.current = true;
        return;
      }

      // Show prompt after short delay so SW has a chance to be ready
      showTimeoutId = setTimeout(() => {
        if (mounted && !hasSubscriptionRef.current) setShowPrompt(true);
      }, 1500);

      // Auto-request permission after 3s if VAPID set and still default (optional nudge)
      if (vapidPublic && Notification.permission === "default" && !autoRequested.current) {
        autoRequested.current = true;
        autoRequestTimeout.current = setTimeout(async () => {
          if (!mounted) return;
          try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const reg2 = await navigator.serviceWorker.ready;
              let sub2 = await reg2.pushManager.getSubscription();
              if (!sub2) {
                sub2 = await reg2.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidPublic),
                });
              }
              const payload = sub2.toJSON
                ? sub2.toJSON()
                : {
                    endpoint: sub2.endpoint,
                    keys: {
                      p256dh: arrayBufferToBase64url(sub2.getKey("p256dh")),
                      auth: arrayBufferToBase64url(sub2.getKey("auth")),
                    },
                  };
              const res = await fetch("/api/push-subscribe", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${s.access_token}`,
                },
                body: JSON.stringify(payload),
              });
              if (res.ok && mounted) {
                setShowPrompt(false);
                setAlreadySubscribed(true);
                toast.success("Notifications enabled");
              }
            }
          } catch (_) {}
        }, 3000);
      }
    })();

    return () => {
      mounted = false;
      if (showTimeoutId) clearTimeout(showTimeoutId);
      if (autoRequestTimeout.current) clearTimeout(autoRequestTimeout.current);
    };
  }, []);

  if (!showPrompt || !session) return null;

  const vapidSet = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9998] bg-slate-800 text-white rounded-xl shadow-lg p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">
        {vapidSet
          ? "Get notified of new requests and rates"
          : "Push notifications are not configured for this app."}
      </p>
      <div className="flex gap-2">
        {vapidSet && (
          <button
            type="button"
            onClick={subscribe}
            disabled={state === "subscribing"}
            className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {state === "subscribing" ? "Enabling…" : "Enable notifications"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="py-2 px-3 text-slate-400 hover:text-white text-sm"
        >
          {vapidSet ? "Not now" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
