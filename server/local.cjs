const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {createHandler} = require('./blizzard.cjs');
function createLocalServer({env=process.env}={}) {
  const proxy=createHandler({env});
  return http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/blizzard') {
      req.query=Object.fromEntries(url.searchParams);
      res.status=code=>{res.statusCode=code;return res;};
      res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res;};
      return proxy(req,res);
    }
    if(req.method!=='GET'){res.writeHead(405);return res.end();}
    const file={'/':'index.html','/index.html':'index.html','/pets.html':'pets.html'}[url.pathname];
    if(!file){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(__dirname,'..',file)));
  });
}
if(require.main===module){
  try {process.loadEnvFile(path.join(__dirname,'../.env'));}
  catch(error){if(error.code!=='ENOENT')throw Error('Local environment file could not be loaded');}
  createLocalServer().listen(8788,'127.0.0.1',()=>console.log('WoW local server: http://127.0.0.1:8788'));
}
module.exports={createLocalServer};
