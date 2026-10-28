import {readPhoto} from './photos.js';
import {load,save,uid,money,safeLink,shared,resolvePhoto} from './store.js';
import {KINDS,ICONS,DEFAULT_RESOURCES,webLink,normalizeUrl,shortUrl} from './recursos.js';
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Los recursos por defecto se muestran hasta que alguien guarde la lista (desde ahí viven en la base de datos).
const prepare=d=>{d.resources??=structuredClone(DEFAULT_RESOURCES);return d};
let data;try{data=prepare(await load())}catch(error){document.body.innerHTML='<main><h1>Europa</h1><p id=accessError></p><button onclick=location.reload()>Reintentar</button></main>';document.querySelector('#accessError').textContent=error.message;throw error}
$('.local').textContent=shared?'● Espacio compartido':'● Demo local';
$('footer small').textContent=shared?'Datos compartidos de Europa.':'Los datos se guardan en este navegador.';
const tabs={repertorios:'Repertorios',fechas:'Próximas Fechas',canciones:'Canciones',ahorros:'Ahorros',recursos:'Recursos',equipamientos:'Equipamientos'};let active='repertorios',detail=null;
async function commit(fn){const next=structuredClone(data);fn(next);toast('Guardando…');data=prepare(await save(next));render();toast('Cambios guardados')}
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2800)}
const empty=t=>`<div class="empty">${t}</div>`;
const field=(label,name,value='',type='text',extra='')=>`<label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}>`;
const date=d=>d?new Date(d+'T12:00:00').toLocaleDateString('es-PY',{day:'numeric',month:'long',year:'numeric'}):'';
function modal(title,html,onSave){$('#modalTitle').textContent=title;$('#fields').innerHTML=html;$('#error').textContent='';$('#form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('.actions .primary');button.disabled=true;try{await onSave(new FormData(e.target));$('#modal').close()}catch(err){$('#error').textContent=err.message}finally{button.disabled=false}};$('#modal').showModal()}
$('#close').onclick=$('#cancel').onclick=()=>$('#modal').close();
function head(title,sub,button){return `<div class="sectionhead"><div><h2>${title}</h2><p>${sub}</p></div>${button||''}</div>`}
function render(){active=location.hash.slice(1) in tabs?location.hash.slice(1):'repertorios';$('#nav').innerHTML=Object.entries(tabs).map(([k,v])=>`<button data-tab="${k}" class="${k===active?'active':''}">${v}</button>`).join('');$('#nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{detail=null;location.hash=b.dataset.tab;render()});const c=$('#content');
if(active==='repertorios'){const r=data.repertoires.find(x=>x.id===detail);if(r){c.innerHTML=`<button class="back" id="back">← Repertorios</button>${head(esc(r.title),'El orden de las canciones es el orden del show.','<button class="primary" id="edit">Editar repertorio</button>')}<div class="detail">${r.songIds.map((id,i)=>{const s=data.songs.find(x=>x.id===id);return `<div class="row"><span class="muted">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s?.title)}</h3><small>${esc(s?.artist)}</small></div></div>`}).join('')||empty('Todavía no agregaste canciones.')}${r.playlist?`<a class="playlist" href="${esc(safeLink(r.playlist))}" target="_blank" rel="noopener noreferrer">Escuchar playlist ↗</a>`:''}</div>`;$('#back').onclick=()=>{detail=null;render()};$('#edit').onclick=()=>editRep(r)}else{c.innerHTML=head('Repertorios','Cada show empieza con una buena selección.','<button class="primary" id="add">+ Crear repertorio</button>')+`<div class="grid">${data.repertoires.map(r=>`<button class="card repcard" data-id="${r.id}"><span>${esc(r.title)}</span><span>↗</span></button>`).join('')||empty('Creá el primer repertorio de Europa.')}</div>`;$('#add').onclick=()=>editRep();c.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{detail=b.dataset.id;render()})}}
if(active==='canciones'){c.innerHTML=head('Canciones',`${data.songs.length} canciones en la biblioteca de Europa.`)+ '<input class="search" id="search" placeholder="Buscar canción o artista" aria-label="Buscar canciones"><div id="songs"></div>';const list=()=>{const q=$('#search').value.toLowerCase();const groups={};data.songs.filter(s=>(s.title+' '+s.artist).toLowerCase().includes(q)).forEach(s=>(groups[s.artist]??=[]).push(s));$('#songs').innerHTML=Object.keys(groups).sort((a,b)=>a.localeCompare(b)).map(a=>`<article class="detail" style="margin-bottom:16px"><h3>${esc(a)}</h3>${groups[a].sort((a,b)=>a.title.localeCompare(b.title)).map(s=>`<div class="row"><div>${esc(s.title)}</div><small>${data.repertoires.filter(r=>r.songIds.includes(s.id)).length} repertorio(s)</small></div>`).join('')}</article>`).join('')||empty('Las canciones que agregues a tus repertorios aparecerán acá.')};$('#search').oninput=list;list()}
if(active==='recursos')renderResources(c);
if(active==='equipamientos')renderEquipment(c);
if(active==='fechas'){c.innerHTML=head('Próximas Fechas','La agenda de la banda, siempre a mano.','<button class="primary" id="add">+ Agregar fecha</button>')+`<div class="grid">${[...data.events].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<button class="card" data-id="${e.id}">${photoMarkup(e.photo,e.title)}<span class="date">${date(e.date)} · ${esc(e.time)}</span><h3>${esc(e.title)}</h3><small>${esc(e.venue)}${e.date<new Date().toLocaleDateString('en-CA')?' · Finalizado':''}</small></button>`).join('')||empty('La próxima fecha empieza acá. Agregá un concierto.')}</div>`;$('#add').onclick=()=>editEvent();c.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>editEvent(data.events.find(e=>e.id===b.dataset.id)))}
if(active==='ahorros'){
 const total=data.movements.reduce((sum,m)=>sum+(m.type==='ingreso'?m.amount:-m.amount),0);
 c.innerHTML=head('Ahorros','Cada aporte nos acerca al próximo paso.','<button class="primary" id="income">+ Aportar</button>')+`<div class="balance"><small>TOTAL AHORRADO</small><strong>${money(total)}</strong></div>`;
 $('#income').onclick=()=>movement();
}}
function editRep(r){modal(r?'Editar repertorio':'Nuevo repertorio',field('Título del repertorio','title',r?.title||'','text','required maxlength="100"')+'<label>Canciones · título y artista</label><div id="rows"></div><button type="button" id="songAdd">+ Agregar canción</button>'+field('Enlace de la playlist (opcional)','playlist',r?.playlist||'','url'),async f=>{const title=f.get('title').trim();if(!title)throw Error('Escribí un título.');const songs=[...$('#rows').children].map(row=>({title:row.querySelector('[name="song"]').value.trim(),artist:row.querySelector('[name="artist"]').value.trim()}));if(songs.some(s=>!s.title||!s.artist))throw Error('Cada canción necesita título y artista.');const playlist=safeLink(f.get('playlist'));await commit(d=>{const ids=songs.map(s=>{let found=d.songs.find(x=>x.title.toLowerCase()===s.title.toLowerCase()&&x.artist.toLowerCase()===s.artist.toLowerCase());if(!found){found={id:uid(),...s};d.songs.push(found)}return found.id});const value={id:r?.id||uid(),title,playlist,songIds:ids};if(r)d.repertoires=d.repertoires.map(x=>x.id===r.id?value:x);else d.repertoires.push(value)})});const add=s=>{const row=document.createElement('div');row.className='songrow';row.innerHTML=`<input name="song" aria-label="Título de canción" placeholder="Canción" value="${esc(s?.title)}" required><input name="artist" aria-label="Artista" placeholder="Artista" value="${esc(s?.artist)}" required><button type="button" aria-label="Quitar canción">×</button>`;row.querySelector('button').onclick=()=>row.remove();$('#rows').append(row)};(r?.songIds||[]).forEach(id=>add(data.songs.find(s=>s.id===id)));$('#songAdd').onclick=()=>add()}
function editEvent(e){modal(e?'Detalles del evento':'Nueva fecha',photoFields(e?.photo)+field('Nombre del evento','title',e?.title||'','text','required')+field('Fecha','date',e?.date||'','date','required')+field('Horario','time',e?.time||'','time')+field('Lugar y dirección','venue',e?.venue||'','text','required')+`<label for="repertoire">Repertorio</label><select id="repertoire" name="repertoire"><option value="">Por definir</option>${data.repertoires.map(r=>`<option value="${r.id}" ${r.id===e?.repertoire?'selected':''}>${esc(r.title)}</option>`).join('')}</select>`+field('Enlace del evento (opcional)','link',e?.link||'','url')+`<label for="notes">Detalles y notas</label><textarea name="notes" id="notes">${esc(e?.notes)}</textarea>`,async f=>{const photo=await photoValue(f,e?.photo);f.delete('photoFile');f.delete('removePhoto');const value={...Object.fromEntries(f),photo,id:e?.id||uid(),link:safeLink(f.get('link'))};if(!value.title.trim()||!value.venue.trim())throw Error('Completá nombre y lugar.');await commit(d=>{if(e)d.events=d.events.map(x=>x.id===e.id?value:x);else d.events.push(value)})})}
function movement(){
 const now=new Date();const pad=n=>String(n).padStart(2,'0');const today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
 modal('Aportar al ahorro',field('Monto (Gs)','amount','','number','required min="1" step="1"')+field('Fecha del aporte','date',today,'date','required'),async f=>{
  const amount=Number(f.get('amount'));
  if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Ingresá un monto entero positivo.');
  await commit(d=>d.movements.push({amount,date:f.get('date'),type:'ingreso',id:uid(),created:new Date().toISOString()}));
 });
}
function photoMarkup(photo,title){return photo?`<img class="entry-photo" ${photo.startsWith('photo:')?`data-photo="${esc(photo)}"`:`src="${esc(photo)}"`} alt="${esc(title)}" loading="lazy">`:''}
function photoFields(photo){return `${photoMarkup(photo,'Foto guardada')}<label for="photoFile">Foto (opcional)</label><input id="photoFile" name="photoFile" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WebP. Se optimiza al guardar.</small>${photo?'<label class="check"><input type="checkbox" name="removePhoto"> Quitar foto actual</label>':''}`}
async function photoValue(form,previous){const file=form.get('photoFile');if(file?.size)return readPhoto(file);return form.has('removePhoto')?'':previous||''}
function renderEquipment(c){
  c.innerHTML=head('Equipamientos','Lo que necesitamos para el próximo paso.','<button class="primary" id="add">+ Agregar equipamiento</button>')+`<div class="balance"><small>COSTO APROXIMADO TOTAL</small><strong>${money(data.equipment.reduce((sum,e)=>sum+e.cost,0))}</strong></div><div class="grid">${data.equipment.map(e=>`<button class="card" data-id="${e.id}">${photoMarkup(e.photo,e.title)}<span class="tag">Próxima compra</span><h3>${esc(e.title)}</h3><strong>${money(e.cost)}</strong>${e.notes?`<p class="notes">${esc(e.notes)}</p>`:''}</button>`).join('')||empty('Agregá los equipos que la banda quiere comprar.')}</div>`;
  $('#add').onclick=()=>editEquipment();c.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>editEquipment(data.equipment.find(e=>e.id===b.dataset.id)));
}
function editEquipment(e){modal(e?'Editar equipamiento':'Nuevo equipamiento',photoFields(e?.photo)+field('Nombre del equipamiento','title',e?.title||'','text','required maxlength="150"')+field('Costo aproximado (Gs)','cost',e?.cost??'','number','required min="0" step="1"')+`<label for="notes">Información (opcional)</label><textarea id="notes" name="notes" placeholder="Modelo, características, dónde comprar…">${esc(e?.notes)}</textarea>`,async f=>{const title=f.get('title').trim(),cost=Number(f.get('cost'));if(!title)throw Error('Escribí el nombre del equipamiento.');if(!Number.isSafeInteger(cost)||cost<0)throw Error('Ingresá un costo válido en guaraníes.');const photo=await photoValue(f,e?.photo);const value={id:e?.id||uid(),title,cost,photo,notes:f.get('notes').trim()};await commit(d=>{if(e)d.equipment=d.equipment.map(x=>x.id===e.id?value:x);else d.equipment.push(value)})})}
// ───────────────────────── Recursos ─────────────────────────
function renderResources(c){
  c.innerHTML=head('Recursos','Enlaces de la banda: abrilos o copialos para compartir.','<button class="primary" id="add">+ Agregar recurso</button>')
    +`<div class="grid">${data.resources.map(res=>{const url=webLink(res.url);return `<article class="card resource"><span class="tag">${esc(KINDS[res.kind]||'Enlace')}</span><h3>${ICONS[res.kind]||ICONS.otro} ${esc(res.title)}</h3><small class="url">${esc(shortUrl(url))}</small><div class="resactions">${url?`<a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a><button type="button" data-copy="${esc(res.id)}">Copiar enlace</button>`:''}<button type="button" data-edit="${esc(res.id)}">Editar</button></div></article>`}).join('')||empty('Agregá los enlaces de la banda: redes, drive, carpetas…')}</div>`;
  $('#add').onclick=()=>editResource();
  c.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editResource(data.resources.find(x=>x.id===b.dataset.edit)));
  c.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{
    const res=data.resources.find(x=>x.id===b.dataset.copy);
    toast(await copyText(webLink(res?.url))?'Enlace copiado':'No se pudo copiar. Abrí el recurso y copialo desde la barra.');
  });
}
async function copyText(text){
  if(!text)return false;
  try{await navigator.clipboard.writeText(text);return true}catch{
    try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return ok}catch{return false}
  }
}
function editResource(res){
  modal(res?'Editar recurso':'Nuevo recurso',
    `<label for="kind">Tipo</label><select id="kind" name="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}" ${k===(res?.kind||'otro')?'selected':''}>${v}</option>`).join('')}</select>`
    +field('Nombre','title',res?.title||'','text','required maxlength="100" placeholder="Ej.: Instagram de Europa"')
    +field('Enlace','url',res?.url||'','text','required maxlength="2000" placeholder="https://…"')
    +(res?'<button type="button" class="danger" id="del">Eliminar recurso</button>':''),
    async f=>{
      const title=f.get('title').trim(),url=webLink(normalizeUrl(f.get('url')));
      if(!title)throw Error('Escribí un nombre.');
      if(!url)throw Error('Pegá un enlace válido, por ejemplo https://www.instagram.com/europa_py/');
      const value={id:res?.id||uid(),kind:f.get('kind'),title,url};
      await commit(d=>{if(res)d.resources=d.resources.map(x=>x.id===res.id?value:x);else d.resources.push(value)});
    });
  if(res)$('#del').onclick=async()=>{
    if(!confirm(`¿Eliminar «${res.title}»?`))return;
    try{await commit(d=>{d.resources=d.resources.filter(x=>x.id!==res.id)});$('#modal').close()}catch(e){$('#error').textContent=e.message}
  };
}


window.addEventListener('hashchange',()=>{detail=null;render()});render();

async function hydratePhotos(){for(const img of document.querySelectorAll('img[data-photo]')){const ref=img.dataset.photo;delete img.dataset.photo;try{img.src=await resolvePhoto(ref)}catch{img.alt='Foto no disponible'}}}
new MutationObserver(hydratePhotos).observe(document.body,{childList:true,subtree:true});hydratePhotos();
