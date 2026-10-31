// Registro de los hooks del arnés que paran o comprueban: .claude/registro-stop.jsonl, una línea JSON
// por anotación. Anotan en él:
//   - el hook Stop (anotar-parada.ts), cada parada de la conversación;
//   - el hook PreToolUse exigir-check-push.ts, cada comprobación antes de git push o gh pr create;
//   - el hook SubagentStop del implementador (exigir-check-implementador.ts), cada bloqueo.
//
// Sirve para dos cosas:
//   - el relevo: saber si la conversación ya ha pasado el suyo (relevoPasado);
//   - el archivo de cada área (docs/areas/<ÁREA>.md): cuántas veces bloquearon los hooks y cómo
//     pararon las conversaciones mientras se implementaba el área («make bloqueos A=<ÁREA>»).
// El fichero está en .gitignore: es local, como reports/.
import path from 'node:path';
import { leerAlcance } from './alcance.ts';
import { faseYAreaDelCheckout, nombreDelCarril } from './checkout.ts';
import { campoTexto } from './entrada-hook.ts';
import { anotarLinea, leerLineas, parsearLineas } from './jsonl.ts';
import type { Fase } from './fases.ts';

// Fuera de git (.gitignore): cada copia del repositorio lleva su propio registro.
const RUTA_REGISTRO_STOP = '.claude/registro-stop.jsonl';

const RESULTADOS = [
  'decision',
  'relevo',
  'espera',
  'sin-cambios',
  'con-cambios',
  'push-verde',
  'push-bloqueo',
  'implementador-bloqueo',
  'verde',
  'bloqueo',
] as const;
/**
 * Del hook Stop: decision, Claude para con [DECISIÓN PENDIENTE]; relevo, para con [RELEVO] porque el
 * contexto ha pasado del umbral; espera, quedan subagentes en segundo plano; sin-cambios y con-cambios,
 * cualquier otra parada, según el árbol de trabajo del checkout difiera o no del último commit.
 * Del hook del push: push-verde y push-bloqueo. Del SubagentStop: implementador-bloqueo.
 * verde y bloqueo, solo en las líneas antiguas: la comprobación que hacía el hook Stop hasta el 31-10-2026.
 */
type ResultadoParada = (typeof RESULTADOS)[number];

export interface ParadaStop {
  /** Fecha y hora ISO 8601. */
  readonly fecha: string;
  /** session_id de Claude Code: identifica la conversación. Los subagentes llevan el de la suya. */
  readonly sesion: string;
  readonly fase: Fase;
  readonly resultado: ResultadoParada;
  /** Solo en los bloqueos: el paso de make que falla. */
  readonly paso?: string;
  /** Solo en las paradas del hook Stop: los tokens de contexto de la última llamada al modelo. */
  readonly tokens?: number;
  /** Solo en las comprobaciones del push: lo que ha tardado make. */
  readonly milisegundos?: number;
  /** Áreas cerradas (config/alcance.json) en ese momento. */
  readonly areasCerradas?: readonly string[];
  /** El área en curso del checkout de la conversación, si tenía una. */
  readonly areaEnCurso?: string;
  /**
   * Carril del checkout de la conversación (nombreDelCarril en checkout.ts). No está en el directorio
   * principal.
   */
  readonly carril?: string;
  /**
   * Solo en las paradas anteriores a las áreas en curso por worktree: copia de la lista de áreas
   * fuera de alcance, de la que se deducía qué área estaba en curso.
   */
  readonly areasFueraDeAlcance?: readonly string[];
}

/** Lo que llevan todas las anotaciones, sea cual sea el hook. */
export type DatosDeParada = Pick<ParadaStop, 'fecha' | 'sesion' | 'fase' | 'areasCerradas' | 'areaEnCurso' | 'carril'>;

