import test from 'node:test';
import assert from 'node:assert/strict';
import { webLink, normalizeUrl, shortUrl, DEFAULT_RESOURCES } from '../public/recursos.js';
import { validateExtras } from '../api/_validar.js';

test('webLink acepta solo http(s) y nunca lanza error', () => {
  assert.equal(webLink('https://www.instagram.com/europa_py/'), 'https://www.instagram.com/europa_py/');
  assert.equal(webLink(' http://a.com '), 'http://a.com/');
  for (const malo of ['javascript:alert(1)', 'data:text/html,hola', 'ftp://x.com', 'sin enlace', '', null, undefined]) assert.equal(webLink(malo), '');
});

test('normalizeUrl completa https:// cuando falta y shortUrl acorta', () => {
  assert.equal(normalizeUrl('instagram.com/europa_py'), 'https://instagram.com/europa_py');
  assert.equal(normalizeUrl('https://a.com'), 'https://a.com');
  assert.equal(normalizeUrl('javascript:alert(1)'), 'javascript:alert(1)');   // se rechaza después con webLink
  assert.equal(shortUrl('https://www.instagram.com/europa_py/'), 'instagram.com/europa_py/');
});

test('los recursos por defecto son válidos para el servidor', () => {
  assert.equal(validateExtras({ songs: [], resources: DEFAULT_RESOURCES }), '');
  assert.equal(DEFAULT_RESOURCES.length, 2);
  assert.ok(DEFAULT_RESOURCES.every(r => webLink(r.url)));
});

test('el servidor rechaza recursos y parts mal formados, y acepta datos viejos sin esos campos', () => {
  const ok = { id: 'r1', kind: 'drive', title: 'Drive', url: 'https://drive.google.com/x' };
  assert.equal(validateExtras({ songs: [{ id: '1', title: 'A', artist: '' }] }), '');
  assert.equal(validateExtras({ songs: [], resources: [ok] }), '');
  assert.match(validateExtras({ songs: [], resources: [{ ...ok, url: 'javascript:alert(1)' }] }), /Recurso inválido/);
  assert.match(validateExtras({ songs: [], resources: [{ ...ok, title: '  ' }] }), /Recurso inválido/);
  assert.match(validateExtras({ songs: [], resources: 'x' }), /Recursos inválidos/);
  assert.match(validateExtras({ songs: [], resources: Array(101).fill(ok) }), /Recursos inválidos/);
  assert.equal(validateExtras({ songs: [{ parts: [{ name: 'Voz', done: true }] }] }), '');
  assert.match(validateExtras({ songs: [{ parts: [{ name: 'Voz', done: 'si' }] }] }), /Instrumentos inválidos/);
  assert.match(validateExtras({ songs: [{ parts: [] }] }), /Instrumentos inválidos/);
  assert.match(validateExtras({ songs: [{ parts: 'x' }] }), /Instrumentos inválidos/);
  assert.equal(validateExtras({ songs: [null] }), '');
});
