import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ContextoRespuesta, Sesion } from '../../../src/aplicacion/sesiones.ts';
import { dominarObjetivo, responder } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import {
  itemsPendientes,
  llegarAlReintento,
  responderOtros,
  responderReintento,
  vuelve,
} from '../soporte/reintentos.ts';
import { iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos del reaprendizaje sucesivo (RECU-6): un ítem fallado vuelve en la misma sesión hasta acertarlo.
//
// Qué se presenta después lo dice la aplicación con `consultarSesion`; el ítem que vuelve se presenta
// y se responde con el contexto `reintento`, sin declarar la confianza.

const OTROS_ANTES_DEL_REINTENTO = 3;
const DIAS_HASTA_EL_REPASO = 8;
const GRUPO_INTERCALADO = 'G1';
const CATEGORIA_INTERCALADA = 'C1';

/** El ítem que la persona falló en su primer intento de la sesión. */
function itemFallado(): string {
  return presente(mundo().itemFallado, 'el ítem que la persona falló en la sesión');
}

/** La persona empieza la sesión de práctica del objetivo, que presenta los ítems `esperados` en ese orden. */
function empezarPractica(objetivo: string, esperados: readonly string[]): void {
  const actual = mundo();
  actual.preparar(() => {
    const sesion = iniciarSesionDePractica(actual, { objetivo });
    assert.deepEqual(
      itemsDe(sesion).map((item) => item.id),
      esperados,
    );
  });
}

/** La persona falla el ítem en su primer intento de la sesión de práctica (la empieza si no hay ninguna). */
function fallarPrimerIntento(actual: Mundo, item: string): void {
  if (actual.sesion === undefined) {
    iniciarSesionDePractica(actual, { objetivo: actual.contenido().item(item).objetivo });
  }
  responder(actual, { item, correcta: false });
  actual.itemFallado = item;
  actual.repasosTrasElFallo = aceptado(actual.aplicacion().consultarRepasos({ dominio: actual.dominio }));
}

/** Comprueba que lo siguiente que se presenta es `item` otra vez y devuelve lo que queda detrás. */
function comprobarQueEsLoSiguiente(item: string): readonly string[] {
  const [siguiente, ...resto] = itemsPendientes(mundo());
  assert.deepEqual(siguiente, { id: item, reintento: true }, 'Lo siguiente que se presenta');
  return resto.map((pendiente) => pendiente.id);
}

function comprobarQueNoSePresenta(item: string): void {
  const pendientes = itemsPendientes(mundo()).map((pendiente) => pendiente.id);
  assert.ok(!pendientes.includes(item), `${item} sigue entre lo que queda por presentar: ${pendientes.join(', ')}`);
}

function comprobarQueVuelveUnaVez(item: string): void {
  const vueltas = itemsPendientes(mundo()).filter((pendiente) => pendiente.id === item && pendiente.reintento);
  assert.equal(vueltas.length, 1, `Las veces que ${item} vuelve a presentarse`);
}

// --- Contenido y sesión -------------------------------------------------------------------------------

// Con expresión regular y la frase de las opciones entera: el paso tendría cuatro parámetros (max-params).
Given(
  /^que (O\d+) tiene también los ítems (.+) con las opciones (.+, la correcta «[^»]*»)$/,
  (objetivo: string, items: string, respuesta: string) => {
    const textos = [...respuesta.matchAll(/«([^»]*)»/g)].map((coincidencia) => coincidencia[1] ?? '');
    const correcta = textos.pop() ?? '';
    for (const id of items.match(/[A-Z]\d+/g) ?? []) {
      mundo()
        .contenido()
        .agregarItem({ id, objetivo, respuesta: { opciones: textos, correcta } });
    }
  },
);

Given('que los ítems entre un intento y su reintento configurados son {int}', (items: number) => {
  mundo().establecerParametro('items_entre_intento_y_reintento', items);
});

Given('que los aciertos que cierran un ítem en la sesión configurados son {int}', (aciertos: number) => {
  mundo().establecerParametro('aciertos_para_cerrar_item_en_sesion', aciertos);
});

Given(
  'que la sesión de práctica de {objetivo} presenta los ítems {item} a {item}, en ese orden',
  (objetivo: string, primero: string, ultimo: string) => {
    const letra = primero.slice(0, 1);
    const esperados: string[] = [];
    for (let numero = Number(primero.slice(1)); numero <= Number(ultimo.slice(1)); numero += 1) {
      esperados.push(`${letra}${String(numero)}`);
    }
    empezarPractica(objetivo, esperados);
  },
);

Given(
  'que la sesión de práctica de {objetivo} presenta solo los ítems {ids}, en ese orden',
  (objetivo: string, items: string[]) => {
    mundo().contenido().dejarSoloItems(objetivo, items);
    empezarPractica(objetivo, items);
  },
);

Given('que la persona falló {item} en su primer intento de la sesión', (item: string) => {
  const actual = mundo();
  actual.preparar(() => {
    fallarPrimerIntento(actual, item);
  });
});

Given(
  'que la persona falló {item} en su primer intento de la sesión y respondió tres ítems de otros',
  (item: string) => {
    const actual = mundo();
    actual.preparar(() => {
      fallarPrimerIntento(actual, item);
      responderOtros(actual, { cantidad: OTROS_ANTES_DEL_REINTENTO, salvo: item });
    });
  },
);

// --- RECU-6.1 a RECU-6.7 y RECU-6.10: cuándo vuelve y cuándo deja de volver ---------------------------------

When('la persona falla {item} y responde {ids}', (item: string, otros: string[]) => {
  const actual = mundo();
  actual.listo();
  fallarPrimerIntento(actual, item);
  otros.forEach((otro) => {
    responder(actual, { item: otro, correcta: true });
  });
});

When('la persona acierta {item} y responde el resto de los ítems', (item: string) => {
  const actual = mundo();
  actual.listo();
  const resto = itemsDe(presente(actual.sesion, 'la sesión de práctica')).filter((otro) => otro.id !== item);
  [item, ...resto.map((otro) => otro.id)].forEach((id) => {
    responder(actual, { item: id, correcta: true });
  });
});

When('se le presenta {item} otra vez', (item: string) => {
  const actual = mundo();
  const visto = aceptado(actual.listo().presentarItem({ dominio: actual.dominio, item, contexto: 'reintento' }));
  actual.presentado = visto;
  // Lo que vio del primer intento ya pasó: lo que cuenta ahora es lo que ve de este.
  actual.feedback = undefined;
});

/** La persona llega a cada reintento del ítem fallado y lo acierta o lo falla, en el orden de `resultados`. */
function responderReintentos(resultados: readonly boolean[], nombrado?: string): void {
  const actual = mundo();
  actual.listo();
  const item = itemFallado();
  if (nombrado !== undefined) assert.equal(nombrado, item, 'El ítem que el escenario nombra no es el que falló la persona');
  resultados.forEach((correcta) => {
    llegarAlReintento(actual, item);
    responderReintento(actual, { item, correcta });
  });
}

When('acierta {item} en su primer reintento', (item: string) => {
  responderReintentos([true], item);
});

When('acierta {item} en su primer reintento, falla en el segundo y acierta en el tercero', (item: string) => {
  responderReintentos([true, false, true], item);
});

When('falla también su primer reintento y responde tres ítems de otros', () => {
  responderReintentos([false]);
  responderOtros(mundo(), { cantidad: OTROS_ANTES_DEL_REINTENTO, salvo: itemFallado() });
});

When('termina la sesión antes de acertarlo en un reintento', () => {
  // Falla un reintento antes de irse: así hay un reintento que no debe mover el siguiente repaso.
  responderReintentos([false]);
  const actual = mundo();
  actual.ultimoResultado = actual.aplicacion().terminarSesion({ dominio: actual.dominio });
});

Then('lo siguiente que se le presenta es {item} otra vez, antes de {item}', (item: string, despues: string) => {
  assert.equal(comprobarQueEsLoSiguiente(item)[0], despues, `Lo que se presenta después de ${item}`);
});

Then('lo siguiente que se le presenta es {item} otra vez', (item: string) => {
  comprobarQueEsLoSiguiente(item);
});

Then('la sesión no termina antes de ese reintento', () => {
  assert.ok(vuelve(itemsPendientes(mundo()), itemFallado()), 'La sesión ha terminado sin el reintento');
});

Then('no se le pide que declare su confianza', () => {
  const visto = presente(mundo().presentado, 'el ítem presentado');
  // `responderReintento` falla si, tras la respuesta, la aplicación espera la confianza.
  responderReintento(mundo(), { item: visto.id, correcta: true });
});

Then(
  'al responder ve si su respuesta es correcta, que la respuesta correcta es {texto} y el feedback {texto}',
  (correcta: string, explicacion: string) => {
    const feedback = presente(mundo().feedback, 'el feedback del reintento');
    assert.deepEqual(feedback, { correcta: true, respuestaCorrecta: correcta, explicacion });
  },
);

Then('la aplicación la deja terminar sin pedirle que acierte {item} antes', (item: string) => {
  assert.equal(item, itemFallado(), 'El ítem que el escenario nombra no es el que falló la persona');
  aceptado(presente(mundo().ultimoResultado, 'el resultado de terminar la sesión'));
});

Then('{item} no entra en la sesión siguiente por haber quedado sin acertar', (item: string) => {
  const actual = mundo();
  const { elementos } = iniciarSesionDePractica(actual, { objetivo: actual.contenido().item(item).objetivo });
  const vueltas = elementos.filter((elemento) => elemento.tipo === 'item' && elemento.reintento === true);
  assert.deepEqual(vueltas, [], 'La sesión siguiente empieza con ítems que vuelven');
  const veces = elementos.filter((elemento) => elemento.tipo === 'item' && elemento.item.id === item).length;
  assert.ok(veces <= 1, `${item} se presenta ${String(veces)} veces en la sesión siguiente`);
});

Then(/^su siguiente repaso es el que decide el planificador con el resultado de su primer intento \(.*\)$/, () => {
  const actual = mundo();
  const repasos = aceptado(actual.listo().consultarRepasos({ dominio: actual.dominio }));
  assert.deepEqual(repasos, presente(actual.repasosTrasElFallo, 'los repasos tras el primer intento'));
});

// --- RECU-6.4, RECU-6.8 y RECU-6.9: si vuelve o no ------------------------------------------------------

Then(/^([A-Z]\d+) no vuelve a presentarse en (?:esa sesión|el diagnóstico|la prueba)$/, comprobarQueNoSePresenta);

Then(/^([A-Z]\d+) vuelve a presentarse en (?:esa sesión|ese repaso)$/, comprobarQueVuelveUnaVez);

Then('{item} vuelve a presentarse una vez más en esa sesión', comprobarQueVuelveUnaVez);

// La exploración, las prepreguntas y los experimentos no tienen aún su propia sesión (AYUD, CALI): el
// paso responde el ítem con su contexto dentro de una sesión de práctica, donde el ítem sigue pendiente
// de su primer intento. Lo que no puede haber es una vuelta por haberlo fallado.
Then(/^([A-Z]\d+) no vuelve (?:por haberlo fallado|a presentarse en el experimento)$/, (item: string) => {
  assert.ok(!vuelve(itemsPendientes(mundo()), item), `${item} vuelve a presentarse por haberlo fallado`);
});

// --- RECU-6.8: solo vuelven los ítems de las sesiones que enseñan --------------------------------------------

/** La persona empieza una sesión de repaso o una prueba de retención del objetivo. */
function iniciarSesion(actual: Mundo, tipo: Sesion['tipo'], objetivo: string): void {
  actual.sesion = aceptado(actual.aplicacion().iniciarSesion({ dominio: actual.dominio, tipo, objetivo }));
}

/** Falla el ítem con ese contexto dentro de la sesión de práctica de su objetivo. */
function fallarEnPractica(contexto: ContextoRespuesta): (actual: Mundo, item: string) => void {
  return (actual, item) => {
    iniciarSesionDePractica(actual, { objetivo: actual.contenido().item(item).objetivo });
    responder(actual, { item, correcta: false, contexto });
  };
}

/** Falla el ítem, que pasa a ser un problema de una categoría con grupo, en una sesión intercalada. */
function fallarEnIntercalada(reservado: boolean): (actual: Mundo, item: string) => void {
  return (actual, item) => {
    const contenido = actual.contenido();
    contenido.hacerIntercalables(0);
    contenido.cambiarItem(item, { tipo: 'problema', categoria: CATEGORIA_INTERCALADA, reservado });
    iniciarSesionDePractica(actual, { grupo: GRUPO_INTERCALADO });
    responder(actual, { item, correcta: false, contexto: 'intercalado' });
  };
}

function fallarEnRepaso(actual: Mundo, item: string): void {
  const { objetivo } = actual.contenido().item(item);
  responder(actual, { item, correcta: true });
  actual.reloj.avanzarDias(DIAS_HASTA_EL_REPASO);
  iniciarSesion(actual, 'repaso', objetivo);
  responder(actual, { item, correcta: false, contexto: 'repaso' });
}

function fallarEnElDiagnostico(actual: Mundo, item: string): void {
  actual.contenido().cambiarItem(item, { diagnostico: true });
  const apertura = aceptado(actual.aplicacion().abrirDominio({ dominio: actual.dominio }));
  actual.sesion = presente(apertura.diagnostico, 'la sesión del diagnóstico');
  responder(actual, { item, correcta: false, contexto: 'diagnostico' });
}

/** Domina el objetivo, espera a su primera prueba de retención y falla el ítem en ella. */
function fallarEnRetencion(actual: Mundo, item: string): void {
  const { objetivo } = actual.contenido().item(item);
  dominarObjetivo(actual, objetivo);
  const repasos = aceptado(actual.aplicacion().consultarRepasos({ dominio: actual.dominio }));
  const prueba = repasos.find((repaso) => repaso.clase === 'retencion' && repaso.objetivo === objetivo);
  actual.reloj.fijar(presente(prueba, `la prueba de retención de ${objetivo}`).fecha);
  iniciarSesion(actual, 'retencion', objetivo);
  responder(actual, { item, correcta: false, contexto: 'retencion' });
}

/** Cómo falla la persona el ítem en cada sitio del esquema de RECU-6.8. */
const FALLOS: Readonly<Record<string, (actual: Mundo, item: string) => void>> = {
  'en una sesión de práctica': fallarEnPractica('practica'),
  'en un repaso programado': fallarEnRepaso,
  'no reservado en una sesión intercalada': fallarEnIntercalada(false),
  'en el diagnóstico': fallarEnElDiagnostico,
  'en una prueba de retención': fallarEnRetencion,
  'reservado en una sesión intercalada': fallarEnIntercalada(true),
  'en un intento de exploración': fallarEnPractica('exploracion'),
  'en una prepregunta': fallarEnPractica('prepregunta'),
  'en el estudio de la mitad recuperada de un experimento': fallarEnPractica('experimento_estudio'),
  'en la prueba de un experimento': fallarEnPractica('experimento_prueba'),
};

When(new RegExp(`^la persona falla ([A-Z]\\d+) (${Object.keys(FALLOS).join('|')})$`), (item: string, donde: string) => {
  const actual = mundo();
  // En el diagnóstico la persona aún no lo ha terminado: hay que decirlo antes de preparar nada.
  actual.diagnosticoPrevio = donde !== 'en el diagnóstico';
  actual.listo();
  presente(FALLOS[donde], `cómo se falla un ítem ${donde}`)(actual, item);
});

// --- RECU-6.9: los dos números se leen de la configuración ---------------------------------------------------

When(
  /^la persona falla ([A-Z]\d+), responde ([A-Z]\d+), acierta [A-Z]\d+ en su primer reintento y responde ([A-Z]\d+)$/,
  (item: string, antes: string, despues: string) => {
    const actual = mundo();
    actual.listo();
    fallarPrimerIntento(actual, item);
    responder(actual, { item: antes, correcta: true });
    responderReintento(actual, { item, correcta: true });
    responder(actual, { item: despues, correcta: true });
  },
);

Then('{item} vuelve a presentarse una vez más antes de {item}', (item: string, despues: string) => {
  assert.equal(comprobarQueEsLoSiguiente(item)[0], despues, `Lo que se presenta después de ${item}`);
});

Then('si lo acierta de nuevo, ya no vuelve a presentarse en esa sesión', () => {
  const item = itemFallado();
  responderReintento(mundo(), { item, correcta: true });
  comprobarQueNoSePresenta(item);
});
