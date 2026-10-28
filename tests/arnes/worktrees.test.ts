import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fijarFase } from '../../scripts/arnes/comun/ajustes-locales.ts';
import { faseYAreaDelCheckout } from '../../scripts/arnes/comun/checkout.ts';
import { RAMA_DE_ORIGEN, ramasDelCarril } from '../../scripts/arnes/comun/ramas.ts';
import { rutaDelRelevo } from '../../scripts/arnes/comun/relevo.ts';
import {
  abrirWorktree,
  directorioDeWorktree,
  pasarALaRamaSiguiente,
  problemaParaCambiarLaFase,
  retirarWorktree,
} from '../../scripts/arnes/comun/worktrees.ts';
import type { PeticionDeWorktree, Resultado } from '../../scripts/arnes/comun/worktrees.ts';
import { commit, fusionarComoGitHub, gitBien, otroPrFusionado, principalConOrigen } from './origen.ts';
import { escribirFicheros } from './temporal.ts';

const PASOS: PeticionDeWorktree = { nombre: 'pasos', fase: 'impl', area: 'MATE' };

/**
 * Carpeta principal con origin, el área MATE y el área DIAG, ya cerrada. Tiene node_modules y unos
 * ajustes locales con permisos, que los carriles no heredan.
 */
function principal(): string {
  const raiz = principalConOrigen({
    'config/alcance.json': JSON.stringify({ areas_cerradas: ['DIAG'] }),
    'features/MATE.feature':
      '# language: es\n@MATE\nCaracterística: MATE\n\n  @MATE-1.1\n  Escenario: E\n    Dado algo\n',
    'features/DIAG.feature':
      '# language: es\n@DIAG\nCaracterística: DIAG\n\n  @DIAG-1.1\n  Escenario: E\n    Dado algo\n',
  });
  escribirFicheros(raiz, { '.claude/settings.local.json': JSON.stringify({ permissions: { allow: ['Bash(ls)'] } }) });
  mkdirSync(path.join(raiz, 'node_modules'));
  return raiz;
}

/** El carril «pasos» de la carpeta principal, abierto en impl/MATE. */
function abierto(raiz: string): string {
  expect(abrirWorktree(raiz, PASOS).ok).toBe(true);
  return directorioDeWorktree(raiz, PASOS.nombre);
}

/** El carril «pasos» después de un PR suyo que GitHub ya ha fusionado. */
function conPrFusionado(raiz: string): string {
  const carril = abierto(raiz);
  commit(carril, 'mi PR', { 'a.txt': 'a\n' });
  fusionarComoGitHub(carril, 'impl/MATE/pasos');
  return carril;
}

