// Las ramas de un carril (worktrees.ts): «<fase>/<ÁREA>/<carril>» la primera, y «-2», «-3»… las
// siguientes, una por PR. Llevan la fase y el área que tenía el carril al crearlas, y salen de
// origin/main.
//
// GitHub fusiona los PR con rebase, que crea commits nuevos: main no contiene los de la rama
// (merge-base --is-ancestor falla). Una rama cuenta como fusionada cuando cada uno de sus commits
// tiene en origin/main otro con el mismo cambio (git cherry).
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

/** Trae origin (git fetch) para que estaFusionada y RAMA_DE_ORIGEN estén al día. Devuelve el motivo si falla. */
export function traerOrigen(raiz: string): string | undefined {
  const traer = git(raiz, ['fetch', '--quiet', 'origin']);
  if (traer.codigo !== 0) return `git fetch origin ha fallado:\n${traer.errores}`;
  if (git(raiz, ['rev-parse', '--verify', '--quiet', RAMA_DE_ORIGEN]).codigo !== 0) {
    return `origin no tiene la rama main (${RAMA_DE_ORIGEN}).`;
  }
  return undefined;
}

/**
 * ¿Está cada commit de la rama en RAMA_DE_ORIGEN, con el mismo cambio? Una rama sin commits propios,
 * también. Usa lo último que trajo traerOrigen. No, si git no puede compararlas.
 */
export function estaFusionada(raiz: string, rama: string): boolean {
  const { codigo, salida } = git(raiz, ['cherry', RAMA_DE_ORIGEN, rama]);
  return codigo === 0 && !salida.split('\n').some((linea) => linea.startsWith('+'));
}
