import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { git } from '../../scripts/arnes/comun/git.ts';
import {
  abrirWorktree,
  directorioDeWorktree,
  integrarWorktree,
  retirarWorktree,
} from '../../scripts/arnes/comun/worktrees.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

const IDENTIDAD = {
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

// Las funciones del arnés llaman a git sin identidad: se la damos por el entorno del proceso.
beforeAll(() => {
  for (const [clave, valor] of Object.entries(IDENTIDAD)) {
    vi.stubEnv(clave, valor);
  }
});
afterAll(() => {
  vi.unstubAllEnvs();
});

function commit(raiz: string, mensaje: string, ficheros: Readonly<Record<string, string>>): void {
  escribirFicheros(raiz, ficheros);
  expect(git(raiz, ['add', '-A']).codigo).toBe(0);
  expect(git(raiz, ['commit', '--quiet', '-m', mensaje]).codigo).toBe(0);
}

/** Repositorio «<padre>/principal» en main, con un área MATE en features/ y ajustes locales propios. */
function repositorioPrincipal(): string {
  const raiz = path.join(directorioTemporal(), 'principal');
  mkdirSync(raiz);
  expect(git(raiz, ['init', '--quiet', '-b', 'main']).codigo).toBe(0);
  commit(raiz, 'inicial', {
    '.gitignore': 'node_modules\n.claude/settings.local.json\n',
    'config/alcance.json': JSON.stringify({ areas_cerradas: ['DIAG'] }),
    'features/MATE.feature':
      '# language: es\n@MATE\nCaracterística: MATE\n\n  @MATE-1.1\n  Escenario: E\n    Dado algo\n',
    'features/DIAG.feature':
      '# language: es\n@DIAG\nCaracterística: DIAG\n\n  @DIAG-1.1\n  Escenario: E\n    Dado algo\n',
    'comun.txt': 'uno\n',
  });
  escribirFicheros(raiz, { '.claude/settings.local.json': JSON.stringify({ permissions: { allow: ['Bash(ls)'] } }) });
  mkdirSync(path.join(raiz, 'node_modules'));
  return raiz;
}

const sinEditor = (): void => undefined;

function abierto(raiz: string, nombre = 'mate'): string {
  const resultado = abrirWorktree(raiz, { nombre, fase: 'impl', area: 'MATE' }, sinEditor);
  expect(resultado.ok).toBe(true);
  return directorioDeWorktree(raiz, nombre);
}

describe('abrirWorktree', () => {
  it('crea la rama y el directorio hermano, enlaza node_modules y fija la fase y el área', () => {
    const raiz = repositorioPrincipal();
    const abiertos: string[] = [];
    const resultado = abrirWorktree(raiz, { nombre: 'mate', fase: 'impl', area: 'MATE' }, (d) => abiertos.push(d));
    const directorio = directorioDeWorktree(raiz, 'mate');
    expect(resultado.ok).toBe(true);
    expect(directorio).toBe(path.join(path.dirname(raiz), 'principal-mate'));
    expect(abiertos).toEqual([directorio]);
    expect(git(directorio, ['rev-parse', '--abbrev-ref', 'HEAD']).salida.trim()).toBe('mate');
    expect(lstatSync(path.join(directorio, 'node_modules')).isSymbolicLink()).toBe(true);
    const ajustes = JSON.parse(readFileSync(path.join(directorio, '.claude/settings.local.json'), 'utf8')) as {
      env: Record<string, string>;
      permissions: unknown;
    };
    expect(ajustes.env).toEqual({ ARNES_FASE: 'impl', ARNES_AREA: 'MATE' });
    expect(ajustes.permissions).toEqual({ allow: ['Bash(ls)'] });
    expect(git(directorio, ['status', '--porcelain']).salida).toBe('');
  });

  it('se niega si el nombre, el área, la rama o el directorio no valen', () => {
    const raiz = repositorioPrincipal();
    const abre = (nombre: string, fase: 'impl' | 'aceptacion', area: string | undefined): string =>
      abrirWorktree(raiz, { nombre, fase, area }, sinEditor).mensajes.join('\n');
    expect(abre('Mate', 'impl', 'MATE')).toMatch(/no vale como nombre/);
    expect(abre('mate', 'impl', 'DIAG')).toMatch(/ya está cerrada/);
    expect(abre('mate', 'aceptacion', undefined)).toMatch(/necesita el área/);
    abierto(raiz);
    expect(abre('mate', 'impl', 'MATE')).toMatch(/Ya existe la rama mate/);
    git(raiz, ['branch', 'otra']);
    mkdirSync(directorioDeWorktree(raiz, 'otra'));
    expect(abre('otra', 'impl', 'MATE')).toMatch(/Ya existe la rama otra/);
    mkdirSync(directorioDeWorktree(raiz, 'tercera'));
    expect(abre('tercera', 'impl', 'MATE')).toMatch(/Ya existe .*principal-tercera/);
  });
});

describe('integrarWorktree', () => {
  it('pone la rama encima de main, la comprueba y avanza main en línea recta', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    commit(directorio, 'en la rama', { 'rama.txt': 'rama\n' });
    commit(raiz, 'en main', { 'main.txt': 'main\n' });
    const comprobados: string[] = [];
    const resultado = integrarWorktree(raiz, 'mate', (d) => comprobados.push(d) > 0);
    expect(resultado.ok).toBe(true);
    expect(comprobados).toEqual([directorio]);
    expect(git(raiz, ['log', '--format=%s', '-3']).salida.split('\n').filter(Boolean)).toEqual([
      'en la rama',
      'en main',
      'inicial',
    ]);
    expect(existsSync(path.join(raiz, 'rama.txt'))).toBe(true);
  });

  it('si la comprobación falla, main no se toca', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    commit(directorio, 'en la rama', { 'rama.txt': 'rama\n' });
    const antes = git(raiz, ['rev-parse', 'main']).salida;
    const resultado = integrarWorktree(raiz, 'mate', () => false);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensajes.join('\n')).toMatch(/make check falla/);
    expect(git(raiz, ['rev-parse', 'main']).salida).toBe(antes);
  });

  it('con conflictos deja el rebase a medias, da el comando para continuar y se niega a repetir hasta resolverlo', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    commit(directorio, 'rama toca', { 'comun.txt': 'rama\n' });
    commit(raiz, 'main toca', { 'comun.txt': 'main\n' });
    const comprobar = vi.fn(() => true);
    const resultado = integrarWorktree(raiz, 'mate', comprobar);
    const mensaje = resultado.mensajes.join('\n');
    expect(resultado.ok).toBe(false);
    expect(mensaje).toMatch(/Conflictos al poner mate encima de main/);
    expect(mensaje).toContain(
      `git -C ${directorio} add comun.txt && GIT_EDITOR=true git -C ${directorio} rebase --continue`,
    );
    expect(comprobar).not.toHaveBeenCalled();
    expect(integrarWorktree(raiz, 'mate', comprobar).mensajes.join('\n')).toMatch(/rebase a medias/);

    writeFileSync(path.join(directorio, 'comun.txt'), 'resuelto\n');
    expect(git(directorio, ['add', 'comun.txt']).codigo).toBe(0);
    expect(
      spawnSync('git', ['rebase', '--continue'], { cwd: directorio, env: { ...process.env, GIT_EDITOR: 'true' } })
        .status,
    ).toBe(0);
    expect(integrarWorktree(raiz, 'mate', comprobar).ok).toBe(true);
    expect(readFileSync(path.join(raiz, 'comun.txt'), 'utf8')).toBe('resuelto\n');
  });

  it('se niega con cambios sin commitear, sin worktree o con un nombre inválido', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    writeFileSync(path.join(directorio, 'comun.txt'), 'sucio\n');
    expect(integrarWorktree(raiz, 'mate', () => true).mensajes.join('\n')).toMatch(/cambios sin commitear/);
    expect(integrarWorktree(raiz, 'nada', () => true).mensajes.join('\n')).toMatch(/No hay un worktree/);
    expect(integrarWorktree(raiz, 'Nada', () => true).mensajes.join('\n')).toMatch(/no vale como nombre/);
  });
});

