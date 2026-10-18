import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { pistaPara, REGLAS_DE_LIMITES, tienePistaPropia } from '../../scripts/arnes/comun/pistas-lint.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

describe('pistas de ESLint', () => {
  it.each(REGLAS_DE_LIMITES)('la regla de límites %s tiene una pista propia', (regla) => {
    expect(tienePistaPropia(regla)).toBe(true);
  });

  it.each(REGLAS_DE_LIMITES)('la regla de límites %s está activa en src/', async (regla) => {
    const configuracion = (await new ESLint({ cwd: RAIZ }).calculateConfigForFile('src/dominio/ejemplo.ts')) as {
      rules?: Record<string, unknown>;
    };
    const ajuste = configuracion.rules?.[regla];
    expect(Array.isArray(ajuste) ? ajuste[0] : ajuste).toBe(2);
  });

  it('agrupa las reglas no-unsafe y remite a la documentación del resto', () => {
    expect(pistaPara('@typescript-eslint/no-unsafe-member-access')).toMatch(/Valor sin tipo/);
    expect(pistaPara('@typescript-eslint/prefer-nullish-coalescing')).toBe(
      'Lee la explicación y los ejemplos de la regla en https://typescript-eslint.io/rules/prefer-nullish-coalescing',
    );
    expect(pistaPara('eqeqeq')).toBe(
      'Lee la explicación y los ejemplos de la regla en https://eslint.org/docs/latest/rules/eqeqeq',
    );
    expect(pistaPara(null)).toMatch(/sintaxis/);
  });
});
