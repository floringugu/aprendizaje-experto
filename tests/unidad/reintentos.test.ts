import { describe, expect, it } from 'vitest';
import {
  colaInicial,
  colaTrasResponder,
  type ClaseDeRespuesta,
  type ColaDeSesion,
  type ReglasDeReintento,
} from '../../src/dominio/reintentos.ts';

/** Separación 3 y un acierto, los valores de config/parametros.json. */
const REGLAS: ReglasDeReintento = { separacion: 3, aciertosParaCerrar: 1 };

const ITEMS_I1_A_I7 = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7'];

/** La cola como texto, en el orden en que se presenta: el ítem que vuelve lleva ↺ detrás. */
const enTexto = (cola: ColaDeSesion): string[] =>
  cola.pendientes.map((pendiente) => (pendiente.reintento ? `${pendiente.item}↺` : pendiente.item));

const aciertosDe = (cola: ColaDeSesion, item: string): number => cola.aciertos.get(item) ?? 0;

/** Una cola ya empezada: con los ítems que vuelven (`I1↺`) y los reintentos acertados que lleva cada uno. */
function colaConAciertos(pendientes: readonly string[], aciertos: Readonly<Record<string, number>> = {}): ColaDeSesion {
  return {
    pendientes: pendientes.map((texto) => ({ item: texto.replace('↺', ''), reintento: texto.endsWith('↺') })),
    aciertos: new Map(Object.entries(aciertos)),
  };
}

/** Una respuesta: el ítem, cómo cuenta para la cola y si es correcta. */
type Respuesta = readonly [item: string, clase: ClaseDeRespuesta, correcta: boolean];

function responder(cola: ColaDeSesion, [item, clase, correcta]: Respuesta, reglas = REGLAS): ColaDeSesion {
  return colaTrasResponder(cola, { item, correcta, clase }, reglas);
}

describe('colaInicial', () => {
  it('@RECU-6.1 deja los ítems en orden, ninguno que vuelva y ningún acierto', () => {
    const cola = colaInicial(['I2', 'I1', 'I3']);
    expect(cola.pendientes).toStrictEqual([
      { item: 'I2', reintento: false },
      { item: 'I1', reintento: false },
      { item: 'I3', reintento: false },
    ]);
    expect(cola.aciertos).toStrictEqual(new Map());
  });

  it('@RECU-6.1 una sesión sin ítems tiene la cola vacía', () => {
    expect(colaInicial([]).pendientes).toStrictEqual([]);
  });
});

