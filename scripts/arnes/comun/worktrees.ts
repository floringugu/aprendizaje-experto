// Carriles: worktrees al lado del directorio principal que duran más que sus ramas (docs/plan.md §6).
// Cada conversación trabaja en un carril, en una rama que acaba en un PR (ramas.ts). Cuando GitHub
// lo fusiona, la conversación siguiente del carril sigue en la rama siguiente. Cuatro operaciones,
// que lanzan los objetivos de make (scripts/arnes/worktrees.ts y fijar-fase.ts):
//   abrir (make abrir, el dueño): crea el carril y su primera rama desde origin/main, con su fase y su área,
//     que salen de su ticket (docs/tickets/<carril>.md) si lo tiene;
//   rama (make rama, la conversación): pasa el carril a la rama siguiente, fusionada la actual;
//   fase (make fase N=, el dueño): cambia la fase y el área del carril, fusionada su rama;
//   retirar (make retirar, el dueño): al acabar la línea de trabajo, borra el carril y todas sus ramas.
// Las tres últimas se niegan con cambios sin commitear o con una rama sin fusionar. fase y retirar,
// también con un relevo pendiente: es de la conversación siguiente del carril.
// Cada función devuelve lo que hay que decir.
import { existsSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fijarFase } from './ajustes-locales.ts';
import { problemaDeFaseYArea } from './alcance.ts';
import { faseYAreaDelCheckout, nombreDelCarril } from './checkout.ts';
import { detalle, estadoDelTicket, situacionDelRepositorio } from './estado-tickets.ts';
import type { Situacion } from './estado-tickets.ts';
import type { Fase } from './fases.ts';
import { git, hayCambiosSinCommitear } from './git.ts';
import {
  esNombreDeCarril,
  estaFusionada,
  nombreDeRama,
  RAMA_DE_ORIGEN,
  ramasDelCarril,
  siguienteRama,
  traerOrigen,
} from './ramas.ts';
import { rutaDelRelevo } from './relevo.ts';
import { rutaDelTicket } from './tickets.ts';
import type { Ticket } from './tickets.ts';

const SIN_AREA = 'Un carril necesita área, porque su rama la lleva en el nombre (<fase>/<ÁREA>/<carril>): A=<ÁREA>.';

export interface Resultado {
  readonly ok: boolean;
  readonly mensajes: readonly string[];
}

function falla(...mensajes: string[]): Resultado {
  return { ok: false, mensajes };
}

/** El directorio del carril: «<raíz>-<nombre>», al lado del directorio principal, la raíz. */
export function directorioDeWorktree(raiz: string, nombre: string): string {
  return path.join(path.dirname(raiz), `${path.basename(raiz)}-${nombre}`);
}

function problemaDeNombre(nombre: string): string | undefined {
  return esNombreDeCarril(nombre)
    ? undefined
    : `«${nombre}» no vale como nombre de carril: minúsculas, números y guiones, y cada tramo empieza por una letra.`;
}

function ramaActual(directorio: string): string {
  return git(directorio, ['rev-parse', '--abbrev-ref', 'HEAD']).salida.trim();
}

export interface PeticionDeWorktree {
  readonly nombre: string;
  readonly fase: Fase;
  readonly area: string | undefined;
}

export interface PeticionDeCarril {
  readonly nombre: string;
  /** Con ticket, salen de él y, si se dan, tienen que coincidir. Sin ticket, hacen falta las dos. */
  readonly fase: Fase | undefined;
  readonly area: string | undefined;
  /** FORZAR=1: abre aunque el ticket no esté listo. Nunca uno hecho o descartado. */
  readonly forzar?: boolean;
}

/**
 * Trae origin, crea el carril y su primera rama desde origin/main, enlaza node_modules y le fija la
 * fase y el área. Si origin/main tiene el ticket del carril (docs/tickets/<nombre>.md), la fase y el
 * área salen de él, y se niega si no está listo. Sus ajustes locales empiezan sin los permisos del
 * directorio principal.
 */
