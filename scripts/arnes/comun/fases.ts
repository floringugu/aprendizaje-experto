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
