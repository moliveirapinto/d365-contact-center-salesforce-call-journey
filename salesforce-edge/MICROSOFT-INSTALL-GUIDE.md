# D365 Contact Center Edge — Salesforce Installation Guide

> For Salesforce administrators installing the D365 Contact Center agent desktop widget.

> **Read this first: the install URL below is a template, not a working link.**
> `04tXXXXXXXXXXXXXXX` is a placeholder, not a shortened ID, and the copy button copies the placeholder as it is.
> The real package version ID (`04t` followed by 15 more characters, 18 in total) is **not published**: your Microsoft representative gives it to you.
> Ask for **"the current D365ContactCenter install URL for a Developer Edition org or sandbox."**
> Paste their ID in place of `04tXXXXXXXXXXXXXXX`, or open the full link they sent you.

## Package availability

As of **2026-06-10**, CELA has cleared the Salesforce distribution path:
`D365ContactCenter` ships as a Salesforce 2GP **unlocked package** published
from a Microsoft-owned Salesforce account.

- Use only the current install URL provided by your Microsoft representative.
  It contains a `04t…` package version ID (18 characters) generated from the Microsoft-owned
  Salesforce account.
- Do **not** use any install URL shared before **2026-05-21**. The earlier
  personal-Dev-Hub package was deleted and those links return
  **"package not found."**
- The package source remains `salesforce-container/force-app/`; customers
  install the package and then point the iframe at the Pulse-served Edge URL.

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Salesforce org** | **During beta:** Developer edition or sandbox only. **At GA:** Enterprise, Unlimited, or Developer edition with Lightning enabled. |
| **Install URL** | Provided by your Microsoft representative (contains a `04t` package version ID). Beta and GA install URLs are different package versions. |
| **D365 Org URL** | Your Dynamics 365 organization URL (e.g., `https://your-org.crm.dynamics.com`) |
| **Admin permission in Salesforce** | The installer must have "System Administrator" profile or equivalent permission to install packages. |
| **Microphone permission** | For voice calls, agents must allow microphone access on the Pulse portal origin (browser-level, one-time prompt). |

## Step 1: Install the Package

1. Open the install URL in your browser. Replace `04tXXXXXXXXXXXXXXX` with the package version ID from your Microsoft representative (or just open the full link they sent you):
   ```
   https://login.salesforce.com/packaging/installPackage.apexp?p0=04tXXXXXXXXXXXXXXX
   ```
   For sandbox installs, replace `login.salesforce.com` with `test.salesforce.com`.
2. Log in to your Salesforce org (if not already logged in).
3. The package installer shows you the components that will be installed —
   seven Lightning Web Components (`d365EdgeContainer`, `d365EdgeBridge`,
   `d365AdapterDetector`, `d365CrmAdapterBase`, `d365LightningAdapter`,
   `d365ConsoleAdapter`, `d365OpenCTIAdapter`). All seven ship as one package;
   you do not install them individually.
4. Review the data access notice: this Microsoft component embeds Dynamics 365
   Contact Center Edge in Salesforce and enables selected data exchange between
   Salesforce and Dynamics 365 Contact Center for the configured orgs and
   signed-in users. Salesforce context such as record identifiers and
   navigation context may be sent to Dynamics 365 Contact Center, and selected
   contact-center context or actions such as screen pop, click-to-dial,
   conversation, call, and presence events may be sent back to Salesforce. This
   integration does not provide general-purpose access to all Salesforce or
   Microsoft data; access is limited to the configured orgs, signed-in users,
   and enabled integration features.
5. Choose **Install for All Users** (recommended) or **Install for Admins Only**.
6. If prompted about "Third-Party Access," approve. (This is Salesforce
   informing you that the widget communicates with Microsoft endpoints —
   AAD for sign-in and your Dynamics 365 tenant for data.)
