const PATH = /^\/data\/wow\/(?:playable-class\/index|pet\/index|(?:pet|media\/pet|item|creature)\/[1-9]\d{0,8})$/;
const LOCALES = new Set(['en_US','en_GB','pt_BR','es_MX','es_ES','fr_FR','de_DE','it_IT','ru_RU','ko_KR','zh_CN','zh_TW']);
function cleanData(value, token) {
  if (Array.isArray(value)) return value.map(item => cleanData(item, token));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['access_token','refresh_token','client_secret'].includes(key)).map(([key,item]) => [key, cleanData(item,token)]));
  if (typeof value === 'string') return value.replaceAll(token, '[redacted]');
  return value;
}
function createHandler({env = process.env, fetchImpl = global.fetch} = {}) {
  // A warm-instance token cache is an optimization only; cold instances authenticate normally.
  let token = null, expires = 0, pendingToken = null;
  async function accessToken() {
    if (token && Date.now() < expires) return token;
    if (!pendingToken) pendingToken = (async () => {
      const credentials = Buffer.from(`${env.BLIZZARD_CLIENT_ID}:${env.BLIZZARD_CLIENT_SECRET}`).toString('base64');
      const result = await fetchImpl('https://oauth.battle.net/token', {method: 'POST', headers: {Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded'}, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10000), redirect: 'error'});
      if (!result.ok) throw new Error('provider_authentication_failed');
      const body = await result.json();
      if (typeof body.access_token !== 'string' || !body.access_token) throw new Error('invalid_provider_token');
      token = body.access_token; expires = Date.now() + Math.max(0, Number(body.expires_in || 0) - 60) * 1000;
      return token;
    })().finally(() => {pendingToken = null;});
    return pendingToken;
  }
  return async (req, res) => {
    res.setHeader('Cache-Control','no-store');
    if (req.method !== 'GET') {res.setHeader('Allow','GET'); return res.status(405).json({error:'method_not_allowed'});}
    const {path, locale = 'en_US'} = req.query || {};
    if (typeof path !== 'string' || !PATH.test(path) || typeof locale !== 'string' || !LOCALES.has(locale)) return res.status(400).json({error:'invalid_resource'});
    if (!env.BLIZZARD_CLIENT_ID || !env.BLIZZARD_CLIENT_SECRET) return res.status(503).json({error:'blizzard_not_configured'});
    try {
      const bearer = await accessToken();
      const url = new URL(path,'https://us.api.blizzard.com');url.searchParams.set('namespace','static-us');url.searchParams.set('locale',locale);
      const result = await fetchImpl(url, {headers: {Authorization:`Bearer ${bearer}`,Accept:'application/json'}, signal:AbortSignal.timeout(15000),redirect:'error'});
      if (!result.ok) {if(result.status===401){token=null;expires=0;} return res.status(result.status===404 ? 404 : 502).json({error: result.status===404 ? 'resource_not_found' : 'blizzard_unavailable'});}
      const data = cleanData(await result.json(),bearer);
      res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(data);
    } catch {return res.status(502).json({error:'blizzard_unavailable'});}
  };
}
module.exports = {createHandler};
