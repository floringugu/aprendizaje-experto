import { describe, expect, it } from 'vitest';
import { faseTrasDominio, faseTrasProblemas } from '../../src/dominio/fases.ts';

const UMBRAL = 0.85;

describe('faseTrasDominio', () => {
  it('@MAST-6.1 de novato pasa a intermedio cuando todos los objetivos están dominados', () => {
    expect(faseTrasDominio('novato', true)).toBe('intermedio');
    expect(faseTrasDominio('novato', false)).toBe('novato');
  });

  it('@MAST-6.3 perder el dominio de un objetivo no devuelve a una fase anterior', () => {
    expect(faseTrasDominio('intermedio', false)).toBe('intermedio');
    expect(faseTrasDominio('avanzado_experto', false)).toBe('avanzado_experto');
  });

  it('@MAST-6.1 solo cambia desde novato', () => {
    expect(faseTrasDominio('diagnostico', true)).toBe('diagnostico');
    expect(faseTrasDominio('avanzado_experto', true)).toBe('avanzado_experto');
  });
});

describe('faseTrasProblemas', () => {
  it('@MAST-6.2 de intermedio pasa a avanzado/experto con el acierto justo en el umbral, no por debajo', () => {
    expect(faseTrasProblemas('intermedio', 17 / 20, UMBRAL)).toBe('avanzado_experto');
    expect(faseTrasProblemas('intermedio', 16 / 20, UMBRAL)).toBe('intermedio');
  });

  it('@MAST-6.2 sin acierto medido en problemas intercalados no cambia', () => {
    expect(faseTrasProblemas('intermedio', undefined, 0)).toBe('intermedio');
  });

  it('@MAST-6.2 solo cambia desde intermedio', () => {
    expect(faseTrasProblemas('novato', 1, UMBRAL)).toBe('novato');
    expect(faseTrasProblemas('diagnostico', 1, UMBRAL)).toBe('diagnostico');
  });

  it('@MAST-6.4 el umbral de paso es el que se le da', () => {
    expect(faseTrasProblemas('intermedio', 16 / 20, 0.75)).toBe('avanzado_experto');
  });
});
