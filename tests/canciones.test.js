import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PARTS, songKey, partsOf, setPart, mergeParts, editParts, songProgress, repertoireProgress, findSong } from '../public/canciones.js';

test('una canción sin parts usa los instrumentos por defecto y no se modifica al leerla', () => {
  const song = { id: 'a', title: 'Zafar', artist: '' };
  assert.deepEqual(partsOf(song).map(p => p.name), DEFAULT_PARTS);
  assert.equal(song.parts, undefined);
});

test('marcar y desmarcar conserva el resto y no toca otras canciones', () => {
  const song = { id: 'a', title: 'Zafar', artist: '' };
  const other = { id: 'b', title: 'Astros', artist: '' };
  assert.equal(setPart(song, 'voz', true), true);
  assert.equal(setPart(song, 'Bajo', true), true);
  assert.equal(setPart(song, 'Teclado', true), false);
  assert.deepEqual(song.parts.filter(p => p.done).map(p => p.name), ['Voz', 'Bajo']);
  setPart(song, 'Voz', false);
  assert.deepEqual(song.parts.filter(p => p.done).map(p => p.name), ['Bajo']);
  assert.equal(other.parts, undefined);
});

test('la misma canción en otro repertorio conserva sus marcas (coincidencia por título y artista)', () => {
  const songs = [{ id: '1', title: 'Tan Lejos', artist: '' }, { id: '2', title: 'Mi enfermedad', artist: 'Los Rodríguez' }];
  assert.equal(findSong(songs, 'tan  lejos', '').id, '1');
  assert.equal(findSong(songs, 'TAN LEJOS', 'Alguien').id, '1');          // al existente le faltaba el artista
  assert.equal(findSong(songs, 'mi enfermedad', 'los rodriguez').id, '2'); // sin mayúsculas ni tildes
  assert.equal(findSong(songs, 'Mi enfermedad', '').id, '2');
  assert.equal(findSong(songs, 'Mi enfermedad', 'Otro grupo'), null);     // otro artista = otra canción
  assert.equal(findSong(songs, 'Otra', ''), null);
  assert.equal(songKey('Á b', ' C '), songKey('a B', 'c'));
});

test('al sumar una lista pegada solo se agregan marcas, nunca se quitan', () => {
  const existing = [{ name: 'Voz', done: true }, { name: 'Bajo', done: false }];
  const merged = mergeParts(existing, [{ name: 'voz', done: false }, { name: 'Bajo', done: true }, { name: 'Teclado', done: true }]);
  assert.deepEqual(merged, [{ name: 'Voz', done: true }, { name: 'Bajo', done: true }, { name: 'Teclado', done: true }]);
  assert.equal(mergeParts(undefined, [{ name: 'Voz', done: true }])[0].done, true);
});

test('editar instrumentos: quitar, agregar uno extra y conservar el estado', () => {
  const song = { id: 'a', title: 'X', artist: '', parts: [{ name: 'Voz', done: true }, { name: 'Coros', done: false }, { name: 'Bajo', done: true }] };
  assert.deepEqual(editParts(song, ['Voz', 'Bajo'], ' Teclado '), [{ name: 'Voz', done: true }, { name: 'Bajo', done: true }, { name: 'Teclado', done: false }]);
  assert.deepEqual(editParts(song, ['Voz', 'Coros', 'Bajo'], 'voz').length, 3);
  assert.throws(() => editParts(song, [], ''), /al menos un instrumento/);
  assert.throws(() => editParts(song, ['Voz'], 'x'.repeat(31)), /30 caracteres/);
});

test('avance por canción y por repertorio, con desglose por instrumento', () => {
  const a = { id: '1', title: 'A', artist: '' }; setPart(a, 'Voz', true); setPart(a, 'Bajo', true);
  const b = { id: '2', title: 'B', artist: '', parts: [{ name: 'Voz', done: true }, { name: 'Teclado', done: false }] };
  assert.deepEqual(songProgress(a), { done: 2, total: 6, percent: 33 });
  const rep = repertoireProgress([a, b]);
  assert.equal(rep.total, 8);
  assert.equal(rep.done, 3);
  assert.equal(rep.percent, 38);
  assert.deepEqual(rep.byPart.find(p => p.name === 'Voz'), { name: 'Voz', done: 2, total: 2 });
  assert.deepEqual(repertoireProgress([]), { done: 0, total: 0, percent: 0, byPart: [] });
});
