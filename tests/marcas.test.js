import test from 'node:test';
import assert from 'node:assert/strict';
import { crearMarcador } from '../public/marcas.js';

const base = () => ({ songs: [{ id: 's1', title: 'Zafar', artist: '' }, { id: 's2', title: 'Astros', artist: '' }], extra: 'x' });

// Servidor falso con revisiones, como el real: guardar con una revisión vieja da 409.
function servidor() {
  const estado = { revision: 1, data: base(), guardados: 0 };
  const cliente = () => {
    let revision = 0;
    return {
      load: async () => { revision = estado.revision; return structuredClone(estado.data); },
      save: async data => {
        if (revision !== estado.revision) throw Object.assign(Error('Otra persona guardó cambios'), { status: 409 });
        estado.data = structuredClone(data); estado.revision++; revision = estado.revision; estado.guardados++;
        return structuredClone(estado.data);
      }
    };
  };
  return { estado, cliente };
}
const nuevoCliente = async (srv, extra = {}) => {
  const api = srv.cliente();
  let data = await api.load();
  const avisos = [];
  const marcador = crearMarcador({ getData: () => data, setData: d => { data = d; }, load: api.load, save: api.save, render() {}, avisar: m => avisos.push(m), ...extra });
  return { marcador, get data() { return data; }, avisos };
};
const marcadas = (data, id) => (data.songs.find(s => s.id === id).parts || []).filter(p => p.done).map(p => p.name);

test('la marca se ve al instante y queda guardada', async () => {
  const srv = servidor(); const a = await nuevoCliente(srv);
  a.marcador.marcar('s1', 'Voz', true);
  assert.deepEqual(marcadas(a.data, 's1'), ['Voz']);        // optimista, antes de guardar
  assert.equal(a.marcador.ocupado(), true);
  await a.marcador.esperar();
  assert.deepEqual(marcadas(srv.estado.data, 's1'), ['Voz']);
  assert.equal(srv.estado.data.extra, 'x');                 // el resto de los datos no se toca
});

test('varios clics seguidos se guardan sin perder ninguno ni chocar consigo mismo', async () => {
  const srv = servidor(); const a = await nuevoCliente(srv);
  ['Voz', 'Coros', 'Bajo'].forEach(name => a.marcador.marcar('s1', name, true));
  a.marcador.marcar('s2', 'Batería', true);
  await a.marcador.esperar();
  assert.deepEqual(marcadas(srv.estado.data, 's1'), ['Voz', 'Coros', 'Bajo']);
  assert.deepEqual(marcadas(srv.estado.data, 's2'), ['Batería']);
  assert.deepEqual(a.avisos, []);
});

test('dos personas marcando a la vez: se reintenta con los datos nuevos y no se pierde nada', async () => {
  const srv = servidor(); const a = await nuevoCliente(srv); const b = await nuevoCliente(srv);
  a.marcador.marcar('s1', 'Voz', true);
  await a.marcador.esperar();                               // a guarda primero (revisión 2)
  b.marcador.marcar('s1', 'Bajo', true);                    // b todavía tiene la revisión 1 → 409 → reintenta
  await b.marcador.esperar();
  assert.deepEqual(marcadas(srv.estado.data, 's1'), ['Voz', 'Bajo']);
  assert.deepEqual(marcadas(b.data, 's1'), ['Voz', 'Bajo']);
  assert.deepEqual(b.avisos, []);
});

test('si el guardado falla, se recarga lo real y se avisa', async () => {
  const srv = servidor(); const a = await nuevoCliente(srv);
  const original = srv.estado.data;
  const roto = await nuevoCliente(srv, { save: async () => { throw Error('sin conexión'); } });
  roto.marcador.marcar('s1', 'Voz', true);
  await roto.marcador.esperar();
  assert.deepEqual(marcadas(roto.data, 's1'), []);          // se deshizo la marca visual
  assert.match(roto.avisos[0], /sin conexión/);
  assert.deepEqual(srv.estado.data, original);
  assert.equal(a.marcador.ocupado(), false);
});

test('marcar una parte que no existe no hace nada', async () => {
  const srv = servidor(); const a = await nuevoCliente(srv);
  a.marcador.marcar('s1', 'Teclado', true); a.marcador.marcar('nope', 'Voz', true);
  assert.equal(a.marcador.ocupado(), false);
  assert.equal(srv.estado.guardados, 0);
});

test('si hay otro guardado en curso, la marca espera y no se pierde aunque ese guardado reemplace los datos', async () => {
  const srv = servidor(); const api = srv.cliente(); let data = await api.load(); let otroGuardando = true; const avisos = [];
  const marcador = crearMarcador({
    getData: () => data, setData: d => { data = d; }, load: api.load, save: api.save, render() {}, avisar: m => avisos.push(m),
    antesDeGuardar: async () => { while (otroGuardando) await new Promise(r => setTimeout(r, 5)); }
  });
  marcador.marcar('s1', 'Voz', true);
  assert.deepEqual(marcadas(data, 's1'), ['Voz']);              // se ve al instante
  assert.equal(srv.estado.guardados, 0);                        // pero espera: hay otro guardado en curso
  // el otro guardado (un formulario) termina y reemplaza los datos, que no traen la marca visual
  data = await api.save({ ...structuredClone(data), extra: 'del formulario' }).then(() => api.load());
  data.songs.find(s => s.id === 's1').parts = undefined;
  otroGuardando = false;
  await marcador.esperar();
  assert.deepEqual(marcadas(srv.estado.data, 's1'), ['Voz']);   // la marca se reaplicó y se guardó
  assert.equal(srv.estado.data.extra, 'del formulario');        // sin pisar lo que guardó el otro
  assert.deepEqual(avisos, []);
});
