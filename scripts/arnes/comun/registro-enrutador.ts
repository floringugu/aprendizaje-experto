// Registro del enrutador de modelos: .claude/registro-enrutador.jsonl, una línea JSON por evento.
//
// Sirve para dos cosas:
//   - la escalera: con qué modelo se encargó la última vez cada tarea en una conversación,
//     porque un reencargo sube un modelo (enrutador.ts);
//   - el freno del implementador: cuántas veces lo ha bloqueado ya el hook SubagentStop
//     (.claude/hooks/exigir-check-implementador.ts).
// Como registro-stop.jsonl, está fuera de git (.gitignore) y dentro de .claude/, para que
// Claude no pueda borrarlo ni editarlo.
import path from 'node:path';
import { anotarLinea, leerLineas, parsearLineas } from './jsonl.ts';

const RUTA_REGISTRO_ENRUTADOR = '.claude/registro-enrutador.jsonl';

/** El hook enrutar-modelo ha encargado una tarea al implementador con ese modelo. */
export interface EncargoAnotado {
  readonly tipo: 'encargo';
  /** Fecha y hora ISO 8601. */
  readonly fecha: string;
  /** session_id de Claude Code: identifica la conversación. */
  readonly sesion: string;
  readonly tarea: string;
  readonly modelo: string;
  readonly ficheros: readonly string[];
}

/** El hook SubagentStop no ha dejado terminar al implementador porque falla un paso. */
export interface BloqueoAnotado {
  readonly tipo: 'bloqueo';
  readonly fecha: string;
  readonly sesion: string;
  /** agent_id de Claude Code: identifica al subagente. */
  readonly agente: string;
  readonly paso: string;
}

export type EventoEnrutador = EncargoAnotado | BloqueoAnotado;

export function anotarEvento(raiz: string, evento: EventoEnrutador): void {
  anotarLinea(path.join(raiz, RUTA_REGISTRO_ENRUTADOR), evento);
}

export function leerRegistroEnrutador(raiz: string): EventoEnrutador[] {
  return leerLineas(path.join(raiz, RUTA_REGISTRO_ENRUTADOR), esEvento);
}

export function parsearRegistroEnrutador(texto: string): EventoEnrutador[] {
  return parsearLineas(texto, esEvento);
}

function esEvento(valor: unknown): valor is EventoEnrutador {
  if (typeof valor !== 'object' || valor === null) return false;
  const evento = valor as Record<string, unknown>;
  if (typeof evento['sesion'] !== 'string') return false;
  if (evento['tipo'] === 'encargo') return typeof evento['tarea'] === 'string' && typeof evento['modelo'] === 'string';
  return evento['tipo'] === 'bloqueo' && typeof evento['agente'] === 'string';
}

/** Modelo del último encargo de esa tarea en la conversación, o undefined si es la primera vez. */
export function ultimoModeloDeLaTarea(
  registro: readonly EventoEnrutador[],
  sesion: string,
  tarea: string,
): string | undefined {
  const encargos = registro.filter(
    (evento): evento is EncargoAnotado =>
      evento.tipo === 'encargo' && evento.sesion === sesion && evento.tarea === tarea,
  );
  return encargos.at(-1)?.modelo;
}

/** Veces que el hook SubagentStop ha bloqueado a ese subagente. */
export function bloqueosDelAgente(registro: readonly EventoEnrutador[], agente: string): number {
  return registro.filter((evento) => evento.tipo === 'bloqueo' && evento.agente === agente).length;
}
