import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { git } from '../../scripts/arnes/comun/git.ts';
import {
  esNombreDeCarril,
  estaFusionada,
  faseYAreaDeLaRama,
  leerNombreDeRama,
  nombreDeRama,
  RAMA_DE_ORIGEN,
  ramasDelCarril,
  siguienteRama,
  traerOrigen,
} from '../../scripts/arnes/comun/ramas.ts';
import { commit, fusionarComoGitHub, gitBien, otroPrFusionado, principalConOrigen } from './origen.ts';
import { directorioTemporal, escribirFicheros, repositorioConCommit } from './temporal.ts';

describe('esNombreDeCarril', () => {
  it('acepta minúsculas, números y guiones, con cada tramo empezando por una letra, hasta 31', () => {
    expect(['pasos', 'mate-pasos', 'p2', 'a-b2-c', 'a'.repeat(31)].filter(esNombreDeCarril)).toHaveLength(5);
  });

  it('rechaza mayúsculas, tramos que empiezan por un número, guiones de más y nombres más largos', () => {
    const malos = ['', 'Pasos', 'pasos-2', '2pasos', '-pasos', 'pasos-', 'a--b', 'pa_sos', 'pa/sos', 'a'.repeat(32)];
    expect(malos.filter(esNombreDeCarril)).toEqual([]);
  });
});

describe('nombreDeRama y leerNombreDeRama', () => {
  it('la primera rama del carril no lleva número; las siguientes, «-2», «-3»…', () => {
    expect(nombreDeRama({ fase: 'impl', area: 'MATE', carril: 'pasos', numero: 1 })).toBe('impl/MATE/pasos');
    expect(nombreDeRama({ fase: 'specs', area: 'DIAG', carril: 'mate-pasos', numero: 12 })).toBe(
      'specs/DIAG/mate-pasos-12',
    );
  });

  it('leerNombreDeRama deshace nombreDeRama: el número del final no se confunde con el carril', () => {
    expect(leerNombreDeRama('impl/MATE/pasos')).toEqual({ fase: 'impl', area: 'MATE', carril: 'pasos', numero: 1 });
    expect(leerNombreDeRama('aceptacion/DIAG/mate-pasos-2')).toEqual({
      fase: 'aceptacion',
      area: 'DIAG',
      carril: 'mate-pasos',
      numero: 2,
    });
    expect(leerNombreDeRama('impl/MATE/pasos-10')?.numero).toBe(10);
  });

  it('da undefined si el nombre no sigue el formato', () => {
    const otros = [
      'main',
      'pasos',
      'impl/MATE',
      'otra/MATE/pasos',
      'impl/mate/pasos',
      'impl/MATEMAT/pasos',
      'impl/MATE/Pasos',
      'impl/MATE/pasos-1',
      'impl/MATE/pasos-02',
      'x/impl/MATE/pasos',
      'impl/MATE/pasos/x',
      `impl/MATE/${'a'.repeat(32)}`,
    ];
    expect(otros.filter((nombre) => leerNombreDeRama(nombre) !== undefined)).toEqual([]);
  });
});

describe('faseYAreaDeLaRama', () => {
  const raiz = directorioTemporal();
  escribirFicheros(raiz, {
    'features/mate.feature': '# language: es\n@MATE\nCaracterística: M\n\n  @MATE-1.1\n  Escenario: E\n    Dado algo\n',
  });

  it('lee la fase y el área del nombre, si el área existe en features/', () => {
    expect(faseYAreaDeLaRama(raiz, 'aceptacion/MATE/pasos-2')).toEqual({ fase: 'aceptacion', area: 'MATE' });
    expect(faseYAreaDeLaRama(raiz, 'impl/DIAG/pasos')).toEqual({
      problema: expect.stringMatching(/DIAG no existe en features/) as unknown,
    });
  });

  it('rechaza un nombre fuera del formato, también el vacío', () => {
    expect(faseYAreaDeLaRama(raiz, 'migracion')).toEqual({
      problema: expect.stringMatching(/no sigue el formato/) as unknown,
    });
    expect(faseYAreaDeLaRama(raiz, '')).toEqual({ problema: expect.stringMatching(/no sigue el formato/) as unknown });
  });
});

