// Consulta liviana a Supabase. Vercel la ejecuta una vez por día (ver vercel.json) para que el
// proyecto gratis no se pause por inactividad. También sirve para diagnosticar: abrí /api/keepalive.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const {SUPABASE_URL:rawUrl,SUPABASE_SECRET_KEY:rawKey}=process.env;
 const url=(rawUrl||'').trim().replace(/\/+$/,'').replace(/\/(rest|storage)\/v1$/,'');
 const key=(rawKey||'').trim();
 if(!url||!key)return res.status(503).json({ok:false,detail:'Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en Vercel.'});
 const headers={apikey:key};
 if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
 try{
  const r=await fetch(url+'/rest/v1/europa_state?id=eq.1&select=revision',{headers});
  if(!r.ok){let m='';try{const j=JSON.parse(await r.text());m=j.message||j.hint||j.msg||''}catch{}return res.status(502).json({ok:false,detail:`HTTP ${r.status}${m?`: ${String(m).slice(0,140)}`:''}`})}
  const rows=await r.json();
  return res.status(200).json({ok:true,tabla:rows.length?'ok':'vacía: ejecutá supabase/setup.sql'})
 }catch(e){return res.status(502).json({ok:false,detail:String(e.cause?.code||e.message||'sin conexión').slice(0,60)})}
}