7. Click **Install**.
8. Wait for the install to complete (usually < 5 minutes — Salesforce sends
   a confirmation email when it's done).

## Step 2: Place the Container in Salesforce

The same package component supports two placement modes:

| Placement | When to use | Setup path |
|-----------|-------------|------------|
| **Utility Bar** | Overlay-style contact center panel that opens from the bottom utility bar. This preserves the original package behavior. | Setup → App Manager → your Lightning app → **Edit** → **Utility Items (Desktop Only)** → Add Utility Item → `d365EdgeContainer` |
| **Docked Lightning page region** | Side-by-side Salesforce page layouts where Edge stays mounted while Salesforce records render in adjacent regions. | Setup → Lightning App Builder → App Page, Home Page, or Record Page → drag `d365EdgeContainer` into the desired region |

For Utility Bar placement, set the label to **Contact Center**, set panel width
to **480** and panel height to **600** (keep the panel height at **545** or
above — below that the docked panel shows a scrollbar), and optionally enable
**Start automatically**.

For App/Home/Record Page placement, use a page region with enough horizontal
space for the agent experience and keep the default **Container Height** (`70vh`)
or set a definite CSS length such as `600px`. Lightning page regions do not
always impose a parent height, so a definite component height prevents the
iframe from collapsing. Keep **Minimum Height** at its `545px` default (or
higher) so the region never hands Edge less than its 500px canvas floor — see
Step 3.

## Step 3: Configure Properties

In the utility item settings you just added, review the data access notice in
the component and property descriptions, then set these properties:

| Property | Value | Example |
|----------|-------|---------|
| **D365 Org URL** | Your Dynamics 365 org URL | `https://contoso.crm.dynamics.com` |
| **Layout Preset** | `embedded`, `compact`, `full`, or `minimal` | `embedded` for inbox + conversation; `compact` or `full` when the page should include Copilot/agent-assist widgets |
| **Screen Pop Mode** | `navigate`, `publish`, or `both` | Utility Bar default: `navigate`; docked pages default: `publish` |
| **Enable Host API** | Leave **on** when Salesforce LWCs need Edge events/data over Lightning Message Service. Turn off only to disable the public host surface. | `true` |
| **Host API Instance ID** | Stable id sibling LWCs use to target this container. Set a unique value when a Salesforce app/page contains more than one D365 Edge container. | `primary` |
| **Host API Allowed Events** | Comma-separated event names published over Lightning Message Service. Defaults to `screenPop.requested`; add lifecycle/message events only for trusted host LWCs. | `screenPop.requested,conversation.started` |
| **Host API Allowed Requests** | Comma-separated allowlist of `operation:name` entries accepted over Lightning Message Service. Blank is the default and disables command/query requests while still allowing events. Keep narrow; raw Dataverse passthrough queries are blocked over LMS. | `query:getConversationTranscript` |
| **Container Height / Minimum Height** | Definite CSS lengths for docked page regions. Keep **Minimum Height** at `545px` or above — that is the smallest value that avoids a permanent scrollbar (Edge floors its canvas at 500px and this container adds a 45px toolbar above the iframe). Lower values are supported; Edge scrolls rather than clipping. See the **Minimum Height** property description in Lightning App Builder. | `70vh`, `600px`, `545px` |
| **Verbose Logging** | Leave **off** in normal operation. Enable only when Microsoft support asks for detailed protocol/auth logs. | `false` |

The **Edge URL** defaults to the US preprod Pulse portal. For production deployments, update it to your production regional Pulse portal URL provided by your Microsoft representative — for example `https://portal.us.contactcenterai.powerplatform.com/experience/agent`. The Edge URL may include an existing query string — the widget composes the iframe URL safely so additional parameters are preserved.

The iframe always points at a Pulse-served portal URL. The Pulse service fetches the SPA bundle from the underlying CDN and serves it under the portal hostname; customers never iframe the CDN directly.

Authentication is handled automatically — Edge uses a Microsoft first-party app (FPA) with `/common` authority, so no tenant ID or client ID configuration is needed.

Click **Save**.

### Optional: Salesforce host API for custom LWCs

When **Enable Host API** is on, the package exposes Lightning Message Service
channels so customer or partner LWCs can integrate with Edge without forking the
container:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `D365EdgeHostEvent__c` | Container → Salesforce host code | Publishes admin-allowlisted events such as `screenPop.requested`, `conversation.started`, `conversation.messageReceived`, `presence.changed`, `call.connected`, and `activityLog.created`. Events include `instanceId`; payloads are JSON strings in `payloadJson`. |
| `D365EdgeHostRequest__c` | Salesforce host code → container | Sends bridge requests with `{ requestId, targetInstanceId, operation, name, paramsJson }`, where `operation` is `command` or `query`. The container ignores requests whose `targetInstanceId` does not match its Host API Instance ID, then enforces the **Host API Allowed Requests** allowlist before forwarding to Edge. |
| `D365EdgeHostResponse__c` | Container → Salesforce host code | Publishes correlated responses with `{ requestId, instanceId, operation, name, success, dataJson, errorMessage }`. |

Use **Screen Pop Mode = publish** for docked pages that render Salesforce
records inline. In that mode, `screenPop.requested` is published on
`D365EdgeHostEvent__c` and the container does not navigate away from the current
Lightning page. Use **both** if the page needs an LMS event and the classic
Salesforce navigation behavior.

Record-resolution logic remains host/customer-owned. For example, a Salesforce
LWC can subscribe to `screenPop.requested`, call `D365EdgeHostRequest__c` queries
such as `getConversationTranscript` or `getConversationData`, resolve the appropriate Salesforce Contact/Case using
customer-specific rules, and render those records inline. The package provides
the transport and data access surface; it does not ship customer-specific Apex,
SOQL matching, Salesforce Knowledge search, or AI writeback logic.

Event publishing is allowlisted and command/query requests are deny-by-default.
If a customer solution needs conversation lifecycle events, message events,
transcript reads, conversation metadata, or a mutating command, add the exact
event name, `query:<name>`, or `command:<name>` entry after reviewing the
data/side-effect scope for that Salesforce page. Raw Dataverse passthrough
queries (`retrieveRecord` / `retrieveMultipleRecords`) are intentionally not
available through LMS.

## Step 4: Add Microsoft URLs to Salesforce Trusted Sites

Salesforce's Lightning Content Security Policy (CSP) blocks cross-origin
iframes and the microphone permission they need unless the target origin
is added to **CSP Trusted Sites**. Some newer Salesforce releases use a
**Trusted URLs** Setup page in addition to or instead of CSP Trusted Sites
— if your org shows both, add the entries to both. Without this step, the
widget will load to a blank panel and the browser console will show a CSP
error such as `Refused to frame ... because it violates the following
Content Security Policy directive: "frame-src ..."`.

1. Go to **Setup** (gear icon in the top-right).
2. In the Quick Find box, search for **CSP Trusted Sites** (and, if
   present in your org, **Trusted URLs**) and open it.
3. Click **New Trusted Site**. Add the Pulse portal origin you used for
   the **Edge URL** property in Step 3 — origin only, not the full
   `/experience/agent` path. For example:

   | Field | Value |
   |-------|-------|
   | Trusted Site Name | `D365ContactCenterEdge` |
   | Trusted Site URL | `https://portal.us.contactcenterai.powerplatform.com` (use your regional production URL) |
   | Active | checked |
   | Context | All |
   | CSP Directives | **Allow site to load in frame in Lightning Experience and Salesforce app pages** — checked |
   | CSP Directives | **Allow site to use microphone in Lightning Experience and Salesforce app pages** — checked |

   The microphone directive is required for voice calls. The frame
   directive is required for the widget to render at all. The camera
   directive is **not** needed.

4. Click **Save**.
5. Repeat steps 3–4 for `https://login.microsoftonline.com` (Trusted Site
   Name: `MicrosoftEntraSignIn`, same directives checked). This is
   required so the Microsoft sign-in popup can complete without being
   blocked by Salesforce CSP.
6. If your org also exposes the newer **Trusted URLs** Setup page, repeat
   the same two entries there with the matching CSP directives.

This is a one-time, org-wide configuration. Agents do not need to repeat
it; they will only see the browser-level microphone prompt on first voice
call (Step 5).

## Step 5: Verify

1. Open your Lightning app.
2. Open the Utility Bar item or the Lightning page where you placed `d365EdgeContainer`.
3. Confirm the agent desktop panel/region renders at the configured height.
4. On first launch:
   - A Microsoft sign-in popup opens at `login.microsoftonline.com`.
   - Agent signs in with their Microsoft Entra (Azure AD) credentials.
   - Popup closes automatically, the iframe inside Salesforce shows the
     agent desktop with inbox and conversation areas.
5. On subsequent launches, sign-in completes silently using the cached
   session (no popup) until the session expires.
6. If you place an inbound/outbound voice call, the browser will prompt
   once for **microphone access** on the Pulse portal origin. Allow this
   permission (and keep it allowed) — Salesforce does **not** propagate
   microphone permission from the host page automatically.

## Step 6: Enable native click-to-dial (Open CTI) — optional

By itself the container catches phone-number clicks only when it runs as the
org's registered Open CTI softphone. A plain utility-bar LWC is never that
softphone, so native Salesforce phone fields stay "click to dial disabled" and
the console reports tier `console`/`lightning` (no `+cti`). Creating a Softphone
Layout alone is **necessary but not sufficient**.

To enable native click-to-dial, the package ships a small Open CTI adapter that
registers as the softphone and forwards each clicked number to the container
over the packaged Lightning Message Service host API:

- **Visualforce page** `D365EdgeCtiAdapter` — loads Lightning Open CTI, enables
  click-to-dial, and forwards each clicked number to the **D365 Edge CTI Bridge**
  via `window.postMessage`. (The softphone runs in the CTI framework's
  cross-domain iframe, which has no Lightning Message Service runtime, so it
  cannot publish onto the host channel directly.)
- **`d365EdgeCtiBridge` Aura component** — runs in the Lightning Experience
  window (add it to the utility bar), receives the softphone's message, and
  re-publishes it as a `command:clickToDial` request on the **D365 Edge Host
  Request** channel. It also relays the container's response back to the
  softphone status line. It is an Aura component, not an LWC, on purpose: under
  Lightning Web Security an LWC's `window` message listener does not receive the
  softphone's native cross-origin `postMessage`, whereas an Aura (Locker)
  component does.
- **Call Center** `Dynamics 365 Contact Center Edge` (`D365EdgeCallCenter`) —
  registers the Visualforce page as the org softphone.

No container code is changed; native click-to-dial rides the documented host API.

Configure it once:

1. **Assign users to the Call Center.**
   Setup → **Call Centers** → *Dynamics 365 Contact Center Edge* → **Manage Call
   Center Users** → **Add More** → select each agent. (If the Call Centers page
   shows the CTI splash, click *Continue*.)

2. **Create/assign a Softphone Layout.**
   Setup → **Softphone Layouts** → **New** (or edit the default) → **Save** →
   **Softphone Layout Assignment** → assign it to the agents' profiles. This is
   what makes phone fields render as click-to-dial enabled.

3. **Add the Open CTI Softphone utility to the app.**
   Setup → **App Manager** → your Lightning app → **Edit** → **Utility Items
   (Desktop Only)** → **Add Utility Item** → **Open CTI Softphone** → **Save**.
   This is required: for an app with a custom utility bar (one that already
   hosts the `d365EdgeContainer` item), the softphone is **not** added
   automatically. Without this item the adapter page never loads, so
   `onClickToDial` never fires and phone fields stay click-to-dial disabled.

4. **Add the D365 Edge CTI Bridge to the app.**
   In the same **Utility Items (Desktop Only)** list → **Add Utility Item** →
   **D365 Edge CTI Bridge** → **Save**. This Aura component shows only a small
   one-line status readout; it must simply be present so it is loaded in the
   Lightning window. It relays the softphone's click-to-dial `postMessage` onto
   the packaged Host Request channel. Without it, the softphone shows
   *"Forwarded…"* but the container never receives the command.

5. **Point the container at the bridge.** On the container utility-bar item
   (Step 2) set:
   - **Host API Instance ID** = `D365EdgePrimary`
     (must match the adapter's default; or pass `?instanceId=<value>` on the
     Call Center *CTI Adapter URL* and use that value here instead).
   - **Host API Allowed Requests** must include `command:clickToDial`
     (comma-separate with any existing entries). Requests are blocked by default,
     so this entry is required — the click is dropped without it.
   - Keep **Enable Host API** checked.

6. **Reload** the Lightning app. The **Open CTI Softphone** utility (from
   Step 3) now appears alongside the D365 Edge container. The softphone panel
   shows *"Ready — click a phone number to dial through D365 Edge."*

7. **Test.** Open a Contact/Account, click a phone field (or a
   `lightning-click-to-dial` number). The D365 Edge outbound dialer opens
   prefilled with that number (subject to the agent's native-voice channel
   policy and voice capacity profile).

> A real outbound call additionally requires the agent to have a **voice
> capacity/channel profile** provisioned in Dynamics 365 — the dialer prefill
> works without it, but placing the call does not.

## Troubleshooting

### "Beta package cannot be installed in this org"

Beta packages can only be installed in **Developer Edition orgs and sandboxes**.
If you receive this error in an Enterprise / Unlimited production org, the
version hasn't been promoted to Released yet — wait for the official GA URL
from your Microsoft representative.

### Authentication popup is blocked

MSAL uses a popup window for sign-in. Ensure your browser allows popups from
the Pulse portal origin (e.g., `portal.us.contactcenterai.powerplatform.com`)
and from `login.microsoftonline.com`. The popup is user-initiated, so most
browsers allow it by default.

### Microphone permission denied / voice calls fail silently

The browser must grant microphone access on the Pulse portal origin (not on
the Salesforce origin). To re-grant:
- Chrome/Edge: click the lock icon in the address bar → Site permissions → Microphone → Allow.
- Use a non-incognito window so the permission persists across sessions.

### "Redirect URI mismatch" error

The Azure AD app registration must include the Pulse portal URL (`/experience/agent`) as an allowed redirect URI. The standard regional portal URLs are pre-registered; if you've configured an unusual variant, contact your Microsoft representative to add it.

### Iframe is blocked / "Refused to frame ... CSP directive"

The Pulse portal origin and/or `login.microsoftonline.com` are missing
from Salesforce's CSP Trusted Sites (and Trusted URLs, if your org has
that page). Go back to **Step 4: Add Microsoft URLs to Salesforce Trusted
Sites** and confirm both entries exist, are Active, are in context **All**,
and have the **Allow site to load in frame** and **Allow site to use
microphone** CSP directives checked.

