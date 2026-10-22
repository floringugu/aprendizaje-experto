import { describe, expect, it } from 'vitest';
import { ajustesConFase } from '../../scripts/arnes/comun/ajustes-locales.ts';

function leer(texto: string): unknown {
  return JSON.parse(texto);
}

describe('ajustesConFase', () => {
  it('crea los ajustes si el fichero no existe o está vacío', () => {
    expect(leer(ajustesConFase(undefined, 'specs'))).toEqual({ env: { ARNES_FASE: 'specs' } });
    expect(leer(ajustesConFase('  \n', 'impl'))).toEqual({ env: { ARNES_FASE: 'impl' } });
  });

  it('cambia la fase y conserva los permisos y las demás variables', () => {
    const anterior = JSON.stringify({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'specs', OTRA: '1' },
    });
    expect(leer(ajustesConFase(anterior, 'aceptacion'))).toEqual({
      permissions: { allow: ['Bash(make check)'] },
      env: { ARNES_FASE: 'aceptacion', OTRA: '1' },
    });
  });

  it('escribe JSON con sangría y un salto de línea al final', () => {
    expect(ajustesConFase(undefined, 'impl')).toBe('{\n  "env": {\n    "ARNES_FASE": "impl"\n  }\n}\n');
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
