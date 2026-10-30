// Validación de los campos opcionales nuevos (recursos y casillas de aprendizaje), para que un dato
// mal formado no rompa la página de todos. Devuelve un mensaje de error, o '' si está bien.
// (El guion bajo hace que Vercel no lo publique como endpoint.)
const COLOR = /^#[0-9a-fA-F]{6}$/;
export function validateExtras(data) {
  if (data.guide !== undefined) {
    const g = data.guide;
    const ok = g && typeof g === 'object' && !Array.isArray(g)
      && typeof g.title === 'string' && g.title.trim() && g.title.length <= 100
      && typeof g.text === 'string' && g.text.length <= 6000;
    if (!ok) return 'Guía inválida.';
  }
  for (const list of [data.repertoires, data.events]) {
    for (const item of list || []) {
      if (item?.color !== undefined && !(typeof item.color === 'string' && (item.color === '' || COLOR.test(item.color)))) return 'Color inválido.';
    }
  }
  if (data.resources !== undefined) {
    if (!Array.isArray(data.resources) || data.resources.length > 100) return 'Recursos inválidos.';
    for (const item of data.resources) {
      const ok = item && typeof item === 'object'
        && typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 64
        && typeof item.title === 'string' && item.title.trim() && item.title.length <= 100
        && typeof item.url === 'string' && item.url.length <= 2000 && /^https?:\/\//i.test(item.url)
        && (item.kind === undefined || (typeof item.kind === 'string' && item.kind.length <= 30));
      if (!ok) return 'Recurso inválido: revisá el nombre y que el enlace empiece con https://';
    }
  }
  for (const song of data.songs) {
    if (song?.parts === undefined) continue;
    if (!Array.isArray(song.parts) || song.parts.length === 0 || song.parts.length > 20) return 'Instrumentos inválidos.';
    for (const part of song.parts) {
      if (!part || typeof part.name !== 'string' || !part.name.trim() || part.name.length > 40 || typeof part.done !== 'boolean') {
        return 'Instrumentos inválidos.';
      }
    }
  }
  return '';
}
