import { describe, expect, it } from 'vitest';
import { RUTA_AJUSTES_LOCALES } from '../../scripts/arnes/comun/ajustes-locales.ts';
import {
  areaCumplida,
  areasCerradasDe,
  escenariosEnRojo,
  estaEnAlcance,
  leerAlcance,
  problemaDeArea,
  problemaDeAreaCerrada,
  problemaDeFaseYArea,
  problemaDelAreaACerrar,
  seleccionEnAlcance,
} from '../../scripts/arnes/comun/alcance.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const FEATURE = (area: string): string =>
  `# language: es\n@${area} @evidencia-2.2\nCaracterística: ${area}\n\n  @${area}-1.1 @evidencia-2.2\n  Escenario: E\n    Dado algo\n`;

function raizConAreas(
  cerradas: readonly string[],
  areasDeFeatures: readonly string[],
  enRojo: Readonly<Record<string, readonly string[]>> = {},
): string {
  const raiz = directorioTemporal();
  escribirFicheros(raiz, {
    'config/alcance.json': JSON.stringify({ areas_cerradas: cerradas, escenarios_en_rojo: enRojo }),
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
    expect(leerAlcance(raiz)).toEqual({ cerradas: ['DIAG', 'MAST'], pendientes: [], enCurso: 'MATE' });
  });

  it('los pendientes son los escenarios en rojo de las áreas cerradas; los de las demás áreas, no', () => {
    const enRojo = { DIAG: ['DIAG-2.4', 'DIAG-3.1'], MAST: [], MATE: ['MATE-1.1'] };
    expect(leerAlcance(raizConAreas(['DIAG', 'MAST'], [], enRojo)).pendientes).toEqual(['DIAG-2.4', 'DIAG-3.1']);
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
    expect(() => leerAlcance(raizConAreas(['DIAG'], [], { DIAG: ['MAST-1.1'] }))).toThrow(/«escenarios_en_rojo.DIAG»/);
  });
});

describe('areasCerradasDe', () => {
  it('lee el texto del fichero, de este checkout o de origin/main; sin texto, ninguna', () => {
    const texto = JSON.stringify({ areas_cerradas: ['DIAG'], escenarios_en_rojo: { DIAG: ['DIAG-2.4'] } });
    expect(areasCerradasDe(texto)).toEqual({ cerradas: ['DIAG'], pendientes: ['DIAG-2.4'] });
    expect(areasCerradasDe(undefined)).toEqual({ cerradas: [], pendientes: [] });
    expect(() => areasCerradasDe('{}')).toThrow(/«areas_cerradas»/);
  });
});

describe('areaCumplida', () => {
  it('un área se cumple cerrada y sin pendientes', () => {
    const alcance = { cerradas: ['DIAG', 'RECU'], pendientes: ['RECU-1.1'] };
    expect(areaCumplida(alcance, 'DIAG')).toBe(true);
    expect(areaCumplida(alcance, 'RECU')).toBe(false);
    expect(areaCumplida(alcance, 'MATE')).toBe(false);
  });
});

