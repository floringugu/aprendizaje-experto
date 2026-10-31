// El estado de los tickets (tickets.ts), que no se guarda: sale de lo que hay en origin/main y de los
// carriles abiertos (docs/plan.md §6, «Tickets»).
//   hecho, descartado: el «estado» del ticket en origin/main;
//   en revisión: su carril está abierto y su rama tiene un PR abierto;
//   en curso: su carril está abierto;
//   listo: todas sus dependencias están cumplidas y su «toca» no se solapa con ningún carril abierto;
//   bloqueado: con las dependencias que faltan y los carriles con que se solapa.
// La huella de un carril abierto es el «toca» de su ticket más lo que ya ha commiteado su rama. Un
// carril sin ticket solo cuenta por lo commiteado.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { carrilesConRama, esArea, nombreDelCarril } from './checkout.ts';
import { git } from './git.ts';
import { estaFusionada, RAMA_DE_ORIGEN } from './ramas.ts';
import { ticketsDe } from './tickets.ts';
import type { Ticket } from './tickets.ts';

export interface CarrilAbierto {
  readonly nombre: string;
  readonly rama: string | undefined;
  /** Los ficheros que ha cambiado su rama y aún no están en origin/main. */
  readonly commiteados: readonly string[];
  /** El número del PR abierto de su rama, si lo tiene. */
  readonly pr: number | undefined;
}

export interface Situacion {
  /** Los tickets de origin/main. */
  readonly tickets: readonly Ticket[];
  /** Los tickets de origin/main que no se han podido leer, con el motivo. */
  readonly problemas: readonly string[];
  /** Las areas_cerradas de origin/main. */
  readonly cerradas: readonly string[];
  readonly carriles: readonly CarrilAbierto[];
  /** Los ficheros del árbol de origin/main. */
  readonly ficheros: readonly string[];
}

export interface Solape {
  readonly carril: string;
  readonly ficheros: readonly string[];
}

export type Estado =
  | { readonly tipo: 'hecho' | 'descartado'; readonly carrilSinRetirar: boolean }
  | { readonly tipo: 'revision'; readonly pr: number }
  | { readonly tipo: 'curso' }
  | { readonly tipo: 'listo' }
  | { readonly tipo: 'bloqueado'; readonly faltan: readonly string[]; readonly solapes: readonly Solape[] };

/** ¿Casa la ruta con la entrada de un «toca»? Una carpeta (acaba en «/») por prefijo; un patrón con «*», como glob. */
function casa(ruta: string, entrada: string): boolean {
  if (entrada.endsWith('/')) return ruta.startsWith(entrada);
  return entrada.includes('*') ? path.posix.matchesGlob(ruta, entrada) : ruta === entrada;
}

/**
 * Las rutas que casan con una entrada de cada huella, ordenadas: los ficheros de `ficheros` (el árbol
 * de origin/main) y las rutas sin «*» de las dos huellas, para los ficheros que aún no existen.
 */
export function seSolapan(a: readonly string[], b: readonly string[], ficheros: readonly string[]): string[] {
  const candidatas = new Set([...ficheros, ...[...a, ...b].filter((entrada) => !entrada.includes('*'))]);
  return [...candidatas]
    .filter((ruta) => a.some((entrada) => casa(ruta, entrada)) && b.some((entrada) => casa(ruta, entrada)))
    .toSorted((x, y) => x.localeCompare(y));
}

function huellaDelCarril(carril: CarrilAbierto, tickets: readonly Ticket[]): readonly string[] {
  const toca = tickets.find((ticket) => ticket.id === carril.nombre)?.toca ?? [];
  return [...toca, ...carril.commiteados];
}

/** Los carriles abiertos, salvo `excepto`, con los que se solapa `huella`. */
export function solapesCon(huella: readonly string[], situacion: Situacion, excepto: string): Solape[] {
  return situacion.carriles
    .filter((carril) => carril.nombre !== excepto)
    .map((carril) => ({
      carril: carril.nombre,
      ficheros: seSolapan(huella, huellaDelCarril(carril, situacion.tickets), situacion.ficheros),
    }))
    .filter((solape) => solape.ficheros.length > 0);
}

/** La huella del carril `nombre` abierto (el «toca» de su ticket y lo commiteado) y sus solapes con los demás. */
export function solapesDelCarril(nombre: string, situacion: Situacion): Solape[] {
  const carril = situacion.carriles.find((abierto) => abierto.nombre === nombre);
  if (carril === undefined) return [];
  return solapesCon(huellaDelCarril(carril, situacion.tickets), situacion, nombre);
}

