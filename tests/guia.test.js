import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_GUIDE, GUIDE_LIMITS, renderGuide } from '../public/guia.js';
import { validateExtras } from '../api/_validar.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

test('la guía por defecto trae todos los montos del original', () => {
  const html = renderGuide(DEFAULT_GUIDE.text, esc);
  for (const monto of ['1.800.000 Gs', '1.500.000 Gs', '2.500.000 Gs', '2.000.000 Gs', '800.000 a 1.000.000 Gs', '1.000.000 a 1.500.000 Gs']) assert.ok(html.includes(`<strong>${monto}</strong>`), monto);
  assert.equal((html.match(/<h4>/g) || []).length, 5);
  assert.equal((html.match(/<ul>/g) || []).length, 5);
  assert.equal(DEFAULT_GUIDE.title, 'Guía de presupuesto');
  assert.ok(DEFAULT_GUIDE.text.length < GUIDE_LIMITS.text);
});

test('formato: apartados, ítems con monto, ítems sueltos y párrafos', () => {
  const html = renderGuide('Intro\n\n## Apartado\n- Con equipos: 1.000 Gs\n- Solo texto\n\nCierre', esc);
  assert.equal(html, '<p>Intro</p><h4>Apartado</h4><ul><li><span>Con equipos</span><strong>1.000 Gs</strong></li><li><span>Solo texto</span></li></ul><p>Cierre</p>');
  assert.equal(renderGuide('', esc), '');
  assert.equal(renderGuide(null, esc), '');
});

test('todo se escapa: el texto no puede inyectar HTML', () => {
  const html = renderGuide('## <img src=x onerror=alert(1)>\n- <b>a</b>: <script>x</script>', esc);
  assert.ok(!html.includes('<img') && !html.includes('<script') && !html.includes('<b>'));
  assert.ok(html.includes('&lt;img'));
});

test('el servidor valida la guía (título y texto) y acepta datos viejos sin ella', () => {
  const base = { songs: [] };
  assert.equal(validateExtras(base), '');
  assert.equal(validateExtras({ ...base, guide: { title: 'Guía', text: 'x' } }), '');
  assert.equal(validateExtras({ ...base, guide: { title: 'Guía', text: '' } }), '');
  for (const mala of [{ title: '', text: 'x' }, { title: 'x'.repeat(101), text: 'x' }, { title: 'a', text: 'x'.repeat(6001) }, { title: 'a', text: 5 }, 'texto', [], null]) {
    assert.match(validateExtras({ ...base, guide: mala }), /Guía inválida/);
  }
});
