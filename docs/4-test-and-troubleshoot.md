# Step 4 — Test & troubleshoot

## 4.1 End-to-end test (5 minutes)

1. **Call your Contact Center number.** Talk to the IVR and ask for an agent.
2. In **Salesforce**, the IVR creates a **Case**. Within a few seconds, a **Contact Center Call** record appears, linked to the Case (look in the Case's *Contact Center Calls* related list, or the *Contact Center Calls* tab).
   Its title looks like: *Phone call received on Fri, Sep 25 · 9:24 PM ET*, status **In progress**.
3. **Answer** the call in the D365 widget, talk for a bit, then **end** the call and close the conversation.
4. About **1–2 minutes** later, open the call record. The **Call Journey** card now shows the queue, the agent, talk/wait time and sentiment, with status **Completed**. The quality score fields fill in once D365 has produced the evaluation.
5. Click **Recording & transcript**. A large pop-up opens with the Dynamics 365 conversation: audio player, transcript, summary, and on the right the **Quality Evaluation** pane.

🎉 **It works!**

---

## 4.2 Troubleshooting

### Nothing is created in Salesforce

| Check | How |
|---|---|
| Does the Case have a **D365 Conversation ID**? | Add the field to your Case layout, or run SOQL: `SELECT CaseNumber, D365_Conversation_Id__c FROM Case ORDER BY CreatedDate DESC LIMIT 5`. If it's empty, revisit [Step 3](3-configure-copilot-studio.md) (make sure the agent was **published**, and that "External sources can set values" is ticked). |
| Is the flow active? | Setup → Flows → **D365 Contact Center - Create Call from IVR case** → *Active*. |
| Permissions | The Salesforce user used by Copilot Studio needs the **D365 Contact Center Call Access** permission set. |
| Flow errors | Setup → **Paused and Failed Flow Interviews**. The flow runs *after* the Case is saved, in the background, so it can never break Case creation. |

### The call record never gets metrics / quality score

| Check | How |
|---|---|
| Sync flow is **On** | make.powerapps.com → Solutions → *D365 Contact Center - Salesforce Call Journey* → Cloud flows. |
| Look at its **run history** | Open the flow → *28-day run history*. A run ending in **No_Salesforce_case_for_this_call** is normal for calls that didn't come through the IVR. |
| Salesforce connection user | Must have the **D365 Contact Center Call Access** permission set. |
| Quality score empty | Quality evaluation must be enabled in D365 Contact Center, and the evaluation must exist when the call closes. Evaluations created later are not re-synced. |

### The pop-up doesn't work

| Symptom | Fix |
|---|---|
| *"&lt;your-org&gt;.crm.dynamics.com refused to connect"* or a blank frame | Setup → **Trusted URLs** → `D365_Contact_Center` must be **Active** with **frame-src** ticked. If the Contact Center panel in the utility bar shows a blocked icon, `D365_CCaaS_Embed` (`https://ccaas-embed-prod.azureedge.net`) must be active too. |
| No *Recording & transcript* button | The **D365 Contact Center Settings** → *Dynamics 365 URL* is empty (Step 1.3). |
| *"You don't have access to this app"* | Share the **Contact Center Call Review** app with the agent's security role (Step 2.4). |
| Microsoft sign-in page inside the pop-up | Sign in to Dynamics 365 once in another browser tab, then reopen the pop-up. |
| Browser console shows *"Refused to frame … frame-ancestors"* | Your Dynamics 365 environment enforces a content security policy. In the Power Platform admin center → your environment → **Settings** → **Privacy + Security** → **Content security policy**, add `https://*.lightning.force.com` and `https://*.my.salesforce.com` to the allowed frame ancestors for model-driven apps. |
| **"Error loading control"** in the evaluation pane | Step 2.3 wasn't done or wasn't published. Also try a hard refresh (Ctrl+F5). |
| **Transcript tab is blank** in the pop-up (but works when opened directly in D365) | Step 2.3 wasn't done, or you're on solution 1.0.0.0: import 1.1.1.0 (or newer). Right after publishing, D365 may still use the old script for one load: reload the pop-up (or clear site data for `*.crm.dynamics.com`, keeping cookies). |

### The call title shows the wrong time

The title is set once, when the call record is created, using **D365 Contact Center Settings** → *Time Zone Offset*, *Daylight Saving Rule* and *Time Zone Label* ([Step 1.3](1-install-salesforce.md#13-tell-salesforce-where-your-dynamics-365-is-and-your-time-zone)). Fix the settings. New calls will use them, and you can rename existing records by hand. The **Call Journey card** always shows times in each user's own Salesforce time zone.

### The call has no Customer (Contact)

The call record copies the **Contact** from the Case. If your IVR doesn't set a Contact on the Case (for example, it doesn't look the caller up), the call's *Customer* stays empty. Everything else still works. See [Step 3](3-configure-copilot-studio.md#optional-link-the-caller-to-a-contact).

### Dynamics 365 is stuck on the loading spinner (widget or pop-up)

This is a Dynamics 365 client **cache** issue, not a problem with this package. It often happens right after someone publishes customizations. D365 keeps a local copy of its app data in the browser (IndexedDB); occasionally that copy gets stuck.

**Fix:** in the browser go to `edge://settings/siteData` (or `chrome://settings/content/all`), search **`dynamics.com`**, delete the site data, then reload Salesforce. You may need to sign in again. For demo laptops, the optional [browser extension](../extras/edge-chrome-extension/README.md) clears this cache automatically at every browser start.

### "HTTP Error 400 – Request Too Long" in the widget

Old Dynamics 365 sign-in cookies (`OpenIdConnect.nonce.*`) have piled up. Delete cookies for `dynamics.com`, or use the optional [browser extension](../extras/edge-chrome-extension/README.md), which removes stale ones automatically.

---

## 4.3 Where the data comes from

| Salesforce field (Contact Center Call) | Filled by | Dynamics 365 source |
|---|---|---|
| Name, Case, Contact, Caller Phone, Conversation ID, Channel, Direction | Salesforce flow (when the Case is created); the title's time zone comes from D365 Contact Center Settings | Case fields |
| Call Received, Agent Connected, Call Ended | D365 sync flow | `msdyn_createdon`, `msdyn_activeagentassignedon`, `msdyn_closedon` / `msdyn_wrapupinitiatedon` |
| Queue, Agent, Customer Sentiment | D365 sync flow | queue, active agent, `msdyn_customersentimentlabel` |
| Talk / Wait / Handle Time | D365 sync flow | `msdyn_conversationtalktimeinseconds`, `…firstwaittimeinseconds`, `…handletimeinseconds` |
| Handled By Virtual Agent | D365 sync flow | `msdyn_copilotengaged` |
| Called Number | D365 sync flow | `msdyn_channelconnectionid` |
| Quality Score / Plan / Summary / Action Plan / Evaluation JSON / Evaluated At | D365 sync flow | latest `msdyn_evaluationhistory` for the conversation |
| Recording URL, Total Duration, Virtual Agent Time | Formulas | built from the fields above + your settings |
