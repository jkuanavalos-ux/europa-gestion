import test from 'node:test';
import assert from 'node:assert/strict';
import { moveId, applyOrder } from '../public/orden.js';

test('moveId sube y baja de a una posición y no se pasa de los extremos', () => {
  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(moveId(ids, 'c', -1), ['a', 'c', 'b', 'd']);
  assert.deepEqual(moveId(ids, 'b', 1), ['a', 'c', 'b', 'd']);
  assert.deepEqual(moveId(ids, 'a', -1), ids);
  assert.deepEqual(moveId(ids, 'd', 1), ids);
  assert.deepEqual(moveId(ids, 'zzz', 1), ids);
  assert.deepEqual(ids, ['a', 'b', 'c', 'd']);   // la original no se toca
});

test('applyOrder respeta el orden elegido, descarta lo borrado y deja al final lo agregado', () => {
  assert.deepEqual(applyOrder(['a', 'b', 'c'], ['c', 'a', 'b']), ['c', 'a', 'b']);
  assert.deepEqual(applyOrder(['a', 'c'], ['c', 'b', 'a']), ['c', 'a']);              // 'b' ya no existe
  assert.deepEqual(applyOrder(['a', 'b', 'c', 'nueva'], ['c', 'a', 'b']), ['c', 'a', 'b', 'nueva']);
  assert.deepEqual(applyOrder(['a', 'b'], ['b', 'b', 'a']), ['b', 'a']);              // sin repetidos
  assert.deepEqual(applyOrder([], ['a']), []);
});
