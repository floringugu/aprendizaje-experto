// Tickets (docs/plan.md §6, «Tickets»): el trabajo pendiente, un fichero por carril en docs/tickets/<id>.md.
// El <id> es el nombre del carril, y el frontmatter dice su fase, su área, de qué depende, qué ficheros
// toca y si está abierto, hecho o descartado. Lo demás (listo, bloqueado, en curso…) no se escribe:
// lo calcula estado-tickets.ts. Los ficheros que empiezan por «_», como _plantilla.md, no son tickets.
//
// El frontmatter es un subconjunto mínimo de YAML, con un parser propio: «clave: valor» y listas «[a, b]».
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { problemaDeArea } from './alcance.ts';
import { esArea } from './checkout.ts';
import { esFase, FASES } from './fases.ts';
import type { Fase } from './fases.ts';
import { git } from './git.ts';
import { esNombreDeCarril } from './ramas.ts';

export const CARPETA_DE_TICKETS = 'docs/tickets';

const CLAVES = ['fase', 'area', 'depende', 'toca', 'estado'];
const ESTADOS_ESCRITOS = ['abierto', 'hecho', 'descartado'] as const;
type EstadoEscrito = (typeof ESTADOS_ESCRITOS)[number];

export interface Ticket {
  /** El nombre del fichero sin «.md», que es el nombre del carril. */
  readonly id: string;
  /** La primera línea «# …» del cuerpo. */
  readonly titulo: string;
  readonly fase: Fase;
  readonly area: string;
  /**
   * Lo que tiene que estar cumplido antes de abrir el carril: ids de tickets, en minúsculas, cumplidos
   * con «estado: hecho», y áreas, en mayúsculas, cumplidas cuando están en areas_cerradas.
   */
  readonly depende: readonly string[];
  /** La huella prevista: rutas, carpetas (acaban en «/») y patrones con «*». Avisa de solapes; no prohíbe. */
  readonly toca: readonly string[];
  /** Lo único de estado que se escribe a mano: el último PR del ticket pone «hecho». */
  readonly estado: EstadoEscrito;
  /** El Markdown que sigue al frontmatter, con el título. */
  readonly cuerpo: string;
}

export function rutaDelTicket(id: string): string {
  return `${CARPETA_DE_TICKETS}/${id}.md`;
}

type Valor = string | readonly string[];

/** El ticket `id` a partir del texto de su fichero, o por qué no se puede leer. */
export function leerTicket(id: string, texto: string): Ticket | { problema: string } {
  const partes = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(texto.replaceAll('\r\n', '\n'));
  const problema = (detalle: string): { problema: string } => ({ problema: `${rutaDelTicket(id)}: ${detalle}` });
  if (partes === null) return problema('tiene que empezar con un frontmatter entre dos líneas «---».');
  const [, cabecera = '', cuerpo = ''] = partes;
  const campos = leerCampos(cabecera);
  if (typeof campos === 'string') return problema(campos);
  const desconocidas = [...campos.keys()].filter((clave) => !CLAVES.includes(clave));
  if (desconocidas.length > 0) {
    return problema(`claves desconocidas en el frontmatter: ${desconocidas.join(', ')}. Valen: ${CLAVES.join(', ')}.`);
  }
  const frontmatter = leerFrontmatter(campos);
  if (typeof frontmatter === 'string') return problema(frontmatter);
  const titulo = /^# (.+)$/m.exec(cuerpo)?.[1]?.trim();
  if (titulo === undefined) return problema('le falta el título, una línea «# …» después del frontmatter.');
  return { id, titulo, ...frontmatter, cuerpo };
}

function leerCampos(cabecera: string): Map<string, Valor> | string {
  const campos = new Map<string, Valor>();
  for (const linea of cabecera.split('\n').filter((linea) => linea.trim() !== '')) {
    const [, clave, valor] = /^([a-z]+):(.*)$/.exec(linea) ?? [];
    if (clave === undefined || valor === undefined) return `la línea «${linea}» del frontmatter no es «clave: valor».`;
    campos.set(clave, leerValor(valor.trim()));
  }
  return campos;
}

