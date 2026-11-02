import { describe, expect, it } from 'vitest';
import {
  esReservado,
  evaluarTransferencia,
  reservadosDeRetencion,
  sinReservados,
} from '../../src/dominio/transferencia.ts';

const UMBRAL = 0.85;
const MINIMO = 5;

interface ItemDePrueba {
  readonly id: string;
  readonly tipo: string;
  readonly categoria?: string;
  readonly reservado?: boolean;
}

// C1 y C2 son parecidas entre sí (grupo G1); C5 no tiene grupo.
const CATEGORIAS = [{ id: 'C1', grupo_parecidas: 'G1' }, { id: 'C2', grupo_parecidas: 'G1' }, { id: 'C5' }];

function problema(id: string, extra: { categoria?: string; reservado?: boolean } = {}): ItemDePrueba {
  return { id, tipo: 'problema', ...extra };
}

function hecho(id: string, extra: { categoria?: string; reservado?: boolean } = {}): ItemDePrueba {
  return { id, tipo: 'hecho', ...extra };
}

/** `cantidad` problemas reservados de la categoría con grupo C1: R1, R2… */
function reservadosConGrupo(cantidad: number): ItemDePrueba[] {
  return Array.from({ length: cantidad }, (_, posicion) =>
    problema(`R${String(posicion + 1)}`, { categoria: 'C1', reservado: true }),
  );
}

/** Último intento de R1, R2…: los `aciertos` primeros acertados y los `fallos` siguientes fallados. */
function respuestas(aciertos: number, fallos: number): Map<string, boolean> {
  return new Map(
    Array.from({ length: aciertos + fallos }, (_, posicion) => [`R${String(posicion + 1)}`, posicion < aciertos]),
  );
}

function evaluar(items: readonly ItemDePrueba[], ultimoIntento: Map<string, boolean>, cambios = {}) {
  return evaluarTransferencia({
    items,
    categorias: CATEGORIAS,
    ultimoIntento,
    umbral: UMBRAL,
    minimo: MINIMO,
    ...cambios,
  });
}

describe('esReservado', () => {
  it('@MAST-8.1 solo es reservado el ítem con reservado en true', () => {
    expect(esReservado({ reservado: true })).toBe(true);
    expect(esReservado({ reservado: false })).toBe(false);
    expect(esReservado({})).toBe(false);
  });
});

describe('sinReservados', () => {
  it('@MAST-8.2 quita los reservados y deja el resto en su orden', () => {
    const items = [
      problema('I1'),
      problema('I2', { reservado: true }),
      hecho('I3', { reservado: false }),
      hecho('I4'),
      hecho('I5', { reservado: true }),
    ];
    expect(sinReservados(items).map((item) => item.id)).toEqual(['I1', 'I3', 'I4']);
  });

  it('@MAST-8.2 sin reservados devuelve todos, y sin ítems no devuelve ninguno', () => {
    expect(sinReservados([hecho('I1'), hecho('I2')])).toHaveLength(2);
    expect(sinReservados([])).toEqual([]);
  });
});

