import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ajustesConFase,
  entornoDeAjustesLocales,
  fijarFase,
  RUTA_AJUSTES_LOCALES,
} from '../../scripts/arnes/comun/ajustes-locales.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

function leer(texto: string): unknown {
  return JSON.parse(texto);
}

describe('ajustesConFase', () => {
  it('crea los ajustes si el fichero no existe o está vacío', () => {
    expect(leer(ajustesConFase(undefined, 'specs', undefined))).toEqual({
      env: { ARNES_FASE: 'specs' },
      model: 'sonnet',
      effortLevel: 'high',
    });
    expect(leer(ajustesConFase('  \n', 'impl', undefined))).toEqual({
      env: { ARNES_FASE: 'impl' },
      model: 'opus',
      effortLevel: 'xhigh',
    });
  });

  it('cambia la fase, el modelo y el esfuerzo, y conserva los permisos y las demás variables', () => {
    const anterior = JSON.stringify({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'impl', OTRA: '1' },
      model: 'opus',
      effortLevel: 'xhigh',
    });
    expect(leer(ajustesConFase(anterior, 'aceptacion', undefined))).toEqual({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'aceptacion', OTRA: '1' },
      model: 'sonnet',
      effortLevel: 'high',
    });
  });

  it('escribe JSON con sangría y un salto de línea al final', () => {
    expect(ajustesConFase(undefined, 'impl', undefined)).toBe(
      '{\n  "env": {\n    "ARNES_FASE": "impl"\n  },\n  "model": "opus",\n  "effortLevel": "xhigh"\n}\n',
    );
  });

  it.each([
    ['{ roto', /JSON/],
    ['[]', /el fichero debe ser un objeto JSON/],
    ['{"env": "specs"}', /«env» debe ser un objeto JSON/],
    ['{"env": null}', /«env» debe ser un objeto JSON/],
  ])('se niega a sobrescribir unos ajustes que no entiende: %s', (anterior, error) => {
    expect(() => ajustesConFase(anterior, 'impl', undefined)).toThrow(error);
  });
});

describe('ajustesConFase con área', () => {
  it('guarda el área en env.ARNES_AREA y cambia la anterior', () => {
    const anterior = JSON.stringify({ env: { ARNES_FASE: 'impl', ARNES_AREA: 'MAST', OTRA: '1' } });
    expect(leer(ajustesConFase(anterior, 'aceptacion', 'MATE'))).toMatchObject({
      env: { ARNES_FASE: 'aceptacion', ARNES_AREA: 'MATE', OTRA: '1' },
    });
  });

  it('quita el área anterior si no se da otra', () => {
    const anterior = JSON.stringify({ env: { ARNES_FASE: 'impl', ARNES_AREA: 'MAST' } });
    expect(leer(ajustesConFase(anterior, 'specs', undefined))).toMatchObject({ env: { ARNES_FASE: 'specs' } });
    expect(ajustesConFase(anterior, 'specs', undefined)).not.toContain('ARNES_AREA');
  });
});

describe('fijarFase', () => {
  const textoDe = (raiz: string): string => readFileSync(path.join(raiz, RUTA_AJUSTES_LOCALES), 'utf8');

  it('escribe los ajustes de la raíz', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { '.claude/.vacio': '' });
    fijarFase(raiz, { fase: 'impl', area: 'MATE' });
    expect(leer(textoDe(raiz))).toMatchObject({ env: { ARNES_FASE: 'impl', ARNES_AREA: 'MATE' } });
  });

  it('conserva lo demás que ya tienen los ajustes de la raíz', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { [RUTA_AJUSTES_LOCALES]: JSON.stringify({ permissions: { allow: ['propio'] } }) });
    fijarFase(raiz, { fase: 'specs', area: undefined });
    expect(leer(textoDe(raiz))).toMatchObject({ permissions: { allow: ['propio'] }, env: { ARNES_FASE: 'specs' } });
  });
});

describe('entornoDeAjustesLocales', () => {
  function raizCon(texto: string): string {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, { [RUTA_AJUSTES_LOCALES]: texto });
    return raiz;
  }

  it('da el objeto «env» de los ajustes de la raíz', () => {
    const raiz = raizCon(JSON.stringify({ model: 'opus', env: { ARNES_AREA: 'MATE', OTRA: '1' } }));
    expect(entornoDeAjustesLocales(raiz)).toEqual({ ARNES_AREA: 'MATE', OTRA: '1' });
  });

  it('está vacío sin fichero, con el fichero vacío o sin «env»', () => {
    expect(entornoDeAjustesLocales(directorioTemporal())).toEqual({});
    expect(entornoDeAjustesLocales(raizCon(' \n'))).toEqual({});
    expect(entornoDeAjustesLocales(raizCon(JSON.stringify({ model: 'opus' })))).toEqual({});
  });

  it('se niega a unos ajustes que no entiende', () => {
    expect(() => entornoDeAjustesLocales(raizCon('{ roto'))).toThrow(/JSON/);
    expect(() => entornoDeAjustesLocales(raizCon('{"env": []}'))).toThrow(/«env» debe ser un objeto JSON/);
  });
});