/** Los datos comunes de una anotación, de la entrada del hook y del checkout de la conversación. */
export function datosDeLaEntrada(entrada: unknown, checkout: string): DatosDeParada {
  const { cerradas, enCurso } = leerAlcance(checkout);
  const carril = nombreDelCarril(checkout);
  return {
    fecha: new Date().toISOString(),
    sesion: campoTexto(entrada, 'session_id') ?? 'desconocida',
    fase: faseYAreaDelCheckout(checkout).fase,
    areasCerradas: cerradas,
    ...(enCurso === undefined ? {} : { areaEnCurso: enCurso }),
    ...(carril === undefined ? {} : { carril }),
  };
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

/**
 * ¿La conversación ya ha parado con [RELEVO] aceptado? Desde entonces no edita más y el Stop no acepta
 * otro relevo (docs/plan.md §5, «Relevo»): el hook PreToolUse bloquear-tras-relevo.ts y anotar-parada.ts
 * lo leen de aquí, y así no hace falta otro registro.
 */
export function relevoPasado(registro: readonly ParadaStop[], sesion: string): boolean {
  return registro.some((parada) => parada.sesion === sesion && parada.resultado === 'relevo');
}

// ---------------------------------------------------------------------------
// Resumen por área (make bloqueos A=<ÁREA>)
// ---------------------------------------------------------------------------

/** Los resultados que niegan algo: el push, la devolución del implementador y el antiguo Stop. */
type ResultadoDeBloqueo = Extract<ResultadoParada, 'push-bloqueo' | 'implementador-bloqueo' | 'bloqueo'>;

export interface ResumenDeArea {
  readonly area: string;
  /** Fecha de la primera anotación con el área en curso, si la hay. */
  readonly desde: string | undefined;
  readonly sesiones: number;
  /** Carriles de esas anotaciones, ordenados; «principal» es el directorio principal. */
  readonly carriles: readonly string[];
  readonly anotaciones: number;
  /** Cuántas anotaciones tiene cada resultado. */
  readonly porResultado: Readonly<Record<ResultadoParada, number>>;
  /** Los bloqueos de cada hook por paso de make, de más a menos. */
  readonly pasos: Readonly<Record<ResultadoDeBloqueo, readonly (readonly [string, number])[]>>;
  /** Mediana de lo que tarda la comprobación del push, en milisegundos; undefined si no hay ninguna. */
  readonly medianaDelPush: number | undefined;
}

export function resumirArea(registro: readonly ParadaStop[], area: string): ResumenDeArea {
  const paradas = paradasDelArea(registro, area);
  const deResultado = (resultado: ResultadoParada): ParadaStop[] =>
    paradas.filter((parada) => parada.resultado === resultado);
  const pushes = [...deResultado('push-verde'), ...deResultado('push-bloqueo')];
  return {
    area,
    desde: paradas[0]?.fecha,
    sesiones: new Set(paradas.map((parada) => parada.sesion)).size,
    carriles: [...new Set(paradas.map((parada) => parada.carril ?? 'principal'))].toSorted((a, b) =>
      a.localeCompare(b),
    ),
    anotaciones: paradas.length,
    porResultado: Object.fromEntries(
      RESULTADOS.map((resultado) => [resultado, deResultado(resultado).length]),
    ) as Record<ResultadoParada, number>,
    pasos: {
      'push-bloqueo': contarPorPaso(deResultado('push-bloqueo')),
      'implementador-bloqueo': contarPorPaso(deResultado('implementador-bloqueo')),
      bloqueo: contarPorPaso(deResultado('bloqueo')),
    },
    medianaDelPush: mediana(pushes.flatMap((push) => push.milisegundos ?? [])),
  };
}

/**
 * Anotaciones de la fase impl mientras el área estaba en curso. Las fases specs y aceptacion no
 * cuentan: tratan todas las áreas a la vez. Cada anotación dice su área en curso; las antiguas, que
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

/** Con un número par de valores, la media de los dos centrales; undefined sin valores. */
function mediana(valores: readonly number[]): number | undefined {
  const ordenados = valores.toSorted((a, b) => a - b);
  const mitad = (ordenados.length - 1) / 2;
  const baja = ordenados[Math.floor(mitad)];
  const alta = ordenados[Math.ceil(mitad)];
  return baja === undefined || alta === undefined ? undefined : (baja + alta) / 2;
}

export function formatearResumen(resumen: ResumenDeArea): string {
  if (resumen.anotaciones === 0) {
    return `${resumen.area}: el registro no tiene anotaciones con esta área en curso.`;
  }
  const { porResultado: cuenta, pasos } = resumen;
  const tarda =
    resumen.medianaDelPush === undefined
      ? ''
      : `; la comprobación tarda ${String(Math.round(resumen.medianaDelPush / 1000))} s de mediana`;
  return [
    `${resumen.area}: ${String(resumen.anotaciones)} anotaciones en ${String(resumen.sesiones)} conversaciones, ` +
      `desde ${resumen.desde ?? '?'}.`,
    `  - Carriles: ${resumen.carriles.join(', ')}.`,
    `  - Push: ${String(cuenta['push-verde'])} en verde y ${bloqueos(pasos['push-bloqueo'])}${tarda}.`,
    `  - Implementador: ${bloqueos(pasos['implementador-bloqueo'])}.`,
    `  - Paradas del hook Stop: ${String(cuenta.decision)} con [DECISIÓN PENDIENTE], ${String(cuenta.relevo)} con ` +
      `[RELEVO], ${String(cuenta.espera)} esperando a subagentes, ${String(cuenta['sin-cambios'])} sin cambios y ` +
      `${String(cuenta['con-cambios'])} con cambios sin commitear.`,
    ...(cuenta.verde + cuenta.bloqueo === 0
      ? []
      : [`  - Comprobación en el Stop, ya retirada: ${String(cuenta.verde)} en verde y ${bloqueos(pasos.bloqueo)}.`]),
  ].join('\n');
}

/** «3 bloqueos (unidad 2, lint 1)», o «0 bloqueos». */
function bloqueos(porPaso: readonly (readonly [string, number])[]): string {
  const total = porPaso.reduce((suma, [, cuenta]) => suma + cuenta, 0);
  const detalle = porPaso.map(([paso, cuenta]) => `${paso} ${String(cuenta)}`).join(', ');
  return `${String(total)} bloqueos${total === 0 ? '' : ` (${detalle})`}`;
}
