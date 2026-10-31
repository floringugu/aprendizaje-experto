// Relevo entre conversaciones (docs/plan.md §5, «Relevo»).
//
// En cada llamada, el modelo vuelve a leer el contexto entero de la conversación: cuanto más largo
// es, más cuesta cada paso. En vez de compactar, al pasar de UMBRAL_DE_RELEVO tokens Claude acaba el
// paso en curso, apunta el estado en el reports/relevo.md de su checkout (fuera de git) y para con
// [RELEVO]. El dueño sigue en una conversación nueva, que lee el fichero y lo borra. El relevo es
// obligatorio: la conversación que lo ha pasado ya no edita (MOTIVO_EDICION_TRAS_RELEVO) y no puede
// pasar otro; solo le queda explicar y parar.
//
// Lo usan cinco hooks:
//   - vigilar-contexto (PostToolUse): avisa al pasar el umbral, y otra vez cada PASO_DE_AVISO tokens;
//   - anotar-parada (Stop): anota la parada con [RELEVO] como relevo, si el contexto pasa del umbral
//     y la conversación no ha pasado ya el relevo;
//   - bloquear-tras-relevo (PreToolUse): niega Edit, Write, MultiEdit y NotebookEdit a la conversación
//     que ya ha pasado el relevo;
//   - anunciar-fase (SessionStart): señala los checkouts del repositorio que tienen un relevo pendiente;
//   - anunciar-carril (PostToolUse de EnterWorktree): señala el relevo pendiente del carril en el que entra.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { campo } from './entrada-hook.ts';
import { MARCA_DECISION_PENDIENTE } from './exigir-check.ts';
import { anotarLinea, leerLineas, parsearLineas } from './jsonl.ts';

export const MARCA_RELEVO = '[RELEVO]';
// Por debajo de la autocompactación de Claude Code (~167 k con la ventana de 200 k), con el margen
// que se gasta entre el aviso y el [RELEVO] (docs/plan.md §5, «Relevo»).
const UMBRAL_DE_RELEVO = 145_000;
const PASO_DE_AVISO = 20_000;

// Fuera de git (.gitignore), como el registro del hook Stop.
const RUTA_REGISTRO_CONTEXTO = '.claude/registro-contexto.jsonl';
// En cada checkout, dentro de reports/, que está fuera de git (.gitignore).
const RUTA_DEL_RELEVO = 'reports/relevo.md';

// ---------------------------------------------------------------------------
// Tamaño del contexto
// ---------------------------------------------------------------------------

/**
 * Tokens de contexto de la última llamada al modelo que recoge el transcript de Claude Code: los de
 * entrada, más los que se escriben en la caché y los que se leen de ella. undefined si aún no hay
 * ninguna. Claude Code escribe el transcript con algo de retraso: puede ir una llamada por detrás.
 */
export function tokensDeContexto(transcript: string): number | undefined {
  // Solo se interpretan las líneas con «usage»: el transcript puede pesar varios MB.
  const conUso = transcript.split('\n').filter((linea) => linea.includes('"usage"'));
  return parsearLineas(conUso.join('\n'), esObjeto).flatMap(tokensDeLlamada).at(-1);
}

/** Lo mismo, leyendo el fichero. undefined si la ruta no llega o el fichero no existe. */
export function tokensDelTranscript(ruta: string | undefined): number | undefined {
  if (ruta === undefined || !existsSync(ruta)) return undefined;
  return tokensDeContexto(readFileSync(ruta, 'utf8'));
}

function esObjeto(valor: unknown): valor is object {
  return typeof valor === 'object' && valor !== null;
}

/** Los tokens de una respuesta de la conversación principal, o ninguno si la línea es otra cosa. */
function tokensDeLlamada(linea: object): number[] {
  // Las líneas «isSidechain» son de un subagente, que tiene su propio contexto.
  if (campo(linea, 'type') !== 'assistant' || campo(linea, 'isSidechain') === true) return [];
  const uso = campo(campo(linea, 'message'), 'usage');
  const entrada = campo(uso, 'input_tokens');
  if (typeof entrada !== 'number') return [];
  return [
    entrada +
      numeroOCero(campo(uso, 'cache_creation_input_tokens')) +
      numeroOCero(campo(uso, 'cache_read_input_tokens')),
  ];
}

function numeroOCero(valor: unknown): number {
  return typeof valor === 'number' ? valor : 0;
}

/** 0 por debajo del umbral, 1 desde el umbral, 2 desde el umbral más un paso de aviso, y así. */
export function tramoDeContexto(tokens: number): number {
  return tokens < UMBRAL_DE_RELEVO ? 0 : 1 + Math.floor((tokens - UMBRAL_DE_RELEVO) / PASO_DE_AVISO);
}

/**
 * [RELEVO] solo cuenta por encima del umbral: por debajo, nombrar la marca en un mensaje no deja a la
 * conversación sin poder editar.
 */
