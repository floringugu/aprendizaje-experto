import { realpathSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUTA_AJUSTES_LOCALES } from '../../scripts/arnes/comun/ajustes-locales.ts';
import {
  checkoutDeLaEntrada,
  checkoutDelRepositorio,
  esArea,
  faseYAreaDelCheckout,
  nombreDelCarril,
  raizDelCheckout,
} from '../../scripts/arnes/comun/checkout.ts';
import { directorioTemporal, escribirFicheros, gitEn, repositorioConCommit } from './temporal.ts';

/** Repositorio con un worktree en la carpeta `carpeta` (dentro de otro directorio temporal). */
function repositorioConWorktree(carpeta: (principal: string) => string): { principal: string; worktree: string } {
  const principal = realpathSync(repositorioConCommit({ 'src/a.ts': '' }));
  const worktree = path.join(realpathSync(directorioTemporal()), carpeta(principal));
  gitEn(principal, ['worktree', 'add', '--quiet', '-b', 'carril', worktree]);
  return { principal, worktree };
}

function conAjustes(env: Record<string, unknown>): string {
  const raiz = directorioTemporal();
  escribirFicheros(raiz, { [RUTA_AJUSTES_LOCALES]: JSON.stringify({ env }) });
  return raiz;
}

describe('esArea', () => {
  it('acepta prefijos de 2 a 6 mayúsculas y nada más', () => {
    expect(['MA', 'MATE', 'ABCDEF'].map(esArea)).toEqual([true, true, true]);
    expect(['', 'M', 'mate', 'ABCDEFG', 'MATE-1'].map(esArea)).toEqual([false, false, false, false, false]);
  });
});

describe('raizDelCheckout', () => {
  it('da la raíz desde un directorio, un fichero o una ruta que aún no existe', () => {
    const raiz = realpathSync(repositorioConCommit({ 'src/a.ts': '' }));
    expect(raizDelCheckout(raiz)).toBe(raiz);
    expect(raizDelCheckout(path.join(raiz, 'src/a.ts'))).toBe(raiz);
    expect(raizDelCheckout(path.join(raiz, 'src/nuevo/b.ts'))).toBe(raiz);
  });

  it('da undefined fuera de un repositorio', () => {
    expect(raizDelCheckout(directorioTemporal())).toBeUndefined();
  });
});

describe('checkoutDelRepositorio', () => {
  it('da el checkout de la ruta si es del mismo repositorio, también un worktree', () => {
    const { principal, worktree } = repositorioConWorktree(() => 'otro');
    expect(checkoutDelRepositorio(principal, path.join(principal, 'src'))).toBe(principal);
    expect(checkoutDelRepositorio(principal, path.join(worktree, 'src/a.ts'))).toBe(worktree);
    expect(checkoutDelRepositorio(worktree, principal)).toBe(principal);
  });

  it('da undefined en otro repositorio, como un clon del scratchpad, o fuera de uno', () => {
    const raiz = repositorioConCommit({ 'src/a.ts': '' });
    expect(checkoutDelRepositorio(raiz, repositorioConCommit({ 'src/a.ts': '' }))).toBeUndefined();
    expect(checkoutDelRepositorio(raiz, directorioTemporal())).toBeUndefined();
  });
});

describe('checkoutDeLaEntrada', () => {
  it('da el checkout del cwd de la entrada si es del repositorio y, si no, la raíz', () => {
    const { principal, worktree } = repositorioConWorktree(() => 'otro');
    expect(checkoutDeLaEntrada(principal, { cwd: path.join(worktree, 'src') })).toBe(worktree);
    expect(checkoutDeLaEntrada(principal, { cwd: repositorioConCommit({ 'src/a.ts': '' }) })).toBe(principal);
    expect(checkoutDeLaEntrada(principal, {})).toBe(principal);
  });
});

describe('faseYAreaDelCheckout', () => {
  it('sin ajustes, la fase es impl y no hay área en curso', () => {
    expect(faseYAreaDelCheckout(directorioTemporal())).toEqual({ fase: 'impl', area: undefined });
  });

  it('lee la fase y el área de los ajustes locales del checkout', () => {
    expect(faseYAreaDelCheckout(conAjustes({ ARNES_FASE: 'aceptacion', ARNES_AREA: 'MATE' }))).toEqual({
      fase: 'aceptacion',
      area: 'MATE',
    });
    expect(faseYAreaDelCheckout(conAjustes({ ARNES_FASE: 'specs', ARNES_AREA: '' }))).toEqual({
      fase: 'specs',
      area: undefined,
    });
  });

  it('se niega a una fase o un área no válidas', () => {
    expect(() => faseYAreaDelCheckout(conAjustes({ ARNES_FASE: 'libre' }))).toThrow(/ARNES_FASE="libre" no es válida/);
    expect(() => faseYAreaDelCheckout(conAjustes({ ARNES_FASE: 3 }))).toThrow(/no es válida/);
    expect(() => faseYAreaDelCheckout(conAjustes({ ARNES_AREA: 'mate' }))).toThrow(
      /ARNES_AREA="mate" no es un prefijo de área/,
    );
  });
});

describe('nombreDelCarril', () => {
  it('no hay carril en el directorio principal', () => {
    const { principal } = repositorioConWorktree(() => 'otro');
    expect(nombreDelCarril(principal)).toBeUndefined();
  });

  it('en un worktree, es el nombre de su carpeta sin el prefijo del directorio principal', () => {
    const { worktree } = repositorioConWorktree((principal) => `${path.basename(principal)}-mate-pasos`);
    expect(nombreDelCarril(worktree)).toBe('mate-pasos');
  });

  it('sin el prefijo, es el nombre entero de la carpeta', () => {
    const { worktree } = repositorioConWorktree(() => 'otro');
    expect(nombreDelCarril(worktree)).toBe('otro');
  });
});
