# Step 3 — Send the conversation ID from Copilot Studio to Salesforce

⏱ ~10 minutes · 👤 Maker/admin of your Copilot Studio IVR agent

Your IVR agent already knows the **Dynamics 365 conversation ID** of every call: Dynamics 365 Contact Center hands it over when the call starts. You just need to **(A)** make it available as a variable and **(B)** write it into the Salesforce Case your agent creates.

> **Why is this needed?** The Case is created by the IVR *during* the call, in Salesforce. The recording, transcript and quality evaluation live in Dynamics 365. The conversation ID is the only value both sides know, so writing it on the Case is what lets everything connect automatically.

---

## A. Make the conversation ID available (`Global.msdyn_ConversationId`)

Dynamics 365 Contact Center passes context variables into Copilot Studio agents, including **`msdyn_ConversationId`**. To use it, the agent needs a **global variable with that exact name** that is allowed to receive values from outside.

1. Open your agent in **https://copilotstudio.microsoft.com** → **Topics** → **+ Add a topic** → **From blank**.
2. Name it **`D365 Context Variables`**.
3. Top-right **⋯** → **Open code editor**. Replace everything with the content of [`copilot-studio/d365-context-variables-topic.yaml`](../copilot-studio/d365-context-variables-topic.yaml):

   ```yaml
   kind: AdaptiveDialog
   beginDialog:
     kind: OnRedirect
     id: main
     actions:
       - kind: SetVariable
         id: setVariable_d365ConversationIdType
         variable: Global.msdyn_ConversationId
         value: =""

   inputType: {}
   outputType: {}
   ```

4. **Save**.
5. Open the **Variables** pane (top toolbar) → **Global** → click **`msdyn_ConversationId`** → in *Variable properties* tick **"External sources can set values"** (*Receive values from other topics / external sources*).
6. **Save**.

> ℹ️ **Why a topic that never runs?** Copilot Studio only creates a global variable (and knows its type) once some topic assigns it. The topic is *redirect-only* (it has no trigger phrases), so it never runs during calls. It exists only so the variable is defined. The real value arrives from Dynamics 365 when the call starts.

## B. Write it into the Case

Find the step in your agent that creates the Salesforce Case. It's usually in the **Escalate** topic, before *Transfer conversation*, and uses the **Salesforce** connector's **Create record** action (operation `PostItem_V2`) with *Salesforce Object Type* = **Case**.

1. Open that action.
2. **Refresh the connector's field list** so it sees the new Salesforce field: open the action's **⋯** → **Refresh** (or re-select *Salesforce Object Type* = *Case*).
3. Click **+ Add input** (or *Advanced inputs*) → choose **D365 Conversation ID**.
4. Set its value to this **formula** (switch the input to *Formula* / *fx*):

   ```powerfx
   If(IsBlank(Global.msdyn_ConversationId), "", Text(Global.msdyn_ConversationId))
   ```

5. If your topic has a **retry** Create record action, do the same there.
6. **Save** → **Publish** the agent.

More details and a YAML example: [`copilot-studio/create-case-field-mapping.md`](../copilot-studio/create-case-field-mapping.md).

### My agent doesn't create a Salesforce Case yet

Add one before the transfer:

1. In your **Escalate** topic, before **Transfer conversation**, click **+** → **Add an action** → **Connector** → search **Salesforce** → **Create record**.
2. Sign in with a Salesforce user that has the **D365 Contact Center Call Access** permission set.
3. **Salesforce Object Type:** `Case`. Map at least *Subject*, *Origin* = `Phone`, *Supplied Phone* = `System.Activity.From.Name` (the caller's number), and **D365 Conversation ID** as above.

### Optional: link the caller to a Contact

The Salesforce call record copies the **Contact** from the Case, which fills the *Customer* field and puts the call on the Contact's page. If your agent already knows who is calling (for example, it looked the caller up by phone number with the Salesforce connector's **Get records** action on *Contact*), also map **Contact ID** in the Create record action. If it doesn't, the call record is still created; it just has no Customer.

✅ **Copilot Studio is done.** Continue with [Step 4 — Test](4-test-and-troubleshoot.md).