After saving the trusted site, refresh the Lightning app. The change takes
effect immediately — no agent re-login is required.

### Iframe loads but shows a blank screen

- Verify the **Edge URL** property matches a valid Pulse regional portal URL (e.g. `https://portal.us.contactcenterai.powerplatform.com/experience/agent`)
- Check the browser console for `Message from unexpected origin` warnings
- Confirm Step 4 (CSP Trusted Sites) is complete — a missing or inactive
  entry causes a blank panel rather than a visible error in the iframe
- Ensure your network allows access to `*.contactcenterai.powerplatform.com`

### Open CTI features not available

This is normal. The component auto-detects the best available CRM integration:

- **Without Open CTI**: Screen pop uses standard Lightning navigation. No functionality is lost.
- **With Open CTI**: Adds click-to-dial and navigation change listeners. Native
  phone-field click-to-dial requires the packaged Open CTI softphone adapter —
  see **Step 6: Enable native click-to-dial (Open CTI)**. A Softphone Layout
  alone is necessary but not sufficient; the agent must also be assigned to the
  `Dynamics 365 Contact Center Edge` Call Center and the container's Host API
  Allowed Requests must include `command:clickToDial`.

Check the detected tier in the browser console:
```
[D365AdapterDetector] Detected tier: lightning
```

