import { describe, expect, it } from 'vitest';
import type { Cita } from '../../scripts/arnes/comun/citas.ts';
import { construirInforme, formatearInforme } from '../../scripts/arnes/comun/cobertura.ts';
import type { DatosCobertura } from '../../scripts/arnes/comun/cobertura.ts';
import type { Estado } from '../../scripts/arnes/comun/estados-cucumber.ts';
import { elementosDeFeature } from '../../scripts/arnes/comun/gherkin.ts';

const FEATURES = `
@MAST @evidencia-2.3
Característica: Criterio de dominio

  @MAST-1 @evidencia-2.3
  Regla: Umbral

    @MAST-1.1 @evidencia-2.3
    Escenario: Implementado
      Dado algo

    @MAST-1.2 @extrapolacion
    Escenario: Sin implementar
      Dado algo
`;

const CALIBRACION =
  '@CALI @evidencia-2.5\nCaracterística: Calibración\n\n  @CALI-1.1 @evidencia-2.5\n  Escenario: E\n    Dado algo\n';

function cita(id: string, fichero: string): Cita {
  return { id, fichero, linea: 3 };
}

function datos(cambios: Partial<DatosCobertura> = {}): DatosCobertura {
  return {
    elementos: [...elementosDeFeature(FEATURES, 'a.feature'), ...elementosDeFeature(CALIBRACION, 'b.feature')],
    citas: [cita('MAST-1.1', 'codigo.ts'), cita('MAST-1.2', 'aceptacion.ts'), cita('CALI-1.1', 'unidad.ts')],
    estados: new Map<string, Estado>([
      ['MAST-1.1', 'PASSED'],
      ['MAST-1.2', 'FAILED'],
      ['CALI-1.1', 'PASSED'],
    ]),
    areasEnAlcance: ['MAST', 'CALI'],
    ...cambios,
  };
}

describe('construirInforme', () => {
  it('da el estado de cada escenario y el peor de sus hijos a Features y Rules', () => {
    const estados = construirInforme(datos()).filas.map((fila) => [fila.id, fila.estado]);
    expect(estados).toEqual([
      ['MAST', 'FAILED'],
      ['MAST-1', 'FAILED'],
      ['MAST-1.1', 'PASSED'],
      ['MAST-1.2', 'FAILED'],
      ['CALI', 'PASSED'],
      ['CALI-1.1', 'PASSED'],
    ]);
  });

  it('falla si un escenario en alcance no pasa', () => {
    expect(construirInforme(datos()).errores).toEqual(['@MAST-1.2 no pasa (estado: FAILED).']);
  });

  it('no exige que el código cite los escenarios que pasan', () => {
    const estados = new Map<string, Estado>([
      ['MAST-1.1', 'PASSED'],
      ['MAST-1.2', 'PASSED'],
      ['CALI-1.1', 'PASSED'],
    ]);
    expect(construirInforme(datos({ citas: [], estados })).errores).toEqual([]);
  });

  it('falla si el código cita un ID que no está en features/', () => {
    const informe = construirInforme(datos({ citas: [...datos().citas, cita('MAST-9.9', 'codigo.ts')] }));
    expect(informe.errores).toContain('codigo.ts:3 cita @MAST-9.9, que no existe en features/.');
  });

  it('un escenario que no se ejecutó no pasa', () => {
    const informe = construirInforme(datos({ estados: new Map() }));
    expect(informe.errores).toContain('@CALI-1.1 no pasa (estado: NO_EJECUTADO).');
  });

  it('las áreas fuera de alcance no dan error', () => {
    const informe = construirInforme(datos({ areasEnAlcance: ['CALI'] }));
    expect(informe.errores).toEqual([]);
    expect(informe.filas.find((fila) => fila.id === 'MAST-1.2')?.estado).toBe('FUERA_DE_ALCANCE');
  });
});

describe('formatearInforme', () => {
  it('pinta una tabla con procedencia, estado y citas', () => {
    const texto = formatearInforme(construirInforme(datos()));
    const lineas = texto.split('\n');
    expect(lineas[0]).toMatch(/^ID\s+TIPO\s+PROCEDENCIA\s+ESTADO\s+CITAS$/);
    expect(lineas).toContainEqual(
      expect.stringMatching(/^MAST-1\.2\s+Scenario\s+extrapolacion\s+FAILED\s+aceptacion\.ts:3$/),
    );
    expect(lineas).toContainEqual(expect.stringMatching(/^MAST-1\s+Rule\s+evidencia-2\.3\s+FAILED\s+—$/));
  });
});