function dependenciasQueFaltan(ticket: Ticket, { tickets, cerradas }: Situacion): string[] {
  return ticket.depende.filter((nombre) =>
    esArea(nombre) ? !cerradas.includes(nombre) : tickets.find((otro) => otro.id === nombre)?.estado !== 'hecho',
  );
}

export function estadoDelTicket(ticket: Ticket, situacion: Situacion): Estado {
  const carril = situacion.carriles.find((abierto) => abierto.nombre === ticket.id);
  if (ticket.estado !== 'abierto') return { tipo: ticket.estado, carrilSinRetirar: carril !== undefined };
  if (carril !== undefined) return carril.pr === undefined ? { tipo: 'curso' } : { tipo: 'revision', pr: carril.pr };
  const faltan = dependenciasQueFaltan(ticket, situacion);
  const solapes = solapesCon(ticket.toca, situacion, ticket.id);
  return faltan.length === 0 && solapes.length === 0 ? { tipo: 'listo' } : { tipo: 'bloqueado', faltan, solapes };
}

/** Los tickets de origin/main con su estado, en el orden de la situación. */
export function estadoDeLosTickets(situacion: Situacion): { ticket: Ticket; estado: Estado }[] {
  return situacion.tickets.map((ticket) => ({ ticket, estado: estadoDelTicket(ticket, situacion) }));
}

function textoDeSolape({ carril, ficheros }: Solape): string {
  return `${carril} (${ficheros.join(', ')})`;
}

/** Por qué espera un ticket bloqueado, o qué hace uno en revisión; vacío en los demás estados. */
export function detalle(estado: Estado): string {
  if (estado.tipo === 'revision') return `PR #${String(estado.pr)}`;
  if (estado.tipo !== 'bloqueado') return '';
  const faltan = estado.faltan.length > 0 ? [`falta ${estado.faltan.join(', ')}`] : [];
  const solapes = estado.solapes.length > 0 ? [`se solapa con ${estado.solapes.map(textoDeSolape).join('; ')}`] : [];
  return [...faltan, ...solapes].join('; ');
}

/**
 * Lo que hay ahora, con lo último que trajo git fetch: tickets, areas_cerradas y árbol de origin/main,
 * y los carriles abiertos de `raiz`, con lo que ha commiteado cada rama sin fusionar. `prs` son los PR
 * abiertos por rama (prsAbiertos). Lo lee por refs, sin entrar en los carriles.
 */
export function situacionDelRepositorio(raiz: string, prs: ReadonlyMap<string, number>): Situacion {
  const { tickets, problemas } = ticketsDe(raiz, RAMA_DE_ORIGEN);
  const carriles = carrilesConRama(raiz)
    .filter(({ ruta }) => existsSync(ruta))
    .map(({ ruta, rama }) => ({
      nombre: nombreDelCarril(ruta) ?? ruta,
      rama,
      commiteados: rama === undefined ? [] : commiteadosSinFusionar(raiz, rama),
      pr: rama === undefined ? undefined : prs.get(rama),
    }));
  const ficheros = lineas(git(raiz, ['ls-tree', '-r', '--name-only', RAMA_DE_ORIGEN]).salida);
  return { tickets, problemas, cerradas: areasCerradasDeOrigen(raiz), carriles, ficheros };
}

function lineas(texto: string): string[] {
  return texto.split('\n').filter((linea) => linea !== '');
}

function commiteadosSinFusionar(raiz: string, rama: string): string[] {
  if (estaFusionada(raiz, rama)) return [];
  return lineas(git(raiz, ['diff', '--name-only', `${RAMA_DE_ORIGEN}...${rama}`]).salida);
}

function areasCerradasDeOrigen(raiz: string): string[] {
  const { codigo, salida } = git(raiz, ['show', `${RAMA_DE_ORIGEN}:config/alcance.json`]);
  if (codigo !== 0) return [];
  const areas = (JSON.parse(salida) as { areas_cerradas?: unknown }).areas_cerradas;
  return Array.isArray(areas) ? areas.filter((area): area is string => typeof area === 'string') : [];
}

/** Los PR abiertos del repositorio, por el nombre de su rama, según gh. Ninguno si gh falla o no está. */
export function prsAbiertos(raiz: string): Map<string, number> {
  const argumentos = ['pr', 'list', '--state', 'open', '--limit', '100', '--json', 'number,headRefName'];
  const resultado = spawnSync('gh', argumentos, { cwd: raiz, encoding: 'utf8' });
  if (resultado.status !== 0) return new Map();
  const lista = JSON.parse(resultado.stdout) as { number: number; headRefName: string }[];
  return new Map(lista.map(({ number, headRefName }) => [headRefName, number]));
}
