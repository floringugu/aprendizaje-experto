import { describe, expect, it } from 'vitest';
import { estadosPorEscenario, pasosPorEscenario, peorEstado } from '../../scripts/arnes/comun/estados-cucumber.ts';

interface Caso {
  readonly id: string;
  readonly etiquetas: readonly string[];
  readonly intentos: readonly (readonly string[])[];
}

/** Mensajes ndjson mínimos de Cucumber: un pickle por caso y un inicio por intento. */
function ndjson(casos: readonly Caso[]): string {
  const mensajes = casos.flatMap(({ id, etiquetas, intentos }) => [
    { pickle: { id: `p-${id}`, tags: etiquetas.map((name) => ({ name })) } },
    { testCase: { id: `c-${id}`, pickleId: `p-${id}` } },
    ...intentos.flatMap((estados, intento) => mensajesDeIntento(id, estados, intento < intentos.length - 1)),
  ]);
  return mensajes.map((mensaje) => JSON.stringify(mensaje)).join('\n');
}

function mensajesDeIntento(id: string, estados: readonly string[], seRepetira: boolean): object[] {
  const inicio = `${id}-${String(seRepetira)}`;
  return [
    { testCaseStarted: { id: inicio, testCaseId: `c-${id}` } },
    ...estados.map((status) => ({ testStepFinished: { testCaseStartedId: inicio, testStepResult: { status } } })),
    { testCaseFinished: { testCaseStartedId: inicio, willBeRetried: seRepetira } },
  ];
}

const IDS = new Set(['MAST-1.1', 'MAST-1.2', 'MAST-1.3']);

describe('peorEstado', () => {
  it('el peor estado manda', () => {
    expect(peorEstado(['PASSED', 'FAILED', 'SKIPPED'])).toBe('FAILED');
    expect(peorEstado(['PASSED', 'UNDEFINED'])).toBe('UNDEFINED');
    expect(peorEstado(['PASSED', 'PASSED'])).toBe('PASSED');
    expect(peorEstado([])).toBe('SIN_PASOS');
  });
});

describe('estados de los escenarios', () => {
  it('junta los casos de un Scenario Outline e ignora las etiquetas que no son IDs de escenario', () => {
    const texto = ndjson([
      { id: 'a', etiquetas: ['@MAST', '@MAST-1.1'], intentos: [['PASSED', 'PASSED']] },
      { id: 'b', etiquetas: ['@MAST', '@MAST-1.1'], intentos: [['PASSED', 'FAILED']] },
      { id: 'c', etiquetas: ['@MAST-1.2'], intentos: [['PASSED', 'PENDING', 'SKIPPED']] },
    ]);
    expect(pasosPorEscenario(texto, IDS).get('MAST-1.1')).toEqual(['PASSED', 'PASSED', 'PASSED', 'FAILED']);
    expect(estadosPorEscenario(texto, IDS)).toEqual(
      new Map([
        ['MAST-1.1', 'FAILED'],
        ['MAST-1.2', 'PENDING'],
      ]),
    );
  });

  it('no cuenta los intentos que Cucumber va a repetir', () => {
    const texto = ndjson([{ id: 'a', etiquetas: ['@MAST-1.3'], intentos: [['FAILED'], ['PASSED']] }]);
    expect(estadosPorEscenario(texto, IDS).get('MAST-1.3')).toBe('PASSED');
  });
});
