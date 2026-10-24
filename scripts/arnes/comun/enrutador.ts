// Enrutador de modelos de los subagentes: la regla del hook PreToolUse sobre Agent
// (.claude/hooks/enrutar-modelo.ts). Separada del hook para poder probarla con tests unitarios.
//
// En la fase impl, la conversación principal decide el diseño: escribe los comentarios de interfaz
// y las firmas. Los cuerpos y los tests unitarios se los encarga al subagente implementador, y el
// modelo de cada encargo no lo elige Claude, sino esta regla fija:
//   - Haiku, si el encargo solo toca tests/unidad/ y como mucho un fichero de src/dominio/:
//     funciones puras con la interfaz ya escrita;
//   - Sonnet, en cualquier otro caso (src/aplicacion/ o varios ficheros del dominio).
// Si la conversación vuelve a encargar la misma tarea es que el encargo anterior no salió bien,
// así que sube un escalón (Haiku → Sonnet). Después de Sonnet no hay más: la conversación
// principal lo hace ella misma o para con [DECISIÓN PENDIENTE].
//
// Los revisores usan siempre el modelo y el esfuerzo de su cabecera (.claude/agents/), aunque
// Claude pase otros.
//
// Los demás subagentes (general-purpose, Explore, Plan…) usarían el modelo de la conversación
// principal, que puede ser Opus. Si Claude no les pasa un modelo, van a Haiku los de búsqueda y
// consulta, y a Sonnet el resto. Un fork no se toca: Claude Code le da siempre el modelo de la
// conversación y no admite otro.
import path from 'node:path';
import { campoTexto } from './entrada-hook.ts';
import { MARCA_DECISION_PENDIENTE } from './freno-stop.ts';
import type { Fase } from './protegidas.ts';
import { ultimoModeloDeLaTarea } from './registro-enrutador.ts';
import type { EventoEnrutador } from './registro-enrutador.ts';

const IMPLEMENTADOR = 'implementador';
const AGENTES_CON_MODELO_FIJO: readonly string[] = ['revisor-codigo', 'revisor-evidencia'];
const FORK = 'fork';
/** Subagentes que solo buscan o consultan: Haiku les basta. */
const AGENTES_DE_BUSQUEDA: readonly string[] = ['Explore', 'claude-code-guide'];
/** El subagente que lanza Agent cuando la llamada no dice cuál. */
const AGENTE_POR_DEFECTO = 'general-purpose';

/** Campos de la llamada a Agent que eligen el modelo; el enrutador no deja que los elija Claude. */
const CAMPOS_DEL_MODELO: readonly string[] = ['model', 'effort'];

const ESCALERA = ['haiku', 'sonnet'] as const;
type ModeloDelImplementador = (typeof ESCALERA)[number];

const FICHEROS_DE_DOMINIO_PARA_HAIKU = 1;
const RUTAS_DEL_IMPLEMENTADOR: readonly string[] = ['src/', 'tests/unidad/'];

const FORMATO_DEL_ENCARGO =
  'Tarea: <ÁREA>-<n>\nFicheros: <rutas de src/ y tests/unidad/ que puede tocar, separadas por comas>';

export interface Encargo {
  /** Etiqueta de la tarea, por ejemplo MAST-3. Repetirla en la misma conversación sube un modelo. */
  readonly tarea: string;
  /** Rutas relativas a la raíz del repositorio, normalizadas. */
  readonly ficheros: readonly string[];
}

export interface ContextoEnrutador {
  readonly fase: Fase;
  /** session_id de la conversación que hace el encargo. */
  readonly sesion: string;
  readonly registro: readonly EventoEnrutador[];
}

export type Enrutado =
  | { readonly tipo: 'sin-cambios' }
  | {
      readonly tipo: 'reescribir';
      /** La entrada completa de Agent con la que se lanza el subagente. */
      readonly entrada: Record<string, unknown>;
      /** Solo en los encargos al implementador: lo que hay que anotar en el registro. */
      readonly encargo?: Encargo & { readonly modelo: ModeloDelImplementador };
      readonly aviso: string;
    }
  | { readonly tipo: 'bloquear'; readonly motivo: string };

const SIN_CAMBIOS: Enrutado = { tipo: 'sin-cambios' };

/** Decide qué hacer con una llamada a Agent. `entrada` es el tool_input que llega al hook. */
export function enrutar(entrada: unknown, contexto: ContextoEnrutador): Enrutado {
  if (typeof entrada !== 'object' || entrada === null) return SIN_CAMBIOS;
  const original = entrada as Record<string, unknown>;
  const agente = campoTexto(original, 'subagent_type');
  if (agente === IMPLEMENTADOR) return enrutarImplementador(original, contexto);
  if (agente !== undefined && AGENTES_CON_MODELO_FIJO.includes(agente)) return usarCabecera(original, agente);
  if (agente === FORK || 'model' in original) return SIN_CAMBIOS;
  return conModeloPorDefecto(original, agente ?? AGENTE_POR_DEFECTO);
}

function conModeloPorDefecto(entrada: Record<string, unknown>, agente: string): Enrutado {
  const modelo = AGENTES_DE_BUSQUEDA.includes(agente) ? 'haiku' : 'sonnet';
  return {
    tipo: 'reescribir',
    entrada: { ...entrada, model: modelo },
    aviso: `Enrutador: ${agente} va a ${modelo}, el modelo de los subagentes que no lo eligen.`,
  };
}