describe('retirarWorktree', () => {
  it('borra el directorio y la rama una vez integrada, con el enlace a node_modules y los ajustes locales dentro', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    commit(directorio, 'en la rama', { 'rama.txt': 'rama\n' });
    expect(integrarWorktree(raiz, 'mate', () => true).ok).toBe(true);
    const resultado = retirarWorktree(raiz, 'mate');
    expect(resultado.mensajes).toEqual([`Retirados el worktree ${directorio} y la rama mate.`]);
    expect(existsSync(directorio)).toBe(false);
    expect(git(raiz, ['rev-parse', '--verify', '--quiet', 'refs/heads/mate']).codigo).not.toBe(0);
    // El node_modules del principal sigue ahí: solo se borró el enlace.
    expect(existsSync(path.join(raiz, 'node_modules'))).toBe(true);
  });

  it('no retira una rama con commits que main no tiene', () => {
    const raiz = repositorioPrincipal();
    const directorio = abierto(raiz);
    commit(directorio, 'sin integrar', { 'rama.txt': 'rama\n' });
    const resultado = retirarWorktree(raiz, 'mate');
    expect(resultado.ok).toBe(false);
    expect(resultado.mensajes.join('\n')).toMatch(/tiene commits que main no tiene/);
    expect(existsSync(directorio)).toBe(true);
  });

  it('se niega si la rama no existe', () => {
    expect(retirarWorktree(repositorioPrincipal(), 'nada').mensajes.join('\n')).toMatch(/No existe la rama nada/);
  });
});

