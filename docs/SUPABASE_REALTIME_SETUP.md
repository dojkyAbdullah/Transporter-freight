# Enable Supabase Realtime – Step-by-Step Guide

This app uses **Supabase Realtime** so that dashboards update live (new requests, new bids, new users) without refreshing the page. You must enable Realtime for the right tables in your Supabase project.

---

## Step 1: Open your Supabase project

1. Go to **[https://supabase.com/dashboard](https://supabase.com/dashboard)** and sign in.
2. Select your project (e.g. **Freight Collection** or the project you use for this app).

---

## Step 2: Go to Database → Replication

1. In the **left sidebar**, click **Database**.
2. Click **Replication** (under Database).
  You’ll see a list of **Publication** and which tables are included for Realtime.

---

## Step 3: Enable Realtime for the tables this app uses

You have two options.

### Option A: Enable Realtime for every table (simplest)

If you want Realtime on **all** tables in `public`:

1. Find the **supabase_realtime** publication (or the one used for Realtime).
2. Click **Edit** / **Configure** (or the equivalent for your UI).
3. Turn **on** Replication for **all** tables listed (or add all tables in `public` to the publication).

This is fine for development or if you’re okay with every table being able to broadcast changes.

---

### Option B: Enable Realtime only for the tables this app needs (recommended)

Enable Realtime only for these **3 tables**:


| Table                     | Used for                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| `**requests`**            | New/updated/closed RFQs; transporters and company dashboards see changes |
| `**transporter_replies**` | Transporters’ rates/bids; company dashboard sees new/updated bids        |
| `**users**`               | User list for admin; transporter list for company “Send to transporters” |


**How to add them:**

1. On the **Replication** page, open the **supabase_realtime** publication (or the Realtime publication your project uses).
2. Click **Add tables** / **Add publication** (wording may vary).
3. From the list of tables, enable:
  - `**public.requests`**
  - `**public.transporter_replies**`
  - `**public.users**`
4. Save / confirm.

If your UI shows a **single toggle per table** (e.g. “Enable Realtime”):

- Turn **ON** for:
  - **requests**
  - **transporter_replies**
  - **users**

---

## Step 4: Confirm Replication is active

1. Stay on **Database → Replication**.
2. Check that the tables you enabled show as **replicated** / **enabled** (e.g. green or “Active”).
3. If you use **Option A**, all tables you added to the Realtime publication should show as enabled.

---

## Step 5: (Optional) Check Realtime in the API docs

1. In the left sidebar, open **Project API** or **API Docs**.
2. Find **Realtime** (or “Realtime” section).
3. You can test subscriptions there; for this app you only need the tables above enabled in Replication.

---

## What this app subscribes to (for reference)


| Dashboard            | Tables listened to                         | What updates in real time                                |
| -------------------- | ------------------------------------------ | -------------------------------------------------------- |
| **Transporter**      | `requests`                                 | New requests, status changes (e.g. CLOSED)               |
| **Company / Inland** | `requests`, `transporter_replies`, `users` | New/updated requests, new/updated bids, transporter list |
| **Admin**            | `users`                                    | New/updated users                                        |


---

## Troubleshooting

- **No live updates**
  - Confirm **Database → Replication** has **requests**, **transporter_replies**, and **users** (or all tables) enabled for the Realtime publication.
  - Confirm Row Level Security (RLS) allows the anon/authenticated role to read those tables if your client uses them; Realtime respects RLS.
- **“Permission denied” or no events**
  - Check RLS policies on `requests`, `transporter_replies`, and `users` so that the roles your app uses can `SELECT` the rows that should be broadcast.
- **Supabase dashboard looks different**
  - Supabase sometimes renames menus (e.g. “Replication” might be under “Database” or “Settings”). Look for **Replication** or **Realtime** and the list of tables/publications.

---

## Summary

1. Open **Supabase Dashboard** → your project.
2. Go to **Database → Replication**.
3. Enable Realtime for at least `**requests`**, `**transporter_replies**`, and `**users**` (or enable for every table if you prefer).
4. Save and confirm; dashboards will then update in real time without refresh.

