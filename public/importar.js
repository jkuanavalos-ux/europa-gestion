// Lee una lista pegada de WhatsApp, por ejemplo:
//   *ROCK RIO PLATENSE*
//   - *Tan Lejos*
//   Voz:✅
//   Coros:
// y devuelve { title, songs: [{ title, artist, parts }], warnings }. Sin DOM, con tests.
import { MAX_PARTS, MAX_PART_NAME, cleanPartName, normalize } from './canciones.js';

const CHECK = /(\u2705|\u2714\uFE0F?|\u2611\uFE0F?|\u2713)\s*$/u;
const CROSS = /(\u274C|\u2716\uFE0F?|\u2B1C|\u2610)\s*$/u;
const SONG = /^\s*\*?\s*[-\u2013\u2022]\s*\*?\s*(.+?)\s*\*?\s*$/u;
const TITLE = /^\s*\*+\s*([^*]+?)\s*\*+\s*$/u;
const COLON = /[:\uFF1A]/;

const strip = value => String(value).replace(/^[\s*_~]+|[\s*_~]+$/g, '').trim();

function newSong(content) {
  const [title, ...rest] = strip(content).split(/\s+[-\u2013\u2014]\s+/);
  return { title: strip(title), artist: strip(rest.join(' - ')), parts: [] };
}

function readPart(line) {
  const done = CHECK.test(line);
  const name = cleanPartName(
    line.replace(CHECK, '').replace(CROSS, '').replace(/[:\uFF1A]\s*$/, '').replace(/^[-\u2013\u2022*\s]+|[*\s]+$/g, ''));
  return name && name.length <= MAX_PART_NAME ? { name, done } : null;
}

function parseConMarcas(text) {
  const result = { title: '', songs: [], warnings: [] };
  let current = null;
  for (const raw of String(text ?? '').replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const isPartLine = (COLON.test(line) && /[:\uFF1A]\s*(\u2705|\u2714\uFE0F?|\u2611\uFE0F?|\u2713|\u274C)?\s*$/u.test(line)) || CHECK.test(line);
    const song = !isPartLine && line.match(SONG);
    if (song) {
      current = newSong(song[1]);
      if (current.title) result.songs.push(current);
      continue;
    }
    if (!current) {
      const title = line.match(TITLE);
      if (!result.title) result.title = strip(title ? title[1] : line);
      continue;
    }
    const part = isPartLine ? readPart(line) : null;
    if (!part) { result.warnings.push(`Línea ignorada: ${line.slice(0, 40)}`); continue; }
    const same = current.parts.find(item => normalize(item.name) === normalize(part.name));
    if (same) same.done = same.done || part.done;
    else if (current.parts.length < MAX_PARTS) current.parts.push(part);
    else result.warnings.push(`Demasiados instrumentos en «${current.title}»`);
  }
  // Una canción sin instrumentos en la lista usa los instrumentos por defecto.
  result.songs.forEach(song => { if (!song.parts.length) song.parts = null; });
  return result;
}

// Formato simple: una canción por línea, "Título – Artista" (con o sin número o viñeta).
function parseSimple(text) {
  const result = { title: '', songs: [], warnings: [] };
  for (const raw of String(text ?? '').replace(/\r/g, '').split('\n')) {
    let line = raw.trim();
    if (!line) continue;
    const title = line.match(TITLE);
    if (title && !result.title && !result.songs.length) { result.title = strip(title[1]); continue; } // *TÍTULO*
    line = line.replace(/^\s*(\d+\s*[.)]|[-\u2013\u2022*])\s*/u, '');                                 // "1." "2)" "-" "•"
    const song = newSong(line);
    if (!song.title || line.length > 160) { result.warnings.push(`Línea ignorada: ${line.slice(0, 40)}`); continue; }
    song.parts = null; // instrumentos por defecto
    result.songs.push(song);
  }
  return result;
}

// Acepta la lista de WhatsApp (con ✅ por instrumento) o una lista simple "Título – Artista".
export function parseLista(text) {
  const conMarcas = parseConMarcas(text);
  return conMarcas.songs.length ? conMarcas : parseSimple(text);
}