describe('reservadosDeRetencion', () => {
  // Los reservados del escenario, en su orden: I14 va a la mezcla (problema de C1, que tiene grupo).
  const reservados = [
    problema('I14', { categoria: 'C1', reservado: true }),
    hecho('I15', { categoria: 'C1', reservado: true }),
    problema('I16', { categoria: 'C5', reservado: true }),
    hecho('I17', { categoria: 'C5', reservado: true }),
    hecho('I18', { categoria: 'C2', reservado: true }),
    problema('I19', { categoria: 'C5', reservado: true }),
  ];

  it('@MAST-8.3 reparte los hechos y los problemas sin grupo, y deja los de grupo para la mezcla', () => {
    expect(reservadosDeRetencion(reservados, CATEGORIAS, 2)).toEqual([
      ['I15', 'I16', 'I17'],
      ['I18', 'I19'],
    ]);
  });

  it('@MAST-8.3 nunca incluye los ítems que no son reservados', () => {
    const items = [
      problema('I1', { categoria: 'C5' }),
      hecho('I2', { categoria: 'C1' }),
      ...reservados,
      hecho('I20', { reservado: false }),
      problema('I21', { categoria: 'C5', reservado: false }),
    ];
    expect(reservadosDeRetencion(items, CATEGORIAS, 2)).toEqual([
      ['I15', 'I16', 'I17'],
      ['I18', 'I19'],
    ]);
  });

  it('@MAST-8.3 un problema sin categoría va a las pruebas de retención', () => {
    const items = [problema('I1', { reservado: true }), problema('I2', { categoria: 'C1', reservado: true })];
    expect(reservadosDeRetencion(items, CATEGORIAS, 1)).toEqual([['I1']]);
  });

  it('@MAST-8.3 respeta el orden de los ítems, no el de los ids', () => {
    const items = [hecho('Z', { reservado: true }), hecho('A', { reservado: true }), hecho('M', { reservado: true })];
    expect(reservadosDeRetencion(items, CATEGORIAS, 1)).toEqual([['Z', 'A', 'M']]);
  });

  it('@MAST-8.3 si el reparto no sale exacto, las primeras pruebas llevan uno más', () => {
    const cinco = ['a', 'b', 'c', 'd', 'e'].map((id) => hecho(id, { reservado: true }));
    expect(reservadosDeRetencion(cinco, CATEGORIAS, 2)).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e'],
    ]);
    const siete = [...cinco, hecho('f', { reservado: true }), hecho('g', { reservado: true })];
    expect(reservadosDeRetencion(siete, CATEGORIAS, 3)).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e'],
      ['f', 'g'],
    ]);
    expect(reservadosDeRetencion(siete.slice(0, 4), CATEGORIAS, 3)).toEqual([['a', 'b'], ['c'], ['d']]);
  });

  it('@MAST-8.3 si el reparto sale exacto, todas las pruebas llevan los mismos', () => {
    const seis = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => hecho(id, { reservado: true }));
    expect(reservadosDeRetencion(seis, CATEGORIAS, 3)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('@MAST-8.3 con menos reservados que pruebas, las últimas pruebas quedan vacías', () => {
    const dos = [hecho('a', { reservado: true }), hecho('b', { reservado: true })];
    expect(reservadosDeRetencion(dos, CATEGORIAS, 5)).toEqual([['a'], ['b'], [], [], []]);
  });

  it('@MAST-8.3 sin reservados cada prueba queda vacía, y con 0 pruebas no hay listas', () => {
    expect(reservadosDeRetencion([hecho('a')], CATEGORIAS, 2)).toEqual([[], []]);
    expect(reservadosDeRetencion(reservados, CATEGORIAS, 0)).toEqual([]);
    expect(reservadosDeRetencion([], CATEGORIAS, 0)).toEqual([]);
  });
});