export function abrirWorktree(raiz: string, peticion: PeticionDeCarril): Resultado {
  const { nombre } = peticion;
  const previo = problemaDeNombre(nombre) ?? traerOrigen(raiz);
  if (previo !== undefined) return falla(previo);
  const delCarril = faseYAreaDelCarril(raiz, peticion);
  if ('problema' in delCarril) return falla(delCarril.problema);
  const { fase, area, avisos } = delCarril;
  const directorio = directorioDeWorktree(raiz, nombre);
  const problema = problemaDeFaseYArea(raiz, fase, area) ?? problemaDeCarrilNuevo(raiz, nombre);
  if (problema !== undefined) return falla(problema);
  const rama = nombreDeRama({ fase, area, carril: nombre, numero: 1 });
  const crear = git(raiz, ['worktree', 'add', '--quiet', '--no-track', '-b', rama, directorio, RAMA_DE_ORIGEN]);
  if (crear.codigo !== 0) return falla(`git worktree add ha fallado:\n${crear.errores}`);
  // node_modules está en .gitignore: cada carril usa el del directorio principal.
  if (existsSync(path.join(raiz, 'node_modules'))) {
    symlinkSync(path.join(raiz, 'node_modules'), path.join(directorio, 'node_modules'));
  }
  fijarFase(directorio, { fase, area });
  return {
    ok: true,
    mensajes: [
      ...avisos,
      `Carril ${directorio}, en la rama ${rama} (desde ${RAMA_DE_ORIGEN}), con la fase ${fase} y el área ${area}.`,
      'Pega esto en una conversación nueva de Claude Code en la ventana principal:',
      `Entra en el carril ${nombre}.`,
    ],
  };
}

interface FaseYAreaDelCarril {
  readonly fase: Fase;
  readonly area: string;
  /** Lo que hay que decir antes de abrir: qué ticket se abre, o que no lo hay. */
  readonly avisos: readonly string[];
}

/** La fase y el área del carril, del ticket de origin/main si lo hay o de la petición; o por qué no se abre. */
function faseYAreaDelCarril(raiz: string, peticion: PeticionDeCarril): FaseYAreaDelCarril | { problema: string } {
  const { nombre, fase, area } = peticion;
  const situacion = situacionDelRepositorio(raiz, new Map());
  const ticket = situacion.tickets.find(({ id }) => id === nombre);
  if (ticket !== undefined) {
    const problema = problemaDelTicket(ticket, situacion, peticion);
    if (problema !== undefined) return { problema };
    const forzado = peticion.forzar === true && estadoDelTicket(ticket, situacion).tipo !== 'listo';
    const avisos = [`Ticket ${rutaDelTicket(nombre)}: ${ticket.titulo}`, ...(forzado ? ['Abierto con FORZAR=1.'] : [])];
    return { fase: ticket.fase, area: ticket.area, avisos };
  }
  if (area === undefined) return { problema: SIN_AREA };
  if (fase === undefined)
    return { problema: `Sin ticket ${rutaDelTicket(nombre)} en ${RAMA_DE_ORIGEN}: hace falta F=<fase>.` };
  const sinTicket = `Sin ticket ${rutaDelTicket(nombre)} en ${RAMA_DE_ORIGEN}: para los solapes, el carril solo cuenta por lo que commitee.`;
  return { fase, area, avisos: [sinTicket] };
}

/** Por qué no se abre el carril del ticket: F o A no coinciden, ya está hecho o descartado, o no está listo sin FORZAR. */
function problemaDelTicket(ticket: Ticket, situacion: Situacion, peticion: PeticionDeCarril): string | undefined {
  const ruta = rutaDelTicket(ticket.id);
  const { fase = ticket.fase, area = ticket.area } = peticion;
  if (fase !== ticket.fase || area !== ticket.area) {
    return `${ruta} es de ${ticket.fase}/${ticket.area}, no de ${fase}/${area}. Quita F y A: salen del ticket.`;
  }
  const estado = estadoDelTicket(ticket, situacion);
  if (estado.tipo === 'hecho' || estado.tipo === 'descartado') return `${ruta} está ${estado.tipo}: no se abre.`;
  if (estado.tipo === 'listo' || peticion.forzar === true) return undefined;
  const motivo = estado.tipo === 'bloqueado' ? detalle(estado) : 'su carril ya está abierto';
  return `${ruta} no está listo: ${motivo}. Si aun así hay que abrirlo: FORZAR=1.`;
}

function problemaDeCarrilNuevo(raiz: string, nombre: string): string | undefined {
  const ramas = ramasDelCarril(raiz, nombre);
  if (ramas.length > 0) {
    return `El carril ${nombre} ya tiene ramas (${ramas.join(', ')}). Si ya no lo usas: make retirar N=${nombre}.`;
  }
  const directorio = directorioDeWorktree(raiz, nombre);
  return existsSync(directorio) ? `Ya existe ${directorio}.` : undefined;
}

/**
 * make rama: pasa el carril de `checkout` a su rama siguiente, desde origin/main recién traído y con
 * la fase y el área que tiene ahora. Solo si la rama actual ya está fusionada.
 */