describe('el hook pre-commit en git rebase --continue', () => {
  // Plan «arnes-paralelo» §B.8: ¿salta el pre-commit al continuar un rebase con conflictos?
  // Si salta, make integrar tiene que contar con él; si no, el commit resuelto entra sin comprobar
  // y la comprobación del arnés es la de make check antes de la fusión.
  it('deja constancia de si el pre-commit corre al continuar un rebase con conflictos', () => {
    const raiz = repositorioPrincipal();
    const hooks = path.join(raiz, 'hooks');
    const marcador = path.join(raiz, 'marcador-pre-commit');
    escribirFicheros(raiz, { 'hooks/pre-commit': `#!/bin/sh\necho corrido >> '${marcador}'\n` });
    spawnSync('chmod', ['+x', path.join(hooks, 'pre-commit')]);
    git(raiz, ['config', 'core.hooksPath', hooks]);
    const directorio = abierto(raiz);
    commit(directorio, 'rama toca', { 'comun.txt': 'rama\n' });
    commit(raiz, 'main toca', { 'comun.txt': 'main\n' });
    expect(git(directorio, ['rebase', 'main']).codigo).not.toBe(0);
    const corridosAntes = existsSync(marcador) ? readFileSync(marcador, 'utf8').split('\n').filter(Boolean).length : 0;
    // Los commits normales de arriba sí lo han corrido: el marcador funciona.
    expect(corridosAntes).toBeGreaterThan(0);
    writeFileSync(path.join(directorio, 'comun.txt'), 'resuelto\n');
    git(directorio, ['add', 'comun.txt']);
    const continuar = spawnSync('git', ['rebase', '--continue'], {
      cwd: directorio,
      env: { ...process.env, GIT_EDITOR: 'true' },
    });
    expect(continuar.status).toBe(0);
    const corridosDespues = existsSync(marcador)
      ? readFileSync(marcador, 'utf8').split('\n').filter(Boolean).length
      : 0;
    // git rebase aplica los commits con «git commit -n»: el pre-commit no corre.
    expect(corridosDespues - corridosAntes).toBe(0);
  });
});
