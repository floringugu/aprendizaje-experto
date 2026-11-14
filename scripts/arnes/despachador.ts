// make despachar [FIN=07:00] [ULTIMO=06:00] (docs/plan.md §6, «Noche desatendida»): el Despachador.
// Toma, uno tras otro, los tickets listos que el dueño aprobó con «make aprobar»; abre el carril de
// cada uno, lanza en él «claude -p» con el modelo y el esfuerzo de su fase, y cuando la sesión
// termina aplica las reglas de comun/despachador.ts: otra sesión, reanudar, esperar al límite, dejar
// el ticket en la cola de la mañana o, si GitHub ha fusionado su PR, retirar el carril.
// Lo lanza el dueño, no Claude Code: las sesiones corren sin permisos que pedir (bypassPermissions),
// con los hooks del arnés como única guardia. Deja el diario y los streams en reports/noche/ de la
// carpeta principal; «make manana» los lee.
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { appendFileSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as esperar } from 'node:timers/promises';
import { leerAprobados, rutaDeAprobados } from './comun/aprobados.ts';
import { carpetaPrincipal } from './comun/checkout.ts';
import {
  hayQueEsperarAlPr,
  leerPr,
  leerStream,
  PARADAS_DE_SESION,
  queHacer,
  ventanaDesde,
} from './comun/despachador.ts';
import type { Accion, ParadaDeSesion, PrSegunGitHub, Ventana } from './comun/despachador.ts';
import { anotarEnElDiario, carpetaDeLaNoche } from './comun/diario-noche.ts';
import type { Suceso } from './comun/diario-noche.ts';
import { estadoDeLosTickets, prsAbiertos, situacionDelRepositorio } from './comun/estado-tickets.ts';
import { MODELO_POR_FASE } from './comun/fases.ts';
import type { Fase } from './comun/fases.ts';
import { git } from './comun/git.ts';
import { traerOrigen } from './comun/ramas.ts';
import { RAIZ } from './comun/raiz.ts';
import { leerRegistro } from './comun/registro-stop.ts';
import { abrirWorktree, directorioDeWorktree, retirarWorktree } from './comun/worktrees.ts';

const PRINCIPAL = carpetaPrincipal(RAIZ);

// La frase de la prueba de humo del 14-11-2026. Lo que sigue al PR (fusión automática y esperar a la
// CI) lo pide CLAUDE.md, «Al terminar».
const PETICION =
  'Haz el ticket de este carril hasta abrir su PR. No hay nadie delante: no preguntes; si necesitas ' +
  'una decisión del dueño, termina con la marca de decisión pendiente del arnés.';

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
/** Cada cuánto se pregunta a GitHub por el PR, y cuánto se espera como mucho a su CI y a su fusión. */
const PAUSA_DEL_PR = 30 * SEGUNDO;
const ESPERA_DEL_PR = 30 * MINUTO;

function anotar(suceso: Suceso): void {
  anotarEnElDiario(PRINCIPAL, suceso);
}

function decir(texto: string): void {
  console.log(`${new Date().toLocaleTimeString('es-ES')} ${texto}`);
}

interface TicketListo {
  readonly id: string;
  readonly fase: Fase;
}

/** El primer ticket aprobado, en el orden de la lista, que está listo y no se ha intentado esta noche. */
function siguienteTicket(intentados: ReadonlySet<string>): TicketListo | undefined {
  const problema = traerOrigen(PRINCIPAL);
  if (problema !== undefined) decir(`Sigo con lo último que se trajo de origin. ${problema}`);
  const estados = estadoDeLosTickets(situacionDelRepositorio(PRINCIPAL, prsAbiertos(PRINCIPAL)));
  const listos = estados.filter(({ estado }) => estado.tipo === 'listo').map(({ ticket }) => ticket);
  for (const id of leerAprobados(rutaDeAprobados())) {
    const ticket = listos.find((listo) => listo.id === id);
    if (ticket !== undefined && !intentados.has(id)) return { id, fase: ticket.fase };
  }
  return undefined;
}

interface Sesion {
  readonly ticket: TicketListo;
  /** El session_id de la sesión que se reanuda con «--resume»; undefined en una sesión nueva. */
  readonly reanuda: string | undefined;
}

/**
 * Lanza «claude -p» en el carril y espera a que termine. Guarda su stream sobre la marcha, cada
 * evento con su hora delante, y devuelve la ruta. Sin tope de espera a lo que corra en segundo
 * plano: con el de 10 minutos, «claude -p» mata al subagente que sigue trabajando (plan §5).
 */
