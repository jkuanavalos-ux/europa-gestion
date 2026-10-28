import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import {validateExtras} from './_validar.js';
const hash=s=>createHash('sha256').update(s).digest();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const reply=(code,message)=>res.status(code).json({error:message});
 const {SUPABASE_URL:rawUrl,SUPABASE_SECRET_KEY:rawKey,EUROPA_ACCESS_TOKEN:token,EUROPA_PRIVATE:priv}=process.env;
 // Se limpian espacios, saltos de línea y barras sobrantes que quedan al copiar y pegar en Vercel.
 const url=(rawUrl||'').trim().replace(/\/+$/,'').replace(/\/(rest|storage)\/v1$/,'');
 const key=(rawKey||'').trim();
 // Acceso abierto: cualquiera con el link de Vercel puede leer y editar.
 // Para volver a exigir una clave: EUROPA_PRIVATE=true y EUROPA_ACCESS_TOKEN (32+ caracteres) en Vercel.
 const requireToken=priv==='true';
 if(!url||!key)return reply(503,'Falta configurar Supabase en Vercel (SUPABASE_URL y SUPABASE_SECRET_KEY).');
 if(requireToken){
  if(!token||token.length<32)return reply(503,'Falta EUROPA_ACCESS_TOKEN (32 caracteres o más) en Vercel.');
  const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!timingSafeEqual(hash(supplied),hash(token)))return reply(401,'Abrí el enlace privado compartido con la banda.');
 }
 const headers={apikey:key,'Content-Type':'application/json'};
 if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
 const remote=async(path,opts={})=>{const r=await fetch(url+path,{...opts,headers:{...headers,...opts.headers}});if(!r.ok){let m='';try{const j=JSON.parse(await r.text());m=j.message||j.msg||j.error||''}catch{}throw Object.assign(Error('Supabase'),{status:r.status,detail:String(m).slice(0,140)})}return r};
 try{
  if(req.method==='GET'){
   if(req.query.photo){const name=String(req.query.photo);if(!/^[a-f0-9-]+\.jpg$/.test(name))return reply(400,'Foto inválida');const r=await remote('/storage/v1/object/europa-photos/'+name);res.setHeader('Content-Type','image/jpeg');return res.status(200).send(Buffer.from(await r.arrayBuffer()))}
   const rows=await (await remote('/rest/v1/europa_state?id=eq.1&select=revision,data')).json();if(!rows[0])return reply(503,'Ejecutá setup.sql en Supabase.');return res.status(200).json(rows[0]);
  }
  if(req.method!=='PUT'){res.setHeader('Allow','GET, PUT');return reply(405,'Método no permitido')}
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!Number.isSafeInteger(body?.revision)||body.revision<0||!body.data)return reply(400,'Datos inválidos');
  const data=body.data;
  for(const name of ['repertoires','songs','events','movements','members','goals','equipment'])if(!Array.isArray(data[name]))return reply(400,'Datos incompletos');
  const invalid=validateExtras(data);if(invalid)return reply(400,invalid);
  if(Buffer.byteLength(JSON.stringify(data))>3500000)return reply(413,'Demasiados datos en un envío. Guardá menos fotos a la vez.');
  for(const item of [...data.events,...data.equipment])if(item.photo){
   if(item.photo.startsWith('data:image/jpeg;base64,')){
    const bytes=Buffer.from(item.photo.split(',')[1],'base64');if(bytes.length>1000000)return reply(400,'Foto demasiado grande');
    const name=randomUUID()+'.jpg';await remote('/storage/v1/object/europa-photos/'+name,{method:'POST',headers:{'Content-Type':'image/jpeg'},body:bytes});item.photo='photo:'+name;
   }else if(!/^photo:[a-f0-9-]+\.jpg$/.test(item.photo))return reply(400,'Formato de foto inválido');
  }
  const rows=await (await remote(`/rest/v1/europa_state?id=eq.1&revision=eq.${body.revision}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data,revision:body.revision+1,updated_at:new Date().toISOString()})})).json();
  if(!rows.length)return reply(409,'Otra persona guardó cambios. Cerrá este formulario y recargá la página antes de volver a editar.');
  return res.status(200).json({data:rows[0].data,revision:rows[0].revision});
 }catch(e){
  console.error('Supabase',e.status,e.detail,e.cause?.code||e.message);
  const why=e.status?`HTTP ${e.status}${e.detail?`: ${e.detail}`:''}`:String(e.cause?.code||e.message||'sin conexión').slice(0,60);
  return reply(502,`No se pudo guardar o leer en Supabase (${why}). Verificá la conexión y la configuración; tus cambios no se confirmaron.`)
 }
}
