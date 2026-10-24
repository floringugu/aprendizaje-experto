// Registro de las paradas del hook Stop: .claude/registro-stop.jsonl, una línea JSON por parada.
//
// Sirve para dos cosas:
//   - el freno: contar cuántas veces seguidas ha bloqueado el mismo paso en una conversación;
//   - el archivo de cada área (docs/areas/<ÁREA>.md): cuántas veces bloqueó el hook mientras
//     se implementaba el área («make bloqueos A=<ÁREA>»).
// El fichero está en .gitignore: es local, como reports/, pero vive en .claude/ para que
// Claude no pueda borrarlo ni editarlo (la ruta está protegida).
import path from 'node:path';
import { BLOQUEOS_PARA_FRENAR } from './freno-stop.ts';
import { anotarLinea, leerLineas, parsearLineas } from './jsonl.ts';
import type { Fase } from './protegidas.ts';

// Fuera de git (.gitignore): cada copia del repositorio lleva su propio registro.
const RUTA_REGISTRO_STOP = '.claude/registro-stop.jsonl';

const RESULTADOS = ['verde', 'bloqueo', 'decision', 'relevo'] as const;
/**
 * verde: la comprobación pasa; bloqueo: falla y no deja parar; decision: Claude para con
 * [DECISIÓN PENDIENTE]; relevo: Claude para con [RELEVO] porque el contexto ha pasado del umbral.
 */
type ResultadoParada = (typeof RESULTADOS)[number];

export interface ParadaStop {
  /** Fecha y hora ISO 8601. */
  readonly fecha: string;
  /** session_id de Claude Code: identifica la conversación. */
  readonly sesion: string;
  readonly fase: Fase;
  readonly resultado: ResultadoParada;
  /** Solo en los bloqueos: el paso de make que falla. */
  readonly paso?: string;
  /** Solo en los bloqueos: cuántos bloqueos seguidos del mismo paso lleva la conversación, contando este. */
  readonly seguidos?: number;
  /** Solo si el fallo es del entorno: su código (EADDRINUSE, EACCES, ENOSPC o COMANDO). */
  readonly entorno?: string;
  /** Áreas cerradas (config/alcance.json) en ese momento. */
  readonly areasCerradas?: readonly string[];
  /** El área en curso de la conversación (ARNES_AREA), si tenía una. */
  readonly areaEnCurso?: string;
  /**
   * Solo en las paradas anteriores a las áreas en curso por worktree: copia de la lista de áreas
   * fuera de alcance, de la que se deducía qué área estaba en curso.
   */
  readonly areasFueraDeAlcance?: readonly string[];
}

export function anotarParada(raiz: string, parada: ParadaStop): void {
  anotarLinea(path.join(raiz, RUTA_REGISTRO_STOP), parada);
}

export function leerRegistro(raiz: string): ParadaStop[] {
  return leerLineas(path.join(raiz, RUTA_REGISTRO_STOP), esParada);
}

export function parsearRegistro(texto: string): ParadaStop[] {
  return parsearLineas(texto, esParada);
}

function esParada(valor: unknown): valor is ParadaStop {
  if (typeof valor !== 'object' || valor === null) return false;
  const parada = valor as Record<string, unknown>;
  return (
    typeof parada['sesion'] === 'string' &&
    (RESULTADOS as readonly unknown[]).includes(parada['resultado']) &&
    (Array.isArray(parada['areasCerradas']) || Array.isArray(parada['areasFueraDeAlcance']))
  );
}

/** Bloqueos seguidos de ese paso al final del registro de la conversación. Otra conversación no corta la racha. */
export function bloqueosSeguidos(registro: readonly ParadaStop[], sesion: string, paso: string): number {
  let seguidos = 0;
  for (const parada of registro.filter((candidata) => candidata.sesion === sesion).toReversed()) {
    if (parada.resultado !== 'bloqueo' || parada.paso !== paso) break;
    seguidos += 1;
  }
  return seguidos;
}

// ---------------------------------------------------------------------------
// Resumen por área (make bloqueos A=<ÁREA>)
// ---------------------------------------------------------------------------

export interface ResumenDeArea {
  readonly area: string;
  /** Fecha de la primera parada con el área en curso, si la hay. */
  readonly desde: string | undefined;
  readonly sesiones: number;
  readonly paradas: number;
  /** Bloqueos por paso de make, de más a menos. */
  readonly bloqueosPorPaso: readonly (readonly [string, number])[];
  /** Códigos de los errores del entorno, uno por bloqueo. */
  readonly erroresDeEntorno: readonly string[];
  /** Bloqueos en los que saltó el freno (tercero seguido o más). */
  readonly frenos: number;
  readonly decisiones: number;
  readonly relevos: number;
}

