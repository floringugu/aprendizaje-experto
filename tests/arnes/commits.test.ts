import { describe, expect, it } from 'vitest';
import {
  categoriaDe,
  problemaDeMezcla,
  problemasDeLoPreparado,
  problemasDelRango,
} from '../../scripts/arnes/comun/commits.ts';
import { commit, gitBien } from './origen.ts';
import { directorioTemporal, escribirFicheros, repositorioConCommit } from './temporal.ts';

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

describe('problemasDeLoPreparado', () => {
  it('mira solo lo preparado, con un renombrado como baja y alta', () => {
    const raiz = repositorioConCommit({ 'features/a.feature': '' });
    escribirFicheros(raiz, { 'src/a.ts': '' });
    expect(problemasDeLoPreparado(raiz)).toEqual([]);
    gitBien(raiz, ['mv', 'features/a.feature', 'src/a.feature']);
    expect(problemasDeLoPreparado(raiz)).toEqual([
      expect.stringMatching(/\(features\/a\.feature\).*\(src\/a\.feature\)/),
    ]);
  });

  it('lanza fuera de un repositorio', () => {
    expect(() => problemasDeLoPreparado(directorioTemporal())).toThrow('git diff --cached ha fallado');
  });
});

describe('problemasDelRango', () => {
  it('comprueba cada commit del rango por separado, con su SHA corto y su título', () => {
    const raiz = repositorioConCommit({ 'features/a.feature': '', 'src/a.ts': '' });
    const base = gitBien(raiz, ['rev-parse', 'HEAD']).trim();
    commit(raiz, 'spec', { 'features/a.feature': 'Feature: a' });
    commit(raiz, 'mezcla', { 'config/b.json': '{}', 'tests/unidad/b.test.ts': '' });
    commit(raiz, 'codigo', { 'src/a.ts': 'export {};' });
    const sha = gitBien(raiz, ['rev-parse', '--short', 'HEAD~1']).trim();
    expect(problemasDelRango(raiz, `${base}..HEAD`)).toEqual([
      expect.stringMatching(new RegExp(`^${sha} «mezcla»: Este commit mezcla .*config/b\\.json`)),
    ]);
  });

  it('con --root, también el primer commit de la historia', () => {
    const raiz = repositorioConCommit({ 'features/a.feature': '', 'src/a.ts': '' });
    expect(problemasDelRango(raiz, 'HEAD')).toEqual([expect.stringMatching(/«inicial»: Este commit mezcla/)]);
  });

  it('lanza si git no conoce el rango', () => {
    const raiz = repositorioConCommit({ 'src/a.ts': '' });
    expect(() => problemasDelRango(raiz, 'nada..HEAD')).toThrow('git rev-list --reverse ha fallado');
  });
});
