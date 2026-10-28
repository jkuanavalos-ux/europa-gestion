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

export function parseLista(text) {
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
