// Recursos de la banda (redes, drive, etc.). Sin DOM, con tests.
export const KINDS = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
  spotify: 'Spotify', drive: 'Drive', whatsapp: 'WhatsApp', otro: 'Otro'
};
export const ICONS = {
  instagram: '📸', facebook: '👥', tiktok: '🎵', youtube: '▶️', spotify: '🎧', drive: '📁', whatsapp: '💬', otro: '🔗'
};

// Se cargan la primera vez, hasta que alguien guarde la lista (después se pueden editar o borrar).
export const DEFAULT_RESOURCES = [
  { id: 'recurso-drive', kind: 'drive', title: 'Drive de recursos',
    url: 'https://drive.google.com/drive/folders/1sj3Ip7bieDvPFZ7LPO1VLCzUiZZayHtk?usp=drive_link' },
  { id: 'recurso-instagram', kind: 'instagram', title: 'Instagram de Europa', url: 'https://www.instagram.com/europa_py/' }
];

// Devuelve la URL limpia si es http(s); si no, ''. Nunca lanza error (un dato malo no rompe la página).
export function webLink(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

// "instagram.com/europa_py" → "https://instagram.com/europa_py"
export function normalizeUrl(value) {
  const text = String(value ?? '').trim();
  return text && !/^[a-z][a-z0-9+.-]*:/i.test(text) ? `https://${text}` : text;
}

export function shortUrl(url) {
  try {
    const parsed = new URL(url);
    const text = parsed.hostname.replace(/^www\./, '') + (parsed.pathname === '/' ? '' : parsed.pathname);
    return text.length > 46 ? `${text.slice(0, 45)}…` : text;
  } catch {
    return '';
  }
}
