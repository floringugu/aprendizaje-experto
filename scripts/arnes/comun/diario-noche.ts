// El diario del Despachador: reports/noche/diario.jsonl de la carpeta principal (fuera de git, como
// todo reports/), una línea JSON por anotación. El Despachador anota cuándo empieza y termina cada
// noche, cada sesión que lanza (con la ruta de su stream) y lo que decide al terminar cada una.
// «make manana» lo lee: el registro de paradas de un carril desaparece cuando el carril se retira,
// así que lo que pasó de noche solo queda aquí y en GitHub.
import path from 'node:path';
import type { Accion } from './despachador.ts';
import { anotarLinea, leerLineas } from './jsonl.ts';

/** Donde el Despachador deja el diario y los streams de las sesiones. */
export function carpetaDeLaNoche(principal: string): string {
  return path.join(principal, 'reports', 'noche');
}

interface Momento {
  /** Fecha y hora ISO 8601. */
  readonly fecha: string;
}

/** Lo que el Despachador anota. */
export type Suceso =
  | { readonly tipo: 'inicio'; readonly fin: string; readonly ultimoTicket: string }
  | { readonly tipo: 'sesion'; readonly ticket: string; readonly stream: string; readonly reanudada: boolean }
  | { readonly tipo: 'decision'; readonly ticket: string; readonly accion: Accion }
  /** El carril de un ticket hecho no se pudo retirar. */
  | { readonly tipo: 'aviso'; readonly ticket: string; readonly texto: string }
  | { readonly tipo: 'fin'; readonly motivo: string };

export type Anotacion = Momento & Suceso;

function rutaDelDiario(principal: string): string {
  return path.join(carpetaDeLaNoche(principal), 'diario.jsonl');
}

/** Anota el suceso con la fecha y la hora de ahora. */
export function anotarEnElDiario(principal: string, suceso: Suceso): void {
  anotarLinea(rutaDelDiario(principal), { fecha: new Date().toISOString(), ...suceso });
}

export function leerDiario(principal: string): Anotacion[] {
  return leerLineas(rutaDelDiario(principal), esAnotacion);
}

function esAnotacion(valor: unknown): valor is Anotacion {
  if (typeof valor !== 'object' || valor === null) return false;
  const { fecha, tipo } = valor as Record<string, unknown>;
  return typeof fecha === 'string' && typeof tipo === 'string';
}

// ---------------------------------------------------------------------------
// El resumen de la mañana (make manana)
// ---------------------------------------------------------------------------

interface TicketDeLaNoche {
  readonly ticket: string;
  readonly sesiones: number;
  /** Lo último que se decidió; undefined si la noche se cortó con la sesión a medias. */
  readonly accion: Accion | undefined;
  readonly avisos: readonly string[];
}

export interface Noche {
  readonly inicio: string;
  /** Por qué terminó; undefined si el Despachador sigue en marcha o murió sin anotarlo. */
  readonly fin: { readonly fecha: string; readonly motivo: string } | undefined;
  /** Los tickets que tocó, en el orden en que los abrió. */
  readonly tickets: readonly TicketDeLaNoche[];
}

/** La última noche del diario (desde su último «inicio»), o undefined si no hay ninguna. */
export function ultimaNoche(diario: readonly Anotacion[]): Noche | undefined {
  const desde = diario.findLastIndex((anotacion) => anotacion.tipo === 'inicio');
  const inicio = diario[desde];
  if (inicio === undefined) return undefined;
  const anotaciones = diario.slice(desde + 1);
  const fin = anotaciones.findLast((anotacion) => anotacion.tipo === 'fin');
  const ids = [...new Set(anotaciones.flatMap((anotacion) => ('ticket' in anotacion ? [anotacion.ticket] : [])))];
  return {
    inicio: inicio.fecha,
    fin: fin?.tipo === 'fin' ? { fecha: fin.fecha, motivo: fin.motivo } : undefined,
    tickets: ids.map((ticket) => ticketDeLaNoche(ticket, anotaciones)),
  };
}

function ticketDeLaNoche(ticket: string, anotaciones: readonly Anotacion[]): TicketDeLaNoche {
  const suyas = anotaciones.filter((anotacion) => 'ticket' in anotacion && anotacion.ticket === ticket);
  const ultima = suyas.at(-1);
  return {
    ticket,
    sesiones: suyas.filter((anotacion) => anotacion.tipo === 'sesion').length,
    accion: ultima?.tipo === 'decision' || ultima?.tipo === 'aviso' ? ultimaDecision(suyas) : undefined,
    avisos: suyas.flatMap((anotacion) => (anotacion.tipo === 'aviso' ? [anotacion.texto] : [])),
  };
}

function ultimaDecision(anotaciones: readonly Anotacion[]): Accion | undefined {
  const decision = anotaciones.findLast((anotacion) => anotacion.tipo === 'decision');
  return decision?.tipo === 'decision' ? decision.accion : undefined;
}

/**
 * El texto de «make manana»: lo fusionado y la cola, cada ticket con su motivo. `estadoDelPr` dice
 * cómo está ahora en GitHub el PR de un ticket de la cola (pudo cambiar desde la noche); '' si no se sabe.
 */
export function textoDeLaManana(noche: Noche, estadoDelPr: (ticket: string) => string): string {
  const hechos = noche.tickets.filter(({ accion }) => accion?.tipo === 'hecho');
  const cola = noche.tickets.filter(({ accion }) => accion?.tipo !== 'hecho');
  const final =
    noche.fin === undefined ? 'sin final anotado' : `terminó a las ${hora(noche.fin.fecha)}: ${noche.fin.motivo}`;
  return [
    `Noche del ${new Date(noche.inicio).toLocaleDateString('es-ES')}, desde las ${hora(noche.inicio)}; ${final}.`,
    '',
    `Fusionado (${String(hechos.length)}):`,
    ...hechos.map((ticket) => `  ${ticket.ticket}: ${lineaDelTicket(ticket)}`),
    '',
    `Cola de la mañana (${String(cola.length)}):`,
    ...cola.map((ticket) => {
      const ahora = estadoDelPr(ticket.ticket);
      return `  ${ticket.ticket}: ${lineaDelTicket(ticket)}${ahora === '' ? '' : ` Ahora: ${ahora}.`}`;
    }),
  ].join('\n');
}

function hora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function lineaDelTicket({ accion, sesiones, avisos }: TicketDeLaNoche): string {
  const cuantas = `${String(sesiones)} ${sesiones === 1 ? 'sesión' : 'sesiones'}`;
  return [`${queQuedo(accion)} (${cuantas}).`, ...avisos].join(' ');
}

function queQuedo(accion: Accion | undefined): string {
  if (accion === undefined) return 'la noche se cortó con su sesión a medias';
  if (accion.tipo === 'hecho') return `PR #${String(accion.pr)} fusionado`;
  if (accion.tipo === 'cola' || accion.tipo === 'fin') return accion.motivo;
  return `quedó a medias (${accion.tipo})`;
}
