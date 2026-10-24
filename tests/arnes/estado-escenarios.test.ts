import { describe, expect, it } from 'vitest';
import { problemasDeEscenario } from '../../scripts/arnes/comun/estado-escenarios.ts';

describe('problemasDeEscenario', () => {
  it('un escenario sin ejecutar es un problema, sea cual sea lo esperado', () => {
    expect(problemasDeEscenario('MATE-1.1', undefined, 'rojo')).toEqual(['@MATE-1.1 no se ha ejecutado.']);
    expect(problemasDeEscenario('MAST-1.1', undefined, 'verde')).toEqual(['@MAST-1.1 no se ha ejecutado.']);
  });

  describe('área en curso (rojo)', () => {
    it('vale si todos los pasos están definidos y alguno falla', () => {
      expect(problemasDeEscenario('MATE-1.1', ['PASSED', 'FAILED', 'SKIPPED'], 'rojo')).toEqual([]);
    });

    it('un escenario en verde no comprueba nada', () => {
      expect(problemasDeEscenario('MATE-1.1', ['PASSED', 'PASSED'], 'rojo')).toEqual([
        '@MATE-1.1 no falla: algún Then debe comprobar un estado observable que la aplicación aún no produce.',
      ]);
    });

    it('los pasos sin definir, ambiguos o pendientes se dicen aparte', () => {
      expect(problemasDeEscenario('MATE-1.1', ['UNDEFINED', 'FAILED', 'PENDING', 'AMBIGUOUS'], 'rojo')).toEqual([
        '@MATE-1.1 tiene pasos sin definir.',
        '@MATE-1.1 tiene pasos que encajan con varias definiciones.',
        '@MATE-1.1 tiene pasos pendientes.',
      ]);
    });
  });

  describe('área cerrada (verde)', () => {
    it('vale si todos los pasos pasan', () => {
      expect(problemasDeEscenario('MAST-1.1', ['PASSED', 'PASSED'], 'verde')).toEqual([]);
    });

    it('que falle o se salte un paso es una regresión', () => {
      const regresion = ['@MAST-1.1 es de un área cerrada y ya no pasa: es una regresión.'];
      expect(problemasDeEscenario('MAST-1.1', ['PASSED', 'FAILED'], 'verde')).toEqual(regresion);
      expect(problemasDeEscenario('MAST-1.1', ['SKIPPED'], 'verde')).toEqual(regresion);
    });

    it('un paso sin definir se dice, pero no se llama regresión', () => {
      expect(problemasDeEscenario('MAST-1.1', ['UNDEFINED'], 'verde')).toEqual(['@MAST-1.1 tiene pasos sin definir.']);
    });
  });
});