Possible tiers: `lightning`, `console`, `lightning+cti`, `console+cti`

## Updating

When Microsoft releases a new version, you'll receive a new install URL. Click it to upgrade — Salesforce handles the update automatically. Your configuration (Edge URL, Org URL) is preserved across upgrades.

## Uninstalling

1. Before uninstalling, remove the `d365EdgeContainer` component from any
   Utility Bar, App Page, Home Page, or Record Page where you added it.
   Otherwise the uninstall will fail with a reference error.
2. Go to **Setup** > **Installed Packages**.
3. Find **D365ContactCenter** and click **Uninstall**.
4. Salesforce shows a list of components that will be removed and asks
   whether to save or delete component data. Either choice is safe here —
   the package stores no Salesforce-side data; agent state lives in
   Microsoft Dynamics 365.
5. Click **Uninstall** and confirm. Salesforce processes the uninstall
   asynchronously and emails you when complete.

## Reporting issues

While in beta, please report installation or runtime issues to your Microsoft
contact with:
- The package version (visible in Setup → Installed Packages)
- Your Salesforce org type and API version
- Browser console logs (F12 → Console tab → copy any errors)
- Screenshots of the error state

For runtime/protocol issues, enable **Verbose Logging** on the utility bar
configuration before reproducing — this captures the `d365edge:` postMessage
protocol traffic in the browser console.
