# Contact screen pop for the Edge widget

When an agent accepts a call, the Edge widget raises a `screenPop.requested` event that carries the **Dynamics 365** customer (`entityType` = `contact` or `account`, and a Dynamics 365 GUID). Salesforce cannot open that GUID. This add-on finds the matching **Salesforce** Contact or Account and opens it.

**How it works**

1. The widget container asks the widget for the Dynamics 365 customer's phone numbers and email (query `retrieveRecord`, read-only, with the agent's own sign-in).
2. The Apex class `D365ScreenPopResolver` finds the Salesforce record: first by phone number (last 10 digits, mobile first), then by email, then by exact name (only if the name is unique).
3. The container opens that record with the normal navigation. If nothing matches, it does nothing (the call and Case are still created).

**Tested** on 2026-10-08 in a Developer Edition org with the widget signed in: a Dynamics 365 contact with phone `+1 512 757 6000` opened the Salesforce Contact with phone `(512) 757-6000`, even when the name sent by the widget did not match. The call event itself was simulated (we sent the same `screenPop.requested` message the widget sends); we did not place a live call.

## Install

1. Deploy the Apex classes in `classes/` (`D365ScreenPopResolver` and its test): `sf project deploy start --source-dir salesforce-edge/screen-pop/classes --target-org <alias>`. Users who run the widget need access to the class (Setup > Permission Sets or Profiles > Apex Class Access), and read access to Contact and Account.
2. Add the logic below to the widget container. **Which way depends on how you installed the widget:**
   - **You deployed the container from source** (as in our test org): add the import and replace `_handleScreenPop` with the code in `container-patch.js`, then redeploy the `d365EdgeContainer` component.
   - **You installed Microsoft's package:** you cannot edit the container. Use the package's host API instead (see Microsoft's INSTALL guide: Screen Pop Mode `publish`, and a small host component that subscribes to `screenPop.requested` and calls `D365ScreenPopResolver.resolve`). The Apex class is the same.

## Notes

- Phone matching uses Salesforce search, so the Salesforce phone field must contain the number (any format).
- A Dynamics 365 customer with no phone or email is matched by name only if exactly one Salesforce record has that name.
- To also create a Contact when nothing matches, extend the `null` branch in `container-patch.js`.
