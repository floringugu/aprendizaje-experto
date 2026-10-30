import { describe, expect, it } from 'vitest';
import { RUTA_AJUSTES_LOCALES } from '../../scripts/arnes/comun/ajustes-locales.ts';
import {
  areasEnAlcance,
  escenariosEnRojo,
  leerAlcance,
  problemaDeArea,
  problemaDeFaseYArea,
  problemaDelAreaACerrar,
} from '../../scripts/arnes/comun/alcance.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const FEATURE = (area: string): string =>
  `# language: es\n@${area} @evidencia-2.2\nCaracterística: ${area}\n\n  @${area}-1.1 @evidencia-2.2\n  Escenario: E\n    Dado algo\n`;

function raizConAreas(cerradas: readonly string[], areasDeFeatures: readonly string[]): string {
  const raiz = directorioTemporal();
  escribirFicheros(raiz, {
    'config/alcance.json': JSON.stringify({ areas_cerradas: cerradas }),
    ...Object.fromEntries(areasDeFeatures.map((area) => [`features/${area}.feature`, FEATURE(area)])),
  });
  return raiz;
}

/** Fija el área en curso del checkout `raiz` en sus ajustes locales, como «make fase». */
function conAreaEnCurso(raiz: string, area: string): string {
  escribirFicheros(raiz, { [RUTA_AJUSTES_LOCALES]: JSON.stringify({ env: { ARNES_AREA: area } }) });
  return raiz;
}

describe('leerAlcance', () => {
  it('lee las áreas cerradas del fichero y el área en curso de los ajustes locales del checkout', () => {
    const raiz = conAreaEnCurso(raizConAreas(['DIAG', 'MAST'], []), 'MATE');
    expect(leerAlcance(raiz)).toEqual({ cerradas: ['DIAG', 'MAST'], enCurso: 'MATE' });
  });

  it('sin ajustes, o con el área vacía, no hay área en curso', () => {
    expect(leerAlcance(raizConAreas(['DIAG'], [])).enCurso).toBeUndefined();
    expect(leerAlcance(conAreaEnCurso(raizConAreas(['DIAG'], []), '')).enCurso).toBeUndefined();
  });

  it('sin fichero no hay áreas cerradas', () => {
    expect(leerAlcance(directorioTemporal()).cerradas).toEqual([]);
  });

  it('se niega a un fichero o a un área mal formados', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify({ areas_fuera_de_alcance: ['PLAN'] }) });
    expect(() => leerAlcance(raiz)).toThrow(/«areas_cerradas» debe ser una lista de prefijos/);
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify({ areas_cerradas: ['mate'] }) });
    expect(() => leerAlcance(raiz)).toThrow(/«areas_cerradas»/);
    expect(() => leerAlcance(conAreaEnCurso(raizConAreas([], []), 'mate'))).toThrow(/ARNES_AREA="mate"/);
  });
});

describe('escenariosEnRojo', () => {
  function raizConAlcance(contenido: unknown): string {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify(contenido) });
    return raiz;
  }

  it('lista los escenarios del área reabierta', () => {
    const raiz = raizConAlcance({ areas_cerradas: [], escenarios_en_rojo: { DIAG: ['DIAG-2.4'] } });
    expect(escenariosEnRojo(raiz, 'DIAG')).toEqual(['DIAG-2.4']);
  });

  it('sin entrada para el área, o sin fichero, no hay lista y fallan todos', () => {
    expect(escenariosEnRojo(raizConAlcance({ areas_cerradas: [] }), 'DIAG')).toBeUndefined();
    expect(escenariosEnRojo(raizConAlcance({ escenarios_en_rojo: { MAST: ['MAST-1.1'] } }), 'DIAG')).toBeUndefined();
    expect(escenariosEnRojo(directorioTemporal(), 'DIAG')).toBeUndefined();
  });

  it('rechaza una lista que no es de IDs del área', () => {
    expect(() => escenariosEnRojo(raizConAlcance({ escenarios_en_rojo: { DIAG: 'DIAG-2.4' } }), 'DIAG')).toThrow(
      /«escenarios_en_rojo.DIAG»/,
    );
    expect(() => escenariosEnRojo(raizConAlcance({ escenarios_en_rojo: { DIAG: ['MAST-1.1'] } }), 'DIAG')).toThrow(
      /«escenarios_en_rojo.DIAG»/,
    );
  });
});

