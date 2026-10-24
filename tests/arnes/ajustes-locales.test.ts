import { describe, expect, it } from 'vitest';
import { ajustesConFase } from '../../scripts/arnes/comun/ajustes-locales.ts';

function leer(texto: string): unknown {
  return JSON.parse(texto);
}

describe('ajustesConFase', () => {
  it('crea los ajustes si el fichero no existe o está vacío', () => {
    expect(leer(ajustesConFase(undefined, 'specs'))).toEqual({
      env: { ARNES_FASE: 'specs' },
      model: 'sonnet',
      effortLevel: 'high',
    });
    expect(leer(ajustesConFase('  \n', 'impl'))).toEqual({
      env: { ARNES_FASE: 'impl' },
      model: 'opus',
      effortLevel: 'xhigh',
    });
  });

  it('cambia la fase, el modelo y el esfuerzo, y conserva los permisos y las demás variables', () => {
    const anterior = JSON.stringify({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'impl', OTRA: '1' },
      model: 'opus',
      effortLevel: 'xhigh',
    });
    expect(leer(ajustesConFase(anterior, 'aceptacion'))).toEqual({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'aceptacion', OTRA: '1' },
      model: 'sonnet',
      effortLevel: 'high',
    });
  });

  it('escribe JSON con sangría y un salto de línea al final', () => {
    expect(ajustesConFase(undefined, 'impl')).toBe(
      '{\n  "env": {\n    "ARNES_FASE": "impl"\n  },\n  "model": "opus",\n  "effortLevel": "xhigh"\n}\n',
    );
  });

  it.each([
    ['{ roto', /JSON/],
    ['[]', /el fichero debe ser un objeto JSON/],
    ['{"env": "specs"}', /«env» debe ser un objeto JSON/],
    ['{"env": null}', /«env» debe ser un objeto JSON/],
  ])('se niega a sobrescribir unos ajustes que no entiende: %s', (anterior, error) => {
    expect(() => ajustesConFase(anterior, 'impl')).toThrow(error);
  });
});