/** «[a, b]» es una lista (vacía con «[]»); lo demás, un texto. */
function leerValor(valor: string): Valor {
  const lista = /^\[(.*)\]$/.exec(valor)?.[1];
  if (lista === undefined) return valor;
  return lista
    .split(',')
    .map((elemento) => elemento.trim())
    .filter((elemento) => elemento !== '');
}

function leerFrontmatter(campos: ReadonlyMap<string, Valor>): Omit<Ticket, 'id' | 'titulo' | 'cuerpo'> | string {
  const { fase, area, estado } = Object.fromEntries(['fase', 'area', 'estado'].map((c) => [c, texto(campos, c)]));
  if (fase === undefined || !esFase(fase)) return `«fase» tiene que ser una de estas: ${FASES.join(', ')}.`;
  if (area === undefined || !esArea(area)) return '«area» tiene que ser un prefijo de área, como MATE.';
  if (estado === undefined || !esEstadoEscrito(estado)) {
    return `«estado» tiene que ser uno de estos: ${ESTADOS_ESCRITOS.join(', ')}.`;
  }
  const depende = lista(campos, 'depende');
  const toca = lista(campos, 'toca');
  if (depende === undefined || toca === undefined) return '«depende» y «toca» tienen que ser listas: [a, b], o [].';
  return { fase, area, depende, toca, estado };
}

function texto(campos: ReadonlyMap<string, Valor>, clave: string): string | undefined {
  const valor = campos.get(clave);
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}

function lista(campos: ReadonlyMap<string, Valor>, clave: string): readonly string[] | undefined {
  const valor = campos.get(clave);
  return typeof valor === 'string' ? undefined : valor;
}

function esEstadoEscrito(valor: string): valor is EstadoEscrito {
  return (ESTADOS_ESCRITOS as readonly string[]).includes(valor);
}

/**
 * El texto del apartado «**<nombre>:** …» del cuerpo, como «Hecho cuando», hasta la línea en blanco
 * o el apartado siguiente; undefined si no lo tiene.
 */
export function apartado(ticket: Ticket, nombre: string): string | undefined {
  const lineas = ticket.cuerpo.split('\n');
  const marca = `**${nombre}:**`;
  const inicio = lineas.findIndex((linea) => linea.startsWith(marca));
  if (inicio === -1) return undefined;
  const fin = lineas.findIndex((linea, i) => i > inicio && (linea.trim() === '' || linea.startsWith('**')));
  const parrafo = lineas.slice(inicio, fin === -1 ? undefined : fin).join(' ');
  return parrafo.slice(marca.length).trim();
}

export interface LecturaDeTickets {
  readonly tickets: readonly Ticket[];
  /** Los ficheros que no se han podido leer, con el motivo. */
  readonly problemas: readonly string[];
}

/**
 * Los tickets del árbol de trabajo de `raiz` o, con `ref` (como origin/main), los de ese commit,
 * leídos con git sin cambiar de rama.
 */
export function ticketsDe(raiz: string, ref?: string): LecturaDeTickets {
  const ficheros = ref === undefined ? ficherosDelArbol(raiz) : ficherosDelCommit(raiz, ref);
  const tickets: Ticket[] = [];
  const problemas: string[] = [];
  for (const { id, contenido } of ficheros) {
    const leido = leerTicket(id, contenido);
    if ('problema' in leido) problemas.push(leido.problema);
    else tickets.push(leido);
  }
  return { tickets, problemas };
}

interface FicheroDeTicket {
  readonly id: string;
  readonly contenido: string;
}

function esFicheroDeTicket(nombre: string): boolean {
  return nombre.endsWith('.md') && !nombre.startsWith('_');
}

function ficherosDelArbol(raiz: string): FicheroDeTicket[] {
  const carpeta = path.join(raiz, CARPETA_DE_TICKETS);
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta)
    .filter(esFicheroDeTicket)
    .toSorted((a, b) => a.localeCompare(b))
    .map((nombre) => ({
      id: path.basename(nombre, '.md'),
      contenido: readFileSync(path.join(carpeta, nombre), 'utf8'),
    }));
}

