import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { hayCambiosSinCommitear } from '../../scripts/arnes/comun/git.ts';
import { directorioTemporal, escribirFicheros, gitEn, repositorioConCommit } from './temporal.ts';

let raiz: string;

beforeEach(() => {
  raiz = repositorioConCommit({ '.gitignore': 'reports/\n', 'src/a.ts': 'a' });
});

describe('hayCambiosSinCommitear', () => {
  it('es false con el árbol igual que el último commit, aunque haya ficheros ignorados', () => {
    escribirFicheros(raiz, { 'reports/informe.md': 'local' });
    expect(hayCambiosSinCommitear(raiz)).toBe(false);
  });

  it('es true si un fichero ha cambiado, se ha borrado o es nuevo', () => {
    writeFileSync(path.join(raiz, 'src/a.ts'), 'b');
    expect(hayCambiosSinCommitear(raiz)).toBe(true);
    gitEn(raiz, ['checkout', '--quiet', '--', 'src/a.ts']);
    rmSync(path.join(raiz, 'src/a.ts'));
    expect(hayCambiosSinCommitear(raiz)).toBe(true);
    gitEn(raiz, ['checkout', '--quiet', '--', 'src/a.ts']);
    escribirFicheros(raiz, { 'src/nuevo.ts': '' });
    expect(hayCambiosSinCommitear(raiz)).toBe(true);
  });

  it('falla fuera de un repositorio, para que el hook bloquee en vez de dejar pasar', () => {
    expect(() => hayCambiosSinCommitear(directorioTemporal())).toThrow('git status ha fallado');
  });
});
