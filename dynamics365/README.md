# Dynamics 365 solution

| File | Use it for |
|---|---|
| **`D365ContactCenterSalesforceCallJourney_1_2_0_0.zip`** | **Installing.** Import it in make.powerapps.com → Solutions → Import. See [Step 2](../docs/2-install-dynamics365.md). Unmanaged solution. |
| `webresource-source/new_d365cc_evaluationpanefix.js` | Readable copy of the Conversation form fix: Evaluation Details pane + transcript in the Salesforce pop-up (same file that is inside the solution). |

**Upgrading from 1.0.0.0 or 1.1.0.0?** Import the 1.2.0.0 zip over it. (1.1.1.0 retries the call update once after a minute, so a very short call is still completed. 1.2.0.0 also creates a call record for **outbound** calls instead of dropping them — see below.) The form library and handler from Step 2.3 stay the same, so there's nothing else to change.

## Outbound calls (1.2.0.0+)

Inbound calls always had a Case created by the IVR before the call ends, so the sync flow could just update that record. Outbound calls (an agent dialing out) have no Case, so previously the flow found nothing to update and silently dropped them.

As of 1.2.0.0, when the call-ended sync flow can't find an existing Salesforce call record for a conversation, it checks **`msdyn_isoutbound`**. If the conversation was outbound, it:

1. Takes the dialed number (`msdyn_channelconnectionid`) and strips it down to its last 10 digits.
2. Looks up a Salesforce **Contact** whose `Phone` or `MobilePhone` ends with those same 10 digits.
3. Creates a new `Contact_Center_Call__c` with `Direction__c = Outbound`, `Caller_Phone__c`/`Called_Number__c` = the dialed number, and `Contact__c` = the matched Contact (left blank if no Contact matches).

This is a best-effort phone match, so it works best when Contact phone numbers are stored in a consistent format (e.g. E.164, `+1##########`). It does not require any Dataverse↔Salesforce contact sync.

Import-tested in a Dynamics 365 Contact Center environment.
