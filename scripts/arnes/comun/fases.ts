// Qué significa cada fase para Claude: qué comprobación exige el hook Stop y para qué sirve la fase.
// La fase la elige el dueño antes de abrir la conversación (make fase o la tarea de VS Code).
import type { Fase } from './protegidas.ts';

/** Objetivo de make que el hook Stop exige en cada fase. */
export const OBJETIVO_POR_FASE: Readonly<Record<Fase, string>> = {
  specs: 'check-specs',
  aceptacion: 'check-aceptacion',
  impl: 'check',
};

/**
 * Objetivo de make que el hook SubagentStop exige al subagente implementador antes de devolver su
 * encargo (docs/plan.md §7). Solo trabaja en la fase impl.
 */
export const OBJETIVO_DEL_IMPLEMENTADOR = 'check-implementador';

export const PROPOSITO_POR_FASE: Readonly<Record<Fase, string>> = {
  specs: 'etapa 2: escribir features/ y config/parametros.json',
  aceptacion: 'etapa 3: escribir los steps de tests/aceptacion/, que deben fallar en rojo',
  impl: 'etapa 4: implementar el área en curso en src/ y tests/unidad/',
};

export interface ModeloDeFase {
  /** Alias del modelo para el ajuste «model» de Claude Code. */
  readonly modelo: 'opus' | 'sonnet';
  /** Valor del ajuste «effortLevel» (low, medium, high o xhigh). */
  readonly esfuerzo: 'high' | 'xhigh';
}

/**
 * Modelo y esfuerzo con que empiezan las conversaciones de cada fase. «make fase» los escribe en
 * .claude/settings.local.json y el aviso de SessionStart los repite.
 *
 * Opus en la fase impl, donde la conversación principal diseña: el paso «Mecanismo», los
 * comentarios de interfaz y las firmas (los cuerpos van al implementador, que usa Sonnet).
 * Sonnet, más barato por token, con un escalón menos de esfuerzo, para escribir specs y steps.
 */
export const MODELO_POR_FASE: Readonly<Record<Fase, ModeloDeFase>> = {
  specs: { modelo: 'sonnet', esfuerzo: 'high' },
  aceptacion: { modelo: 'sonnet', esfuerzo: 'high' },
  impl: { modelo: 'opus', esfuerzo: 'xhigh' },
};

/**
 * Aviso para el dueño si la conversación no usa el modelo de su fase; undefined si lo usa o si
 * no se sabe. `modeloEnUso` es el campo model de SessionStart (claude-sonnet-5-5, por ejemplo),
 * que Claude Code no siempre envía.
 */
export function avisoDeModelo(fase: Fase, modeloEnUso: string | undefined): string | undefined {
  const { modelo } = MODELO_POR_FASE[fase];
  if (modeloEnUso === undefined || modeloEnUso.includes(modelo)) return undefined;
  return `esta conversación usa ${modeloEnUso} y la fase ${fase} pide ${modelo} (cámbialo con /model)`;
}
