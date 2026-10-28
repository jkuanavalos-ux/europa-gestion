// Lógica pura de canciones y de las casillas "ya lo aprendí" (sin DOM, con tests en tests/canciones.test.js).
// El estado vive en la canción (song.parts), no en el repertorio: así se conserva si la
// canción se agrega a otro repertorio. Una canción sin `parts` usa los instrumentos por defecto.

export const DEFAULT_PARTS = ['Voz', 'Coros', 'Guitarra 2', 'Guitarra 1', 'Bajo', 'Batería'];
export const MAX_PARTS = 12;
export const MAX_PART_NAME = 30;

export const normalize = value =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const songKey = (title, artist) => `${normalize(title)}|${normalize(artist)}`;
export const cleanPartName = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export const defaultParts = () => DEFAULT_PARTS.map(name => ({ name, done: false }));
export const partsOf = song => (Array.isArray(song?.parts) ? song.parts : defaultParts());

// Artistas compatibles: iguales, o falta uno, o uno contiene al otro ("Bersuit" y "Bersuit Vergarabat").
const artistsMatch = (a, b) => {
  const x = normalize(a), y = normalize(b);
  return !x || !y || x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y));
};

// Misma canción = mismo título y artista compatible (siempre que sea una única candidata).
export function findSong(songs, title, artist, excludeId) {
  const pool = songs.filter(song => song.id !== excludeId);
  const exact = pool.find(song => songKey(song.title, song.artist) === songKey(title, artist));
  if (exact) return exact;
  const candidates = pool.filter(song => normalize(song.title) === normalize(title) && artistsMatch(song.artist, artist));
  return candidates.length === 1 ? candidates[0] : null;
}

// Marca o desmarca una parte. Devuelve false si la canción no tiene esa parte.
export function setPart(song, name, done) {
  const parts = partsOf(song).map(part => ({ ...part }));
  const part = parts.find(item => normalize(item.name) === normalize(name));
  if (!part) return false;
  part.done = Boolean(done);
  song.parts = parts;
  return true;
}

// Une las marcas pegadas con las existentes: solo suma, nunca desmarca.
export function mergeParts(existing, incoming) {
  const result = (Array.isArray(existing) ? existing : defaultParts()).map(part => ({ ...part }));
  for (const item of incoming || []) {
    const found = result.find(part => normalize(part.name) === normalize(item.name));
    if (found) found.done = found.done || Boolean(item.done);
    else if (result.length < MAX_PARTS) result.push({ name: cleanPartName(item.name), done: Boolean(item.done) });
  }
  return result;
}

// Nueva lista de partes: conserva las elegidas (con su estado) y suma una extra opcional.
export function editParts(song, keepNames, extraName) {
  const keep = new Set((keepNames || []).map(normalize));
  const parts = partsOf(song).filter(part => keep.has(normalize(part.name))).map(part => ({ ...part }));
  const extra = cleanPartName(extraName);
  if (extra) {
    if (extra.length > MAX_PART_NAME) throw Error(`El nombre del instrumento puede tener hasta ${MAX_PART_NAME} caracteres.`);
    if (!parts.some(part => normalize(part.name) === normalize(extra))) parts.push({ name: extra, done: false });
  }
  if (!parts.length) throw Error('Dejá al menos un instrumento.');
  if (parts.length > MAX_PARTS) throw Error(`Máximo ${MAX_PARTS} instrumentos por canción.`);
  return parts;
}

export function songProgress(song) {
  const parts = partsOf(song);
  const done = parts.filter(part => part.done).length;
  return { done, total: parts.length, percent: parts.length ? Math.round((done / parts.length) * 100) : 0 };
}

// Avance de un repertorio: total y desglose por instrumento (Voz 8/17, Bajo 6/17…).
export function repertoireProgress(songs) {
  let done = 0, total = 0;
  const byPart = new Map();
  for (const song of songs) {
    for (const part of partsOf(song)) {
      total++;
      if (part.done) done++;
      const key = normalize(part.name);
      const entry = byPart.get(key) || { name: part.name, done: 0, total: 0 };
      entry.total++;
      if (part.done) entry.done++;
      byPart.set(key, entry);
    }
  }
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, byPart: [...byPart.values()] };
}
