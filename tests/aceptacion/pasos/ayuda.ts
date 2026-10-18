import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Sesion } from '../../../src/aplicacion/sesiones.ts';
import { progresoDe, responderItems, responderProblemasDeLaSemana, retirarPasos } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import { ejemplosDe, iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos de la ayuda adaptativa con retirada progresiva (AYUD). La ayuda son los pasos de los ejemplos
// resueltos; «sin ejemplos» quiere decir que se han retirado todos sus pasos.

const PROBLEMAS_EN_LA_SESION = 3;
const DIAS_SIN_RESPONDER = 1;

/** La persona empieza una sesión de práctica del objetivo, que tiene problemas de sobra. */
function practicar(objetivo: string): Sesion {
  const actual = mundo();
  actual.contenido().asegurarProblemas(objetivo, PROBLEMAS_EN_LA_SESION);
  actual.objetivoEnCurso = objetivo;
  return iniciarSesionDePractica(actual, { objetivo });
}

/** Hay ejemplos y problemas, y nunca dos ejemplos ni dos problemas seguidos (AYUD-1.1). */
function comprobarAlternancia(sesion: Sesion): void {
  const tipos = sesion.elementos.map((elemento) => elemento.tipo);
  assert.ok(tipos.includes('ejemplo') && tipos.includes('item'), 'La sesión no tiene ejemplos y problemas');
  tipos.forEach((tipo, posicion) => {
    assert.notEqual(tipo, tipos[posicion - 1], `Dos elementos seguidos de tipo «${tipo}»`);
  });
}

/** Los problemas de la sesión son de tipo «problema» y del objetivo indicado. */
function comprobarSoloProblemasDe(sesion: Sesion, objetivo: string): void {
  const items = itemsDe(sesion);
  assert.ok(items.length > 0, 'La sesión no tiene ningún problema');
  items.forEach((visto) => {
    const contenido = mundo().contenido().item(visto.id);
    assert.deepEqual([contenido.tipo, contenido.objetivo], ['problema', objetivo]);
  });
}

function pasosRetirados(objetivo: string): number {
  return progresoDe(mundo(), objetivo).pasosRetirados;
}

function comprobarPasosRetirados(objetivo: string, esperados: number): void {
  assert.equal(pasosRetirados(objetivo), esperados);
}

// --- Contenido y estado de partida ---------------------------------------------------------------

Given(
  'que {objetivo} tiene el ejemplo resuelto {item} con los pasos {ids}',
  (objetivo: string, ejemplo: string, pasos: string[]) => {
    mundo().contenido().fijarEjemplo(objetivo, { id: ejemplo, pasos });
  },
);

Given('que {objetivo} tiene la ayuda completa', (objetivo: string) => {
  const actual = mundo();
  actual.preparar(() => {
    assert.equal(pasosRetirados(objetivo), 0, 'Al empezar, la ayuda es completa');
  });
});

// Los pasos se retiran por el camino de verdad: bucles semanales con todos los problemas acertados.
Given('que {objetivo} tiene {int} paso(s) retirado(s)', (objetivo: string, pasos: number) => {
  const actual = mundo();
  actual.preparar(() => {
    retirarPasos(actual, objetivo, pasos);
  });
});

Given(
  'que en la última semana la persona acertó {int} de 20 problemas de {objetivo}',
  (aciertos: number, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      responderProblemasDeLaSemana(actual, objetivo, aciertos);
    });
  },
);

Given('que en la última semana la persona no respondió ningún problema de {objetivo}', () => {
  // Pasa la semana sin que la persona responda nada.
  const actual = mundo();
  actual.preparar(() => {
    actual.reloj.avanzarDias(DIAS_SIN_RESPONDER);
  });
});

// --- Lo que hace la persona ----------------------------------------------------------------------

When('la persona practica {objetivo}', practicar);

When(
  'la persona acierta {int} problemas seguidos de {objetivo} a mitad de semana',
  (cantidad: number, objetivo: string) => {
    const actual = mundo();
    actual.listo();
    actual.contenido().asegurarProblemas(objetivo, cantidad);
    const problemas = actual
      .contenido()
      .itemsDe(objetivo)
      .filter((item) => item.tipo === 'problema');
    responderItems(actual, { items: problemas.slice(0, cantidad), aciertos: cantidad });
  },
);

