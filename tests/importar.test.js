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
  assert.deepEqual(parseLista('   \n\n'), { title: '', songs: [], warnings: [] });
  assert.equal(parseLista('hola\nque tal').songs.length, 2);   // sin formato: una canción por línea
});

const SIMPLE = `Tan Lejos – No Te Va Gustar
A las nueve – No Te Va Gustar
Zafar – La Vela Puerca
Va a escampar – La Vela Puerca
Yendo a la casa de Damián – El Cuarteto de Nos
Un pacto – Bersuit Vergarabat
El tiempo no para – Bersuit Vergarabat
Me gusta – Ciro y los Persas
Astros – Ciro y los Persas
Antes y después – Ciro y los Persas
Reyes de la noche – Guasones
Pasan las horas – Guasones
Avanti morocha – Los Caballeros de la Quema
Sapo de otro pozo – Los Caballeros de la Quema
Sin documentos – Los Rodríguez
Mi enfermedad – Los Rodríguez
La milonga del marinero y el capitán – Los Rodríguez
A veces vuelvo – Catupecu Machu`;

test('formato simple "Título – Artista": una canción por línea, con sus artistas', () => {
  const r = parseLista(SIMPLE);
  assert.equal(r.songs.length, 18);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.title, '');
  assert.deepEqual([r.songs[0].title, r.songs[0].artist], ['Tan Lejos', 'No Te Va Gustar']);
  assert.deepEqual([r.songs[4].title, r.songs[4].artist], ['Yendo a la casa de Damián', 'El Cuarteto de Nos']);
  assert.deepEqual([r.songs[16].title, r.songs[16].artist], ['La milonga del marinero y el capitán', 'Los Rodríguez']);
  assert.deepEqual([r.songs[17].title, r.songs[17].artist], ['A veces vuelvo', 'Catupecu Machu']);
  assert.ok(r.songs.every(s => s.parts === null));   // sin instrumentos pegados → los de por defecto
});

test('formato simple: acepta guion normal o largo, numeración, líneas en blanco y saltos de Windows', () => {
  const r = parseLista('1. Tan Lejos - No Te Va Gustar\r\n\r\n2) A las nueve — No Te Va Gustar\r\n3. Solo título\r\n10. Con número – Artista X\r\n2 minutos – Bersuit');
  assert.deepEqual(r.songs.map(s => [s.title, s.artist]), [
    ['Tan Lejos', 'No Te Va Gustar'], ['A las nueve', 'No Te Va Gustar'], ['Solo título', ''], ['Con número', 'Artista X'], ['2 minutos', 'Bersuit']]);
});

test('lista con viñetas en todas las líneas', () => {
  const r = parseLista('- Tan Lejos – No Te Va Gustar\n• Zafar – La Vela Puerca\n- Solo título');
  assert.deepEqual(r.songs.map(s => [s.title, s.artist, s.parts]), [['Tan Lejos', 'No Te Va Gustar', null], ['Zafar', 'La Vela Puerca', null], ['Solo título', '', null]]);
});

test('formato simple con título entre asteriscos, y la lista de WhatsApp sigue leyéndose igual', () => {
  const r = parseLista('*MI REPERTORIO*\nTan Lejos – X\nZafar – Y');
  assert.equal(r.title, 'MI REPERTORIO');
  assert.equal(r.songs.length, 2);
  const w = parseLista('*MI REPERTORIO*\n- *Tan Lejos – X*\nVoz:✅\nBajo:');
  assert.deepEqual([w.songs[0].title, w.songs[0].artist, w.songs[0].parts.map(p => p.done)], ['Tan Lejos', 'X', [true, false]]);
});