describe('ramasDelCarril y siguienteRama', () => {
  it('cuentan las ramas locales del carril, de cualquier fase y área, y siguen por el número más alto', () => {
    const raiz = repositorioConCommit({ 'a.txt': '' });
    for (const rama of [
      'impl/MATE/pasos',
      'specs/DIAG/pasos-3',
      'impl/MATE/pasos-largo',
      'impl/MATE/otro-4',
      'pasos-5',
    ]) {
      gitBien(raiz, ['branch', rama]);
    }
    expect(ramasDelCarril(raiz, 'pasos')).toEqual(['impl/MATE/pasos', 'specs/DIAG/pasos-3']);
    expect(siguienteRama(raiz, { fase: 'aceptacion', area: 'MATE', carril: 'pasos' })).toBe('aceptacion/MATE/pasos-4');
  });

  it('sin ramas del carril, la siguiente es la primera, sin número', () => {
    const raiz = repositorioConCommit({ 'a.txt': '' });
    expect(ramasDelCarril(raiz, 'pasos')).toEqual([]);
    expect(siguienteRama(raiz, { fase: 'impl', area: 'MATE', carril: 'pasos' })).toBe('impl/MATE/pasos');
  });
});

describe('traerOrigen', () => {
  it('trae lo último de origin', () => {
    const principal = principalConOrigen({});
    otroPrFusionado(principal);
    expect(traerOrigen(principal)).toBeUndefined();
    expect(git(principal, ['log', '-1', '--format=%s', RAMA_DE_ORIGEN]).salida.trim()).toBe('otro PR');
  });

  it('dice el motivo si no hay origin o si origin no tiene main', () => {
    expect(traerOrigen(repositorioConCommit({ 'a.txt': '' }))).toMatch(/git fetch origin ha fallado/);
    const principal = principalConOrigen({});
    const vacio = path.join(path.dirname(principal), 'vacio.git');
    gitBien(principal, ['init', '--quiet', '--bare', vacio]);
    gitBien(principal, ['remote', 'set-url', 'origin', vacio]);
    gitBien(principal, ['update-ref', '-d', `refs/remotes/${RAMA_DE_ORIGEN}`]);
    expect(traerOrigen(principal)).toMatch(/origin no tiene la rama main/);
  });
});

describe('estaFusionada', () => {
  const RAMA = 'impl/MATE/pasos';

  function principalConRama(): string {
    const principal = principalConOrigen({ 'a.txt': 'a\n' });
    gitBien(principal, ['switch', '--quiet', '-c', RAMA]);
    commit(principal, 'uno', { 'b.txt': 'b\n' });
    commit(principal, 'dos', { 'c.txt': 'c\n' });
    return principal;
  }

  it('sí, si GitHub ha copiado cada commit de la rama en main, aunque main no tenga los de la rama', () => {
    const principal = principalConRama();
    expect(estaFusionada(principal, RAMA)).toBe(false);
    fusionarComoGitHub(principal, RAMA);
    expect(traerOrigen(principal)).toBeUndefined();
    expect(git(principal, ['merge-base', '--is-ancestor', RAMA, RAMA_DE_ORIGEN]).codigo).toBe(1);
    expect(estaFusionada(principal, RAMA)).toBe(true);
  });

  it('no, si a main le falta un solo commit de la rama', () => {
    const principal = principalConRama();
    fusionarComoGitHub(principal, RAMA);
    commit(principal, 'tres', { 'd.txt': 'd\n' });
    expect(traerOrigen(principal)).toBeUndefined();
    expect(estaFusionada(principal, RAMA)).toBe(false);
  });

  it('una rama sin commits propios, también; una que no existe, no', () => {
    const principal = principalConOrigen({});
    gitBien(principal, ['branch', RAMA]);
    expect(estaFusionada(principal, RAMA)).toBe(true);
    expect(estaFusionada(principal, 'impl/MATE/nada')).toBe(false);
  });
});
