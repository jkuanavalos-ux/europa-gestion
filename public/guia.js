// Guía de presupuesto (texto editable que se muestra en Recursos). Sin DOM, con tests.
// Formato del texto: «## Apartado», «- Detalle: monto» (el monto se resalta) y párrafos sueltos.

export const DEFAULT_GUIDE = {
  title: 'Guía de presupuesto',
  text: `Valores de referencia en guaraníes (Gs) para cotizar un show.

## Bar chico (con o sin entrada)
- Con equipos de la banda: 1.800.000 Gs
- Con equipos del bar: 1.500.000 Gs

## Bar grande (con o sin entrada)
- Con equipos de la banda: 2.500.000 Gs
- Con equipos del bar: 2.000.000 Gs

## Evento grande con muchas bandas
- Con todos los equipos: 1.500.000 Gs

## Acústico de 2 o 3 integrantes
- Según los equipos y otros detalles: 800.000 a 1.000.000 Gs

## Acústico con la banda completa
- Según el bar, la ubicación y otros detalles: 1.000.000 a 1.500.000 Gs

Los montos finales pueden variar según los equipos, la ubicación y el tipo de evento.`
};

export const GUIDE_LIMITS = { title: 100, text: 6000 };

// Convierte el texto en HTML. Todo el contenido se escapa con `esc`.
export function renderGuide(text, esc) {
  const html = [];
  let list = false;
  const closeList = () => { if (list) { html.push('</ul>'); list = false; } };
  for (const raw of String(text ?? '').replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) { closeList(); html.push(`<h4>${esc(heading[1])}</h4>`); continue; }
    const item = line.match(/^[-•–*]\s+(.+)$/);
    if (item) {
      if (!list) { html.push('<ul>'); list = true; }
      const pair = item[1].match(/^(.+?):\s+(.+)$/);
      html.push(pair
        ? `<li><span>${esc(pair[1])}</span><strong>${esc(pair[2])}</strong></li>`
        : `<li><span>${esc(item[1])}</span></li>`);
      continue;
    }
    closeList();
    html.push(`<p>${esc(line)}</p>`);
  }
  closeList();
  return html.join('');
}
