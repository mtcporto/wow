const {Readable}=require('node:stream');
const LIMIT=20000;
const FAST_LIMIT=32*1024*1024;
const unitPrice=auction=>Number.isFinite(auction.unit_price)?auction.unit_price:Number.isFinite(auction.buyout)&&auction.buyout>0?auction.buyout/Math.max(1,auction.quantity||1):null;
const compare=(a,b)=>(unitPrice(a)??Infinity)-(unitPrice(b)??Infinity)||a.id-b.id;
async function readSnapshot(response,itemId,{fastLimit=FAST_LIMIT}={}){
 let total=0,quantity=0;const entries=[];
 function add(value){
  if(value.item?.id!==itemId)return;
  total++;quantity+=value.quantity||1;entries.push(value);
  if(entries.length>=LIMIT*2){entries.sort(compare);entries.length=LIMIT;}
 }
 // Native parsing is much faster for bounded snapshots. Larger markets keep streaming.
 const reader=response.body.getReader(),chunks=[];let bytes=0,complete=false;
 try{
  while(bytes<=fastLimit){const chunk=await reader.read();if(chunk.done){complete=true;break;}chunks.push(Buffer.from(chunk.value));bytes+=chunk.value.byteLength;}
  if(complete){
   const payload=JSON.parse(Buffer.concat(chunks,bytes).toString('utf8'));
   for(const value of payload.auctions||[])add(value);
  }else{
   const [{parser},{pick},{streamArray},{default:chain}]=await Promise.all([import('stream-json'),import('stream-json/filters/pick.js'),import('stream-json/streamers/stream-array.js'),import('stream-chain')]);
   async function* remaining(){for(const chunk of chunks)yield chunk;for(;;){const chunk=await reader.read();if(chunk.done)break;yield Buffer.from(chunk.value);}}
   const pipeline=chain([Readable.from(remaining()),parser(),pick({filter:'auctions'}),streamArray()]);
   for await(const {value} of pipeline)add(value);
  }
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 entries.sort(compare);if(entries.length>LIMIT)entries.length=LIMIT;
 return {entries,total,quantity,lowestUnitPrice:entries.length?unitPrice(entries[0]):null,fetchedAt:new Date().toISOString(),snapshotAt:response.headers.get('last-modified'),itemId};
}
function pageSnapshot(snapshot,page=1){
 const pages=Math.max(1,Math.ceil(snapshot.entries.length/50)),current=Math.min(page,pages);
 return {itemId:snapshot.itemId,auctions:snapshot.entries.slice((current-1)*50,current*50),total:snapshot.total,retained:snapshot.entries.length,quantity:snapshot.quantity,lowestUnitPrice:snapshot.lowestUnitPrice,page:current,pages,fetchedAt:snapshot.fetchedAt,snapshotAt:snapshot.snapshotAt,truncated:snapshot.total>snapshot.entries.length};
}
module.exports={readSnapshot,pageSnapshot,unitPrice};