export function puedePasarElRelevo(tokens: number): boolean {
  return tokens >= UMBRAL_DE_RELEVO;
}

// ---------------------------------------------------------------------------
// Registro de tramos: para avisar una vez por tramo, y no en cada herramienta
// ---------------------------------------------------------------------------

export interface TramoAnotado {
  /** Fecha y hora ISO 8601. */
  readonly fecha: string;
  /** session_id de Claude Code: identifica la conversación. */
  readonly sesion: string;
  /** Carril del checkout de la conversación (nombreDelCarril en checkout.ts); no está en el directorio principal. */
  readonly carril?: string;
  readonly tokens: number;
  readonly tramo: number;
}

export function anotarTramo(raiz: string, tramo: TramoAnotado): void {
  anotarLinea(path.join(raiz, RUTA_REGISTRO_CONTEXTO), tramo);
}

export function leerRegistroContexto(raiz: string): TramoAnotado[] {
  return leerLineas(path.join(raiz, RUTA_REGISTRO_CONTEXTO), esTramo);
}

function esTramo(valor: unknown): valor is TramoAnotado {
  return typeof campo(valor, 'sesion') === 'string' && typeof campo(valor, 'tramo') === 'number';
}

/** El tramo de la última anotación de la conversación; 0 si no tiene ninguna. */
export function ultimoTramo(registro: readonly TramoAnotado[], sesion: string): number {
  return registro.filter((anotado) => anotado.sesion === sesion).at(-1)?.tramo ?? 0;
}

// ---------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------

function miles(tokens: number): string {
  return `${String(Math.round(tokens / 1000))} k`;
}

/** El aviso del umbral, con la ruta absoluta del relevo del checkout de la conversación. */
export function avisoParaClaude(tokens: number, checkout: string): string {
  return (
    `Relevo: el contexto de esta conversación va por ${miles(tokens)} tokens (umbral: ${miles(UMBRAL_DE_RELEVO)}), ` +
    'y cada llamada lo vuelve a leer entero. Acaba el paso en curso sin empezar otro. Después apunta el estado ' +
    `en ${rutaDelRelevo(checkout)}: qué está hecho, qué falta, el paso siguiente y qué hay que leer primero, ` +
    'en rangos fichero:líneas y no en ficheros enteros. Apunta también las búsquedas que ya has hecho y lo que ' +
    `dieron: así la conversación nueva no repite tu lectura. Termina el mensaje con ${MARCA_RELEVO}: el hook ` +
    'Stop lo anota, y el dueño seguirá en una conversación nueva. Después de ese relevo esta conversación ya no ' +
    'podrá editar ficheros.'
  );
}

export function avisoParaElDueno(tokens: number): string {
  return (
    `Contexto: ${miles(tokens)} tokens (umbral de relevo: ${miles(UMBRAL_DE_RELEVO)}). Claude acabará el paso en ` +
    `curso, apuntará el relevo y parará con ${MARCA_RELEVO}. Después, esa conversación ya no edita: sigue en una nueva.`
  );
}

export function avisoDeRelevoPasado(tokens: number): string {
  return (
    `Claude ha parado con ${MARCA_RELEVO} (contexto: ${miles(tokens)} tokens). Sigue en una conversación nueva: ` +
    'el aviso de inicio te dirá qué carril tiene el relevo.'
  );
}

/** Lo que ve Claude si intenta editar después de pasar el relevo (hook bloquear-tras-relevo). */
export const MOTIVO_EDICION_TRAS_RELEVO =
  `Esta conversación ya ha pasado el relevo (${MARCA_RELEVO}) y no edita más ficheros: el dueño sigue en una ` +
  `conversación nueva, que lee el relevo (${RUTA_DEL_RELEVO}). Si falta algo, dilo en tu mensaje y para; si necesitas ` +
  `una decisión, termina con ${MARCA_DECISION_PENDIENTE}.`;

// ---------------------------------------------------------------------------
// Relevos pendientes
// ---------------------------------------------------------------------------

/** Ruta absoluta del relevo del checkout. */
export function rutaDelRelevo(checkout: string): string {
  return path.join(checkout, RUTA_DEL_RELEVO);
}

/** Los checkouts de `checkouts` con un relevo pendiente: los que tienen un reports/relevo.md. */
export function carrilesConRelevo(checkouts: readonly string[]): string[] {
  return checkouts.filter((checkout) => existsSync(rutaDelRelevo(checkout)));
}

/** Aviso de inicio para los checkouts de carrilesConRelevo, con la ruta absoluta de cada relevo. */
export function avisoDeRelevoPendiente(checkouts: readonly string[]): string {
  const ficheros = checkouts.map(rutaDelRelevo).join(', ');
  return (
    `Relevo pendiente en ${ficheros}. Si sigues en ese carril, lee primero el relevo y bórralo: ` +
    'el próximo relevo escribirá otro.'
  );
}
