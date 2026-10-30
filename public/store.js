const KEY='europa-demo-v1';
export const initial=()=>({repertoires:[],songs:[],events:[],movements:[],members:['Juan Angel Avalos','Joel Guitierrez','Julio Bogado','Romano Parquet','Osval Britoz'].map((name,i)=>({id:crypto.randomUUID(),name,type:i===4?'Invitado':'Permanente'}))});
function loadLocal(){const value=localStorage.getItem(KEY);return {goals:[],equipment:[],...(value?JSON.parse(value):initial())}}
function saveLocal(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(error){if(error.name==='QuotaExceededError')throw Error('El almacenamiento local está lleno. Exportá un respaldo y quitá fotos que no necesites antes de guardar.');throw error}}
export const uid=()=>crypto.randomUUID();
export const money=n=>new Intl.NumberFormat('es-PY').format(n)+' Gs';
export function safeLink(value){if(!value)return '';const u=new URL(value);if(!['http:','https:'].includes(u.protocol))throw Error('Usá un enlace que empiece con https:// o http://');return u.href}

export const shared=!['localhost','127.0.0.1'].includes(location.hostname);
const fragment=new URLSearchParams(location.hash.slice(1));
if(fragment.has('acceso')){sessionStorage.setItem('europa-access',fragment.get('acceso'));history.replaceState(null,'',location.pathname+'#repertorios')}
let revision=0;
const auth=()=>({'Authorization':'Bearer '+(sessionStorage.getItem('europa-access')||'')});
async function request(options){const r=await fetch('/api/data',{...options,headers:{...auth(),'Content-Type':'application/json'},cache:'no-store'});const result=await r.json();if(!r.ok){const e=Error(result.error||'Error de conexión');e.status=r.status;throw e}return result}
// Versión del sitio con la que se abrió la página (viene del servidor). Si cambia, hay un despliegue nuevo.
let knownVersion='';
export const siteChanged=result=>Boolean(result?.version&&knownVersion&&result.version!==knownVersion);
export async function load(){if(!shared)return loadLocal();const result=await request();revision=result.revision;if(result.version&&!knownVersion)knownVersion=result.version;return result.data}
export async function save(data){if(!shared){saveLocal(data);return data}const result=await request({method:'PUT',body:JSON.stringify({data,revision})});revision=result.revision;return result.data}
// Para actualizar la pantalla sin pisar la revisión de un guardado en curso.
export const currentRevision=()=>revision;
export function adopt(value){revision=value}
export async function peek(){return shared?request():null}
const photos=new Map();
export async function resolvePhoto(ref){if(!ref.startsWith('photo:'))return ref;if(!photos.has(ref)){const r=await fetch('/api/data?photo='+encodeURIComponent(ref.slice(6)),{headers:auth(),cache:'no-store'});if(!r.ok)throw Error('No se pudo cargar la foto');photos.set(ref,URL.createObjectURL(await r.blob()))}return photos.get(ref)}
