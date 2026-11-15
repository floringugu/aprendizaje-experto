// Las ramas de un carril (worktrees.ts): «<fase>/<ÁREA>/<carril>» la primera, y «-2», «-3»… las
// siguientes, una por PR. Llevan la fase y el área que tenía el carril al crearlas, y salen de
// origin/main o, las que abre el Despachador para aceptación e impl, de la rama de lote de la noche
// (lote.ts). El lote de una rama se apunta en su configuración de git, en la clave que lee
// «gh pr create» para elegir la base del PR: así el PR de la rama va a su lote sin que nadie lo diga.
//
// GitHub fusiona los PR con rebase, que crea commits nuevos: main no contiene los de la rama
// (merge-base --is-ancestor falla). Una rama cuenta como fusionada cuando cada uno de sus commits
// tiene en su origen otro con el mismo cambio. No vale git cherry: compara el parche con sus
// líneas de contexto, y el rebase las cambia si antes entró otro commit que toca las de al lado
// (pasa con config/alcance.json, que escriben casi todos los carriles).
import { problemaDeArea } from './alcance.ts';
import { esArea } from './checkout.ts';
import type { FaseYArea } from './checkout.ts';
import { esFase } from './fases.ts';
import type { Fase } from './fases.ts';
import { git } from './git.ts';

export const RAMA_DE_ORIGEN = 'origin/main';

export interface Rama {
  readonly fase: Fase;
  readonly area: string;
  readonly carril: string;
  /** 1 en la primera rama del carril, que no lleva sufijo. */
  readonly numero: number;
}

// Cada tramo entre guiones empieza por una letra: así el «-2» del final siempre es el número.
const CARRIL = '[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*';
const LARGO_MAXIMO_DE_CARRIL = 31;

/** ¿Vale como nombre de carril? Minúsculas, números y guiones, y cada tramo empieza por una letra. */
export function esNombreDeCarril(nombre: string): boolean {
  return nombre.length <= LARGO_MAXIMO_DE_CARRIL && new RegExp(`^${CARRIL}$`).test(nombre);
}

export function nombreDeRama({ fase, area, carril, numero }: Rama): string {
  return `${fase}/${area}/${carril}${numero === 1 ? '' : `-${String(numero)}`}`;
}

/** La rama que nombra `nombre`, o undefined si no sigue el formato de nombreDeRama. */
export function leerNombreDeRama(nombre: string): Rama | undefined {
  const partes = new RegExp(`^([a-z]+)/([A-Z]+)/(${CARRIL})(?:-([2-9]|[1-9][0-9]+))?$`).exec(nombre);
  const [, fase = '', area = '', carril = '', numero = '1'] = partes ?? [];
  if (!esFase(fase) || !esArea(area) || !esNombreDeCarril(carril)) return undefined;
  return { fase, area, carril, numero: Number(numero) };
}

/**
 * La fase y el área que la rama `nombre` lleva en el nombre, o por qué no valen: el nombre no sigue el
 * formato de nombreDeRama o el área no existe en features/ de `raiz`. La CI (ci.ts) la usa con la rama del PR.
 */
export function faseYAreaDeLaRama(raiz: string, nombre: string): FaseYArea | { problema: string } {
  const rama = leerNombreDeRama(nombre);
  if (rama === undefined) {
    return {
      problema: `La rama «${nombre}» no sigue el formato <fase>/<ÁREA>/<carril>[-n], p. ej. impl/MATE/pasos-2.`,
    };
  }
  const problema = problemaDeArea(raiz, rama.area);
  return problema === undefined ? { fase: rama.fase, area: rama.area } : { problema };
}

/** Las ramas locales del carril, de cualquier fase y área. */
export function ramasDelCarril(raiz: string, carril: string): string[] {
  const { salida } = git(raiz, ['for-each-ref', '--format=%(refname:lstrip=2)', 'refs/heads/']);
  return salida.split('\n').filter((nombre) => leerNombreDeRama(nombre)?.carril === carril);
}

/** El nombre de la rama siguiente del carril: el número más alto de sus ramas locales, más uno. */
export function siguienteRama(raiz: string, { fase, area, carril }: Omit<Rama, 'numero'>): string {
  const numeros = ramasDelCarril(raiz, carril).map((nombre) => leerNombreDeRama(nombre)?.numero ?? 1);
  return nombreDeRama({ fase, area, carril, numero: Math.max(0, ...numeros) + 1 });
}

