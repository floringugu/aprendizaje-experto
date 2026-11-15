import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { crearLote } from '../../scripts/arnes/comun/lote.ts';
import { loteDeLaRama, RAMA_DE_ORIGEN } from '../../scripts/arnes/comun/ramas.ts';
import {
  abrirWorktree,
  directorioDeWorktree,
  pasarALaRamaSiguiente,
  retirarWorktree,
} from '../../scripts/arnes/comun/worktrees.ts';
import { asunto, conTickets, negativa, PASOS, principal, ramaDe, SOLO_NOMBRE } from './carriles-de-prueba.ts';
import { commit, fusionarComoGitHub, fusionarLoteComoGitHub, gitBien, prFusionadoEnLote } from './origen.ts';
import { texto } from './tickets-de-prueba.ts';

describe('los carriles que salen de un lote', () => {
  const LOTE = 'lote/1';
  const DEL_LOTE = { ...PASOS, lote: LOTE };

  /** Carpeta principal con lote/1 en origin, y en él un PR ya fusionado que main no tiene. */
  function conLote(): string {
    const raiz = principal();
    expect(crearLote(raiz, LOTE)).toBeUndefined();
    prFusionadoEnLote(raiz, { rama: 'aceptacion/MATE/antes', lote: LOTE, ficheros: { 'antes.txt': 'a\n' } });
    gitBien(raiz, ['switch', '--quiet', 'main']);
    return raiz;
  }

  /** El carril «pasos», que sale del lote, con un commit sin subir. */
  function abiertoEnLote(raiz: string): string {
    expect(abrirWorktree(raiz, DEL_LOTE).ok).toBe(true);
    const carril = directorioDeWorktree(raiz, 'pasos');
    commit(carril, 'mi PR', { 'a.txt': 'a\n' });
    return carril;
  }

  it('abrirWorktree crea la rama desde el lote, sin upstream, y le apunta el lote', () => {
    const raiz = conLote();
    const resultado = abrirWorktree(raiz, DEL_LOTE);
    expect(resultado.mensajes.join('\n')).toContain('en la rama impl/MATE/pasos (desde origin/lote/1)');
    const carril = directorioDeWorktree(raiz, 'pasos');
    expect(asunto(carril, 'HEAD')).toBe('trabajo de aceptacion/MATE/antes');
    expect(loteDeLaRama(raiz, 'impl/MATE/pasos')).toBe(LOTE);
    expect(gitBien(carril, ['for-each-ref', '--format=%(upstream)', 'refs/heads/impl/MATE/pasos']).trim()).toBe('');
  });

  it('abrirWorktree evalúa el ticket contra el lote: cuenta la dependencia que la noche ya fusionó en él', () => {
    const raiz = conTickets({ pasos: { depende: '[antes]' }, antes: { fase: 'aceptacion' } });
    expect(crearLote(raiz, LOTE)).toBeUndefined();
    const hecho = { 'docs/tickets/antes.md': texto({ fase: 'aceptacion', estado: 'hecho' }) };
    prFusionadoEnLote(raiz, { rama: 'aceptacion/MATE/antes', lote: LOTE, ficheros: hecho });
    gitBien(raiz, ['switch', '--quiet', 'main']);
    gitBien(raiz, ['branch', '-D', 'aceptacion/MATE/antes']);
    expect(negativa(abrirWorktree(raiz, SOLO_NOMBRE))).toMatch(/no está listo: falta antes\./);
    expect(abrirWorktree(raiz, { ...SOLO_NOMBRE, lote: LOTE }).ok).toBe(true);
    expect(ramaDe(directorioDeWorktree(raiz, 'pasos'))).toBe('impl/MATE/pasos');
  });

  it('make rama se niega mientras el lote no tenga los commits de la rama', () => {
    const carril = abiertoEnLote(conLote());
    expect(negativa(pasarALaRamaSiguiente(carril))).toMatch(/Sin fusionar en origin\/lote\/1: impl\/MATE\/pasos\./);
  });

  it('make rama sigue en el lote mientras main no lo tenga, y vuelve a origin/main cuando lo tiene', () => {
    const raiz = conLote();
    const carril = abiertoEnLote(raiz);
    fusionarComoGitHub(carril, 'impl/MATE/pasos', LOTE);
    expect(pasarALaRamaSiguiente(carril).mensajes).toEqual([
      'El carril pasos deja impl/MATE/pasos, ya fusionada, y sigue en impl/MATE/pasos-2, que sale de origin/lote/1: su PR va a lote/1.',
    ]);
    expect(loteDeLaRama(raiz, 'impl/MATE/pasos-2')).toBe(LOTE);
    expect(gitBien(carril, ['rev-parse', 'HEAD'])).toBe(gitBien(carril, ['rev-parse', 'origin/lote/1']));

    fusionarLoteComoGitHub(raiz, LOTE);
    expect(pasarALaRamaSiguiente(carril).mensajes).toEqual([
      'El carril pasos deja impl/MATE/pasos-2, ya fusionada, y sigue en impl/MATE/pasos-3.',
    ]);
    expect(loteDeLaRama(raiz, 'impl/MATE/pasos-3')).toBeUndefined();
    expect(gitBien(carril, ['rev-parse', 'HEAD'])).toBe(gitBien(carril, ['rev-parse', RAMA_DE_ORIGEN]));
  });

  it('retirarWorktree retira un carril fusionado en el lote, y con la rama se va su apunte del lote', () => {
    const raiz = conLote();
    const carril = abiertoEnLote(raiz);
    fusionarComoGitHub(carril, 'impl/MATE/pasos', LOTE);
    expect(retirarWorktree(raiz, 'pasos').ok).toBe(true);
    expect(existsSync(carril)).toBe(false);
    expect(gitBien(raiz, ['config', '--get-regexp', String.raw`^branch\.`]).includes('impl/MATE/pasos')).toBe(false);
  });

  it('retirarWorktree agrupa las ramas sin fusionar por su origen', () => {
    const raiz = conLote();
    abiertoEnLote(raiz);
    gitBien(raiz, ['branch', 'impl/MATE/pasos-2', 'impl/MATE/pasos']);
    expect(negativa(retirarWorktree(raiz, 'pasos'))).toContain(
      'Sin fusionar en origin/lote/1: impl/MATE/pasos. Sin fusionar en origin/main: impl/MATE/pasos-2. Espera',
    );
  });
});
