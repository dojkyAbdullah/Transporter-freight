# Push Notifications Setup

This app sends push notifications when:

1. **A new request is created** → Only the **selected transporters** get notified (or **all transporters** if “Select all” was used).
2. **A transporter submits a rate** → The **executive** (company that created the request) and **all admins** get notified.

Notifications work in both the **PWA** (installed app) and the **web app** (browser), as long as the user has allowed notifications and the app has registered their device.

---

## 1. Generate VAPID keys

You need a single key pair for Web Push (VAPID). Run once:

```bash
npx web-push generate-vapid-keys
```

You’ll get two lines, for example:

```
Public Key:  BNx...
Private Key: yz...
```

---

## 2. Add environment variables

In your `.env` (or hosting env):

- **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** – the **Public Key** from step 1 (so the browser can subscribe).
- **`VAPID_PRIVATE_KEY`** – the **Private Key** from step 1 (never expose this; server only).

Restart the dev server or redeploy after changing env.

---

## 3. Create the `push_subscriptions` table in Supabase

Run the migration in **Supabase Dashboard → SQL Editor** (or your migration runner).

See the file: **`supabase/migrations/push_subscriptions.sql`**.

It creates:

- Table **`public.push_subscriptions`** with: `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`.
- Unique constraint on `endpoint` so one device = one row.
- RLS so users can only add/delete their own subscriptions; the service role can read all for sending.

If you prefer to paste SQL, use:

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own subscription"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all"
  ON public.push_subscriptions FOR SELECT TO service_role
  USING (true);
```

---

## 4. How it works in the app

- On **first load** (when the user is logged in), the app may ask for **notification permission**. If the user allows, the browser creates a push subscription and the app sends it to **`/api/push-subscribe`**, which stores it in **`push_subscriptions`** for that user.
- **When a request is created:**  
  - If specific transporters were selected → only those users’ subscriptions are used.  
  - If “Select all” (or no selection) → all users with role **TRANSPORTER** get the notification.
- **When a transporter submits a rate:**  
  - The **company** that owns the request and every user with role **ADMIN** get a notification (no duplicate for the same user).

Notifications open the app (or the relevant dashboard) when clicked, using the `url` stored in the payload (e.g. `/transporter/dashboard`, `/company/dashboard`).

---

## 5. How to check on the web that notifications are working

### Step 1: Prerequisites

- VAPID keys are in `.env` and the dev server was restarted.
- The `push_subscriptions` table exists in Supabase.
- You’re on **HTTPS** or **http://localhost** (push requires a secure context).

### Step 2: Allow notifications in the browser

1. Open your app in the browser (e.g. `http://localhost:3000` or your deployed URL).
2. Log in (e.g. as Executive, Transporter, or Admin).
3. You should see a small card: **“Get notified of new requests and rates”** with **Enable notifications**.
4. Click **Enable notifications**.
5. When the browser asks **“Allow notifications?”**, click **Allow**.

If you already blocked the site:

- **Chrome:** Click the lock/info icon in the address bar → **Site settings** → set **Notifications** to **Allow**, then reload and enable again in the app if needed.
- **Firefox:** Lock icon → **Clear cookies and site data** or set permissions for the site to allow notifications, then reload.

### Step 3: Confirm the subscription was saved

1. In **Supabase Dashboard** go to **Table Editor** → **push_subscriptions**.
2. You should see at least one row with your `user_id`, and `endpoint` / `p256dh` / `auth` filled.
3. If there’s a row, the web app has registered this browser for push.

### Step 4: Trigger a notification

**Test 1 – “New request” (Transporter gets notified):**

1. Open a **second browser** (or incognito) and log in as a **Transporter**.
2. In that window, enable notifications (same as Step 2) so that transporter has a row in `push_subscriptions`.
3. In the **first browser**, log in as **Executive** (or Admin).
4. Create a new request and **select that transporter** (or “Select all”).
5. Submit the RFQ.
6. In the **Transporter** window you should get a **browser push notification**: “New freight request” with the commodity/label. It may appear in the system tray or as a popup depending on the OS.

**Test 2 – “New rate” (Executive / Admin get notified):**

1. In one browser, log in as **Executive** (or Admin) and enable notifications.
2. In another browser (or another user), log in as **Transporter**, open a request, and **submit a rate**.
3. In the **Executive/Admin** window you should get a push: “New rate submitted” with transporter name and amount.

### Step 5: If no notification appears

- Check **Supabase → push_subscriptions**: is there a row for the user who should receive the notification?
- Check the **browser’s notification permission** for your site (address bar → site settings): must be **Allow**.
- Check the **terminal** where `npm run dev` (or your server) is running for any `[push]` or `web-push` errors.
- Try in **Chrome** or **Edge** (Safari has stricter rules; Firefox works but behaviour can differ).

Once you see the notification in the browser (and optionally in the PWA), notifications are working on the web version.

---

## 6. Troubleshooting

- **Browser never asks for permission / table stays empty:**  
  - Ensure **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** (and **`VAPID_PRIVATE_KEY`**) are set in `.env` and the dev server was restarted. Without the public key, the app won’t show the notification card or request permission.  
  - After logging in, the app shows a small card: “Get notified of new requests and rates”. If permission is still “default”, the browser prompt may also appear automatically after a few seconds.  
  - Click **Enable notifications** on the card if you don’t see the browser prompt.  
  - Ensure the **service worker** is registered (PWA or first visit); push requires `navigator.serviceWorker.ready` before subscribing.

- **No notifications:**  
  - Confirm **VAPID** keys are set and the **push_subscriptions** table exists and has rows for the test user.  
  - In the browser, check **Site settings → Notifications** and ensure they’re allowed.  
  - Check the server logs for `[push]` or `web-push` errors (e.g. invalid or expired subscription).

- **“Invalid or expired token” from `/api/push-subscribe`:**  
  - The client must send the current Supabase **access_token** in the `Authorization: Bearer ...` header. If the session has expired, the user should log in again.

- **Subscriptions table:**  
  - Use **Supabase Dashboard → Table Editor → push_subscriptions** to see stored subscriptions and confirm `user_id` and `endpoint` are correct.

(For a full walkthrough of testing on the web, see **Section 5** above.)
