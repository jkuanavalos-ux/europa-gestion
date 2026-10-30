import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, safeColor, colorPicker } from '../public/colores.js';
import { validateExtras } from '../api/_validar.js';

test('safeColor acepta solo colores de la paleta', () => {
  assert.equal(safeColor('#3A63A8'), '#3a63a8');
  assert.equal(safeColor(' #b5483e '), '#b5483e');
  for (const malo of ['', null, undefined, 'red', '#fff', '#3a63a8;background:url(x)', 'javascript:alert(1)', '"><script>', '#123456', 42]) assert.equal(safeColor(malo), '');
  assert.equal(COLORS.length, 9);
});

test('el selector marca el color actual o «Sin color», y no deja pasar valores raros', () => {
  const azul = colorPicker('#3a63a8');
  assert.match(azul, /value="#3a63a8" checked/);
  assert.equal((azul.match(/checked/g) || []).length, 1);
  assert.match(colorPicker(''), /name="color" value="" checked/);
  assert.match(colorPicker('red;x'), /name="color" value="" checked/);
  assert.equal((colorPicker(null).match(/type="radio"/g) || []).length, 10);   // sin color + 9 colores
});

test('el servidor rechaza colores fuera de formato en repertorios y fechas', () => {
  assert.equal(validateExtras({ songs: [], repertoires: [{ color: '#3a63a8' }, { color: '' }, {}], events: [{ color: '#B5483E' }] }), '');
  assert.match(validateExtras({ songs: [], repertoires: [{ color: 'red' }], events: [] }), /Color inválido/);
  assert.match(validateExtras({ songs: [], repertoires: [], events: [{ color: '#3a63a8;x' }] }), /Color inválido/);
  assert.match(validateExtras({ songs: [], repertoires: [{ color: 5 }], events: [] }), /Color inválido/);
  assert.equal(validateExtras({ songs: [] }), '');          // datos viejos sin esos campos
});
