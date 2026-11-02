import { describe, expect, it } from 'vitest';
import { evaluarDominio, fechasDeRetencion, pruebaDeRetencionEnCurso } from '../../src/dominio/criterio-dominio.ts';

const UMBRAL = 0.85;
const ITEMS = Array.from({ length: 20 }, (_, posicion) => `I${String(posicion + 1)}`);

/** Último intento de los `respondidos` primeros ítems: acierta los `aciertos` primeros y falla el resto. */
function intentos(aciertos: number, respondidos = ITEMS.length): Map<string, boolean> {
  return new Map(ITEMS.slice(0, respondidos).map((item, posicion) => [item, posicion < aciertos]));
}

function evaluar(ultimoIntento: Map<string, boolean>, cambios: { umbral?: number; dominadoAntes?: boolean } = {}) {
  return evaluarDominio({ items: ITEMS, ultimoIntento, umbral: UMBRAL, dominadoAntes: false, ...cambios });
}

describe('evaluarDominio', () => {
  it('@MAST-1.1 domina el objetivo justo en el umbral, no por debajo', () => {
    expect(evaluar(intentos(17))).toStrictEqual({ dominado: true, aciertoSinAyuda: 0.85, itemsSinIntento: 0 });
    expect(evaluar(intentos(16)).dominado).toBe(false);
  });

  it('@MAST-1.3 con algún ítem sin intento no se evalúa y el objetivo sigue como estaba', () => {
    const sinUno = intentos(19, 19);
    expect(evaluar(sinUno)).toStrictEqual({ dominado: false, itemsSinIntento: 1 });
    expect(evaluar(sinUno, { dominadoAntes: true }).dominado).toBe(true);
  });

  it('@MAST-4.1 deja de estar dominado en cuanto el acierto baja del umbral', () => {
    expect(evaluar(intentos(16), { dominadoAntes: true }).dominado).toBe(false);
  });

  it('@MAST-5.1 el umbral es el que se le da', () => {
    expect(evaluar(intentos(16), { umbral: 0.8 }).dominado).toBe(true);
    expect(evaluar(intentos(16), { umbral: 0.9 }).dominado).toBe(false);
  });
});

describe('fechasDeRetencion', () => {
  const dominadoEl = new Date('2026-03-02T09:00:00Z');

  it('@MAST-7.1 programa una prueba por cada número de semanas, contado desde que quedó dominado', () => {
    expect(fechasDeRetencion(dominadoEl, [1, 4])).toEqual([
      new Date('2026-03-09T09:00:00Z'),
      new Date('2026-03-30T09:00:00Z'),
    ]);
  });

  it('@MAST-7.3 las semanas son las que se le dan', () => {
    expect(fechasDeRetencion(dominadoEl, [2, 8])).toEqual([
      new Date('2026-03-16T09:00:00Z'),
      new Date('2026-04-27T09:00:00Z'),
    ]);
  });
});

describe('pruebaDeRetencionEnCurso', () => {
  const fechas = [new Date('2026-03-09T09:00:00Z'), new Date('2026-03-30T09:00:00Z')];

  it('@MAST-8.6 antes de la primera fecha no toca ninguna prueba', () => {
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-08T09:00:00Z'))).toBeUndefined();
    expect(pruebaDeRetencionEnCurso([], new Date('2026-03-08T09:00:00Z'))).toBeUndefined();
  });

  it('@MAST-8.6 en el mismo instante de una fecha, esa prueba ya toca', () => {
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-09T09:00:00Z'))).toBe(0);
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-30T09:00:00Z'))).toBe(1);
  });

  it('@MAST-8.6 una milésima antes de una fecha, esa prueba aún no toca', () => {
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-09T08:59:59.999Z'))).toBeUndefined();
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-30T08:59:59.999Z'))).toBe(0);
  });

  it('@MAST-8.6 una prueba sigue tocando hasta que llega la siguiente', () => {
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-03-20T09:00:00Z'))).toBe(0);
    expect(pruebaDeRetencionEnCurso(fechas, new Date('2026-04-15T09:00:00Z'))).toBe(1);
  });

  it('@MAST-8.6 no supone que las fechas vengan ordenadas', () => {
    const desordenadas = [new Date('2026-03-30T09:00:00Z'), new Date('2026-03-09T09:00:00Z')];
    expect(pruebaDeRetencionEnCurso(desordenadas, new Date('2026-03-20T09:00:00Z'))).toBe(1);
    expect(pruebaDeRetencionEnCurso(desordenadas, new Date('2026-04-15T09:00:00Z'))).toBe(0);
  });

  it('@MAST-8.6 con una fecha que aún no ha llegado entre las que sí, devuelve la más reciente de las llegadas', () => {
    const tres = [new Date('2026-03-09T09:00:00Z'), new Date('2026-03-30T09:00:00Z'), new Date('2026-05-01T09:00:00Z')];
    expect(pruebaDeRetencionEnCurso(tres, new Date('2026-04-15T09:00:00Z'))).toBe(1);
  });
});
