# Extra: bigger Dynamics 365 Contact Center panel in Salesforce

Out of the box, the Dynamics 365 Contact Center widget opens in a fairly small panel in the Salesforce console. This extra makes it **much larger** (about 64% of the screen width, almost full height) for **every user in the org**. No browser extension needed.

## What's inside

| Component | Purpose |
|---|---|
| Static resource `D365_CTI_Panel_CSS` | The CSS that resizes the Open CTI panel |
| Aura component `d365CtiPanelStyles` | An invisible *background utility item* that loads the CSS on every page of the app |

## Install (5 minutes)

1. Deploy **`D365_CTI_Panel_Enlarger_Salesforce.zip`** with Workbench exactly like the main package ([Step 1.2](../../docs/1-install-salesforce.md#12-deploy-with-workbench-option-a-recommended)).
2. **Setup** → **App Manager** → find your console app (the one with the D365 Contact Center utility item) → ▾ → **Edit**.
3. **Utility Items (Desktop Only)** → **Add Utility Item** → search **`d365CtiPanelStyles`** → add it. Give it a short **Label** (e.g. *Panel size*). It has no content; it only loads the CSS.
4. **Save** and reload the console.

Open the D365 Contact Center panel: it's now large.

## Adjusting the size

Edit the static resource (Setup → Static Resources → `D365_CTI_Panel_CSS`), change the `width: clamp(900px, 64vw, 1300px)` and `height: calc(100vh - 190px)` values, and re-upload.
