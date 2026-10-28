// Guardado de las casillas "ya lo aprendí". La marca se ve al instante (optimista) y se guarda en
// segundo plano. Si otra persona guardó antes (409), se vuelven a cargar los datos nuevos, se
// reaplica la marca y se reintenta: así dos personas marcando a la vez no pierden marcas.
import { setPart } from './canciones.js';

export function aplicarMarca(data, { songId, name, done }) {
  const song = data.songs.find(item => item.id === songId);
  return song ? setPart(song, name, done) : false;
}

// `antesDeGuardar` (opcional): espera a que termine otro guardado de la página (por ejemplo un formulario),
// para no mandar dos guardados con la misma revisión.
export function crearMarcador({ getData, setData, load, save, render, avisar, antesDeGuardar, maxIntentos = 5 }) {
  const pendientes = [];
  let enCurso = null;

  async function vaciar() {
    try {
      while (pendientes.length) {
        if (antesDeGuardar) {
          await antesDeGuardar();
          // Ese otro guardado pudo reemplazar los datos: se reaplican las marcas que seguían pendientes.
          pendientes.forEach(marca => aplicarMarca(getData(), marca));
          render();
        }
        const lote = pendientes.splice(0);
        let base = getData();
        for (let intento = 1; ; intento++) {
          try {
            const guardado = await save(structuredClone(base));
            pendientes.forEach(marca => aplicarMarca(guardado, marca)); // marcas hechas mientras se guardaba
            setData(guardado);
            render();
            break;
          } catch (error) {
            if (error.status !== 409 || intento >= maxIntentos) throw error;
            base = await load(); // datos más nuevos de otra persona
            lote.forEach(marca => aplicarMarca(base, marca));
          }
        }
      }
    } catch (error) {
      pendientes.length = 0;
      try { setData(await load()); } catch { /* se reintenta en la próxima actualización */ }
      render();
      avisar(`No se pudo guardar la marca: ${error.message}`);
    }
  }

  function disparar() {
    if (!enCurso) {
      enCurso = vaciar().finally(() => {
        enCurso = null;
        if (pendientes.length) disparar();
      });
    }
    return enCurso;
  }

  function marcar(songId, name, done) {
    const marca = { songId, name, done };
    if (!aplicarMarca(getData(), marca)) return;
    pendientes.push(marca);
    render();
    disparar();
  }

  return { marcar, ocupado: () => Boolean(enCurso) || pendientes.length > 0, esperar: () => (pendientes.length ? disparar() : enCurso || Promise.resolve()) };
}
