// Worktrees: una conversación de Claude Code = un worktree = una rama = una fase y un área
// (docs/plan.md §6). Tres operaciones del dueño, que lanza «make abrir», «make integrar» y
// «make retirar» (scripts/arnes/worktrees.ts):
//   abrir: crea la rama desde main en un directorio hermano y le fija la fase y el área;
//   integrar: rebase de la rama sobre main, comprobación y fusión «fast-forward» en main;
//   retirar: borra el worktree y la rama, que ya tienen que estar en main.
// Cada función recibe el directorio principal (la raíz con main) y devuelve lo que hay que decir.
import { existsSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fijarFase } from './ajustes-locales.ts';
import { problemaDeFaseYArea } from './alcance.ts';
import { git } from './git.ts';
import type { Fase } from './protegidas.ts';

const RAMA_PRINCIPAL = 'main';

export interface Resultado {
  readonly ok: boolean;
  readonly mensajes: readonly string[];
}

function falla(...mensajes: string[]): Resultado {
  return { ok: false, mensajes };
}

/** El directorio de la rama: «<raíz>-<nombre>», al lado de la raíz. */
export function directorioDeWorktree(raiz: string, nombre: string): string {
  return path.join(path.dirname(raiz), `${path.basename(raiz)}-${nombre}`);
}

function problemaDeNombre(nombre: string): string | undefined {
  return /^[a-z][a-z0-9-]{0,30}$/.test(nombre)
    ? undefined
    : `«${nombre}» no vale como nombre: minúsculas, números y guiones, empezando por una letra.`;
}

function existeLaRama(raiz: string, rama: string): boolean {
  return git(raiz, ['rev-parse', '--verify', '--quiet', `refs/heads/${rama}`]).codigo === 0;
}

function ramaActual(directorio: string): string {
  return git(directorio, ['rev-parse', '--abbrev-ref', 'HEAD']).salida.trim();
}

function rebaseEnCurso(directorio: string): boolean {
  return ['rebase-merge', 'rebase-apply'].some((nombre) => {
    const ruta = git(directorio, ['rev-parse', '--git-path', nombre]).salida.trim();
    return existsSync(path.resolve(directorio, ruta));
  });
}

export interface PeticionDeWorktree {
  readonly nombre: string;
  readonly fase: Fase;
  readonly area: string | undefined;
}

/** Crea el worktree y la rama desde main, enlaza node_modules, fija la fase y el área, y abre el editor. */
export function abrirWorktree(
  raiz: string,
  peticion: PeticionDeWorktree,
  abrirEditor: (directorio: string) => void,
): Resultado {
  const { nombre, fase, area } = peticion;
  const directorio = directorioDeWorktree(raiz, nombre);
  const problema = problemaDeNombre(nombre) ?? problemaDeFaseYArea(raiz, fase, area);
  if (problema !== undefined) return falla(problema);
  if (!existeLaRama(raiz, RAMA_PRINCIPAL)) return falla(`No hay una rama ${RAMA_PRINCIPAL} de la que partir.`);
  if (existeLaRama(raiz, nombre)) return falla(`Ya existe la rama ${nombre}.`);
  if (existsSync(directorio)) return falla(`Ya existe ${directorio}.`);
  const crear = git(raiz, ['worktree', 'add', directorio, '-b', nombre, RAMA_PRINCIPAL]);
  if (crear.codigo !== 0) return falla(`git worktree add ha fallado:\n${crear.errores}`);
  // node_modules está en .gitignore: cada worktree usa el del directorio principal.
  if (existsSync(path.join(raiz, 'node_modules'))) {
    symlinkSync(path.join(raiz, 'node_modules'), path.join(directorio, 'node_modules'));
  }
  fijarFase(directorio, { fase, area }, raiz);
  abrirEditor(directorio);
  return {
    ok: true,
    mensajes: [
      `Worktree ${directorio} en la rama ${nombre}, con la fase ${fase} y el área ${area ?? 'ninguna'}.`,
      'Abre en esa ventana una conversación nueva de Claude Code.',
      `Al acabar: make integrar N=${nombre}, y después make retirar N=${nombre}.`,
    ],
  };
}

/**
 * Pone la rama encima de main, la comprueba y la fusiona en main sin commit de fusión.
 * Se para sin tocar main si hay conflictos (deja el rebase a medias en el worktree), si la
 * comprobación falla, o si main no puede avanzar en línea recta.
 */
