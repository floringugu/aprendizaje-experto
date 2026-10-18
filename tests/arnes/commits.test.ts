import { describe, expect, it } from 'vitest';
import {
  categoriaDe,
  problemaDeAutoria,
  problemaDeMezcla,
  problemasDeSumas,
} from '../../scripts/arnes/comun/commits.ts';
import { parsearProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import { sha256 } from '../../scripts/arnes/comun/sumas.ts';

const entradas = parsearProtegidas('features/ @specs\nconfig/parametros.json @specs\nMakefile\n.claude/\n');

describe('categoriaDe', () => {
  it.each([
    ['features/dominio.feature', 'especificacion'],
    ['tests/aceptacion/pasos.ts', 'especificacion'],
    ['config/parametros.json', 'especificacion'],
    ['src/dominio/criterio.ts', 'codigo'],
    ['tests/unidad/criterio.test.ts', 'codigo'],
    ['docs/plan.md', 'otro'],
    ['tests/arnes/guardia.test.ts', 'otro'],
  ])('%s es %s', (ruta, categoria) => {
    expect(categoriaDe(ruta)).toBe(categoria);
  });
});

describe('problemaDeMezcla', () => {
  it('rechaza un commit con especificación y código', () => {
    expect(problemaDeMezcla(['features/a.feature', 'src/dominio/a.ts'])).toMatch(/mezcla especificación y código/);
  });

  it('acepta un commit solo de especificación o solo de código, aunque lleve otros ficheros', () => {
    expect(problemaDeMezcla(['features/a.feature', 'config/parametros.json', 'docs/plan.md'])).toBeUndefined();
    expect(problemaDeMezcla(['src/dominio/a.ts', 'tests/unidad/a.test.ts', 'docs/plan.md'])).toBeUndefined();
  });
});

describe('problemaDeAutoria', () => {
  it('desde Claude Code no se commitean ficheros protegidos, ni los de la fase specs', () => {
    expect(problemaDeAutoria(['features/a.feature'], entradas, true)).toMatch(/los commitea el dueño/);
    expect(problemaDeAutoria(['Makefile'], entradas, true)).toMatch(/Makefile/);
  });

  it('el dueño sí puede, y Claude Code puede commitear lo que no está protegido', () => {
    expect(problemaDeAutoria(['features/a.feature'], entradas, false)).toBeUndefined();
    expect(problemaDeAutoria(['src/dominio/a.ts'], entradas, true)).toBeUndefined();
  });
});

describe('problemasDeSumas', () => {
  const contenido = Buffer.from('all:\n');
  const sumas = `${sha256(contenido)}  Makefile\n`;

  it('acepta un fichero protegido cuya suma va en el mismo commit', () => {
    expect(problemasDeSumas([{ ruta: 'Makefile', contenido }], sumas, entradas)).toEqual([]);
  });

  it('rechaza un fichero protegido sin sumas o con una suma que no coincide', () => {
    expect(problemasDeSumas([{ ruta: 'Makefile', contenido }], undefined, entradas)).toEqual([
      'Faltan las sumas (.claude/sumas.sha256). Ejecuta make sumas.',
    ]);
    const otro = Buffer.from('otro');
    expect(problemasDeSumas([{ ruta: 'Makefile', contenido: otro }], sumas, entradas)).toEqual([
      'Makefile no coincide con su suma. Ejecuta make sumas y añádelas.',
    ]);
  });

  it('rechaza borrar un fichero protegido que sigue en las sumas', () => {
    expect(problemasDeSumas([{ ruta: 'Makefile', contenido: undefined }], sumas, entradas)).toEqual([
      'Makefile se borra pero sigue en las sumas.',
    ]);
  });

  it('no pide sumas a los ficheros que no están protegidos', () => {
    expect(problemasDeSumas([{ ruta: 'src/a.ts', contenido }], undefined, entradas)).toEqual([]);
  });
});