describe('evaluarTransferencia', () => {
  it('@MAST-6.7 con 9 de 10 reservados acertados supera la transferencia, y con 8 de 10 no', () => {
    expect(evaluar(reservadosConGrupo(10), respuestas(9, 1))).toStrictEqual({
      acierto: 0.9,
      superada: true,
      faltanCasosNuevos: false,
    });
    expect(evaluar(reservadosConGrupo(10), respuestas(8, 2))).toStrictEqual({
      acierto: 0.8,
      superada: false,
      faltanCasosNuevos: true,
    });
  });

  it('@MAST-6.7 un acierto justo en el umbral ya la supera, y una milésima por debajo no', () => {
    expect(evaluar(reservadosConGrupo(20), respuestas(17, 3))).toStrictEqual({
      acierto: 0.85,
      superada: true,
      faltanCasosNuevos: false,
    });
    expect(evaluar(reservadosConGrupo(20), respuestas(16, 4)).superada).toBe(false);
  });

  it('@MAST-6.7 solo cuentan los problemas reservados de categorías con grupo', () => {
    const items = [
      ...reservadosConGrupo(5),
      hecho('H1', { categoria: 'C1', reservado: true }),
      problema('P1', { categoria: 'C5', reservado: true }),
      problema('P2', { reservado: true }),
      problema('P3', { categoria: 'C2' }),
      problema('P4', { categoria: 'C2', reservado: false }),
    ];
    // Los que no cuentan, falle o falten, no cambian ni el acierto ni el «todos respondidos».
    const intentos = respuestas(5, 0);
    intentos.set('H1', false);
    intentos.set('P2', false);
    expect(evaluar(items, intentos)).toStrictEqual({ acierto: 1, superada: true, faltanCasosNuevos: false });
  });

  it('@MAST-6.8 con alguno sin responder no se supera, y tampoco faltan casos nuevos', () => {
    expect(evaluar(reservadosConGrupo(10), respuestas(9, 0))).toStrictEqual({
      acierto: 1,
      superada: false,
      faltanCasosNuevos: false,
    });
    expect(evaluar(reservadosConGrupo(10), respuestas(8, 1))).toStrictEqual({
      acierto: 8 / 9,
      superada: false,
      faltanCasosNuevos: false,
    });
  });

  it('@MAST-6.8 con ninguno respondido no hay acierto, ni se supera, ni faltan casos nuevos', () => {
    expect(evaluar(reservadosConGrupo(10), respuestas(0, 0))).toStrictEqual({
      superada: false,
      faltanCasosNuevos: false,
    });
  });

  it('@MAST-6.9 sin ningún problema reservado no hay acierto, no se supera y faltan casos nuevos', () => {
    expect(evaluar([], new Map())).toStrictEqual({ superada: false, faltanCasosNuevos: true });
  });

  it('@MAST-6.10 el umbral es el que se le da', () => {
    const cambios = { umbral: 0.75 };
    expect(evaluar(reservadosConGrupo(10), respuestas(8, 2), cambios).superada).toBe(true);
    expect(evaluar(reservadosConGrupo(10), respuestas(7, 3), cambios)).toStrictEqual({
      acierto: 0.7,
      superada: false,
      faltanCasosNuevos: true,
    });
  });

  it('@MAST-6.11 con menos reservados que el mínimo no se supera aunque se acierten todos', () => {
    expect(evaluar(reservadosConGrupo(4), respuestas(4, 0))).toStrictEqual({
      acierto: 1,
      superada: false,
      faltanCasosNuevos: true,
    });
  });

  it('@MAST-6.11 con exactamente el mínimo de reservados ya se puede superar', () => {
    expect(evaluar(reservadosConGrupo(5), respuestas(5, 0))).toStrictEqual({
      acierto: 1,
      superada: true,
      faltanCasosNuevos: false,
    });
  });

  it('@MAST-6.11 por debajo del mínimo faltan casos nuevos aunque alguno esté sin responder', () => {
    expect(evaluar(reservadosConGrupo(4), respuestas(2, 0))).toStrictEqual({
      acierto: 1,
      superada: false,
      faltanCasosNuevos: true,
    });
  });

  it('@MAST-6.12 los reservados nuevos se suman a los ya respondidos', () => {
    expect(evaluar(reservadosConGrupo(20), respuestas(18, 2))).toStrictEqual({
      acierto: 0.9,
      superada: true,
      faltanCasosNuevos: false,
    });
  });

  it('@MAST-6.13 con todos respondidos y sin llegar al umbral, faltan casos nuevos', () => {
    expect(evaluar(reservadosConGrupo(10), respuestas(0, 10))).toStrictEqual({
      acierto: 0,
      superada: false,
      faltanCasosNuevos: true,
    });
  });

  it('@MAST-6.14 el mínimo es el que se le da', () => {
    const cambios = { minimo: 3 };
    expect(evaluar(reservadosConGrupo(3), respuestas(3, 0), cambios)).toStrictEqual({
      acierto: 1,
      superada: true,
      faltanCasosNuevos: false,
    });
    expect(evaluar(reservadosConGrupo(2), respuestas(2, 0), cambios).faltanCasosNuevos).toBe(true);
  });
});
