// 1) Add at the top of d365EdgeContainer.js:
// import resolveScreenPop from '@salesforce/apex/D365ScreenPopResolver.resolve';
// 2) Replace the existing _handleScreenPop(payload) method with the code below.
// The rest of the original method (the screenPopMode checks and the adapter call) stays unchanged after it.

  /**
   * Edge sends the Dynamics 365 customer (a GUID), not a Salesforce Id. Look the customer up in
   * Dynamics 365, find the matching Salesforce Contact/Account by phone, email or name, and pop that.
   * @returns {Promise<{entityType: string, entityId: string}|null>}
   */
  async _resolveSalesforceRecord(entityType, entityId, entityName) {
    const type = String(entityType || '').toLowerCase();
    const entitySet = type === 'account' ? 'accounts' : 'contacts';
    const select =
      type === 'account'
        ? '?$select=name,telephone1,emailaddress1'
        : '?$select=fullname,mobilephone,telephone1,emailaddress1';
    let record = {};
    try {
      record = (await this._bridge.sendQuery('retrieveRecord', { entitySet, id: entityId, options: select })) || {};
    } catch (err) {
      console.warn('[D365EdgeContainer] Could not read the Dynamics 365 customer:', err);
    }
    const match = await resolveScreenPop({
      phone: record.telephone1 || null,
      mobile: record.mobilephone || null,
      email: record.emailaddress1 || null,
      name: record.fullname || record.name || entityName || null,
      d365Type: type,
    });
    return match ? { entityType: match.objectApiName, entityId: match.recordId } : null;
  }

  async _handleScreenPop(payload) {
    let { entityType, entityId } = payload || {};
    const { entityName } = payload || {};

    if (!entityType || !entityId) {
      console.warn('[D365EdgeContainer] screenPop.requested missing entityType or entityId');
      return;
    }

    if (!/^[a-zA-Z0-9]{15,18}$/.test(entityId)) {
      try {
        const match = await this._resolveSalesforceRecord(entityType, entityId, entityName);
        if (!match) {
          console.warn('[D365EdgeContainer] No Salesforce record matches the Dynamics 365 customer', entityName);
          return;
        }
        ({ entityType, entityId } = match);
      } catch (err) {
        console.error('[D365EdgeContainer] Screen pop lookup failed:', err);
        return;
      }
    }


