// La carpeta principal y los ayudantes que comparten los tests de los carriles (worktrees.ts).
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import type { PeticionDeWorktree, Resultado } from '../../scripts/arnes/comun/worktrees.ts';
import { commit, gitBien, principalConOrigen } from './origen.ts';
import { escribirFicheros } from './temporal.ts';
import { texto } from './tickets-de-prueba.ts';
import type { Frontmatter } from './tickets-de-prueba.ts';

export const PASOS: PeticionDeWorktree = { nombre: 'pasos', fase: 'impl', area: 'MATE' };

/**
 * Carpeta principal con origin, el área MATE y el área DIAG, ya cerrada. Tiene node_modules y unos
 * ajustes locales con permisos, que los carriles no heredan.
 */
export function principal(): string {
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

export function ramaDe(checkout: string): string {
  return gitBien(checkout, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

export function asunto(checkout: string, referencia: string): string {
  return gitBien(checkout, ['log', '-1', '--format=%s', referencia]).trim();
}

/** Los mensajes de un resultado que se niega, en un solo texto. */
export function negativa(resultado: Resultado): string {
  expect(resultado.ok).toBe(false);
  return resultado.mensajes.join('\n');
}

/** Carpeta principal con los tickets `tickets` (id → frontmatter) ya en origin/main. */
export function conTickets(tickets: Readonly<Record<string, Frontmatter>>): string {
  const raiz = principal();
  commit(
    raiz,
    'tickets',
    Object.fromEntries(Object.entries(tickets).map(([id, f]) => [`docs/tickets/${id}.md`, texto(f)])),
  );
  gitBien(raiz, ['push', '--quiet', 'origin', 'main']);
  return raiz;
}

export const SOLO_NOMBRE = { nombre: 'pasos', fase: undefined, area: undefined };
