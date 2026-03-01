# Freight Collection – Progressive Web App (PWA)

The app is a **Progressive Web App**: you can install it on your phone or tablet and use it like a native app, with offline support and real-time updates.

---

## Install on your phone

### Android (Chrome / Edge)

1. Open the app in **Chrome** or **Edge**: `https://your-domain.com` (or your dev URL).
2. Tap the **menu** (⋮) → **“Install app”** or **“Add to Home screen”**.
3. Confirm. The app icon appears on your home screen and opens in full screen without the browser bar.

### iPhone / iPad (Safari)

1. Open the app in **Safari** (PWA install is not supported in Chrome on iOS).
2. Tap the **Share** button (square with arrow).
3. Scroll and tap **“Add to Home Screen”**.
4. Edit the name if you want, then tap **Add**. The app icon appears on your home screen.

---

## What works offline

- **Cached pages**: Once you’ve opened a page while online, it’s stored and can be opened again when you’re offline.
- **Offline banner**: When you lose connection, a yellow bar at the top tells you that you’re offline.
- **Offline page**: If you open a link that isn’t cached, you’ll see an “You’re offline” page with a **Go back** button.

When you’re back online:

- **Realtime** (Supabase) reconnects and data (requests, bids, users) updates automatically.
- New data is loaded from the server; no refresh needed for live updates.

---

## Optional: PNG icons for “Add to Home Screen”

The app uses an SVG icon by default. For the best “Add to Home Screen” experience (especially on iOS), you can add PNG icons:

1. Create at least:
   - **192×192** → save as `public/icons/icon-192.png`
   - **512×512** → save as `public/icons/icon-512.png`
2. Use a generator (e.g. [realfavicongenerator.net](https://realfavicongenerator.net/) or [pwa-asset-generator](https://www.npmjs.com/package/pwa-asset-generator)) to create these from your logo.
3. In `src/app/manifest.js`, add (or merge) these entries to the `icons` array:

```js
{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
```

Then rebuild and redeploy.

---

## HTTPS

PWAs require **HTTPS** in production. For local development, `http://localhost` is allowed. Use a tunnel (e.g. ngrok) or your host’s HTTPS to test install on a real device.
