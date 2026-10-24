// Enrutador de modelos de los subagentes: la regla del hook PreToolUse sobre Agent
// (.claude/hooks/enrutar-modelo.ts). Separada del hook para poder probarla con tests unitarios.
//
// El modelo de los subagentes no lo elige Claude:
//   - el implementador y los revisores usan siempre el modelo y el esfuerzo de su cabecera
//     (.claude/agents/), aunque Claude pase otros: el implementador va a Sonnet;
//   - el implementador solo trabaja en la fase impl: en otra, el encargo se bloquea.
//
// Los demás subagentes (general-purpose, Explore, Plan…) usarían el modelo de la conversación
// principal, que puede ser Opus. Si Claude no les pasa un modelo, van a Haiku los de búsqueda y
// consulta, y a Sonnet el resto. Un fork no se toca: Claude Code le da siempre el modelo de la
// conversación y no admite otro.
import { campoTexto } from './entrada-hook.ts';
import type { Fase } from './protegidas.ts';

const IMPLEMENTADOR = 'implementador';
const AGENTES_CON_MODELO_FIJO: readonly string[] = [IMPLEMENTADOR, 'revisor-codigo', 'revisor-evidencia'];
const FORK = 'fork';
/** Subagentes que solo buscan o consultan: Haiku les basta. */
const AGENTES_DE_BUSQUEDA: readonly string[] = ['Explore', 'claude-code-guide'];
/** El subagente que lanza Agent cuando la llamada no dice cuál. */
const AGENTE_POR_DEFECTO = 'general-purpose';

/** Campos de la llamada a Agent que eligen el modelo; el enrutador no deja que los elija Claude. */
const CAMPOS_DEL_MODELO: readonly string[] = ['model', 'effort'];

export interface ContextoEnrutador {
  readonly fase: Fase;
}

export type Enrutado =
  | { readonly tipo: 'sin-cambios' }
  | {
      readonly tipo: 'reescribir';
      /** La entrada completa de Agent con la que se lanza el subagente. */
      readonly entrada: Record<string, unknown>;
      readonly aviso: string;
    }
  | { readonly tipo: 'bloquear'; readonly motivo: string };

const SIN_CAMBIOS: Enrutado = { tipo: 'sin-cambios' };

/** Decide qué hacer con una llamada a Agent. `entrada` es el tool_input que llega al hook. */
export function enrutar(entrada: unknown, contexto: ContextoEnrutador): Enrutado {
  if (typeof entrada !== 'object' || entrada === null) return SIN_CAMBIOS;
  const original = entrada as Record<string, unknown>;
  const agente = campoTexto(original, 'subagent_type');
  if (agente === IMPLEMENTADOR && contexto.fase !== 'impl') return bloquear(motivoDeFase(contexto.fase));
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

function usarCabecera(entrada: Record<string, unknown>, agente: string): Enrutado {
  const quitados = CAMPOS_DEL_MODELO.filter((nombre) => nombre in entrada);
  if (quitados.length === 0) return SIN_CAMBIOS;
  return {
    tipo: 'reescribir',
    entrada: Object.fromEntries(Object.entries(entrada).filter(([nombre]) => !CAMPOS_DEL_MODELO.includes(nombre))),
    aviso: `Enrutador: ${agente} usa el modelo y el esfuerzo de su cabecera; se ha quitado ${quitados.join(' y ')}.`,
  };
}

function bloquear(motivo: string): Enrutado {
  return { tipo: 'bloquear', motivo };
}

function motivoDeFase(fase: Fase): string {
  return `El implementador solo trabaja en la fase impl, y esta conversación está en la fase «${fase}».`;
}
