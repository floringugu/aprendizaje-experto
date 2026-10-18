import { describe, expect, it } from 'vitest';
import type { EntradaDiagnostico } from '../../src/dominio/diagnostico.ts';
import {
  evaluarDiagnostico,
  objetivosPendientes,
  pasosRetiradosIniciales,
  problemasIntercalables,
} from '../../src/dominio/diagnostico.ts';

const UMBRAL = 0.85;

/** Un objetivo con `total` ítems llamados `<objetivo>-1`, `<objetivo>-2`… */
function objetivo(id: string, total: number): { id: string; items: string[] } {
  return { id, items: Array.from({ length: total }, (_, posicion) => `${id}-${String(posicion + 1)}`) };
}

/** Acierta los `aciertos` primeros ítems de la lista y falla el resto. */
function acertar(items: readonly string[], aciertos: number): [string, boolean][] {
  return items.map((item, posicion) => [item, posicion < aciertos]);
}

const O1 = objetivo('O1', 4);
const O2 = objetivo('O2', 4);
const VEINTE = objetivo('O1', 20);

/** Evalúa con los dos umbrales a 0,85 salvo que la prueba cambie alguno. */
function evaluar(cambios: Partial<EntradaDiagnostico>) {
  return evaluarDiagnostico({
    objetivos: [O1, O2],
    problemasIntercalables: [],
    respuestas: new Map(),
    umbralDominio: UMBRAL,
    umbralPasoAAvanzado: UMBRAL,
    ...cambios,
  });
}

/**
 * Un solo objetivo de 20 ítems, todos dominados salvo los `fallos`; los 10 primeros son problemas
 * intercalables, así que cada fallo entre ellos resta 0,1 a su acierto.
 */
function diagnosticoDeVeinte(fallos: readonly string[], cambios: Partial<EntradaDiagnostico> = {}) {
  return evaluar({
    objetivos: [VEINTE],
    problemasIntercalables: VEINTE.items.slice(0, 10),
    respuestas: new Map(VEINTE.items.map((item) => [item, !fallos.includes(item)])),
    ...cambios,
  });
}

describe('evaluarDiagnostico', () => {
  it('@DIAG-2.1 un objetivo dominado sale de la ruta y la persona sigue de novato', () => {
    const resultado = evaluar({ respuestas: new Map([...acertar(O1.items, 4), ...acertar(O2.items, 2)]) });
    expect(resultado.objetivosDominados).toEqual(['O1']);
    expect(resultado.ruta).toEqual(['O2']);
    expect(resultado.fase).toBe('novato');
    expect(resultado.aciertoPorObjetivo).toEqual({ O1: 1, O2: 0.5 });
  });

  it('@DIAG-2.2 domina el objetivo justo en el umbral, no por debajo', () => {
    const dominadosCon = (aciertos: number) =>
      evaluar({ objetivos: [VEINTE], respuestas: new Map(acertar(VEINTE.items, aciertos)) }).objetivosDominados;
    expect(dominadosCon(17)).toEqual(['O1']);
    expect(dominadosCon(16)).toEqual([]);
  });

  it('@DIAG-2.2 un objetivo con ítems sin responder no tiene acierto ni queda dominado', () => {
    const resultado = evaluar({ respuestas: new Map(acertar(O1.items.slice(0, 3), 3)) });
    expect(resultado.aciertoPorObjetivo).toEqual({});
    expect(resultado.ruta).toEqual(['O1', 'O2']);
  });

  it('@DIAG-2.1 sigue de novato mientras quede un objetivo por dominar, aunque acierte todos los problemas', () => {
    const resultado = evaluar({
      problemasIntercalables: O1.items,
      respuestas: new Map([...acertar(O1.items, 4), ...acertar(O2.items, 0)]),
    });
    expect(resultado.aciertoProblemasSinPista).toBe(1);
    expect(resultado.fase).toBe('novato');
  });

  it('@DIAG-2.3 un problema intercalable sin responder impide pasar a avanzado/experto', () => {
    const resultado = evaluar({
      problemasIntercalables: [...O1.items, 'SIN-RESPONDER'],
      respuestas: new Map([...acertar(O1.items, 4), ...acertar(O2.items, 4)]),
    });
    expect(resultado.fase).toBe('intermedio');
  });

  it('@DIAG-2.3 intermedio cuando el acierto en problemas intercalables no llega al umbral', () => {
    const resultado = diagnosticoDeVeinte(['O1-9', 'O1-10']);
    expect(resultado.objetivosDominados).toEqual(['O1']);
    expect(resultado.fase).toBe('intermedio');
    expect(resultado.aciertoProblemasSinPista).toBe(0.8);
  });

  it('@DIAG-2.4 avanzado/experto cuando el acierto en problemas intercalables llega al umbral', () => {
    const resultado = diagnosticoDeVeinte(['O1-10']);
    expect(resultado.fase).toBe('avanzado_experto');
    expect(resultado.aciertoProblemasSinPista).toBe(0.9);
  });

  it('@DIAG-2.4 el paso a avanzado/experto usa su propio umbral, no el de dominio', () => {
    const resultado = diagnosticoDeVeinte(['O1-10'], { umbralPasoAAvanzado: 0.95 });
    expect(resultado.objetivosDominados).toEqual(['O1']);
    expect(resultado.fase).toBe('intermedio');
  });

  it('@DIAG-3.1 sin problemas intercalables no informa de su acierto', () => {
    expect(evaluar({}).aciertoProblemasSinPista).toBeUndefined();
  });
});

describe('objetivosPendientes', () => {
  it('@DIAG-2.1 conserva el orden del contenido', () => {
    expect(objetivosPendientes(['O1', 'O2', 'O3'], new Set(['O2']))).toEqual(['O1', 'O3']);
  });
});

describe('problemasIntercalables', () => {
  it('@DIAG-2.3 solo los problemas de categorías con grupo de parecidas', () => {
    const items = [
      { id: 'P1', tipo: 'problema', categoria: 'C1' },
      { id: 'P2', tipo: 'problema', categoria: 'C2' },
      { id: 'P3', tipo: 'problema' },
      { id: 'H1', tipo: 'hecho', categoria: 'C1' },
    ];
    const categorias = [{ id: 'C1', grupo_parecidas: 'G' }, { id: 'C2' }];
    expect(problemasIntercalables(items, categorias)).toEqual(['P1']);
  });
});

describe('pasosRetiradosIniciales', () => {
  it('@DIAG-2.5 un objetivo dominado empieza sin pasos visibles; uno sin dominar, con todos', () => {
    expect(pasosRetiradosIniciales(true, [3])).toBe(3);
    expect(pasosRetiradosIniciales(false, [3])).toBe(0);
  });

  it('@DIAG-2.5 con varios ejemplos se retiran los pasos del más largo', () => {
    expect(pasosRetiradosIniciales(true, [2, 5, 3])).toBe(5);
  });

  it('@DIAG-2.5 sin ejemplos no hay pasos que retirar', () => {
    expect(pasosRetiradosIniciales(true, [])).toBe(0);
  });
});
