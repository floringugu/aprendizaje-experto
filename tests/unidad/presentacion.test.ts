import { describe, expect, it } from 'vitest';
import type { ItemContenido } from '../../src/aplicacion/contenido.ts';
import { presentar } from '../../src/aplicacion/presentacion.ts';

// Un ítem con lo mínimo; cada test cambia solo la respuesta, que es lo que decide cómo se presenta.
function itemConRespuesta(respuesta: ItemContenido['respuesta']): ItemContenido {
  return {
    id: 'I',
    objetivo: 'O1',
    tipo: 'problema',
    diagnostico: false,
    enunciado: '¿Cuánto vale?',
    respuesta,
    feedback: 'Porque sí.',
  };
}

describe('presentar', () => {
  it('@RECU-4.1 un ítem de opciones lleva sus opciones y ninguna entrada', () => {
    const presentado = presentar(itemConRespuesta({ opciones: ['a', 'b', 'c'], correcta: 'a' }));

    expect(presentado.opciones).toEqual(['a', 'b', 'c']);
    expect('entrada' in presentado).toBe(false);
  });

  it('@RECU-4.2 un ítem numérico con unidades se responde con un número y su unidad, y no lleva opciones', () => {
    const presentado = presentar(itemConRespuesta({ valor: 9.81, unidades: ['m/s²', 'm/s^2', 'm/s2'] }));

    expect(presentado.entrada).toBe('numero_con_unidad');
    expect('opciones' in presentado).toBe(false);
  });

  it('@RECU-5.8 un ítem numérico sin unidades se responde solo con un número, y no lleva opciones', () => {
    const presentado = presentar(itemConRespuesta({ valor: 12 }));

    expect(presentado.entrada).toBe('numero');
    expect('opciones' in presentado).toBe(false);
  });

  it('@RECU-4.2 un ítem numérico con tolerancia propia se presenta igual que uno sin ella', () => {
    const presentado = presentar(itemConRespuesta({ valor: 100, unidades: ['kPa'], tolerancia: 0.05 }));

    expect(presentado.entrada).toBe('numero_con_unidad');
  });

  it('@RECU-4.2 un ítem de respuesta escrita no lleva ni opciones ni entrada', () => {
    const presentado = presentar(itemConRespuesta({ aceptadas: ['regla de tres'] }));

    expect('opciones' in presentado).toBe(false);
    expect('entrada' in presentado).toBe(false);
  });

  it('@RECU-1.1 no muestra la respuesta correcta, el feedback, el objetivo ni la categoría', () => {
    const presentado = presentar(itemConRespuesta({ valor: 12 }));

    expect(presentado).toEqual({ id: 'I', enunciado: '¿Cuánto vale?', acciones: ['responder'], entrada: 'numero' });
  });
});