When('la persona estudia el ejemplo resuelto {item}', (ejemplo: string) => {
  const actual = mundo();
  const objetivo = actual
    .contenido()
    .objetivos.find((candidato) => candidato.ejemplos_resueltos.some((existente) => existente.id === ejemplo));
  actual.ejemplo = aceptado(
    actual.listo().estudiarEjemplo({
      dominio: actual.dominio,
      objetivo: presente(objetivo, `un objetivo con ${ejemplo}`).id,
      ejemplo,
    }),
  );
});

// --- Lo que ve la persona ------------------------------------------------------------------------

Then(
  'la sesión alterna el ejemplo resuelto {item} con sus {int} pasos y un problema de {objetivo}',
  (ejemplo: string, pasos: number, objetivo: string) => {
    const sesion = presente(mundo().sesion, 'la sesión');
    comprobarAlternancia(sesion);
    const visto = presente(ejemplosDe(sesion)[0], 'ningún ejemplo en la sesión');
    assert.deepEqual([visto.id, visto.pasos.length], [ejemplo, pasos]);
    comprobarSoloProblemasDe(sesion, objetivo);
  },
);

Then('mientras responde un problema no ve el ejemplo resuelto', () => {
  const actual = mundo();
  const sesion = presente(actual.sesion, 'la sesión');
  const problema = presente(itemsDe(sesion)[0], 'ningún problema en la sesión');
  const visto = aceptado(
    actual.listo().presentarItem({ dominio: actual.dominio, item: problema.id, contexto: 'practica' }),
  );
  const pasos = ejemplosDe(sesion).flatMap((ejemplo) => ejemplo.pasos);
  assert.ok(pasos.length > 0, 'La sesión no tiene ejemplo cuyos pasos buscar');
  assert.deepEqual(
    pasos.filter((paso) => JSON.stringify(visto).includes(paso)),
    [],
  );
});

Then('el ejemplo resuelto {item} muestra los pasos {ids}', (ejemplo: string, pasos: string[]) => {
  const visto = ejemplosDe(presente(mundo().sesion, 'la sesión')).find((candidato) => candidato.id === ejemplo);
  assert.deepEqual(presente(visto, `el ejemplo ${ejemplo}`).pasos, pasos);
});

Then('no muestra el paso {item}', (paso: string) => {
  const pasos = ejemplosDe(presente(mundo().sesion, 'la sesión')).flatMap((ejemplo) => ejemplo.pasos);
  assert.ok(pasos.length > 0, 'La sesión no muestra ningún paso');
  assert.ok(!pasos.includes(paso), `Se muestra el paso ${paso}`);
});

Then('la sesión solo presenta problemas de {objetivo}', (objetivo: string) => {
  const sesion = presente(mundo().sesion, 'la sesión');
  assert.equal(itemsDe(sesion).length, sesion.elementos.length, 'Hay elementos que no son problemas');
  comprobarSoloProblemasDe(sesion, objetivo);
});

Then('no muestra ningún ejemplo resuelto', () => {
  assert.deepEqual(ejemplosDe(presente(mundo().sesion, 'la sesión')), []);
});

Then('{objetivo} tiene {int} paso(s) retirado(s)', comprobarPasosRetirados);

Then('{objetivo} sigue con {int} paso(s) retirado(s)', comprobarPasosRetirados);

Then('{objetivo} sigue con {int} paso(s) retirado(s) hasta el siguiente bucle semanal', comprobarPasosRetirados);

Then(
  'la siguiente sesión de {objetivo} vuelve a alternar el ejemplo resuelto {item}, con el paso {item}, y problemas',
  (objetivo: string, ejemplo: string, paso: string) => {
    const sesion = practicar(objetivo);
    comprobarAlternancia(sesion);
    const visto = ejemplosDe(sesion).find((candidato) => candidato.id === ejemplo);
    assert.deepEqual(presente(visto, `el ejemplo ${ejemplo}`).pasos, [paso]);
  },
);

Then('la aplicación no le pide que explique ningún paso', () => {
  assert.deepEqual(presente(mundo().ejemplo, 'el ejemplo estudiado').instruccionesAutoexplicacion, []);
});

Then('no le muestra ninguna instrucción de autoexplicación', () => {
  assert.doesNotMatch(JSON.stringify(presente(mundo().ejemplo, 'el ejemplo estudiado')), /explic/i);
});
