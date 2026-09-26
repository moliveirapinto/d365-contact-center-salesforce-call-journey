# Mapping the D365 Conversation ID into your "Create Case" action

Your IVR agent creates the Salesforce Case with the **Salesforce** connector → **Create record** (`PostItem_V2`).
Add **one** field to it:

| Salesforce field | Value (Power Fx formula) |
|---|---|
| **D365 Conversation ID** (`D365_Conversation_Id__c`) | `If(IsBlank(Global.msdyn_ConversationId), "", Text(Global.msdyn_ConversationId))` |

The `If(IsBlank(...))` guard means test calls from the Copilot Studio test pane (which have no Dynamics 365 conversation) still create the Case normally.

## YAML example

If you prefer the code editor, this is what the action looks like. **Keep your own** `connectionReference`, `Subject`, `Description`, etc. Only the `D365_Conversation_Id__c` part is new:

```yaml
- kind: InvokeConnectorAction
  id: invokeConnectorAction_createEscalationCase
  input:
    binding:
      table: Case
      item: '={Subject: Left(Topic.CaseSubject, 255), Description: Topic.CaseSummary, SuppliedPhone: Text(System.Activity.From.Name), Origin: "Phone", Status: "New", Priority: "Medium", D365_Conversation_Id__c: If(IsBlank(Global.msdyn_ConversationId), "", Text(Global.msdyn_ConversationId))}'

  output:
    kind: SingleVariableOutputBinding
    variable: Topic.EscalationCase

  connectionReference: <your agent's Salesforce connection reference>
  connectionProperties:
    mode: Maker

  dynamicInputSchema:
    properties:
      item:
        # ...your existing Case fields...
        properties:
          D365_Conversation_Id__c:
            displayName: D365 Conversation ID
            order: 40
            type: String

  operationId: PostItem_V2
```

> The easiest way to get the `dynamicInputSchema` right is to **refresh the action in the designer** after installing the Salesforce package. Copilot Studio then reads the new field from Salesforce for you. The YAML above is for reference.
