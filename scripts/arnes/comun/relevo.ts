// Relevo entre conversaciones (docs/plan.md §5, «Relevo»).
//
// En cada llamada, el modelo vuelve a leer el contexto entero de la conversación: cuanto más largo
// es, más cuesta cada paso. En vez de compactar, al pasar de UMBRAL_DE_RELEVO tokens Claude acaba el
// paso en curso, apunta el estado en una sección «## Relevo» de docs/areas/<ÁREA>.md y para con
// [RELEVO]. El dueño sigue en una conversación nueva, que lee la sección y la borra. El relevo es
// obligatorio: la conversación que lo ha pasado ya no edita (MOTIVO_EDICION_TRAS_RELEVO) y no puede
// pasar otro (NOTA_TRAS_RELEVO); solo le queda explicar y parar con la comprobación o con una decisión.
//
// Lo usan cuatro hooks:
//   - vigilar-contexto (PostToolUse): avisa al pasar el umbral, y otra vez cada PASO_DE_AVISO tokens;
//   - exigir-check (Stop): deja parar con [RELEVO] sin la comprobación, si el contexto pasa del umbral
//     y la conversación no ha pasado ya el relevo;
//   - bloquear-tras-relevo (PreToolUse): niega Edit, Write, MultiEdit y NotebookEdit a la conversación
//     que ya ha pasado el relevo;
//   - anunciar-fase (SessionStart): señala las áreas que tienen un relevo pendiente.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { campo } from './entrada-hook.ts';
import { MARCA_DECISION_PENDIENTE } from './freno-stop.ts';
import { anotarLinea, leerLineas, parsearLineas } from './jsonl.ts';

export const MARCA_RELEVO = '[RELEVO]';
const UMBRAL_DE_RELEVO = 120_000;
const PASO_DE_AVISO = 20_000;

// Fuera de git (.gitignore), como el registro del hook Stop.
const RUTA_REGISTRO_CONTEXTO = '.claude/registro-contexto.jsonl';
const CARPETA_DE_AREAS = 'docs/areas';

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

/** [RELEVO] solo deja parar por encima del umbral: así la marca no sirve para saltarse la comprobación. */
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

export function avisoParaClaude(tokens: number): string {
  return (
    `Relevo: el contexto de esta conversación va por ${miles(tokens)} tokens (umbral: ${miles(UMBRAL_DE_RELEVO)}), ` +
    'y cada llamada lo vuelve a leer entero. Acaba el paso en curso sin empezar otro. Después apunta el estado ' +
    `al final de ${CARPETA_DE_AREAS}/<ÁREA>.md, en una sección «## Relevo»: qué está hecho, qué falta, el paso ` +
    'siguiente y los ficheros que hay que leer primero (si el fichero no existe, cópialo de la plantilla). Si la ' +
    `conversación no trabaja en un área, escribe el relevo en tu mensaje final. Termina el mensaje con ${MARCA_RELEVO}: ` +
    'el hook Stop te deja parar así sin la comprobación, y el dueño seguirá en una conversación nueva. ' +
    'Después de ese relevo esta conversación ya no podrá editar ficheros.'
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
    'el aviso de inicio te dirá qué área tiene el relevo. La comprobación no se ha ejecutado.'
  );
}

export const NOTA_DE_RELEVO_ANTES_DE_TIEMPO =
  `Has terminado con ${MARCA_RELEVO}, pero el contexto no llega al umbral de relevo ` +
  `(${miles(UMBRAL_DE_RELEVO)} tokens). Sigue con el trabajo de la fase.`;

/** Lo que ve Claude si intenta editar después de pasar el relevo (hook bloquear-tras-relevo). */
export const MOTIVO_EDICION_TRAS_RELEVO =
  `Esta conversación ya ha pasado el relevo (${MARCA_RELEVO}) y no edita más ficheros: el dueño sigue en una ` +
  'conversación nueva, que lee la sección «## Relevo». Si falta algo, dilo en tu mensaje y para; si necesitas ' +
  `una decisión, termina con ${MARCA_DECISION_PENDIENTE}.`;

/** Lo que ve Claude si el Stop falla en una conversación que ya ha pasado el relevo: no puede arreglarlo. */
export const NOTA_TRAS_RELEVO =
  `Esta conversación ya ha pasado el relevo, así que ${MARCA_RELEVO} no vale otra vez y ya no puede editar ` +
  `ficheros. No intentes arreglar el fallo: explica en el mensaje qué falla y termina con ${MARCA_DECISION_PENDIENTE}; ` +
  'el dueño lo arregla en la conversación nueva.';

// ---------------------------------------------------------------------------
// Relevos pendientes
// ---------------------------------------------------------------------------

/** Áreas con un relevo pendiente: los docs/areas/<ÁREA>.md que tienen una sección «## Relevo». */
export function areasConRelevo(raiz: string): string[] {
  const carpeta = path.join(raiz, CARPETA_DE_AREAS);
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta)
    .filter((nombre) => nombre.endsWith('.md') && nombre !== 'plantilla.md')
    .filter((nombre) => /^## Relevo\s*$/m.test(readFileSync(path.join(carpeta, nombre), 'utf8')))
    .map((nombre) => nombre.replace(/\.md$/, ''))
    .toSorted((a, b) => a.localeCompare(b));
}

export function avisoDeRelevoPendiente(areas: readonly string[]): string {
  const ficheros = areas.map((area) => `${CARPETA_DE_AREAS}/${area}.md`).join(', ');
  return (
    `Relevo pendiente en ${ficheros}. Si sigues con esa área, lee primero su sección «## Relevo» y bórrala: ` +
    'el próximo relevo escribirá una nueva.'
  );
}
