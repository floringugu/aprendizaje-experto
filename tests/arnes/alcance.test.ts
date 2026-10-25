import { describe, expect, it } from 'vitest';
import {
  areasEnAlcance,
  escenariosEnRojo,
  leerAlcance,
  problemaDeFaseYArea,
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

describe('leerAlcance', () => {
  it('lee las áreas cerradas del fichero y el área en curso de ARNES_AREA', () => {
    const raiz = raizConAreas(['DIAG', 'MAST'], []);
    expect(leerAlcance(raiz, { ARNES_AREA: 'MATE' })).toEqual({ cerradas: ['DIAG', 'MAST'], enCurso: 'MATE' });
  });

  it('sin variable, o con la variable vacía, no hay área en curso', () => {
    const raiz = raizConAreas(['DIAG'], []);
    expect(leerAlcance(raiz, {}).enCurso).toBeUndefined();
    expect(leerAlcance(raiz, { ARNES_AREA: '' }).enCurso).toBeUndefined();
  });

  it('sin fichero no hay áreas cerradas', () => {
    expect(leerAlcance(directorioTemporal(), {}).cerradas).toEqual([]);
  });

  it('se niega a un fichero o a una variable mal formados', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify({ areas_fuera_de_alcance: ['PLAN'] }) });
    expect(() => leerAlcance(raiz, {})).toThrow(/«areas_cerradas» debe ser una lista de prefijos/);
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify({ areas_cerradas: ['mate'] }) });
    expect(() => leerAlcance(raiz, {})).toThrow(/«areas_cerradas»/);
    expect(() => leerAlcance(raizConAreas([], []), { ARNES_AREA: 'mate' })).toThrow(/ARNES_AREA=mate/);
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