export function integrarWorktree(raiz: string, nombre: string, comprobar: (directorio: string) => boolean): Resultado {
  const directorio = directorioDeWorktree(raiz, nombre);
  const problema = problemaPrevioAIntegrar(raiz, nombre);
  if (problema !== undefined) return falla(problema);
  const rebase = git(directorio, ['rebase', RAMA_PRINCIPAL]);
  if (rebase.codigo !== 0) return falla(...mensajeDeRebaseFallido(directorio, nombre, rebase.errores));
  if (!comprobar(directorio)) {
    return falla(
      `make check falla en ${directorio}, con la rama ya encima de ${RAMA_PRINCIPAL}. No se ha tocado ${RAMA_PRINCIPAL}.`,
    );
  }
  const fusion = git(raiz, ['merge', '--ff-only', nombre]);
  if (fusion.codigo !== 0) {
    return falla(
      `${RAMA_PRINCIPAL} ha avanzado mientras tanto, o no admite la fusión:\n${fusion.errores}`,
      `Repite make integrar N=${nombre}.`,
    );
  }
  return {
    ok: true,
    mensajes: [`${RAMA_PRINCIPAL} incluye ahora la rama ${nombre}. Cuando quieras: make retirar N=${nombre}.`],
  };
}

/** Lo que impide empezar a integrar, o undefined si la rama y los dos directorios están listos. */
function problemaPrevioAIntegrar(raiz: string, nombre: string): string | undefined {
  const directorio = directorioDeWorktree(raiz, nombre);
  const problemaDeNombreInvalido = problemaDeNombre(nombre);
  if (problemaDeNombreInvalido !== undefined) return problemaDeNombreInvalido;
  if (!existsSync(directorio) || !existeLaRama(raiz, nombre)) {
    return `No hay un worktree ${directorio} con la rama ${nombre}. ¿Lo abriste con make abrir N=${nombre}?`;
  }
  if (rebaseEnCurso(directorio)) {
    return (
      `Hay un rebase a medias en ${directorio}. Resuélvelo con la conversación de esa rama y acaba con ` +
      `git -C ${directorio} rebase --continue; después repite make integrar N=${nombre}.`
    );
  }
  if (ramaActual(raiz) !== RAMA_PRINCIPAL) return `El directorio principal no está en ${RAMA_PRINCIPAL}.`;
  if (ramaActual(directorio) !== nombre) return `El worktree ${directorio} no está en la rama ${nombre}.`;
  if (git(directorio, ['status', '--porcelain', '--untracked-files=no']).salida.trim() !== '') {
    return `El worktree ${directorio} tiene cambios sin commitear: commitéalos o deshazlos antes de integrar.`;
  }
  return undefined;
}

function mensajeDeRebaseFallido(directorio: string, nombre: string, errores: string): string[] {
  const conflictos = git(directorio, ['diff', '--name-only', '--diff-filter=U'])
    .salida.split('\n')
    .filter((f) => f !== '');
  if (conflictos.length === 0) {
    return [`git rebase ha fallado en ${directorio}:\n${errores}`];
  }
  return [
    `Conflictos al poner ${nombre} encima de ${RAMA_PRINCIPAL}. El rebase queda a medias en ${directorio}:`,
    ...conflictos.map((fichero) => `  - ${fichero}`),
    'La conversación de esa rama resuelve los ficheros que su fase desbloquea. Cuando estén resueltos:',
    `  git -C ${directorio} add ${conflictos.join(' ')} && GIT_EDITOR=true git -C ${directorio} rebase --continue`,
    `y repite make integrar N=${nombre}.`,
  ];
}

/** Borra el worktree y la rama, solo si la rama ya está en main. */
export function retirarWorktree(raiz: string, nombre: string): Resultado {
  const directorio = directorioDeWorktree(raiz, nombre);
  const problema = problemaDeNombre(nombre);
  if (problema !== undefined) return falla(problema);
  if (!existeLaRama(raiz, nombre)) return falla(`No existe la rama ${nombre}.`);
  if (git(raiz, ['merge-base', '--is-ancestor', nombre, RAMA_PRINCIPAL]).codigo !== 0) {
    return falla(`La rama ${nombre} tiene commits que ${RAMA_PRINCIPAL} no tiene: primero make integrar N=${nombre}.`);
  }
  if (existsSync(directorio)) {
    const quitar = git(raiz, ['worktree', 'remove', directorio]);
    if (quitar.codigo !== 0) return falla(`git worktree remove ha fallado:\n${quitar.errores}`);
  }
  const borrar = git(raiz, ['branch', '-d', nombre]);
  if (borrar.codigo !== 0) return falla(`git branch -d ha fallado:\n${borrar.errores}`);
  return { ok: true, mensajes: [`Retirados el worktree ${directorio} y la rama ${nombre}.`] };
}