function enrutarImplementador(entrada: Record<string, unknown>, contexto: ContextoEnrutador): Enrutado {
  if (contexto.fase !== 'impl') return bloquear(motivoDeFase(contexto.fase));
  const encargo = leerEncargo(campoTexto(entrada, 'prompt') ?? '');
  if (encargo === undefined) return bloquear(MOTIVO_SIN_FORMATO);
  const fuera = encargo.ficheros.filter((fichero) => !RUTAS_DEL_IMPLEMENTADOR.some((ruta) => fichero.startsWith(ruta)));
  if (fuera.length > 0) return bloquear(motivoFueraDeAlcance(fuera));
  const anterior = ultimoModeloDeLaTarea(contexto.registro, contexto.sesion, encargo.tarea);
  const modelo = anterior === undefined ? modeloInicial(encargo.ficheros) : siguienteModelo(anterior);
  if (modelo === undefined) return bloquear(motivoSinEscalon(encargo.tarea));
  return {
    tipo: 'reescribir',
    entrada: { ...sinCampos(entrada, CAMPOS_DEL_MODELO), model: modelo },
    encargo: { ...encargo, modelo },
    aviso: avisoDelEncargo(encargo.tarea, modelo, anterior),
  };
}

/** Lee las líneas «Tarea:» y «Ficheros:» del prompt, o undefined si falta alguna. */
export function leerEncargo(prompt: string): Encargo | undefined {
  const tarea = /^Tarea:[ \t]*(\S+)[ \t]*$/m.exec(prompt)?.[1];
  const lista = /^Ficheros:[ \t]*(.+)$/m.exec(prompt)?.[1];
  if (tarea === undefined || lista === undefined) return undefined;
  // normalize resuelve «..»: «src/../docs/x.md» queda como «docs/x.md» y no pasa por src/.
  const ficheros = lista
    .split(/[,\s]+/)
    .filter((fichero) => fichero !== '')
    .map((fichero) => path.posix.normalize(fichero));
  return ficheros.length === 0 ? undefined : { tarea, ficheros };
}

/** Modelo del primer encargo de una tarea, según los ficheros que toca. */
export function modeloInicial(ficheros: readonly string[]): ModeloDelImplementador {
  const deDominio = ficheros.filter((fichero) => fichero.startsWith('src/dominio/')).length;
  const deTests = ficheros.filter((fichero) => fichero.startsWith('tests/unidad/')).length;
  const soloDominioYTests = deDominio + deTests === ficheros.length;
  return soloDominioYTests && deDominio <= FICHEROS_DE_DOMINIO_PARA_HAIKU ? 'haiku' : 'sonnet';
}

/** El escalón siguiente al modelo del encargo anterior, o undefined si ya no hay más. */
function siguienteModelo(anterior: string): ModeloDelImplementador | undefined {
  const indice = (ESCALERA as readonly string[]).indexOf(anterior);
  return ESCALERA[indice + 1];
}

function usarCabecera(entrada: Record<string, unknown>, agente: string): Enrutado {
  const quitados = CAMPOS_DEL_MODELO.filter((nombre) => nombre in entrada);
  if (quitados.length === 0) return SIN_CAMBIOS;
  return {
    tipo: 'reescribir',
    entrada: sinCampos(entrada, CAMPOS_DEL_MODELO),
    aviso: `Enrutador: ${agente} usa el modelo y el esfuerzo de su cabecera; se ha quitado ${quitados.join(' y ')}.`,
  };
}

function sinCampos(entrada: Record<string, unknown>, campos: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(entrada).filter(([nombre]) => !campos.includes(nombre)));
}

function bloquear(motivo: string): Enrutado {
  return { tipo: 'bloquear', motivo };
}

function motivoDeFase(fase: Fase): string {
  return `El implementador solo trabaja en la fase impl, y esta conversación está en la fase «${fase}».`;
}

const MOTIVO_SIN_FORMATO =
  'El encargo al implementador necesita estas dos líneas en el prompt, para que el enrutador elija ' +
  `el modelo:\n\n${FORMATO_DEL_ENCARGO}\n\nCada tarea nueva lleva un número nuevo; repetir uno reencarga ` +
  'esa tarea con un modelo más capaz.';

function motivoFueraDeAlcance(fuera: readonly string[]): string {
  return (
    `El implementador solo escribe en ${RUTAS_DEL_IMPLEMENTADOR.join(' y ')}, y el encargo incluye: ` +
    `${fuera.join(', ')}. Haz tú ese cambio, o encarga solo los ficheros de src/ y tests/unidad/.`
  );
}

function motivoSinEscalon(tarea: string): string {
  return (
    `La tarea ${tarea} ya se encargó a Sonnet en esta conversación y no hay un modelo más capaz para el ` +
    'implementador. Hazla tú a partir de lo que devolvió, o explica qué falla y termina con ' +
    `${MARCA_DECISION_PENDIENTE}.`
  );
}

function avisoDelEncargo(tarea: string, modelo: ModeloDelImplementador, anterior: string | undefined): string {
  const porque =
    anterior === undefined
      ? 'Haiku solo si toca tests/unidad/ y como mucho un fichero de src/dominio/'
      : `reencargo: la vez anterior fue a ${anterior}`;
  return (
    `Enrutador: la tarea ${tarea} va a ${modelo} (${porque}). Espera a que el implementador termine ` +
    'antes de tocar sus ficheros.'
  );
}

// ---------------------------------------------------------------------------
// Espera del hook Stop
// ---------------------------------------------------------------------------

/**
 * Subagentes que siguen trabajando en segundo plano, según el campo background_tasks de la
 * entrada del hook Stop. Mientras haya alguno, make check vería sus ficheros a medio escribir.
 */
export function subagentesEnCurso(tareasDeFondo: unknown): number {
  if (!Array.isArray(tareasDeFondo)) return 0;
  return tareasDeFondo.filter((tarea) => campoTexto(tarea, 'type') === 'subagent').length;
}