function ficherosDelCommit(raiz: string, ref: string): FicheroDeTicket[] {
  const { salida } = git(raiz, ['ls-tree', '--name-only', ref, `${CARPETA_DE_TICKETS}/`]);
  return salida
    .split('\n')
    .map((ruta) => path.posix.basename(ruta))
    .filter(esFicheroDeTicket)
    .map((nombre) => ({
      id: path.basename(nombre, '.md'),
      contenido: git(raiz, ['show', `${ref}:${CARPETA_DE_TICKETS}/${nombre}`]).salida,
    }));
}

/**
 * Por qué los tickets de `raiz` (su árbol de trabajo) no valen, en una lista vacía si valen: nombre de
 * carril, área con su feature, dependencias que existen y no están descartadas, carpetas de «toca» que
 * acaban en «/» y ningún ciclo entre las dependencias sin cumplir. `cerradas` son las areas_cerradas.
 */
export function problemasDeLosTickets(
  raiz: string,
  { tickets, problemas }: LecturaDeTickets,
  cerradas: readonly string[],
): string[] {
  const porId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const deCadaTicket = tickets.flatMap((ticket) =>
    [
      esNombreDeCarril(ticket.id) ? undefined : 'el nombre del fichero no vale como nombre de carril.',
      problemaDeArea(raiz, ticket.area),
      ...ticket.depende.map((nombre) =>
        problemaDeDependencia(raiz, ticket, { nombre, dependencia: porId.get(nombre) }),
      ),
      ...ticket.toca.map((entrada) => problemaDeEntrada(raiz, entrada)),
    ].flatMap((problema) => (problema === undefined ? [] : [`${rutaDelTicket(ticket.id)}: ${problema}`])),
  );
  const ciclo = cicloDeDependencias(tickets, cerradas);
  const delGrafo = ciclo === undefined ? [] : [`Ciclo de dependencias sin cumplir: ${ciclo.join(' → ')}.`];
  return [...problemas, ...deCadaTicket, ...delGrafo];
}

function problemaDeDependencia(
  raiz: string,
  ticket: Ticket,
  { nombre, dependencia }: { nombre: string; dependencia: Ticket | undefined },
): string | undefined {
  if (esArea(nombre)) return problemaDeArea(raiz, nombre);
  if (dependencia === undefined) return `depende de «${nombre}», que no es un ticket de ${CARPETA_DE_TICKETS}/.`;
  if (ticket.estado === 'abierto' && dependencia.estado === 'descartado') {
    return `depende de ${nombre}, que está descartado: cámbialo por los tickets que lo sustituyen.`;
  }
  return undefined;
}

function problemaDeEntrada(raiz: string, entrada: string): string | undefined {
  if (entrada.endsWith('/') || entrada.includes('*')) return undefined;
  const esCarpeta = statSync(path.join(raiz, entrada), { throwIfNoEntry: false })?.isDirectory() === true;
  return esCarpeta ? `«${entrada}» en «toca» es una carpeta: escríbela con «/» al final.` : undefined;
}

/**
 * Un ciclo entre las dependencias sin cumplir de los tickets abiertos, o undefined si no hay: ninguno
 * de sus tickets se podría abrir nunca. Depender de un área sin cerrar es depender de cada ticket
 * abierto de esa área.
 */
function cicloDeDependencias(tickets: readonly Ticket[], cerradas: readonly string[]): string[] | undefined {
  const abiertos = tickets.filter((ticket) => ticket.estado === 'abierto');
  const siguientes = (ticket: Ticket): Ticket[] =>
    abiertos.filter((otro) =>
      ticket.depende.some((nombre) => nombre === otro.id || (nombre === otro.area && !cerradas.includes(nombre))),
    );
  const terminados = new Set<string>();
  const camino: string[] = [];
  const visitar = (ticket: Ticket): string[] | undefined => {
    if (camino.includes(ticket.id)) return [...camino.slice(camino.indexOf(ticket.id)), ticket.id];
    if (terminados.has(ticket.id)) return undefined;
    camino.push(ticket.id);
    const ciclo = siguientes(ticket).reduce<string[] | undefined>(
      (hallado, otro) => hallado ?? visitar(otro),
      undefined,
    );
    camino.pop();
    terminados.add(ticket.id);
    return ciclo;
  };
  return abiertos.reduce<string[] | undefined>((hallado, ticket) => hallado ?? visitar(ticket), undefined);
}
