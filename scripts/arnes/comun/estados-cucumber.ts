// Estado de cada escenario a partir de los mensajes de Cucumber (formato ndjson).
import type { Envelope } from '@cucumber/messages';

/** De mejor a peor. El estado de un escenario es el peor de sus pasos. */
const ORDEN_ESTADOS = ['PASSED', 'UNKNOWN', 'SKIPPED', 'PENDING', 'UNDEFINED', 'AMBIGUOUS', 'FAILED'] as const;
export type Estado = (typeof ORDEN_ESTADOS)[number] | 'SIN_PASOS';

export const RUTA_MENSAJES_CUCUMBER = 'reports/cucumber.ndjson';

export function peorEstado(estados: readonly string[]): Estado {
  if (estados.length === 0) return 'SIN_PASOS';
  const indices = estados.map((estado) => ORDEN_ESTADOS.indexOf(estado as (typeof ORDEN_ESTADOS)[number]));
  return ORDEN_ESTADOS[Math.max(...indices)] ?? 'UNKNOWN';
}

interface Recorrido {
  readonly etiquetasPorPickle: Map<string, string[]>;
  readonly picklePorCaso: Map<string, string>;
  readonly casoPorInicio: Map<string, string>;
  readonly estadosPorInicio: Map<string, string[]>;
  readonly iniciosReintentados: Set<string>;
}

/**
 * Estados de todos los pasos de cada escenario, identificado por su etiqueta de ID.
 * Un Scenario Outline genera varios casos: se juntan los pasos de todos ellos.
 * Los intentos que Cucumber va a repetir (--retry) no cuentan.
 */
export function pasosPorEscenario(ndjson: string, idsDeEscenario: ReadonlySet<string>): Map<string, string[]> {
  const recorrido = recorrerMensajes(ndjson);
  const pasosPorId = new Map<string, string[]>();
  for (const [inicio, caso] of recorrido.casoPorInicio) {
    if (recorrido.iniciosReintentados.has(inicio)) continue;
    const pickle = recorrido.picklePorCaso.get(caso) ?? '';
    const id = (recorrido.etiquetasPorPickle.get(pickle) ?? []).find((etiqueta) => idsDeEscenario.has(etiqueta));
    if (id === undefined) continue;
    pasosPorId.set(id, [...(pasosPorId.get(id) ?? []), ...(recorrido.estadosPorInicio.get(inicio) ?? [])]);
  }
  return pasosPorId;
}

/** Estado de cada escenario: el peor de sus pasos. */
export function estadosPorEscenario(ndjson: string, idsDeEscenario: ReadonlySet<string>): Map<string, Estado> {
  const pasos = pasosPorEscenario(ndjson, idsDeEscenario);
  return new Map([...pasos].map(([id, estados]) => [id, peorEstado(estados)]));
}

function recorrerMensajes(ndjson: string): Recorrido {
  const recorrido: Recorrido = {
    etiquetasPorPickle: new Map(),
    picklePorCaso: new Map(),
    casoPorInicio: new Map(),
    estadosPorInicio: new Map(),
    iniciosReintentados: new Set(),
  };
  for (const linea of ndjson.split('\n')) {
    if (linea.trim() !== '') anotarMensaje(JSON.parse(linea) as Envelope, recorrido);
  }
  return recorrido;
}

function anotarMensaje(sobre: Envelope, recorrido: Recorrido): void {
  const { pickle, testCase, testCaseStarted, testStepFinished, testCaseFinished } = sobre;
  if (pickle)
    recorrido.etiquetasPorPickle.set(
      pickle.id,
      pickle.tags.map((etiqueta) => etiqueta.name.slice(1)),
    );
  if (testCase) recorrido.picklePorCaso.set(testCase.id, testCase.pickleId);
  if (testCaseStarted) recorrido.casoPorInicio.set(testCaseStarted.id, testCaseStarted.testCaseId);
  if (testStepFinished) {
    const inicio = testStepFinished.testCaseStartedId;
    const estados = recorrido.estadosPorInicio.get(inicio) ?? [];
    recorrido.estadosPorInicio.set(inicio, [...estados, testStepFinished.testStepResult.status]);
  }
  if (testCaseFinished?.willBeRetried === true) recorrido.iniciosReintentados.add(testCaseFinished.testCaseStartedId);
}
