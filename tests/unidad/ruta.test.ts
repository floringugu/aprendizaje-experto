import { describe, expect, it } from 'vitest';
import { objetivosPendientes, recorrerRuta } from '../../src/dominio/ruta.ts';

const OBJETIVOS = ['O1', 'O2', 'O3'];

describe('objetivosPendientes', () => {
  it('@DIAG-2.1 conserva el orden del contenido', () => {
    expect(objetivosPendientes(['O1', 'O2', 'O3'], new Set(['O2']))).toEqual(['O1', 'O3']);
  });
});

/** Recorre O1, O2 y O3 con los dominados de ahora y los que lo estuvieron antes y lo perdieron. */
function recorrer(dominados: readonly string[], perdidos: readonly string[] = []) {
  return recorrerRuta(OBJETIVOS, {
    dominados: new Set(dominados),
    dominadosAlgunaVez: new Set([...dominados, ...perdidos]),
  });
}

/** Los estados de O1, O2 y O3, en ese orden. */
function estados(recorrido: ReturnType<typeof recorrerRuta>) {
  return OBJETIVOS.map((objetivo) => recorrido.estados.get(objetivo));
}

describe('recorrerRuta', () => {
  it('@MAST-2.2 sin dominar nada solo está abierto el primero', () => {
    const recorrido = recorrer([]);
    expect(estados(recorrido)).toEqual(['abierto', 'cerrado', 'cerrado']);
    expect(recorrido.actual).toBe('O1');
  });

  it('@MAST-2.1 al dominar el actual se abre el siguiente, y solo ese', () => {
    const recorrido = recorrer(['O1']);
    expect(estados(recorrido)).toEqual(['dominado', 'abierto', 'cerrado']);
    expect(recorrido.actual).toBe('O2');
  });

  it('@MAST-4.1 perder el dominio no cierra el siguiente y el actual es el más avanzado', () => {
    const recorrido = recorrer([], ['O1']);
    expect(estados(recorrido)).toEqual(['abierto', 'abierto', 'cerrado']);
    expect(recorrido.actual).toBe('O2');
  });

  it('@MAST-6.3 el objetivo perdido vuelve a la cola de práctica aunque los demás sigan dominados', () => {
    const recorrido = recorrer(['O1', 'O3'], ['O2']);
    expect(estados(recorrido)).toEqual(['dominado', 'abierto', 'dominado']);
    expect(recorrido.actual).toBe('O2');
  });

  it('@DIAG-2.1 un objetivo dominado tras uno sin dominar no abre el siguiente', () => {
    expect(estados(recorrer(['O2']))).toEqual(['abierto', 'dominado', 'cerrado']);
  });

  it('@MAST-6.1 con todos dominados no hay objetivo actual', () => {
    const recorrido = recorrer(OBJETIVOS);
    expect(estados(recorrido)).toEqual(['dominado', 'dominado', 'dominado']);
    expect(recorrido).not.toHaveProperty('actual');
  });
});