export function resumirArea(registro: readonly ParadaStop[], area: string): ResumenDeArea {
  const paradas = paradasDelArea(registro, area);
  const bloqueos = paradas.filter((parada) => parada.resultado === 'bloqueo');
  return {
    area,
    desde: paradas[0]?.fecha,
    sesiones: new Set(paradas.map((parada) => parada.sesion)).size,
    paradas: paradas.length,
    bloqueosPorPaso: contarPorPaso(bloqueos),
    erroresDeEntorno: bloqueos.flatMap((parada) => parada.entorno ?? []),
    frenos: bloqueos.filter((parada) => (parada.seguidos ?? 0) >= BLOQUEOS_PARA_FRENAR).length,
    decisiones: paradas.filter((parada) => parada.resultado === 'decision').length,
    relevos: paradas.filter((parada) => parada.resultado === 'relevo').length,
  };
}

/**
 * Paradas de la fase impl mientras el área estaba en curso. Las fases specs y aceptacion no
 * cuentan: tratan todas las áreas a la vez. Cada parada dice su área en curso; las antiguas, que
 * solo copiaban la lista de áreas fuera de alcance, se resuelven con `paradasAntiguasDelArea`.
 */
function paradasDelArea(registro: readonly ParadaStop[], area: string): ParadaStop[] {
  const nuevas = registro.filter((parada) => parada.areaEnCurso === area && parada.fase === 'impl');
  return [...paradasAntiguasDelArea(registro, area), ...nuevas].toSorted((a, b) => a.fecha.localeCompare(b.fecha));
}

/** El área empezaba al salir de config/alcance.json y acababa al entrar en alcance otra de las que seguían fuera. */
function paradasAntiguasDelArea(registro: readonly ParadaStop[], area: string): ParadaStop[] {
  const antiguas = registro.filter((parada) => parada.areasFueraDeAlcance !== undefined);
  const fuera = (parada: ParadaStop): readonly string[] => parada.areasFueraDeAlcance ?? [];
  const enAlcance = (parada: ParadaStop): boolean => !fuera(parada).includes(area);
  const primera = antiguas.find(enAlcance);
  if (primera === undefined) return [];
  const inicio = antiguas.indexOf(primera);
  const otrasFueraAlEmpezar = fuera(primera).filter((otra) => otra !== area);
  const entraOtra = (parada: ParadaStop): boolean => otrasFueraAlEmpezar.some((otra) => !fuera(parada).includes(otra));
  const fin = antiguas.findIndex((parada, indice) => indice > inicio && entraOtra(parada));
  return antiguas
    .slice(inicio, fin === -1 ? undefined : fin)
    .filter((parada) => enAlcance(parada) && parada.fase === 'impl');
}

function contarPorPaso(bloqueos: readonly ParadaStop[]): [string, number][] {
  const cuenta = new Map<string, number>();
  for (const bloqueo of bloqueos) {
    const paso = bloqueo.paso ?? 'desconocido';
    cuenta.set(paso, (cuenta.get(paso) ?? 0) + 1);
  }
  return [...cuenta].toSorted(([, a], [, b]) => b - a);
}

export function formatearResumen(resumen: ResumenDeArea): string {
  if (resumen.paradas === 0) {
    return `${resumen.area}: el registro no tiene paradas del hook Stop con esta área en curso.`;
  }
  const bloqueos = resumen.bloqueosPorPaso.reduce((total, [, cuenta]) => total + cuenta, 0);
  const porPaso = resumen.bloqueosPorPaso.map(([paso, cuenta]) => `${paso} ${String(cuenta)}`).join(', ');
  const entorno = resumen.erroresDeEntorno;
  return [
    `${resumen.area}: ${String(resumen.paradas)} paradas del hook Stop en ${String(resumen.sesiones)} conversaciones, ` +
      `desde ${resumen.desde ?? '?'}.`,
    `  - Bloqueos: ${String(bloqueos)}${bloqueos === 0 ? '' : ` (${porPaso})`}.`,
    `  - Por el entorno: ${String(entorno.length)}${entorno.length === 0 ? '' : ` (${entorno.join(', ')})`}.`,
    `  - Con el freno (${String(BLOQUEOS_PARA_FRENAR)}.º bloqueo seguido o más): ${String(resumen.frenos)}.`,
    `  - Paradas con [DECISIÓN PENDIENTE]: ${String(resumen.decisiones)}.`,
    `  - Paradas con [RELEVO]: ${String(resumen.relevos)}.`,
  ].join('\n');
}