export function pasarALaRamaSiguiente(checkout: string): Resultado {
  const carril = nombreDelCarril(checkout);
  if (carril === undefined) return falla(`${checkout} es el directorio principal, que sigue en main.`);
  const { fase, area } = faseYAreaDelCheckout(checkout);
  if (area === undefined) return falla(`${SIN_AREA} Fíjala con make fase N=${carril}.`);
  const actual = ramaActual(checkout);
  const problema = problemaParaDejarLasRamas(checkout, checkout, [actual]);
  if (problema !== undefined) return falla(problema);
  const rama = siguienteRama(checkout, { fase, area, carril });
  const cambiar = git(checkout, ['switch', '--quiet', '--no-track', '-c', rama, RAMA_DE_ORIGEN]);
  if (cambiar.codigo !== 0) return falla(`git switch ha fallado:\n${cambiar.errores}`);
  return { ok: true, mensajes: [`El carril ${carril} deja ${actual}, ya fusionada, y sigue en ${rama}.`] };
}

/**
 * make fase N=<carril>: por qué el carril no puede cambiar de fase y de área, o undefined si puede.
 * Su conversación siguiente empieza con make rama: la rama nueva ya lleva la fase y el área nuevas.
 */
export function problemaParaCambiarLaFase(raiz: string, peticion: PeticionDeWorktree): string | undefined {
  const { nombre, fase, area } = peticion;
  if (area === undefined) return SIN_AREA;
  const directorio = directorioDeWorktree(raiz, nombre);
  return (
    problemaDeNombre(nombre) ??
    (existsSync(directorio) ? undefined : `No hay un carril ${directorio}.`) ??
    problemaDeFaseYArea(raiz, fase, area) ??
    problemaDeRelevo(directorio) ??
    problemaParaDejarLasRamas(raiz, directorio, [ramaActual(directorio)])
  );
}

/** make retirar: borra el carril y todas sus ramas locales, fusionadas en origin/main (no en main: branch -D). */
export function retirarWorktree(raiz: string, nombre: string): Resultado {
  const directorio = directorioDeWorktree(raiz, nombre);
  const ramas = ramasDelCarril(raiz, nombre);
  const hayCarril = existsSync(directorio) || ramas.length > 0;
  const problema =
    problemaDeNombre(nombre) ??
    (hayCarril ? undefined : `No hay un carril ${nombre}: ni ${directorio} ni ramas suyas.`) ??
    problemaDeRelevo(directorio) ??
    problemaParaDejarLasRamas(raiz, directorio, ramas);
  if (problema !== undefined) return falla(problema);
  const fallo = borrarCarril(raiz, directorio, ramas);
  if (fallo !== undefined) return falla(fallo);
  return { ok: true, mensajes: [`Retirados el carril ${directorio} y sus ramas: ${ramas.join(', ')}.`] };
}

/** Quita el worktree, si está, y borra las ramas. Devuelve el motivo si git falla. */
function borrarCarril(raiz: string, directorio: string, ramas: readonly string[]): string | undefined {
  if (existsSync(directorio)) {
    const quitar = git(raiz, ['worktree', 'remove', directorio]);
    if (quitar.codigo !== 0) return `git worktree remove ha fallado:\n${quitar.errores}`;
  }
  if (ramas.length === 0) return undefined;
  const borrar = git(raiz, ['branch', '-D', ...ramas]);
  return borrar.codigo === 0 ? undefined : `git branch -D ha fallado:\n${borrar.errores}`;
}

function problemaDeRelevo(directorio: string): string | undefined {
  const relevo = rutaDelRelevo(directorio);
  return existsSync(relevo)
    ? `Relevo pendiente en ${relevo}: antes, una conversación del carril tiene que seguirlo.`
    : undefined;
}

/** Cambios sin commitear en el carril, o alguna de `ramas` sin fusionar en origin/main (recién traído). */
function problemaParaDejarLasRamas(raiz: string, directorio: string, ramas: readonly string[]): string | undefined {
  if (existsSync(directorio) && hayCambiosSinCommitear(directorio)) {
    return `${directorio} tiene cambios sin commitear: commitéalos y que se fusione su PR, o deshazlos.`;
  }
  const problema = traerOrigen(raiz);
  if (problema !== undefined) return problema;
  const sinFusionar = ramas.filter((rama) => !estaFusionada(raiz, rama));
  if (sinFusionar.length === 0) return undefined;
  return `Sin fusionar en ${RAMA_DE_ORIGEN}: ${sinFusionar.join(', ')}. Espera a que GitHub fusione su PR.`;
}