function ramaDe(checkout: string): string {
  return gitBien(checkout, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

function asunto(checkout: string, referencia: string): string {
  return gitBien(checkout, ['log', '-1', '--format=%s', referencia]).trim();
}

function dejarRelevo(checkout: string): void {
  const relevo = rutaDelRelevo(checkout);
  mkdirSync(path.dirname(relevo), { recursive: true });
  writeFileSync(relevo, '## Relevo\n');
}

/** Los mensajes de un resultado que se niega, en un solo texto. */
function negativa(resultado: Resultado): string {
  expect(resultado.ok).toBe(false);
  return resultado.mensajes.join('\n');
}

describe('abrirWorktree', () => {
  it('crea la rama <fase>/<ÁREA>/<carril> desde origin/main recién traído, sin upstream y sin mover main', () => {
    const raiz = principal();
    otroPrFusionado(raiz);
    const resultado = abrirWorktree(raiz, PASOS);
    expect(resultado.ok).toBe(true);
    expect(resultado.mensajes.at(-1)).toBe('Entra en el carril pasos.');
    const carril = directorioDeWorktree(raiz, 'pasos');
    expect(ramaDe(carril)).toBe('impl/MATE/pasos');
    expect(asunto(carril, 'HEAD')).toBe('otro PR');
    expect(asunto(raiz, 'main')).toBe('inicial');
    expect(gitBien(carril, ['for-each-ref', '--format=%(upstream)', 'refs/heads/impl/MATE/pasos']).trim()).toBe('');
  });

  it('enlaza el node_modules de la carpeta principal y fija la fase y el área, sin sus permisos', () => {
    const raiz = principal();
    const carril = abierto(raiz);
    const enlace = path.join(carril, 'node_modules');
    expect(lstatSync(enlace).isSymbolicLink()).toBe(true);
    expect(readlinkSync(enlace)).toBe(path.join(raiz, 'node_modules'));
    expect(faseYAreaDelCheckout(carril)).toEqual({ fase: 'impl', area: 'MATE' });
    const ajustes = JSON.parse(readFileSync(path.join(carril, '.claude/settings.local.json'), 'utf8')) as object;
    expect(ajustes).not.toHaveProperty('permissions');
  });

  it('se niega sin área, con un nombre que no vale o con un área cerrada, y no crea nada', () => {
    const raiz = principal();
    expect(negativa(abrirWorktree(raiz, { ...PASOS, area: undefined }))).toMatch(/necesita área/);
    expect(negativa(abrirWorktree(raiz, { ...PASOS, nombre: 'Pasos' }))).toMatch(/no vale como nombre de carril/);
    expect(negativa(abrirWorktree(raiz, { ...PASOS, nombre: 'pasos-2' }))).toMatch(/no vale como nombre de carril/);
    expect(negativa(abrirWorktree(raiz, { ...PASOS, area: 'DIAG' }))).toMatch(/DIAG ya está cerrada/);
    expect(existsSync(directorioDeWorktree(raiz, 'pasos'))).toBe(false);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual([]);
  });

  it('se niega si el carril ya tiene ramas o ya existe su directorio', () => {
    const conRama = principal();
    gitBien(conRama, ['branch', 'specs/MATE/pasos-3']);
    expect(negativa(abrirWorktree(conRama, PASOS))).toMatch(/ya tiene ramas \(specs\/MATE\/pasos-3\)/);
    const conDirectorio = principal();
    mkdirSync(directorioDeWorktree(conDirectorio, 'pasos'));
    expect(negativa(abrirWorktree(conDirectorio, PASOS))).toMatch(/Ya existe .*-pasos\./);
  });

  it('se niega sin origin', () => {
    const raiz = principal();
    gitBien(raiz, ['remote', 'remove', 'origin']);
    expect(negativa(abrirWorktree(raiz, PASOS))).toMatch(/git fetch origin ha fallado/);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual([]);
  });
});

describe('pasarALaRamaSiguiente', () => {
  it('fusionado el PR, pasa a la rama siguiente desde origin/main, aunque haya un relevo', () => {
    const carril = conPrFusionado(principal());
    dejarRelevo(carril);
    const resultado = pasarALaRamaSiguiente(carril);
    expect(resultado.mensajes).toEqual([
      'El carril pasos deja impl/MATE/pasos, ya fusionada, y sigue en impl/MATE/pasos-2.',
    ]);
    expect(ramaDe(carril)).toBe('impl/MATE/pasos-2');
    expect(gitBien(carril, ['rev-parse', 'HEAD'])).toBe(gitBien(carril, ['rev-parse', RAMA_DE_ORIGEN]));
    expect(asunto(carril, 'HEAD')).toBe('mi PR');
  });

  it('una rama sin commits propios cuenta como fusionada; la siguiente lleva la fase que tiene ahora el carril', () => {
    const carril = abierto(principal());
    fijarFase(carril, { fase: 'specs', area: 'MATE' });
    expect(pasarALaRamaSiguiente(carril).ok).toBe(true);
    expect(ramaDe(carril)).toBe('specs/MATE/pasos-2');
  });

  it('se niega con la rama sin fusionar o con cambios sin commitear, y sigue en la misma rama', () => {
    const sinFusionar = abierto(principal());
    commit(sinFusionar, 'mi PR', { 'a.txt': 'a\n' });
    expect(negativa(pasarALaRamaSiguiente(sinFusionar))).toMatch(/Sin fusionar en origin\/main: impl\/MATE\/pasos\./);
    const conCambios = abierto(principal());
    escribirFicheros(conCambios, { 'a.txt': 'a\n' });
    expect(negativa(pasarALaRamaSiguiente(conCambios))).toMatch(/tiene cambios sin commitear/);
    expect([ramaDe(sinFusionar), ramaDe(conCambios)]).toEqual(['impl/MATE/pasos', 'impl/MATE/pasos']);
  });

  it('se niega en la carpeta principal y en un carril sin área', () => {
    const raiz = principal();
    expect(negativa(pasarALaRamaSiguiente(raiz))).toMatch(/es el directorio principal, que sigue en main/);
    const carril = abierto(raiz);
    fijarFase(carril, { fase: 'impl', area: undefined });
    expect(negativa(pasarALaRamaSiguiente(carril))).toMatch(/necesita área.*make fase N=pasos/);
  });
});

describe('problemaParaCambiarLaFase', () => {
  it('ninguno si la rama del carril está fusionada', () => {
    const raiz = principal();
    conPrFusionado(raiz);
    expect(problemaParaCambiarLaFase(raiz, { ...PASOS, fase: 'specs' })).toBeUndefined();
  });

  it('se niega sin área, con un área cerrada, con un nombre que no vale o con un carril que no existe', () => {
    const raiz = principal();
    abierto(raiz);
    expect(problemaParaCambiarLaFase(raiz, { ...PASOS, area: undefined })).toMatch(/necesita área/);
    expect(problemaParaCambiarLaFase(raiz, { ...PASOS, area: 'DIAG' })).toMatch(/DIAG ya está cerrada/);
    expect(problemaParaCambiarLaFase(raiz, { ...PASOS, nombre: 'Pasos' })).toMatch(/no vale como nombre de carril/);
    expect(problemaParaCambiarLaFase(raiz, { ...PASOS, nombre: 'otro' })).toMatch(/No hay un carril .*-otro\./);
  });

  it('se niega con un relevo pendiente, con cambios sin commitear y con un commit sin PR fusionado', () => {
    const raiz = principal();
    const carril = abierto(raiz);
    dejarRelevo(carril);
    expect(problemaParaCambiarLaFase(raiz, PASOS)).toMatch(/Relevo pendiente en .*relevo\.md/);
    rmSync(rutaDelRelevo(carril));
    escribirFicheros(carril, { 'a.txt': 'a\n' });
    expect(problemaParaCambiarLaFase(raiz, PASOS)).toMatch(/tiene cambios sin commitear/);
    commit(carril, 'mi PR', {});
    expect(problemaParaCambiarLaFase(raiz, PASOS)).toMatch(/Sin fusionar en origin\/main: impl\/MATE\/pasos\./);
  });
});

describe('retirarWorktree', () => {
  it('borra el carril y todas sus ramas, fusionadas, y deja el node_modules de la carpeta principal', () => {
    const raiz = principal();
    const carril = conPrFusionado(raiz);
    expect(pasarALaRamaSiguiente(carril).ok).toBe(true);
    commit(carril, 'mi PR 2', { 'b.txt': 'b\n' });
    fusionarComoGitHub(carril, 'impl/MATE/pasos-2');
    const resultado = retirarWorktree(raiz, 'pasos');
    expect(resultado.mensajes).toEqual([
      `Retirados el carril ${carril} y sus ramas: impl/MATE/pasos, impl/MATE/pasos-2.`,
    ]);
    expect(existsSync(carril)).toBe(false);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual([]);
    expect(existsSync(path.join(raiz, 'node_modules'))).toBe(true);
  });

  it('sin el directorio del carril, borra sus ramas', () => {
    const raiz = principal();
    const carril = abierto(raiz);
    gitBien(raiz, ['worktree', 'remove', carril]);
    expect(retirarWorktree(raiz, 'pasos').ok).toBe(true);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual([]);
  });

  it('se niega si una rama no está fusionada, y nombra solo esa', () => {
    const raiz = principal();
    const carril = abierto(raiz);
    expect(pasarALaRamaSiguiente(carril).ok).toBe(true);
    commit(carril, 'mi PR 2', { 'b.txt': 'b\n' });
    expect(negativa(retirarWorktree(raiz, 'pasos'))).toMatch(/Sin fusionar en origin\/main: impl\/MATE\/pasos-2\./);
    expect(existsSync(carril)).toBe(true);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual(['impl/MATE/pasos', 'impl/MATE/pasos-2']);
  });

  it('se niega con un relevo pendiente o con cambios sin commitear, y no borra nada', () => {
    const raiz = principal();
    const carril = abierto(raiz);
    dejarRelevo(carril);
    expect(negativa(retirarWorktree(raiz, 'pasos'))).toMatch(/Relevo pendiente/);
    rmSync(rutaDelRelevo(carril));
    escribirFicheros(carril, { 'a.txt': 'a\n' });
    expect(negativa(retirarWorktree(raiz, 'pasos'))).toMatch(/tiene cambios sin commitear/);
    expect(existsSync(carril)).toBe(true);
    expect(ramasDelCarril(raiz, 'pasos')).toEqual(['impl/MATE/pasos']);
  });

  it('se niega con un carril que no existe o con un nombre que no vale', () => {
    const raiz = principal();
    expect(negativa(retirarWorktree(raiz, 'otro'))).toMatch(/No hay un carril otro/);
    expect(negativa(retirarWorktree(raiz, 'Pasos'))).toMatch(/no vale como nombre de carril/);
  });
});
