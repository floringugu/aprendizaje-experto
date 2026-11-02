import { describe, expect, it } from 'vitest';
import { contenidoValidado } from '../../src/aplicacion/mesa-guardada.ts';

describe('contenidoValidado', () => {
  it('un dominio sin contenido leído se rechaza diciendo que no existe (regla que la feature no cubre)', () => {
    expect(contenidoValidado('ficticio', undefined)).toStrictEqual({
      ok: false,
      motivo: 'No existe el dominio «ficticio».',
    });
  });
});
