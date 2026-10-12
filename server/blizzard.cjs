const PATH = /^\/data\/wow\/(?:playable-class\/(?:index|[1-9]\d{0,8})|playable-specialization\/[1-9]\d{0,8}|playable-race\/[1-9]\d{0,8}|creature-family\/(?:index|[1-9]\d{0,8})|mount\/(?:index|[1-9]\d{0,8})|pet\/index|spell\/[1-9]\d{0,8}|realm\/[a-z0-9]+(?:-[a-z0-9]+)*|(?:region|connected-realm)\/(?:index|[1-9]\d{0,8})|achievement(?:-category)?\/(?:index|[1-9]\d{0,8})|(?:decor|fixture|fixture-hook|room)\/(?:index|[1-9]\d{0,8})|item-appearance\/(?:[1-9]\d{0,8}|set\/(?:index|[1-9]\d{0,8})|slot\/index)|profession\/(?:index|[1-9]\d{0,8}(?:\/skill-tier\/[1-9]\d{0,8})?)|recipe\/[1-9]\d{0,8}|journal-(?:expansion|instance)\/(?:index|[1-9]\d{0,8})|journal-encounter\/[1-9]\d{0,8}|talent-tree\/[1-9]\d{0,8}\/playable-specialization\/[1-9]\d{0,8}|media\/(?:playable-class|playable-specialization|creature-family|creature-display|journal-instance|item|profession|recipe|achievement|spell)\/[1-9]\d{0,8}|search\/creature|(?:pet|media\/pet|item|creature)\/[1-9]\d{0,8})$/;
const EXTRA_PATH = /^\/data\/wow\/(?:toy\/(?:index|[1-9]\d{0,8})|quest\/(?:index|[1-9]\d{0,8}|(?:category|area|type)\/(?:index|[1-9]\d{0,8}))|(?:reputation-faction\/(?:index|[1-9]\d{0,8})|reputation-tiers\/(?:index|\d{1,9}))|pvp-season\/(?:index|[1-9]\d{0,8}(?:\/pvp-leaderboard\/(?:index|2v2|3v3|rbg|(?:shuffle|blitz)-(?:overall|[a-z]+(?:-[a-z]+){1,5})))?)|mythic-keystone\/(?:index|(?:season|period|dungeon)\/(?:index|[1-9]\d{0,8}))|connected-realm\/[1-9]\d{0,8}\/(?:auctions|mythic-leaderboard\/(?:index|[1-9]\d{0,8}\/period\/[1-9]\d{0,8}))|auctions\/commodities|leaderboard\/hall-of-fame\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:alliance|horde))$/;
const PROFILE_PATH = /^\/profile\/wow\/character\/[a-z0-9]+(?:-[a-z0-9]+)*\/[\p{L}]{2,12}(?:\/(?:status|equipment|specializations|character-media|reputations|quests\/completed|collections\/(?:mounts|pets)))?$/u;
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
  const auctionCache=new Map();
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
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('X-Content-Type-Options','nosniff');
    if (req.method !== 'GET') {res.setHeader('Allow','GET'); return res.status(405).json({error:'method_not_allowed'});}
    const {path, locale = 'en_US', region = 'us'} = req.query || {};
    if (typeof path !== 'string' || (!PATH.test(path)&&!EXTRA_PATH.test(path)&&!PROFILE_PATH.test(path)&&path!=='/data/wow/search/item') || typeof locale !== 'string' || !LOCALES.has(locale)) return res.status(400).json({error:'invalid_resource'});
    if (typeof region !== 'string' || !['us','eu','kr','tw'].includes(region)) return res.status(400).json({error:'invalid_resource'});
    if(path==='/data/wow/search/item'){
      const {q,page='1'}=req.query;
      if(typeof q!=='string'||q.trim().length<2||q.length>80||! /^[\p{L}\p{N}\p{M} '\u2019.,:()\-]+$/u.test(q)||typeof page!=='string'||! /^[1-9]\d{0,4}$/.test(page))return res.status(400).json({error:'invalid_resource'});
    }
    if (path === '/data/wow/search/creature') {
      const {family, page = '1'} = req.query;
      if (typeof family !== 'string' || !/^[1-9]\d{0,8}$/.test(family) || typeof page !== 'string' || !/^[1-9]\d{0,4}$/.test(page)) return res.status(400).json({error:'invalid_resource'});
    }
    const auctions=/^\/data\/wow\/(?:auctions\/commodities|connected-realm\/[1-9]\d{0,8}\/auctions)$/.test(path);
    const ranking=typeof path==='string'&&(/\/pvp-leaderboard\/(?!index$)/.test(path)||/\/mythic-leaderboard\/\d+\/period\/\d+$/.test(path));
    if(ranking&&req.query.page!==undefined&&(typeof req.query.page!=='string'||!/^[1-9]\d{0,4}$/.test(req.query.page)))return res.status(400).json({error:'invalid_resource'});
    if(auctions&&(typeof req.query.item!=='string'||!/^[1-9]\d{0,8}$/.test(req.query.item)||req.query.page!==undefined&&(typeof req.query.page!=='string'||!/^[1-9]\d{0,4}$/.test(req.query.page))))return res.status(400).json({error:'invalid_resource'});
    if (!env.BLIZZARD_CLIENT_ID || !env.BLIZZARD_CLIENT_SECRET) return res.status(503).json({error:'blizzard_not_configured'});
    try {
      const bearer = await accessToken();
      const auctionKey=region+':'+path+':'+req.query.item;
      const cached=auctions?auctionCache.get(auctionKey):null;
      if(cached&&Date.now()-cached.fetched<60000){res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=120');return res.status(200).json(cleanData(require('./auctions.cjs').pageSnapshot(cached.snapshot,Number(req.query.page||1)),bearer));}
      const dynamic = /^\/data\/wow\/(?:realm|region|connected-realm|auctions|mythic-keystone|pvp-season|leaderboard)\//.test(path);
      const profile=PROFILE_PATH.test(path);
      const url = new URL(path,'https://'+region+'.api.blizzard.com');url.searchParams.set('namespace',(profile?'profile-':dynamic?'dynamic-':'static-')+region);url.searchParams.set('locale',locale);
        if(path==='/data/wow/search/item'){
        const stopWords=new Set(['de','da','do','das','dos','e','o','a','os','as','of','the','and','an']);
        const words=req.query.q.trim().split(/\s+/).filter(word=>!stopWords.has(word.toLowerCase()));
        for(const word of new Set(words.length?words:[req.query.q.trim()]))url.searchParams.append('name.'+locale,word);
        url.searchParams.set('_page',req.query.page||'1');
        url.searchParams.set('_pageSize','12');
        url.searchParams.set('orderby','id');
      }
    if (path === '/data/wow/search/creature') {
        url.searchParams.set('is_tameable','true');
        url.searchParams.set('family.id',req.query.family);
        url.searchParams.set('_page',req.query.page || '1');
        url.searchParams.set('_pageSize','24');
        url.searchParams.set('orderby','id');
      }
      const result = await fetchImpl(url, {headers: {Authorization:`Bearer ${bearer}`,Accept:'application/json'}, signal:AbortSignal.timeout(auctions?45000:15000),redirect:'error'});
      if (!result.ok) {if(result.status===401){token=null;expires=0;} return res.status(result.status===404 ? 404 : 502).json({error: result.status===404 ? 'resource_not_found' : 'blizzard_unavailable'});}
      let payload;
      if(auctions){
        const {readSnapshot,pageSnapshot}=require('./auctions.cjs');
        const snapshot=await readSnapshot(result,Number(req.query.item));
        if(auctionCache.size>=8)auctionCache.delete(auctionCache.keys().next().value);
        auctionCache.set(auctionKey,{snapshot,fetched:Date.now()});payload=pageSnapshot(snapshot,Number(req.query.page||1));
      }else payload=await result.json();
      if(ranking){const key=Array.isArray(payload.entries)?'entries':'leading_groups';const rows=payload[key]||[];const page=Math.min(Number(req.query.page||1),Math.max(1,Math.ceil(rows.length/50)));payload={...payload,[key]:rows.slice((page-1)*50,page*50),page,pages:Math.max(1,Math.ceil(rows.length/50)),total:rows.length};}
      const data=cleanData(payload,bearer);
      res.setHeader('Cache-Control',(dynamic||profile)?'public, s-maxage=60, stale-while-revalidate=120':'public, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(data);
    } catch {return res.status(502).json({error:'blizzard_unavailable'});}
  };
}
module.exports = {createHandler};
