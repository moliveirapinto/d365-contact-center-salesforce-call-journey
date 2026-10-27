# Dynamics 365 solution

| File | Use it for |
|---|---|
| **`D365ContactCenterSalesforceCallJourney_1_3_0_0.zip`** | **Installing.** Import it in make.powerapps.com → Solutions → Import. See [Step 2](../docs/2-install-dynamics365.md). Unmanaged solution. |
| `webresource-source/new_d365cc_evaluationpanefix.js` | Readable copy of the Conversation form fix: Evaluation Details pane + transcript in the Salesforce pop-up (same file that is inside the solution). |

**Upgrading from 1.0.0.0, 1.1.0.0 or 1.2.0.0?** Import the 1.3.0.0 zip over it. (1.1.1.0 retries the call update once after a minute, so a very short call is still completed. 1.2.0.0/1.3.0.0 also create a call record for **outbound** calls instead of dropping them — see below. 1.3.0.0 fixes outbound calls so they're never silently merged into the wrong branch of the flow.) The form library and handler from Step 2.3 stay the same, so there's nothing else to change.

## Outbound calls (1.2.0.0+)

Inbound calls always had a Case created by the IVR before the call ends, so the sync flow could just update that record. Outbound calls (an agent dialing out) have no Case, so previously the flow found nothing to update and silently dropped them.

The call-ended sync flow now checks **`msdyn_isoutbound`** right after reading the conversation, and branches:

- **Inbound** (unchanged): update the existing Salesforce call record created from the Case, same as before.
- **Outbound**: resolve a phone number for the customer — preferring the Dataverse Contact D365 itself already matched the caller to (`msdyn_customer`, via its own Mobile Phone matching), falling back to the dialed number (`msdyn_channelconnectionid`) — then:
  1. Normalize that number to its last 10 digits.
  2. Look up a Salesforce **Contact** whose `Phone` or `MobilePhone` ends with those same 10 digits.
  3. Check whether a `Contact_Center_Call__c` already exists for this conversation (`Conversation_Id__c`). If one does, update it; otherwise create a new one with `Direction__c = Outbound`, `Caller_Phone__c`/`Called_Number__c` = the resolved number, and `Contact__c` = the matched Contact (left blank if no Contact matches).

**Why 1.3.0.0 replaced the first (1.2.0.0) approach:** 1.2.0.0 tried to detect "no existing record" by waiting for the original update-only PATCH to fail, then branching. In testing, Salesforce's PATCH-to-external-ID endpoint silently upserts (creates) a record even with `updateOnly=true`, so that failure never happened and the outbound branch never ran — outbound calls got a bare record with no `Direction__c`/`Contact__c`/phone fields. 1.3.0.0 branches on `msdyn_isoutbound` immediately instead of waiting for a failure, and explicitly queries for an existing record before deciding to update vs. create.

This is a best-effort phone match, so it works best when Contact phone numbers are stored in a consistent format (e.g. E.164, `+1##########`). It does not require any Dataverse↔Salesforce contact sync — though if your environment already has Dataverse↔Salesforce contact sync and D365's own call matching enabled, outbound calls will usually resolve a phone number even when the dialed number alone isn't recorded on the conversation.

Import-tested in a Dynamics 365 Contact Center environment, including a live outbound test call end-to-end (dialer → Salesforce Contact_Center_Call__c with Direction__c = Outbound and Contact__c populated).
