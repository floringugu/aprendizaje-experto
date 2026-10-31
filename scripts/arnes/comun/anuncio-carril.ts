// Lógica del hook PostToolUse anunciar-carril.ts: cuando la conversación entra en un carril con
// EnterWorktree, le dice en qué carril está y cómo se trabaja en él y, si el carril tiene ticket
// (tickets.ts), qué dice el ticket y con qué carriles abiertos se solapa. Hace para el carril lo que
// anunciar-fase.ts hace al empezar la conversación. Separada del hook para probarla con tests.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { checkoutDelRepositorio, faseYAreaDelCheckout, nombreDelCarril } from './checkout.ts';
import { campo, campoTexto } from './entrada-hook.ts';
import { situacionDelRepositorio, solapesDelCarril, textoDeSolape } from './estado-tickets.ts';
import { MODELO_POR_FASE, OBJETIVO_POR_FASE, PROPOSITO_POR_FASE } from './fases.ts';
import { avisoDeRelevoPendiente, carrilesConRelevo } from './relevo.ts';
import { apartado, rutaDelTicket, ticketsDe } from './tickets.ts';

const RUTA_CODEOWNERS = '.github/CODEOWNERS';

export interface AnuncioDelCarril {
  /** Aviso de una línea para el dueño (systemMessage). */
  readonly paraElDueno: string;
  /** Contexto para Claude (additionalContext). */
  readonly paraClaude: string;
}

/**
 * El anuncio del carril en el que entra la conversación, según la entrada del hook: el
 * tool_input.path de EnterWorktree, resuelto contra el cwd de la entrada. undefined sin path, si la
 * ruta no es de un checkout del repositorio de `raiz` o si es la carpeta principal, que no es un carril.
 */
export function anuncioDelCarril(raiz: string, entrada: unknown): AnuncioDelCarril | undefined {
  const enCarril = carrilDeLaEntrada(raiz, entrada);
  if (enCarril === undefined) return undefined;
  const { carril, nombre } = enCarril;
  const { fase, area } = faseYAreaDelCheckout(carril);
  const objetivo = OBJETIVO_POR_FASE[fase];
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  const blanca = listaBlanca(carril);
  const relevos = carrilesConRelevo([carril]);
  const avisos = [
    `Carril ${nombre}: fase ${fase} (${modelo}, esfuerzo ${esfuerzo})`,
    `área en curso: ${area ?? 'ninguna'}`,
    `git push exige make ${objetivo}`,
    ...(relevos.length === 0 ? [] : ['relevo pendiente']),
  ];
  return {
    paraElDueno: `${avisos.join(' · ')}.`,
    paraClaude: [
      `Arnés: la conversación ha entrado en el carril «${nombre}» (${carril}), en la fase «${fase}» ` +
        `(${PROPOSITO_POR_FASE[fase]}). Área en curso: ${area ?? 'ninguna'}.`,
      `git push y gh pr create exigen «make ${objetivo}» en verde en este carril: el hook exigir-check-push los niega mientras falle.`,
      blanca.length === 0
        ? `El carril no tiene lista blanca (${RUTA_CODEOWNERS}): todo PR espera al visto bueno del dueño.`
        : `Un PR que solo toca la lista blanca (${RUTA_CODEOWNERS}) se fusiona solo: ${blanca.join(', ')}. ` +
          'Lo demás espera al visto bueno del dueño.',
      `La fase pide ${modelo} con esfuerzo ${esfuerzo}. Si la conversación usa otro modelo, pídele al dueño «/model ${modelo}».`,
      `Los enlaces a ficheros del carril van con ruta absoluta (${carril}/…): las relativas apuntan a la carpeta principal.`,
      'Los demás carriles son de otras conversaciones: no se tocan.',
      ...lineasDelTicket(raiz, carril, nombre),
      ...(relevos.length === 0 ? [] : [avisoDeRelevoPendiente(relevos)]),
    ].join('\n'),
  };
}

/** La ruta y el nombre del carril de la entrada; undefined sin path, fuera del repositorio o en la carpeta principal. */
function carrilDeLaEntrada(raiz: string, entrada: unknown): { carril: string; nombre: string } | undefined {
  const ruta = campoTexto(campo(entrada, 'tool_input'), 'path');
  if (ruta === undefined) return undefined;
  const carril = checkoutDelRepositorio(raiz, path.resolve(campoTexto(entrada, 'cwd') ?? raiz, ruta));
  const nombre = carril === undefined ? undefined : nombreDelCarril(carril);
  return carril === undefined || nombre === undefined ? undefined : { carril, nombre };
}

/**
 * Lo que dice el ticket del carril, leído de su árbol de trabajo: título, «Hecho cuando», «Leer
 * primero», «toca» y los carriles abiertos con que se solapa, con lo último que se trajo de origin
 * (sin fetch ni gh, que pueden tardar). Vacío si el carril no tiene ticket.
 */
function lineasDelTicket(raiz: string, carril: string, nombre: string): string[] {
  const ticket = ticketsDe(carril).tickets.find(({ id }) => id === nombre);
  if (ticket === undefined) return [];
  const hechoCuando = apartado(ticket, 'Hecho cuando');
  const leerPrimero = apartado(ticket, 'Leer primero');
  const solapes = solapesDelCarril(nombre, situacionDelRepositorio(raiz, new Map()));
  return [
    `Ticket del carril (${rutaDelTicket(nombre)}): «${ticket.titulo}». Es el trabajo de la conversación, ` +
      'y «Hecho cuando» es el criterio de cierre.',
    ...(hechoCuando === undefined ? [] : [`Hecho cuando: ${hechoCuando}`]),
    ...(leerPrimero === undefined ? [] : [`Leer primero: ${leerPrimero}`]),
    `Toca: ${ticket.toca.length === 0 ? 'nada todavía' : ticket.toca.join(', ')}.`,
    ...(solapes.length === 0 ? [] : [`Se solapa con los carriles abiertos ${solapes.map(textoDeSolape).join('; ')}.`]),
  ];
}

/** Las rutas sin dueño de .github/CODEOWNERS del carril: las líneas de un solo campo, sin las vacías ni los comentarios. */
function listaBlanca(carril: string): string[] {
  const ruta = path.join(carril, RUTA_CODEOWNERS);
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8')
    .split('\n')
    .map((linea) => linea.trim().split(/\s+/))
    .filter((campos) => campos.length === 1 && campos[0] !== '' && !campos[0]?.startsWith('#'))
    .map(([patron = '']) => patron);
}
