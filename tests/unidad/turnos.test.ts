import { describe, expect, it } from 'vitest';
import { intercalarPorTurnos } from '../../src/dominio/turnos.ts';

describe('intercalarPorTurnos', () => {
  it('@DIAG-1.3 toma uno de cada grupo por turnos y sigue con los que aún tienen elementos', () => {
    expect(intercalarPorTurnos([['A1', 'A2', 'A3'], ['B1'], ['C1', 'C2']])).toEqual([
      'A1',
      'B1',
      'C1',
      'A2',
      'C2',
      'A3',
    ]);
  });

  it('@DIAG-1.3 sin grupos, o con grupos vacíos, no da nada', () => {
    expect(intercalarPorTurnos([])).toEqual([]);
    expect(intercalarPorTurnos([[], []])).toEqual([]);
  });
});
