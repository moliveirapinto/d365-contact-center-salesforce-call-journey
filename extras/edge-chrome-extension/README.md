# Extra: "D365 Contact Center Helper for Salesforce" browser extension

A small Microsoft Edge / Google Chrome extension for **demo and agent laptops**. It fixes three annoyances you may hit when running the Dynamics 365 Contact Center widget inside Salesforce:

| Problem | What the extension does |
|---|---|
| The D365 panel in the Salesforce console is small | Enlarges it (same CSS as the [Salesforce CTI panel enlarger](../salesforce-cti-panel-enlarger/README.md), but only in this browser) |
| **"HTTP Error 400 – Request Too Long"** in the widget after many sign-ins | Removes stale `OpenIdConnect.nonce.*` sign-in cookies for `*.crm*.dynamics.com` (keeps them for 5 minutes, long enough for any sign-in) |
| D365 takes ~2 minutes to load / stuck spinner | Clears Dynamics 365's local app cache (IndexedDB, cache storage, service workers) **once at browser start**, before any D365 page is open. Sign-in cookies are kept. Your D365 org is detected automatically. |

It doesn't read page content and doesn't send data anywhere.

## Install

1. Download this folder (`extras/edge-chrome-extension`) to your computer (GitHub → **Code** → **Download ZIP**, then unzip).
2. Open **`edge://extensions`** (Edge) or **`chrome://extensions`** (Chrome).
3. Turn on **Developer mode**.
4. Click **Load unpacked** → select the `edge-chrome-extension` folder.
5. Restart the browser once.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension definition (Manifest V3) |
| `styles.css` | Enlarges the Open CTI panel on `*.lightning.force.com` |
| `background.js` | Cookie clean-up and cache clearing |
