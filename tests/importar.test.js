import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLista } from '../public/importar.js';

const LISTA = `*ROCK RIO PLATENSE*

- *Tan Lejos* 
Voz:✅
Coros:
Guitarra 2:✅
Guitarra 1:
Bajo: ✅
Batería: ✅

 *- A las nueve* 
Voz:✅
Coros:
Guitarra 2:✅
Guitarra 1:
Bajo: ✅
Batería: ✅

- *Yendo a la casa de damian* 
Voz:
Coros:
Guitarra 2:
Guitarra 1:
Bajo:✅
Batería: 

- *El tiempo no para - Bersuit* 
Voz:✅
Coros:
Guitarra 2:
Guitarra 1:
Bajo:
Batería: 

- *Avanti morocha - los cabelleros...* 
Voz:✅
Coros:
Guitarra 2:✅
Guitarra 1:
Bajo:
Batería: 

- *Mi enfermedad - Los Rodríguez* 
Voz:✅
Coros:
Guitarra 2:✅
Guitarra 1:
Bajo:
Batería: 

- *A veces vuelvo* 
Voz✅
Coros:
Guitarra 2:
Guitarra 1:
Bajo:
Batería:`;

const done = song => song.parts.filter(p => p.done).map(p => p.name);

test('lee la lista de WhatsApp: título, canciones, artistas y marcas', () => {
  const r = parseLista(LISTA);
  assert.equal(r.title, 'ROCK RIO PLATENSE');
  assert.deepEqual(r.songs.map(s => s.title), ['Tan Lejos', 'A las nueve', 'Yendo a la casa de damian', 'El tiempo no para', 'Avanti morocha', 'Mi enfermedad', 'A veces vuelvo']);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.songs[0].parts.map(p => p.name), ['Voz', 'Coros', 'Guitarra 2', 'Guitarra 1', 'Bajo', 'Batería']);
  assert.deepEqual(done(r.songs[0]), ['Voz', 'Guitarra 2', 'Bajo', 'Batería']);
  assert.deepEqual(done(r.songs[1]), ['Voz', 'Guitarra 2', 'Bajo', 'Batería']);   // formato " *- A las nueve* "
  assert.deepEqual(done(r.songs[2]), ['Bajo']);
  assert.deepEqual([r.songs[3].title, r.songs[3].artist], ['El tiempo no para', 'Bersuit']);
  assert.deepEqual([r.songs[4].title, r.songs[4].artist], ['Avanti morocha', 'los cabelleros...']);
  assert.deepEqual([r.songs[5].title, r.songs[5].artist], ['Mi enfermedad', 'Los Rodríguez']);
  assert.deepEqual(done(r.songs[6]), ['Voz']);                                   // "Voz✅" sin dos puntos
});

test('instrumentos extra, repetidos y líneas que no se entienden', () => {
  const r = parseLista('*MI LISTA*\n- Canción uno\nVoz:✅\nTeclado:✅\nVoz:\n- Canción dos\n*OTRA COSA*\nSolo texto suelto');
  assert.equal(r.title, 'MI LISTA');
  assert.deepEqual(r.songs[0].parts, [{ name: 'Voz', done: true }, { name: 'Teclado', done: true }]);
  assert.equal(r.songs[1].parts, null);                 // sin instrumentos → los de por defecto
  assert.equal(r.warnings.length, 2);                   // las dos líneas ignoradas, sin romper nada
});

test('texto vacío o sin canciones', () => {
  assert.deepEqual(parseLista(''), { title: '', songs: [], warnings: [] });
  assert.equal(parseLista('hola\nque tal').songs.length, 0);
});
