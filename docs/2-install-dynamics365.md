# Step 2 — Import the Dynamics 365 solution

⏱ ~10 minutes · 👤 Power Platform System Administrator (or System Customizer) in your Contact Center environment

You'll import **one zip file** into Dynamics 365, turn on one flow, and add one script to one form.

---

## 2.1 Import the solution

1. Download **[`dynamics365/D365ContactCenterSalesforceCallJourney_1_1_0_0.zip`](../dynamics365/D365ContactCenterSalesforceCallJourney_1_1_0_0.zip)** (GitHub → **Download raw file**). Don't unzip it.
2. Go to **https://make.powerapps.com** and pick your **Contact Center environment** (top-right environment picker).
3. Left menu → **Solutions** → **Import solution** → **Browse** → pick the zip → **Next**.
4. You'll see **Connections** for two connection references:

   | Connection reference | What to pick |
   |---|---|
   | **D365 Contact Center - Dataverse** | Your Microsoft Dataverse connection (or **+ New connection** → sign in as yourself) |
   | **D365 Contact Center - Salesforce** | **+ New connection** → Salesforce → **Login type:** *Production* or *Sandbox* → sign in with the Salesforce user that got the permission set in Step 1.4 |

5. Click **Import**. Wait for *"Solution imported successfully"*.

> ℹ️ The warning *"A connector was imported, however the related connection references need connections…"* is normal if you skipped the connections. You can set them later (next step).

## 2.2 Turn on the sync flow

1. **Solutions** → open **D365 Contact Center - Salesforce Call Journey**.
2. Click **Cloud flows** → **D365 Contact Center - Sync ended calls to Salesforce**.
3. If it says **Off**, click **Turn on**.
   *(If Turn on is greyed out: go back to the solution → **Connection references** → open each one → choose a connection → Save, then try again.)*

**What this flow does:** when a voice conversation ends (*Wrap-up* or *Closed*), it reads the call's times, queue, agent, sentiment and the latest **AI quality evaluation**. Then it updates the Salesforce *Contact Center Call* record that has the same conversation ID. If no Salesforce record exists (e.g. calls that didn't come through the IVR), it simply stops, successfully.

## 2.3 Add the Conversation form fix

This makes the **Quality Evaluation** side pane load inside the Salesforce pop-up (and in Customer Service Hub) instead of showing *"Error loading control"*, and makes the **Transcript** tab show the conversation inside the pop-up instead of staying blank. It's a one-time change to Microsoft's **Conversation Form**.

1. In **make.powerapps.com** → **Tables** → search **Conversation** (logical name `msdyn_ocliveworkitem`) → open it.
2. **Forms** → open **Conversation Form** (type *Main*).
3. In the form designer, open **Form libraries** in the left rail (📚 icon) → **+ Add library**.
4. Search **`new_d365cc_evaluationpanefix`** → tick it → **Add**.
5. Click an empty area of the form so the **form** itself is selected. On the right, open the **Events** tab.
6. Under **On load**, click **+ Event handler** and fill in:

   | Setting | Value |
   |---|---|
   | Library | `new_d365cc_evaluationpanefix.js` |
   | Function | `D365CC.EvaluationPaneFix.onLoad` |
   | Enabled | ✅ |
   | Pass execution context as first parameter | ✅ |

7. **Done** → **Save and publish**.

> 🔍 **What does the script do?**
> - **Evaluation pane:** loads the Fluent UI v8 library (from Microsoft's own Power Apps CDN) that the Evaluation Details control needs but forgets to request. If Fluent UI is already on the page, it does nothing. [Why](../README.md#why-the-evaluation-pane-fix-is-needed)
> - **Transcript:** only when the conversation is shown inside another site (the Salesforce pop-up) and Microsoft's transcript stays blank, it reads that conversation's transcript with the signed-in user's own permissions and shows it in the Transcript tab. Opened directly in Dynamics 365, it does nothing. [Why](../README.md#why-the-transcript-fix-is-needed)
>
> It doesn't change or send your data anywhere. [Source code](../dynamics365/webresource-source/new_d365cc_evaluationpanefix.js).

## 2.4 Give agents access to the Call Review app

The pop-up in Salesforce opens the **Contact Center Call Review** app. Out of the box, only admins can open it.

1. **make.powerapps.com** → **Apps** → find **Contact Center Call Review** → **⋯** → **Share**.
2. Add the **security roles** your agents have (for example *Omnichannel agent*, *Customer Service Representative*, *Quality Manager*) → **Share**.

## 2.5 Copy the app ID into Salesforce

1. **Apps** → **Contact Center Call Review** → **Play**.
2. Look at the browser address bar. Copy the value after **`appid=`** (a long ID like `3f2c1a…-…`).
3. In **Salesforce** → Setup → **Custom Settings** → **D365 Contact Center Settings** → **Manage** → **Edit** → paste it into **Call Review App ID** → **Save**.

✅ **Dynamics 365 is done.** Continue with [Step 3 — Copilot Studio](3-configure-copilot-studio.md).

---

### What got installed?

| Component | Name |
|---|---|
| Model-driven app | **Contact Center Call Review**: a lightweight conversation viewer with no extra side panes, fast to load inside Salesforce |
| Web resource | `new_d365cc_evaluationpanefix.js` (Conversation form fix: Evaluation pane + transcript in the pop-up) |
| Cloud flow | **D365 Contact Center - Sync ended calls to Salesforce** |
| Connection references | *D365 Contact Center - Dataverse*, *D365 Contact Center - Salesforce* |
| Publisher | *D365 Contact Center Samples* (prefix `new`) |

The solution is **unmanaged**, so you can open and change every piece.
