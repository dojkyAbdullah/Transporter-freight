import webPush from "web-push";
import { supabaseServer } from "./supabaseServer";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    "mailto:support@freight-collection.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Get all push subscriptions for the given user IDs.
 * @param {string[]} userIds
 * @returns {Promise<Array<{ endpoint, keys: { p256dh, auth } }>>}
 */
async function getSubscriptionsForUsers(userIds) {
  if (!userIds?.length) return [];
  const { data: rows, error } = await supabaseServer
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) {
    console.error("[push] getSubscriptionsForUsers error:", error);
    return [];
  }

  return (rows || []).map((r) => ({
    endpoint: r.endpoint,
    keys: {
      p256dh: r.p256dh,
      auth: r.auth,
    },
  }));
}

/**
 * Send a push notification to all subscriptions of the given user IDs.
 * @param {string[]} userIds
 * @param {{ title: string, body?: string, url?: string, tag?: string }} payload
 */
export async function sendPushToUsers(userIds, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[push] VAPID keys not set, skipping push");
    return;
  }

  const subscriptions = await getSubscriptionsForUsers(userIds);
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
    tag: payload.tag ?? "freight",
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(sub, body).catch((err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid - could delete from DB
        }
        console.warn("[push] send failed:", err.message);
      })
    )
  );
}