describe('areasEnAlcance', () => {
  const alcance = { cerradas: ['DIAG', 'MAST'], enCurso: 'MATE' };

  it('la regresión comprueba solo las cerradas', () => {
    expect(areasEnAlcance(alcance, false)).toEqual(['DIAG', 'MAST']);
  });

  it('con el área en curso, la suma a las cerradas', () => {
    expect(areasEnAlcance(alcance, true)).toEqual(['DIAG', 'MAST', 'MATE']);
  });

  it('no repite un área en curso que ya está cerrada, ni inventa una que no hay', () => {
    expect(areasEnAlcance({ cerradas: ['MATE'], enCurso: 'MATE' }, true)).toEqual(['MATE']);
    expect(areasEnAlcance({ cerradas: ['MATE'], enCurso: undefined }, true)).toEqual(['MATE']);
  });
});

describe('problemaDeFaseYArea', () => {
  const raiz = raizConAreas(['DIAG'], ['DIAG', 'MATE', 'PANT']);

  it('la fase aceptacion necesita área; las otras no', () => {
    expect(problemaDeFaseYArea(raiz, 'aceptacion', undefined)).toMatch(/necesita el área/);
    expect(problemaDeFaseYArea(raiz, 'impl', undefined)).toBeUndefined();
    expect(problemaDeFaseYArea(raiz, 'specs', undefined)).toBeUndefined();
  });

  it('el área tiene que existir en features/ y no estar cerrada', () => {
    expect(problemaDeFaseYArea(raiz, 'impl', 'MATE')).toBeUndefined();
    expect(problemaDeFaseYArea(raiz, 'impl', 'XXXX')).toMatch(/no existe en features\/. Hay: DIAG, MATE, PANT/);
    expect(problemaDeFaseYArea(raiz, 'impl', 'DIAG')).toMatch(/ya está cerrada/);
    expect(problemaDeFaseYArea(raiz, 'impl', 'mate')).toMatch(/no es un prefijo de área/);
  });
});

describe('problemaDeArea', () => {
  it('el área tiene que existir en features/, aunque esté cerrada', () => {
    const raiz = raizConAreas(['DIAG'], ['DIAG', 'MATE']);
    expect(problemaDeArea(raiz, 'DIAG')).toBeUndefined();
    expect(problemaDeArea(raiz, 'XXXX')).toMatch(/no existe en features\/. Hay: DIAG, MATE/);
    expect(problemaDeArea(raiz, 'mate')).toMatch(/no es un prefijo de área/);
  });
});

describe('problemaDelAreaACerrar', () => {
  it('sin A, da el uso', () => {
    expect(problemaDelAreaACerrar(directorioTemporal(), '')).toBe('Uso: make cerrar-area A=<ÁREA>');
  });

  it('sin área en curso, dice cómo fijarla', () => {
    expect(problemaDelAreaACerrar(directorioTemporal(), 'MATE')).toMatch(/no tiene área en curso.*F=impl A=MATE/);
  });

  it('con otra área en curso, dice cuál es', () => {
    expect(problemaDelAreaACerrar(conAreaEnCurso(directorioTemporal(), 'PANT'), 'MATE')).toBe(
      'El área en curso de este checkout es PANT, no MATE.',
    );
  });

  it('se puede cerrar el área en curso del checkout', () => {
    expect(problemaDelAreaACerrar(conAreaEnCurso(directorioTemporal(), 'MATE'), 'MATE')).toBeUndefined();
  });
});
