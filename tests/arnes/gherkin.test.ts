import { describe, expect, it } from 'vitest';
import { elementosDeFeature, idDe, procedenciaDe, validarElementos } from '../../scripts/arnes/comun/gherkin.ts';

const SECCIONES = new Set(['2.2', '2.3', '4']);

const FEATURE_VALIDA = `
@MAST @evidencia-2.3
Característica: Criterio de dominio

  @MAST-1 @evidencia-2.3
  Regla: Se avanza al superar el umbral

    @MAST-1.1 @extrapolacion
    Escenario: Acierto por encima del umbral
      Dado un objetivo
      Entonces está dominado

    @MAST-1.2 @evidencia-4
    Esquema del escenario: Varios aciertos
      Dado <n> aciertos
      Entonces el estado es <estado>

      Ejemplos:
        | n | estado   |
        | 1 | pendiente |
`;

function validar(texto: string): string[] {
  return validarElementos(elementosDeFeature(texto, 'features/x.feature'), SECCIONES).map(({ mensaje }) => mensaje);
}

describe('elementosDeFeature', () => {
  it('lee el Feature, sus Rules y sus Scenarios con etiquetas, línea e IDs del padre', () => {
    const elementos = elementosDeFeature(FEATURE_VALIDA, 'features/x.feature');
    expect(elementos.map((elemento) => [elemento.tipo, idDe(elemento), elemento.idsPadre])).toEqual([
      ['Feature', 'MAST', []],
      ['Rule', 'MAST-1', ['@MAST']],
      ['Scenario', 'MAST-1.1', ['@MAST-1']],
      ['Scenario', 'MAST-1.2', ['@MAST-1']],
    ]);
    expect(elementos[2]?.linea).toBe(9);
    expect(elementos[3] === undefined ? '' : procedenciaDe(elementos[3])).toBe('evidencia-4');
  });
});

describe('validarElementos', () => {
  it('acepta una feature con IDs y procedencia correctos', () => {
    expect(validar(FEATURE_VALIDA)).toEqual([]);
  });

  it('exige exactamente un ID por elemento', () => {
    const texto =
      '@evidencia-4\nCaracterística: Sin ID\n\n  @MAST-1.1 @MAST-1.2 @evidencia-4\n  Escenario: Dos IDs\n    Dado algo\n';
    expect(validar(texto)).toEqual([
      'Feature «Sin ID» necesita exactamente un ID (tiene 0).',
      'Scenario «Dos IDs» necesita exactamente un ID (tiene 2).',
    ]);
  });

  it('exige que el ID siga la jerarquía del padre', () => {
    const texto =
      '@MAST @evidencia-4\nCaracterística: F\n\n  @CALI-1.1 @evidencia-4\n  Escenario: Otro prefijo\n    Dado algo\n';
    expect(validar(texto)).toEqual(['El ID @CALI-1.1 de Scenario «Otro prefijo» debe tener la forma @MAST-1.1.']);
  });

  it('exige procedencia y que la sección exista en el informe', () => {
    const texto = '@MAST\nCaracterística: F\n\n  @MAST-1.1 @evidencia-9.9\n  Escenario: E\n    Dado algo\n';
    expect(validar(texto)).toEqual([
      'Feature «F» necesita procedencia: @evidencia-<sección> o @extrapolacion.',
      '@evidencia-9.9: el informe no tiene la sección 9.9.',
    ]);
  });

  it('rechaza IDs repetidos', () => {
    const escenario = '  @MAST-1.1 @evidencia-4\n  Escenario: E\n    Dado algo\n';
    const texto = `@MAST @evidencia-4\nCaracterística: F\n\n${escenario}\n${escenario}`;
    expect(validar(texto)).toEqual(['El ID @MAST-1.1 ya se usa en features/x.feature:5.']);
  });
});
