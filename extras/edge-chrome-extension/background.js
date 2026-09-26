// Stale OpenIdConnect.nonce.* cookies pile up on .crm.dynamics.com with every sign-in popup
// and eventually cause "HTTP 400 - Request Too Long" in the D365 widget. A nonce is only
// needed for the few seconds a sign-in takes, so anything older than NONCE_TTL_MS is removed.
const NONCE_PREFIX = 'OpenIdConnect.nonce.';
const NONCE_TTL_MS = 5 * 60 * 1000;
const DOMAIN_RE = /(^|\.)crm\d*\.dynamics\.com$/i;

const cookieUrl = (c) => `https://${c.domain.replace(/^\./, '')}${c.path}`;
const keyOf = (c) => `${c.domain}|${c.path}|${c.name}`;

async function sweep(removeAll = false) {
  const { firstSeen = {} } = await chrome.storage.local.get('firstSeen');
  const now = Date.now();
  const cookies = (await chrome.cookies.getAll({})).filter(c => DOMAIN_RE.test(c.domain) && c.name.startsWith(NONCE_PREFIX));
  const live = {};
  let removed = 0;
  for (const c of cookies) {
    const k = keyOf(c);
    const seen = firstSeen[k] ?? now;
    if (removeAll || now - seen > NONCE_TTL_MS) {
      await chrome.cookies.remove({ url: cookieUrl(c), name: c.name, storeId: c.storeId });
      removed++;
    } else {
      live[k] = seen;
    }
  }
  await chrome.storage.local.set({ firstSeen: live, lastSweep: now, lastRemoved: removed });
}

chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
  if (removed || !DOMAIN_RE.test(cookie.domain) || !cookie.name.startsWith(NONCE_PREFIX)) return;
  const { firstSeen = {} } = await chrome.storage.local.get('firstSeen');
  firstSeen[keyOf(cookie)] ??= Date.now();
  await chrome.storage.local.set({ firstSeen });
});

// Alarms are not guaranteed to survive a browser restart, so recreate them on both events.
const init = () => { chrome.alarms.create('nonce-sweep', { periodInMinutes: 5 }); sweep(true); };

// D365's local app cache (IndexedDB) can grow to hundreds of MB and stop responding, which makes
// every D365 page wait ~2 minutes ("LocalDataSource initialize timeout"). It is only a cache, so
// clearing it at browser start (before any D365 page is open) is safe; sign-in cookies are kept.
// Your Dynamics 365 org(s) are detected from the sign-in cookies, so nothing needs to be configured.
async function d365Origins() {
  const hosts = new Set((await chrome.cookies.getAll({})).map(c => c.domain.replace(/^\./, '')).filter(h => DOMAIN_RE.test(h) && h.split('.').length > 3));
  return [...hosts].map(h => `https://${h}`);
}
async function clearD365AppCache() {
  const origins = await d365Origins();
  if (!origins.length) return;
  await chrome.browsingData.remove({ origins }, { indexedDB: true, cacheStorage: true, serviceWorkers: true, localStorage: true });
  await chrome.storage.local.set({ lastD365CacheClear: Date.now() });
}

chrome.runtime.onStartup.addListener(() => { init(); clearD365AppCache(); });
chrome.runtime.onInstalled.addListener(init);
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'nonce-sweep') sweep(false); });
