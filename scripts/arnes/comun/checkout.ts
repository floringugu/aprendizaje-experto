// El checkout: el directorio principal del repositorio o uno de sus worktrees («make abrir»), los
// carriles. Cada uno lleva su fase y su área en curso (en su .claude/settings.local.json), su
// reports/ y su árbol de trabajo. Los hooks trabajan sobre el checkout del cwd de la conversación o
// sobre el del fichero que se toca; los scripts, sobre el suyo.
import { realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { entornoDeAjustesLocales, RUTA_AJUSTES_LOCALES } from './ajustes-locales.ts';
import { campoTexto } from './entrada-hook.ts';
import { esFase, FASES } from './fases.ts';
import type { Fase } from './fases.ts';
import { git } from './git.ts';

/** ¿Es un prefijo de área, como MATE? */
export function esArea(valor: string): boolean {
  return /^[A-Z]{2,6}$/.test(valor);
}

/** Raíz del checkout que contiene `ruta` (un fichero o un directorio, exista o no), o undefined fuera de un repositorio. */
export function raizDelCheckout(ruta: string): string | undefined {
  const { codigo, salida } = git(directorioExistente(path.resolve(ruta)), ['rev-parse', '--show-toplevel']);
  return codigo === 0 ? salida.trim() : undefined;
}

/** `ruta` si es un directorio; si no, el antecesor más cercano que lo es. */
function directorioExistente(ruta: string): string {
  let actual = ruta;
  while (statSync(actual, { throwIfNoEntry: false })?.isDirectory() !== true) actual = path.dirname(actual);
  return actual;
}

/**
 * El checkout que contiene `ruta`, solo si es de este repositorio, el de `raiz`: comparten el
 * directorio común de git. undefined fuera de un repositorio o en otro, como un clon del scratchpad.
 */
export function checkoutDelRepositorio(raiz: string, ruta: string): string | undefined {
  const checkout = raizDelCheckout(ruta);
  if (checkout === undefined) return undefined;
  return directorioComun(checkout) === directorioComun(raiz) ? checkout : undefined;
}

/** El checkout del cwd de la entrada de un hook, si es de este repositorio; si no, `raiz`. */
export function checkoutDeLaEntrada(raiz: string, entrada: unknown): string {
  const cwd = campoTexto(entrada, 'cwd');
  return (cwd === undefined ? undefined : checkoutDelRepositorio(raiz, cwd)) ?? raiz;
}

function directorioComun(checkout: string): string {
  return git(checkout, ['rev-parse', '--path-format=absolute', '--git-common-dir']).salida.trim();
}

export interface FaseYArea {
  readonly fase: Fase;
  /** El área en curso, si el dueño la fijó. */
  readonly area: string | undefined;
}

/**
 * La fase y el área en curso del checkout, de su .claude/settings.local.json, que escriben «make fase»
 * y «make abrir». Sin fase, impl; sin área, ninguna. Se niega a una fase o un área no válidas.
 */
export function faseYAreaDelCheckout(raiz: string): FaseYArea {
  const entorno = entornoDeAjustesLocales(raiz);
  const fase = entorno['ARNES_FASE'] ?? 'impl';
  if (typeof fase !== 'string' || !esFase(fase)) {
    throw new Error(
      `${RUTA_AJUSTES_LOCALES}: env.ARNES_FASE=${JSON.stringify(fase)} no es válida. Usa ${FASES.join(', ')}.`,
    );
  }
  const area = entorno['ARNES_AREA'];
  if (area === undefined || area === '') return { fase, area: undefined };
  if (typeof area !== 'string' || !esArea(area)) {
    throw new Error(
      `${RUTA_AJUSTES_LOCALES}: env.ARNES_AREA=${JSON.stringify(area)} no es un prefijo de área. Usa, por ejemplo, MATE.`,
    );
  }
  return { fase, area };
}

/** El directorio principal del repositorio del checkout: el que tiene el directorio común de git. */
export function carpetaPrincipal(raiz: string): string {
  return path.dirname(directorioComun(raiz));
}

export interface CheckoutsDelRepositorio {
  /** El directorio principal (carpetaPrincipal). */
  readonly principal: string;
  /** Los worktrees: los carriles de «make abrir» y los de EnterWorktree, en .claude/worktrees/. */
  readonly carriles: readonly string[];
}

/** Los checkouts del repositorio de `raiz`, según git worktree list. Lanza si git falla. */
export function checkoutsDelRepositorio(raiz: string): CheckoutsDelRepositorio {
  const { codigo, salida, errores } = git(raiz, ['worktree', 'list', '--porcelain']);
  if (codigo !== 0) throw new Error(`git worktree list ha fallado:\n${errores}`);
  // Cada checkout empieza con una línea «worktree <ruta>», y el directorio principal va primero.
  const [principal = raiz, ...carriles] = salida
    .split('\n')
    .filter((linea) => linea.startsWith('worktree '))
    .map((linea) => linea.slice('worktree '.length));
  return { principal, carriles };
}

/**
 * Nombre del carril del checkout: undefined en el directorio principal (carpetaPrincipal); en un
 * worktree, el nombre de su carpeta sin el prefijo «<principal>-» de «make abrir».
 */
export function nombreDelCarril(raiz: string): string | undefined {
  const principal = carpetaPrincipal(raiz);
  const carpeta = realpathSync(raiz);
  if (carpeta === principal) return undefined;
  const prefijo = `${path.basename(principal)}-`;
  const nombre = path.basename(carpeta);
  return nombre.startsWith(prefijo) ? nombre.slice(prefijo.length) : nombre;
}