/** Trae origin (git fetch) para que estaFusionada, RAMA_DE_ORIGEN y las ramas de lote estén al día. Devuelve el motivo si falla. */
export function traerOrigen(raiz: string): string | undefined {
  const traer = git(raiz, ['fetch', '--quiet', 'origin']);
  if (traer.codigo !== 0) return `git fetch origin ha fallado:\n${traer.errores}`;
  if (git(raiz, ['rev-parse', '--verify', '--quiet', RAMA_DE_ORIGEN]).codigo !== 0) {
    return `origin no tiene la rama main (${RAMA_DE_ORIGEN}).`;
  }
  return undefined;
}

const LOTE = /^lote\/([1-9][0-9]*)$/;

/** El número de la rama de lote `nombre` («lote/3» → 3), o undefined si no es una rama de lote. */
export function numeroDeLote(nombre: string): number | undefined {
  const numero = LOTE.exec(nombre)?.[1];
  return numero === undefined ? undefined : Number(numero);
}

function claveDelLote(rama: string): string {
  return `branch.${rama}.gh-merge-base`;
}

/** Apunta que la rama local `rama` sale de la rama de lote `lote` («lote/N») y que su PR va a ella. */
export function fijarLoteDeLaRama(raiz: string, rama: string, lote: string): void {
  git(raiz, ['config', claveDelLote(rama), lote]);
}

/**
 * La rama de lote de la que sale `rama` («lote/N»), si fijarLoteDeLaRama la apuntó y origin la tiene
 * (con lo último que trajo traerOrigen); undefined si sale de origin/main.
 */
export function loteDeLaRama(raiz: string, rama: string): string | undefined {
  const lote = git(raiz, ['config', '--get', claveDelLote(rama)]).salida.trim();
  if (numeroDeLote(lote) === undefined) return undefined;
  return git(raiz, ['rev-parse', '--verify', '--quiet', `origin/${lote}`]).codigo === 0 ? lote : undefined;
}

/** De dónde sale `rama` y adónde va su PR: «origin/lote/N» si tiene lote (loteDeLaRama); si no, RAMA_DE_ORIGEN. */
export function origenDeLaRama(raiz: string, rama: string): string {
  const lote = loteDeLaRama(raiz, rama);
  return lote === undefined ? RAMA_DE_ORIGEN : `origin/${lote}`;
}

/**
 * ¿Está fusionada la rama? Sí, si lo está en su origen (origenDeLaRama) o en RAMA_DE_ORIGEN: una rama
 * de un lote que ya entró en main tiene allí sus commits, aunque no llegara a entrar en el lote.
 */
export function estaFusionada(raiz: string, rama: string): boolean {
  const origen = origenDeLaRama(raiz, rama);
  return (
    estaFusionadaEn(raiz, rama, origen) || (origen !== RAMA_DE_ORIGEN && estaFusionadaEn(raiz, rama, RAMA_DE_ORIGEN))
  );
}

/**
 * ¿Está cada commit de `rama` en `origen`, con el mismo cambio? Se buscan entre los commits de
 * `origen` que la rama no tiene, comparando las líneas que quitan y añaden, sin contexto. Una rama
 * sin commits propios, o con solo commits vacíos, también. Usa lo último que trajo traerOrigen. No,
 * si git no puede compararlas. `rama` puede ser cualquier ref: también dice si un lote ya está en main.
 */
export function estaFusionadaEn(raiz: string, rama: string, origen: string): boolean {
  const deLaRama = idsDeParche(raiz, `${origen}..${rama}`);
  const deOrigen = idsDeParche(raiz, `${rama}..${origen}`);
  if (deLaRama === undefined || deOrigen === undefined) return false;
  const enOrigen = new Set(deOrigen);
  return deLaRama.every((id) => enOrigen.has(id));
}

/**
 * El patch-id de cada commit de `rango` con el diff sin contexto (-U0): git patch-id no cuenta los
 * números de línea, así que el mismo cambio da el mismo id aunque el rebase lo haya movido. Los
 * commits vacíos no dan id. undefined si git falla (rango que no existe).
 */
function idsDeParche(raiz: string, rango: string): string[] | undefined {
  // --full-index y --binary: que dos ficheros binarios distintos no den el mismo «Binary files differ».
  const parches = git(raiz, ['log', '-p', '-U0', '--no-color', '--no-ext-diff', '--full-index', '--binary', rango]);
  if (parches.codigo !== 0) return undefined;
  const ids = git(raiz, ['patch-id', '--stable'], parches.salida);
  if (ids.codigo !== 0) return undefined;
  // Cada línea es «<patch-id> <commit>».
  return ids.salida
    .split('\n')
    .filter((linea) => linea !== '')
    .map((linea) => linea.split(' ')[0] ?? '');
}
