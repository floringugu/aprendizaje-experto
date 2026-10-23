import { describe, expect, it } from 'vitest';
import { objetivosPendientes } from '../../src/dominio/ruta.ts';

describe('objetivosPendientes', () => {
  it('@DIAG-2.1 conserva el orden del contenido', () => {
    expect(objetivosPendientes(['O1', 'O2', 'O3'], new Set(['O2']))).toEqual(['O1', 'O3']);
  });
});