describe('colaTrasResponder: el ítem que se falla vuelve', () => {
  it('@RECU-6.1 con separación 3 vuelve detrás de los tres siguientes', () => {
    const cola = responder(colaInicial(ITEMS_I1_A_I7), ['I1', 'ensena', false]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺', 'I5', 'I6', 'I7']);
  });

  it('@RECU-6.1 el que vuelve se marca como reintento y los demás no', () => {
    const cola = responder(colaInicial(['I1', 'I2']), ['I1', 'ensena', false], {
      separacion: 1,
      aciertosParaCerrar: 1,
    });
    expect(cola.pendientes).toStrictEqual([
      { item: 'I2', reintento: false },
      { item: 'I1', reintento: true },
    ]);
  });

  it('@RECU-6.1 la separación sale de las reglas, no es fija', () => {
    const reglas = { separacion: 2, aciertosParaCerrar: 1 };
    const cola = responder(colaInicial(ITEMS_I1_A_I7), ['I1', 'ensena', false], reglas);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I1↺', 'I4', 'I5', 'I6', 'I7']);
  });

  it('@RECU-6.1 con separación igual a lo que queda, vuelve el último', () => {
    const cola = responder(colaInicial(['I1', 'I2', 'I3', 'I4']), ['I1', 'ensena', false]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺']);
  });

  it('@RECU-6.1 con separación 0 vuelve lo siguiente que se presenta', () => {
    const cola = responder(colaInicial(['I1', 'I2', 'I3']), ['I1', 'ensena', false], {
      separacion: 0,
      aciertosParaCerrar: 1,
    });
    expect(enTexto(cola)).toStrictEqual(['I1↺', 'I2', 'I3']);
  });

  it('@RECU-6.1 la separación se cuenta desde el principio de lo que queda, aunque no se responda el primero', () => {
    const cola = responder(colaInicial(ITEMS_I1_A_I7), ['I3', 'ensena', false]);
    expect(enTexto(cola)).toStrictEqual(['I1', 'I2', 'I4', 'I3↺', 'I5', 'I6', 'I7']);
  });

  it('@RECU-6.1 un ítem fallado no cuenta como acierto', () => {
    const cola = responder(colaInicial(['I1', 'I2']), ['I1', 'ensena', false]);
    expect(aciertosDe(cola, 'I1')).toBe(0);
  });

  it('@RECU-6.6 con menos ítems de los que pide la separación, vuelve cuando se acaban', () => {
    const cola = responder(colaInicial(['I1', 'I3', 'I4']), ['I1', 'ensena', false]);
    expect(enTexto(cola)).toStrictEqual(['I3', 'I4', 'I1↺']);
  });

  it('@RECU-6.6 si no queda ningún otro ítem, vuelve él solo', () => {
    const cola = responder(colaInicial(['I1']), ['I1', 'ensena', false]);
    expect(enTexto(cola)).toStrictEqual(['I1↺']);
  });
});

describe('colaTrasResponder: el ítem que se acierta o que solo mide no vuelve', () => {
  it('@RECU-6.2 un acierto en el primer intento de una sesión que enseña no vuelve', () => {
    const cola = responder(colaInicial(ITEMS_I1_A_I7), ['I1', 'ensena', true]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4', 'I5', 'I6', 'I7']);
  });

  it('@RECU-6.2 el acierto en el primer intento no cuenta como reintento acertado', () => {
    const cola = responder(colaInicial(['I1', 'I2']), ['I1', 'ensena', true]);
    expect(aciertosDe(cola, 'I1')).toBe(0);
  });

  it.each([true, false])('@RECU-6.8 un intento que solo mide quita el ítem y no vuelve (correcta: %s)', (correcta) => {
    const cola = responder(colaInicial(ITEMS_I1_A_I7), ['I1', 'mide', correcta]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4', 'I5', 'I6', 'I7']);
    expect(aciertosDe(cola, 'I1')).toBe(0);
  });

  it('@RECU-6.8 el fallo de un intento que mide no vuelve aunque se pidan muchos aciertos', () => {
    const cola = responder(colaInicial(['I1', 'I2']), ['I1', 'mide', false], { separacion: 3, aciertosParaCerrar: 5 });
    expect(enTexto(cola)).toStrictEqual(['I2']);
  });
});

describe('colaTrasResponder: el reintento', () => {
  const trasElFallo = (reglas: ReglasDeReintento) =>
    responder(colaInicial(['I1', 'I2', 'I3', 'I4']), ['I1', 'ensena', false], reglas);

  it('@RECU-6.4 con un acierto, el reintento acertado cierra el ítem', () => {
    const cola = responder(trasElFallo(REGLAS), ['I1', 'reintento', true]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4']);
    expect(aciertosDe(cola, 'I1')).toBe(1);
  });

  it('@RECU-6.4 con dos aciertos, el primer reintento acertado vuelve y el segundo cierra', () => {
    const reglas = { separacion: 1, aciertosParaCerrar: 2 };
    const primero = responder(trasElFallo(reglas), ['I1', 'reintento', true], reglas);
    expect(enTexto(primero)).toStrictEqual(['I2', 'I1↺', 'I3', 'I4']);
    const segundo = responder(primero, ['I1', 'reintento', true], reglas);
    expect(enTexto(segundo)).toStrictEqual(['I2', 'I3', 'I4']);
    expect(aciertosDe(segundo, 'I1')).toBe(2);
  });

  it('@RECU-6.4 con dos aciertos, el reintento acertado que no cierra vuelve y suma un acierto', () => {
    const reglas = { separacion: 1, aciertosParaCerrar: 2 };
    const cola = responder(trasElFallo(reglas), ['I1', 'reintento', true], reglas);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I1↺', 'I3', 'I4']);
    expect(aciertosDe(cola, 'I1')).toBe(1);
  });

  it('@RECU-6.5 un reintento fallado vuelve otra vez, y no suma ningún acierto', () => {
    const cola = responder(colaConAciertos(['I2', 'I1↺']), ['I1', 'reintento', false]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I1↺']);
    expect(aciertosDe(cola, 'I1')).toBe(0);
  });

  it('@RECU-6.5 el reintento fallado vuelve detrás de la separación, contada desde lo que queda', () => {
    const cola = responder(colaConAciertos(['I1↺', 'I2', 'I3', 'I4', 'I5']), ['I1', 'reintento', false]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺', 'I5']);
  });

  it('@RECU-6.5 un reintento fallado vuelve aunque ya haya acertado antes', () => {
    const reglas = { separacion: 1, aciertosParaCerrar: 2 };
    const cola = responder(colaConAciertos(['I1↺', 'I2'], { I1: 1 }), ['I1', 'reintento', false], reglas);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I1↺']);
    expect(aciertosDe(cola, 'I1')).toBe(1);
  });

  it('@RECU-6.10 acierto, fallo y acierto cierran con dos aciertos: no tienen que ser seguidos', () => {
    const reglas = { separacion: 1, aciertosParaCerrar: 2 };
    const tras1 = responder(trasElFallo(reglas), ['I1', 'reintento', true], reglas);
    expect(enTexto(tras1)).toStrictEqual(['I2', 'I1↺', 'I3', 'I4']);
    const tras2 = responder(tras1, ['I1', 'reintento', false], reglas);
    expect(enTexto(tras2)).toStrictEqual(['I2', 'I1↺', 'I3', 'I4']);
    expect(aciertosDe(tras2, 'I1')).toBe(1);
    const tras3 = responder(tras2, ['I1', 'reintento', true], reglas);
    expect(enTexto(tras3)).toStrictEqual(['I2', 'I3', 'I4']);
    expect(aciertosDe(tras3, 'I1')).toBe(2);
  });

  it('@RECU-6.9 cada respuesta usa las reglas de ese momento: un cambio cuenta enseguida', () => {
    const reglas = { separacion: 1, aciertosParaCerrar: 2 };
    const fallo = responder(colaInicial(['I1', 'I2', 'I3', 'I4']), ['I1', 'ensena', false], reglas);
    expect(enTexto(fallo)).toStrictEqual(['I2', 'I1↺', 'I3', 'I4']);
    const segunda = responder(fallo, ['I2', 'ensena', true], reglas);
    expect(enTexto(segunda)).toStrictEqual(['I1↺', 'I3', 'I4']);
    const reintento = responder(segunda, ['I1', 'reintento', true], reglas);
    expect(enTexto(reintento)).toStrictEqual(['I3', 'I1↺', 'I4']);
    const tercera = responder(reintento, ['I3', 'ensena', true], reglas);
    expect(enTexto(tercera)).toStrictEqual(['I1↺', 'I4']);
  });

  it('@RECU-6.9 con aciertos 0 el ítem fallado no vuelve ni en el primer intento ni en el reintento', () => {
    const reglas = { separacion: 3, aciertosParaCerrar: 0 };
    expect(enTexto(responder(colaInicial(['I1', 'I2']), ['I1', 'ensena', false], reglas))).toStrictEqual(['I2']);
    expect(enTexto(responder(colaConAciertos(['I1↺', 'I2']), ['I1', 'reintento', false], reglas))).toStrictEqual([
      'I2',
    ]);
  });
});

describe('colaTrasResponder: la entrada que se responde', () => {
  it('@RECU-6.1 un ítem que no está en la cola la deja como estaba', () => {
    const cola = colaInicial(['I1', 'I2']);
    expect(responder(cola, ['I9', 'ensena', false])).toBe(cola);
    expect(responder(cola, ['I9', 'mide', true])).toBe(cola);
  });

  it('@RECU-6.7 responder como reintento un ítem que no volvía deja la cola como estaba', () => {
    const cola = colaInicial(['I1', 'I2']);
    expect(responder(cola, ['I1', 'reintento', false])).toBe(cola);
    expect(responder(cola, ['I1', 'reintento', true])).toBe(cola);
  });

  it('@RECU-6.7 el primer intento de un ítem que solo tiene entrada de reintento deja la cola como estaba', () => {
    const cola = colaConAciertos(['I2', 'I1↺']);
    expect(responder(cola, ['I1', 'ensena', false])).toBe(cola);
    expect(responder(cola, ['I1', 'mide', true])).toBe(cola);
  });

  it('@RECU-6.5 el reintento quita su entrada de reintento y deja la del primer intento', () => {
    const cola = colaConAciertos(['I1', 'I1↺', 'I2']);
    expect(responder(cola, ['I1', 'reintento', true]).pendientes).toStrictEqual([
      { item: 'I1', reintento: false },
      { item: 'I2', reintento: false },
    ]);
  });

  it('@RECU-6.1 el primer intento quita su entrada y deja la de reintento', () => {
    const cola = colaConAciertos(['I1', 'I1↺', 'I2']);
    expect(responder(cola, ['I1', 'mide', true]).pendientes).toStrictEqual([
      { item: 'I1', reintento: true },
      { item: 'I2', reintento: false },
    ]);
  });

  it('@RECU-6.1 solo se quita la entrada del ítem respondido, no la de otro', () => {
    const cola = responder(colaConAciertos(['I2', 'I1', 'I3']), ['I1', 'mide', true]);
    expect(enTexto(cola)).toStrictEqual(['I2', 'I3']);
  });

  it('@RECU-6.10 los aciertos de otros ítems se conservan', () => {
    const cola = responder(colaConAciertos(['I1↺', 'I2'], { I2: 1 }), ['I1', 'reintento', true]);
    expect(aciertosDe(cola, 'I2')).toBe(1);
    expect(aciertosDe(cola, 'I1')).toBe(1);
  });
});

describe('colaTrasResponder: no cambia la cola de entrada', () => {
  it('@RECU-6.10 el mapa de aciertos de entrada queda como estaba', () => {
    const entrada = colaConAciertos(['I1↺', 'I2'], { I1: 1 });
    const salida = responder(entrada, ['I1', 'reintento', true], { separacion: 1, aciertosParaCerrar: 3 });
    expect(aciertosDe(salida, 'I1')).toBe(2);
    expect(aciertosDe(entrada, 'I1')).toBe(1);
  });

  it('@RECU-6.1 la lista de pendientes de entrada queda como estaba', () => {
    const entrada = colaInicial(ITEMS_I1_A_I7);
    responder(entrada, ['I1', 'ensena', false]);
    expect(enTexto(entrada)).toStrictEqual(ITEMS_I1_A_I7);
    expect(entrada.aciertos).toStrictEqual(new Map());
  });
});
