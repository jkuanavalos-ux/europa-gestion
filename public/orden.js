// Orden de listas (canciones de un repertorio, repertorios). Funciones puras, con tests.

// Mueve un elemento `delta` posiciones (-1 = subir, 1 = bajar). No modifica la lista original.
export function moveId(ids, id, delta) {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// Aplica un orden elegido a la lista actual: respeta el orden elegido, descarta lo que ya no existe
// y deja al final lo que se agregó mientras tanto (por ejemplo, por otra persona).
export function applyOrder(current, desired) {
  const exists = new Set(current);
  const kept = [...new Set(desired)].filter(id => exists.has(id));
  const keptSet = new Set(kept);
  return [...kept, ...current.filter(id => !keptSet.has(id))];
}