async function lanzarSesion({ ticket, reanuda }: Sesion): Promise<string> {
  const { modelo, esfuerzo } = MODELO_POR_FASE[ticket.fase];
  const sello = new Date().toISOString().replaceAll(/[-:]|\.\d+Z$/g, '');
  const stream = path.join(carpetaDeLaNoche(PRINCIPAL), `${ticket.id}-${sello}.tsv`);
  const peticion = reanuda === undefined ? [PETICION] : ['sigue', '--resume', reanuda];
  const salida = ['--output-format', 'stream-json', '--verbose'];
  const argumentos = [
    '-p',
    ...peticion,
    '--model',
    modelo,
    '--effort',
    esfuerzo,
    '--permission-mode',
    'bypassPermissions',
  ];
  anotar({ tipo: 'sesion', ticket: ticket.id, stream, reanudada: reanuda !== undefined });
  decir(`${ticket.id}: ${reanuda === undefined ? 'sesión nueva' : 'reanudo la sesión'} (${modelo}, ${esfuerzo}).`);
  const proceso = spawn('claude', [...argumentos, ...salida], {
    cwd: directorioDeWorktree(PRINCIPAL, ticket.id),
    env: { ...process.env, CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' },
    stdio: ['ignore', 'pipe', openSync(`${stream}.err`, 'a')],
  });
  const final = once(proceso, 'close');
  if (proceso.stdout === null) throw new Error('claude se ha lanzado sin salida que leer.');
  for await (const linea of createInterface({ input: proceso.stdout })) {
    appendFileSync(stream, `${new Date().toISOString()}\t${linea}\n`);
  }
  await final;
  return stream;
}

/** El PR más reciente de la rama, según gh; undefined si no tiene o gh falla. */
function prDeLaRama(directorio: string, rama: string): PrSegunGitHub | undefined {
  const campos = 'number,state,autoMergeRequest,statusCheckRollup';
  const argumentos = ['pr', 'list', '--head', rama, '--state', 'all', '--limit', '1', '--json', campos];
  const resultado = spawnSync('gh', argumentos, { cwd: directorio, encoding: 'utf8' });
  if (resultado.status !== 0) return undefined;
  return leerPr((JSON.parse(resultado.stdout) as unknown[])[0]);
}

/** El PR de la rama actual del carril, tras esperar a que su CI termine y, si se fusiona solo, a que GitHub lo fusione. */
async function prDelCarril(directorio: string): Promise<PrSegunGitHub | undefined> {
  const rama = git(directorio, ['branch', '--show-current']).salida.trim();
  const limite = Date.now() + ESPERA_DEL_PR;
  let pr = prDeLaRama(directorio, rama);
  while (pr !== undefined && hayQueEsperarAlPr(pr) && Date.now() < limite) {
    await esperar(PAUSA_DEL_PR);
    pr = prDeLaRama(directorio, rama);
  }
  return pr;
}

/** Cómo va un ticket: la sesión que toca lanzar y las que ya lleva. */
interface Marcha extends Sesion {
  /** El final de la ventana. */
  readonly fin: Date;
  readonly relevos: number;
  readonly reanudaciones: number;
}

interface Final {
  readonly accion: Accion;
  readonly sesion: string | undefined;
}

/** Reúne lo que se sabe de la sesión que acaba de terminar y aplica las reglas. */
async function alTerminar({ ticket, fin, relevos, reanudaciones }: Marcha, stream: string): Promise<Final> {
  const directorio = directorioDeWorktree(PRINCIPAL, ticket.id);
  const { sesion, error, reinicioDelLimite } = leerStream(readFileSync(stream, 'utf8'));
  const paradas = leerRegistro(directorio).filter((parada) => parada.sesion === sesion);
  const parada = paradas.map(({ resultado }) => resultado).findLast(esParadaDeSesion);
  const pr = await prDelCarril(directorio);
  const accion = queHacer({ parada, pr, error, reinicioDelLimite, relevos, reanudaciones, ahora: new Date(), fin });
  anotar({ tipo: 'decision', ticket: ticket.id, accion });
  return { accion, sesion };
}

function esParadaDeSesion(resultado: string): resultado is ParadaDeSesion {
  return (PARADAS_DE_SESION as readonly string[]).includes(resultado);
}

/** Retira el carril del ticket hecho, con lo mismo que «make retirar». Si no se deja, lo avisa en el diario. */
function retirar(ticket: string, pr: number): void {
  const { ok, mensajes } = retirarWorktree(PRINCIPAL, ticket);
  decir(`${ticket}: PR #${String(pr)} fusionado; ${ok ? 'carril retirado' : 'el carril no se ha podido retirar'}.`);
  if (!ok) anotar({ tipo: 'aviso', ticket, texto: `El carril no se ha retirado: ${mensajes.join(' ')}` });
}

/**
 * La sesión siguiente del ticket. Tras un relevo es una nueva, que empieza por leerlo; si no, sigue
 * la misma: reanudada, o tras esperar a que el límite de uso se reinicie (un minuto de margen).
 */
async function siguienteSesion(marcha: Marcha, { accion, sesion }: Final): Promise<Marcha> {
  if (accion.tipo === 'sesion-nueva') return { ...marcha, reanuda: undefined, relevos: marcha.relevos + 1 };
  if (accion.tipo === 'esperar') {
    decir(`${marcha.ticket.id}: límite de uso agotado; espero hasta las ${accion.hasta.toLocaleTimeString('es-ES')}.`);
    await esperar(Math.max(0, accion.hasta.getTime() - Date.now()) + MINUTO);
    return { ...marcha, reanuda: sesion };
  }
  return { ...marcha, reanuda: sesion, reanudaciones: marcha.reanudaciones + 1 };
}

/** Lleva un ticket hasta que queda hecho o en la cola. Devuelve el motivo si la noche tiene que terminar. */
async function despachar(ticket: TicketListo, fin: Date): Promise<string | undefined> {
  const abierto = abrirWorktree(PRINCIPAL, { nombre: ticket.id, fase: undefined, area: undefined });
  if (!abierto.ok) {
    const motivo = `no se ha podido abrir su carril: ${abierto.mensajes.join(' ')}`;
    anotar({ tipo: 'decision', ticket: ticket.id, accion: { tipo: 'cola', motivo } });
    return undefined;
  }
  let marcha: Marcha = { ticket, fin, reanuda: undefined, relevos: 0, reanudaciones: 0 };
  for (;;) {
    const final = await alTerminar(marcha, await lanzarSesion(marcha));
    const { accion } = final;
    if (accion.tipo === 'hecho') {
      retirar(ticket.id, accion.pr);
      return undefined;
    }
    if (accion.tipo === 'cola' || accion.tipo === 'fin') {
      decir(`${ticket.id}: a la cola; ${accion.motivo}.`);
      return accion.tipo === 'fin' ? accion.motivo : undefined;
    }
    marcha = await siguienteSesion(marcha, final);
  }
}

/** La noche: un ticket tras otro hasta que no queda ninguno, pasa la hora del último o una regla la termina. */
async function noche({ fin, ultimoTicket }: Ventana): Promise<string> {
  const intentados = new Set<string>();
  for (;;) {
    if (new Date() >= ultimoTicket) return 'pasó la hora del último ticket';
    const ticket = siguienteTicket(intentados);
    if (ticket === undefined) return 'no quedan tickets listos y aprobados';
    intentados.add(ticket.id);
    const motivo = await despachar(ticket, fin);
    if (motivo !== undefined) return motivo;
  }
}

async function principal(): Promise<number> {
  const [horaDelFin = '', horaDelUltimo = ''] = process.argv.slice(2);
  const ventana = ventanaDesde(
    new Date(),
    horaDelFin === '' ? '07:00' : horaDelFin,
    horaDelUltimo === '' ? '06:00' : horaDelUltimo,
  );
  if (process.env['CLAUDECODE'] !== undefined) {
    console.error('make despachar solo lo lanza el dueño, desde su terminal (no desde Claude Code).');
    return 1;
  }
  if (ventana === undefined) {
    console.error('Uso: make despachar [FIN=HH:MM] [ULTIMO=HH:MM] (por defecto, 07:00 y 06:00).');
    return 1;
  }
  mkdirSync(carpetaDeLaNoche(PRINCIPAL), { recursive: true });
  anotar({ tipo: 'inicio', fin: ventana.fin.toISOString(), ultimoTicket: ventana.ultimoTicket.toISOString() });
  decir(`Despachador en marcha: tickets nuevos hasta las ${ventana.ultimoTicket.toLocaleTimeString('es-ES')}.`);
  const motivo = await noche(ventana);
  anotar({ tipo: 'fin', motivo });
  decir(`Fin de la noche: ${motivo}. Mira «make manana».`);
  return 0;
}

process.exitCode = await principal();
