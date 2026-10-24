import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { estadoConHead, ficherosDeHead } from '../../scripts/arnes/comun/git.ts';
import { problemasDeIntegridad } from '../../scripts/arnes/comun/integridad.ts';
import { parsearProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import { directorioTemporal, escribirFicheros, gitEn, repositorioConCommit } from './temporal.ts';

const ENTRADAS = parsearProtegidas('docs/a.md\nfeatures/ @specs\n.claude/\n');

let raiz = '';

beforeEach(() => {
  raiz = repositorioConCommit({
    '.gitignore': '.claude/settings.local.json\n',
    'docs/a.md': 'a',
    'features/x.feature': 'x',
    '.claude/settings.json': '{}',
    '.claude/settings.local.json': '{}',
    'src/libre.ts': '',
  });
});

describe('problemasDeIntegridad', () => {
  it('no encuentra nada si lo protegido es igual que en HEAD, ni por lo ignorado o lo libre', () => {
    writeFileSync(path.join(raiz, '.claude/settings.local.json'), '{"permissions":{}}');
    writeFileSync(path.join(raiz, 'src/libre.ts'), 'export {};');
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toEqual([]);
  });

  it('cuenta lo cambiado, lo borrado y lo nuevo sin seguimiento', () => {
    writeFileSync(path.join(raiz, 'docs/a.md'), 'b');
    rmSync(path.join(raiz, 'features/x.feature'));
    escribirFicheros(raiz, { 'features/nueva.feature': 'n', '.claude/hooks/nuevo.ts': '' });
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toEqual([
      '.claude/hooks/nuevo.ts: es nuevo y no está en el último commit',
      'docs/a.md: ha cambiado respecto al último commit',
      'features/nueva.feature: es nuevo y no está en el último commit',
      'features/x.feature: está en el último commit pero ya no existe',
    ]);
  });

  it('cuenta un fichero borrado con git rm, que git ls-files ya no lista', () => {
    gitEn(raiz, ['rm', '--quiet', 'docs/a.md']);
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toEqual([
      'docs/a.md: está en el último commit pero ya no existe',
    ]);
  });

  it('cuenta un cambio preparado pero sin commitear', () => {
    writeFileSync(path.join(raiz, 'docs/a.md'), 'b');
    gitEn(raiz, ['add', 'docs/a.md']);
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toHaveLength(1);
  });

  it('deja de contar el cambio en cuanto se commitea', () => {
    writeFileSync(path.join(raiz, 'docs/a.md'), 'b');
    gitEn(raiz, ['commit', '--quiet', '-am', 'dueño']);
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toEqual([]);
  });

  it('no cuenta lo que la fase desbloquea', () => {
    writeFileSync(path.join(raiz, 'features/x.feature'), 'y');
    escribirFicheros(raiz, { 'features/nueva.feature': 'n' });
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'specs')).toEqual([]);
    expect(problemasDeIntegridad(raiz, ENTRADAS, 'impl')).toHaveLength(2);
  });
});

describe('estadoConHead', () => {
  it('distingue igual, cambiado, nuevo, borrado y ausente', () => {
    writeFileSync(path.join(raiz, 'docs/a.md'), 'b');
    rmSync(path.join(raiz, 'features/x.feature'));
    escribirFicheros(raiz, { 'features/nueva.feature': 'n' });
    const rutas = ['docs/a.md', 'features/x.feature', 'features/nueva.feature', 'src/libre.ts', 'no/existe'];
    expect(estadoConHead(raiz, rutas)).toEqual(
      new Map([
        ['docs/a.md', 'cambiado'],
        ['features/x.feature', 'borrado'],
        ['features/nueva.feature', 'nuevo'],
        ['src/libre.ts', 'igual'],
        ['no/existe', 'ausente'],
      ]),
    );
  });

  it('sin commits, lo que existe es nuevo', () => {
    const vacio = directorioTemporal();
    spawnSync('git', ['init', '--quiet'], { cwd: vacio });
    escribirFicheros(vacio, { 'a.txt': 'a' });
    expect(estadoConHead(vacio, ['a.txt', 'b.txt'])).toEqual(
      new Map([
        ['a.txt', 'nuevo'],
        ['b.txt', 'ausente'],
      ]),
    );
    expect(ficherosDeHead(vacio)).toEqual([]);
  });
});

describe('ficherosDeHead', () => {
  it('lista los ficheros del último commit', () => {
    expect(ficherosDeHead(raiz)).toEqual([
      '.claude/settings.json',
      '.gitignore',
      'docs/a.md',
      'features/x.feature',
      'src/libre.ts',
    ]);
  });
});