describe('escenariosEnRojo', () => {
  function raizConAlcance(contenido: unknown): string {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { 'config/alcance.json': JSON.stringify(contenido) });
    return raiz;
  }

  it('lista los escenarios en rojo del área', () => {
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

describe('seleccionEnAlcance', () => {
  const alcance = { cerradas: ['DIAG', 'MAST'], pendientes: [], enCurso: 'MATE' };

  it('la regresión comprueba solo las cerradas', () => {
    expect(seleccionEnAlcance(alcance, false)).toEqual({ areas: ['DIAG', 'MAST'], excluidos: [] });
  });

  it('con el área en curso, la suma a las cerradas', () => {
    expect(seleccionEnAlcance(alcance, true).areas).toEqual(['DIAG', 'MAST', 'MATE']);
  });

  it('no repite un área en curso que ya está cerrada, ni inventa una que no hay', () => {
    expect(seleccionEnAlcance({ ...alcance, cerradas: ['MATE'] }, true).areas).toEqual(['MATE']);
    expect(seleccionEnAlcance({ ...alcance, cerradas: ['MATE'], enCurso: undefined }, true).areas).toEqual(['MATE']);
  });

  it('deja fuera los pendientes de las cerradas, salvo los del área en curso', () => {
    const conPendientes = { cerradas: ['DIAG', 'MAST'], pendientes: ['DIAG-2.4', 'MAST-1.1'], enCurso: 'DIAG' };
    expect(seleccionEnAlcance(conPendientes, false).excluidos).toEqual(['DIAG-2.4', 'MAST-1.1']);
    expect(seleccionEnAlcance(conPendientes, true)).toEqual({ areas: ['DIAG', 'MAST'], excluidos: ['MAST-1.1'] });
  });
});

describe('estaEnAlcance', () => {
  it('un ID está en alcance si su área lo está y no está excluido', () => {
    const seleccion = { areas: ['DIAG'], excluidos: ['DIAG-2.4'] };
    expect(estaEnAlcance(seleccion, 'DIAG-1.1')).toBe(true);
    expect(estaEnAlcance(seleccion, 'DIAG')).toBe(true);
    expect(estaEnAlcance(seleccion, 'DIAG-2.4')).toBe(false);
    expect(estaEnAlcance(seleccion, 'MAST-1.1')).toBe(false);
  });
});

describe('problemaDeFaseYArea', () => {
  const raiz = raizConAreas(['DIAG'], ['DIAG', 'MATE', 'PANT']);

  it('la fase aceptacion necesita área; las otras no', () => {
    expect(problemaDeFaseYArea(raiz, 'aceptacion', undefined)).toMatch(/necesita el área/);
    expect(problemaDeFaseYArea(raiz, 'impl', undefined)).toBeUndefined();
    expect(problemaDeFaseYArea(raiz, 'specs', undefined)).toBeUndefined();
  });

  it('el área tiene que existir en features/', () => {
    expect(problemaDeFaseYArea(raiz, 'impl', 'MATE')).toBeUndefined();
    expect(problemaDeFaseYArea(raiz, 'impl', 'XXXX')).toMatch(/no existe en features\/. Hay: DIAG, MATE, PANT/);
    expect(problemaDeFaseYArea(raiz, 'impl', 'mate')).toMatch(/no es un prefijo de área/);
  });

  it('un área cerrada vale en specs, y en aceptacion o impl solo con pendientes', () => {
    expect(problemaDeFaseYArea(raiz, 'specs', 'DIAG')).toBeUndefined();
    expect(problemaDeFaseYArea(raiz, 'impl', 'DIAG')).toMatch(/ya está cerrada y no tiene pendientes/);
    const conPendientes = raizConAreas(['DIAG'], ['DIAG'], { DIAG: ['DIAG-1.1'] });
    expect(problemaDeFaseYArea(conPendientes, 'impl', 'DIAG')).toBeUndefined();
    expect(problemaDeFaseYArea(conPendientes, 'aceptacion', 'DIAG')).toBeUndefined();
  });
});

describe('problemaDeAreaCerrada', () => {
  it('solo se queja de aceptacion o impl en un área cerrada y sin pendientes', () => {
    const alcance = { cerradas: ['DIAG', 'RECU'], pendientes: ['RECU-1.1'] };
    expect(problemaDeAreaCerrada(alcance, 'aceptacion', 'DIAG')).toBe(
      'El área DIAG ya está cerrada y no tiene pendientes (escenarios_en_rojo en config/alcance.json): para cambiarla, empieza por specs.',
    );
    expect(problemaDeAreaCerrada(alcance, 'specs', 'DIAG')).toBeUndefined();
    expect(problemaDeAreaCerrada(alcance, 'impl', 'RECU')).toBeUndefined();
    expect(problemaDeAreaCerrada(alcance, 'impl', 'MATE')).toBeUndefined();
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
