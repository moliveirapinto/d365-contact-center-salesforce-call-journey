# Step 1 — Install the Salesforce package

⏱ ~10 minutes · 👤 Salesforce System Administrator

You'll upload **one zip file** to Salesforce. No command line needed.

> **How does "installing" work in Salesforce?**
> Salesforce apps come in two flavours:
> - **Packages from AppExchange**: you click an install link.
> - **Metadata deployments**: you upload a zip of components (objects, fields, pages, flows…) with a deployment tool.
>
> This project uses a **metadata deployment**. It's the same method admins use to move changes from a sandbox to production. The zip contains a `package.xml` "packing list" plus the components. Salesforce reads the list and creates everything for you.
>
> We'll use **Workbench**, a free, browser-based tool that the Salesforce community has used for years. (Prefer the official command line? See [Option B](#option-b-salesforce-cli).)

---

## 1.1 Download the zip

Download **[`salesforce/D365ContactCenter_CallJourney_Salesforce.zip`](../salesforce/D365ContactCenter_CallJourney_Salesforce.zip)** from this repo (open the file on GitHub → **Download raw file**).

⚠️ **Don't unzip it.** Salesforce wants the zip as-is.

## 1.2 Deploy with Workbench (Option A, recommended)

1. Go to **https://workbench.developerforce.com**.
2. **Environment:** choose **Sandbox** (if your URL contains `.sandbox.`) or **Production**.
   **API version:** pick the highest one. Tick *I agree to the terms* → **Login with Salesforce**.
3. Log in with your Salesforce admin user. If asked, click **Allow**.
4. In the top menu choose **migration → Deploy**.
5. Click **Choose File** and pick `D365ContactCenter_CallJourney_Salesforce.zip`.
6. Tick these two boxes:
   - ✅ **Rollback On Error** (if anything fails, nothing is changed)
   - ✅ **Single Package**

   **Test Level:** in a **sandbox** you can pick `NoTestRun`. In **production**, leave the default (the package has no Apex code, so no tests are needed).
7. Click **Next** → **Deploy**.
8. Wait until the status shows **Succeeded** (usually under a minute). You should see about **48 components** deployed.

> ❌ **Failed?** Workbench shows the failing component and the reason. The most common one: *"Field D365_Conversation_Id__c already exists"*, which means you already have a field with that name on Case. Rename your existing field or remove it from `package.xml`.

## 1.3 Tell Salesforce where your Dynamics 365 is (and your time zone)

Nothing in the package is tied to a specific organization, region or time zone. You enter your own values once:

1. **Setup** → Quick Find: **Custom Settings** → click **D365 Contact Center Settings**.
2. Click **Manage** → **New** (the one at the top, *Default Organization Level Value*).
3. Fill in:

   | Field | What to enter | Example |
   |---|---|---|
   | **Dynamics 365 URL** | Your Contact Center environment URL (any region) | `https://contoso.crm.dynamics.com` |
   | **Call Review App ID** | Leave blank for now. You'll paste it in Step 2.5 | `3f2c…-…` |
   | **Time Zone Offset (hours)** | Your *standard-time* offset from UTC, used in call titles | `-5` |
   | **Daylight Saving Rule** | `US`, `EU`, or leave blank if you don't observe daylight saving time | `US` |
   | **Time Zone Label** | Short label printed at the end of call titles | `ET` |

4. **Save**.

**Common time zones**

| Where | Offset | Daylight Saving Rule | Label |
|---|---|---|---|
| US Eastern (New York, Toronto) | `-5` | `US` | `ET` |
| US Central (Chicago, Mexico City*) | `-6` | `US` (*Mexico: blank) | `CT` |
| US Mountain (Denver) | `-7` | `US` | `MT` |
| US Pacific (Los Angeles, Vancouver) | `-8` | `US` | `PT` |
| Brazil (São Paulo) | `-3` | *(blank)* | `BRT` |
| UK / Ireland / Portugal | `0` | `EU` | `GMT` |
| Central Europe (Paris, Berlin, Madrid) | `1` | `EU` | `CET` |
| India | `5.5` | *(blank)* | `IST` |
| Australia (Sydney)† | `10` | *(blank)* | `AEST` |

With these values a call title reads like **"Phone call received on Fri, Sep 25 · 9:24 PM ET"**. If you leave all three blank, titles use UTC (e.g. *"… 1:24 AM UTC"*).
† Southern-hemisphere daylight saving isn't supported. Use your standard offset.

> The **Call Journey card** doesn't use these settings. It always shows times in **each user's own Salesforce time zone and language** (their personal settings).

## 1.4 Give people access

1. **Setup** → Quick Find: **Permission Sets** → **D365 Contact Center Call Access**.
2. **Manage Assignments** → **Add Assignment**.
3. Select:
   - every **agent** who uses the Salesforce console
   - the **Salesforce user that Copilot Studio uses** to create Cases
   - the **Salesforce user you'll use for the Power Automate connection** in Step 2 (often an integration user)
4. **Next** → **Assign**.

## 1.5 (Optional) Show the call on the Case

- **Link in the Case header** (like the screenshot in the README): Setup → Object Manager → **Case** → **Compact Layouts** → **Compact Layout Assignment** → **Edit Assignment** → choose **Case Highlights with Call Recording** → Save. *(If you already use a custom Case compact layout, just add the **Call Recording & Transcript** field to it instead.)*
- **Case page layout:** Setup → Object Manager → **Case** → Page Layouts → your layout → drag **Call Recording & Transcript** onto it → Save.
- **Related list of calls:** on the same Case layout (and on the Contact layout), in *Related Lists* drag **Contact Center Calls** → Save.
- **Visual timeline on the Case:** open a Case → ⚙ → **Edit Page** → drag **Call Timeline (D365 Contact Center)** onto the page → Save → Activate.

✅ **Salesforce is done.** Continue with [Step 2 — Dynamics 365](2-install-dynamics365.md).

---

## What got installed?

| Component | Where to find it |
|---|---|
| **Contact Center Call** object (+ tab) | Setup → Object Manager → Contact Center Call. Add the tab to your console app's navigation if you like. |
| **D365 Conversation ID** and **Call Recording & Transcript** fields | Object Manager → Case → Fields & Relationships |
| **Case Highlights with Call Recording** compact layout | Object Manager → Case → Compact Layouts |
| **D365 Contact Center - Create Call from IVR case** flow (active) | Setup → Flows |
| **Contact Center Call Page** (the default page for call records) | Setup → Lightning App Builder |
| **Call Timeline** and **Call Recording Modal** components | Setup → Lightning Components |
| **Trusted URL** `https://*.dynamics.com` (frame-src) | Setup → Trusted URLs |
| **D365 Contact Center Settings** | Setup → Custom Settings |
| **D365 Contact Center Call Access** permission set | Setup → Permission Sets |

---

## Option B: Salesforce CLI

If you already use the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli):

```bash
# log in (use --instance-url https://test.salesforce.com for sandboxes)
sf org login web --alias myorg

# deploy from the repo root
sf project deploy start --metadata-dir salesforce/source --target-org myorg --wait 10
```

Then continue with steps 1.3–1.5 above.
