import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ContextoRespuesta } from '../../../src/aplicacion/sesiones.ts';
import { responder, responderTexto } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { OpcionesCorregidas } from '../soporte/tipos-de-parametro.ts';

// Pasos de la práctica de recuperación con feedback correctivo (RECU).

/** Lo que la persona puede hacer con un ítem antes de responder: solo responder (RECU-1.2). */
const ACCION_DE_RESPONDER = 'responder';
const ACCIONES_PROHIBIDAS = /(ver|mostrar|revelar).*respuesta|sab|conoc|salt|dominad/i;
/** Lo único que dice el feedback: si acertó, cuál era la respuesta y por qué (RECU-2.2). */
const CLAVES_DEL_FEEDBACK = ['correcta', 'explicacion', 'respuestaCorrecta'];
const CONTEXTOS_DE_RECU_4: readonly ContextoRespuesta[] = ['practica', 'repaso', 'retencion'];

/** Presenta el ítem a la persona en el contexto indicado y recuerda lo que ve. */
function presentar(item: string, contexto: ContextoRespuesta): void {
  const actual = mundo();
  const visto = aceptado(actual.listo().presentarItem({ dominio: actual.dominio, item, contexto }));
  actual.presentado = visto;
  actual.presentaciones.push(visto);
}

/** Escribe `respuesta` como respuesta al ítem y deja el feedback para los pasos «Entonces». */
function escribirRespuesta(respuesta: string, item: string): void {
  const actual = mundo();
  actual.listo();
  responderTexto(actual, { item, respuesta });
}

/** Si el último feedback dice que la respuesta es «correcta» o «incorrecta». */
function comprobarCorreccion(corregida: string): void {
  assert.ok(['correcta', 'incorrecta'].includes(corregida), `«${corregida}» no es una corrección`);
  assert.equal(presente(mundo().feedback, 'el feedback').correcta, corregida === 'correcta');
}

// --- Contenido -----------------------------------------------------------------------------------

Given(
  'que {objetivo} tiene el ítem {item} con las opciones {opciones_corregidas}',
  (objetivo: string, item: string, { opciones, correcta, feedback }: OpcionesCorregidas) => {
    mundo().contenido().agregarItem({ id: item, objetivo, respuesta: { opciones, correcta }, feedback });
  },
);

Given(
  'que {objetivo} tiene el ítem {item} con las respuestas aceptadas {textos}',
  (objetivo: string, item: string, aceptadas: string[]) => {
    mundo().contenido().agregarItem({ id: item, objetivo, respuesta: { aceptadas } });
  },
);

// --- RECU-1: se recuerda antes de ver la respuesta -------------------------------------------------

When('se le presenta {item} a la persona', (item: string) => {
  presentar(item, 'practica');
});

Then('ve el enunciado y las opciones {textos}', (opciones: string[]) => {
  const visto = presente(mundo().presentado, 'el ítem presentado');
  assert.equal(visto.enunciado, mundo().contenido().item(visto.id).enunciado);
  assert.deepEqual(visto.opciones, opciones);
});

Then('no ve cuál es la correcta ni el feedback hasta haber respondido', () => {
  const visto = presente(mundo().presentado, 'el ítem presentado');
  const permitido = ['id', 'enunciado', 'opciones', 'objetivo', 'categoria', 'acciones'];
  assert.deepEqual(
    Object.keys(visto).filter((clave) => !permitido.includes(clave)),
    [],
    'El ítem presentado trae datos de más',
  );
  assert.ok(!JSON.stringify(visto).includes(mundo().contenido().item(visto.id).feedback), 'Se ve el feedback');
  assert.equal(mundo().feedback, undefined, 'La persona no ha respondido y ya hay feedback');
});

Then('no hay ninguna opción para ver la respuesta sin responder ni para marcarlo como sabido', () => {
  const { acciones } = presente(mundo().presentado, 'el ítem presentado');
  assert.ok(acciones.includes(ACCION_DE_RESPONDER), `Falta la acción «${ACCION_DE_RESPONDER}»`);
  assert.deepEqual(
    acciones.filter((accion) => ACCIONES_PROHIBIDAS.test(accion)),
    [],
  );
});

// --- RECU-2: feedback correctivo sobre la tarea --------------------------------------------------------

When('la persona responde {texto} a {item} y declara su confianza', (respuesta: string, item: string) => {
  escribirRespuesta(respuesta, item);
});

/** La persona acierta el ítem (lo que dice el feedback no depende de si acierta o falla). */
function responderAcertando(item: string): void {
  const actual = mundo();
  actual.listo();
  responder(actual, { item, correcta: true });
}

When('la persona responde a {item} y declara su confianza', responderAcertando);

Then('ve que su respuesta es {word}', comprobarCorreccion);

Then('ve que la respuesta correcta es {texto}', (correcta: string) => {
  assert.equal(presente(mundo().feedback, 'el feedback').respuestaCorrecta, correcta);
});

Then('ve el feedback {texto}', (explicacion: string) => {
  assert.equal(presente(mundo().feedback, 'el feedback').explicacion, explicacion);
});

Then(
  'el feedback solo contiene si la respuesta es correcta, la respuesta correcta y la explicación del contenido',
  () => {
    const feedback = presente(mundo().feedback, 'el feedback');
    assert.deepEqual(Object.keys(feedback).sort(), CLAVES_DEL_FEEDBACK);
  },
);

Then('no contiene elogios, reproches, notas ni mensajes sobre la persona', () => {
  // Si la explicación es exactamente la del contenido, la aplicación no le ha añadido nada.
  const feedback = presente(mundo().feedback, 'el feedback');
  const item = mundo().contenido().item(presente(mundo().presentado, 'el ítem presentado').id);
  assert.equal(feedback.explicacion, item.feedback);
  assert.ok('opciones' in item.respuesta);
  assert.equal(feedback.respuestaCorrecta, item.respuesta.correcta);
});

// --- RECU-3: la corrección es automática -------------------------------------------------------------

When('la persona escribe {texto} como respuesta a {item}', escribirRespuesta);

When(
  'la persona escribe {texto} con dos espacios delante y uno detrás como respuesta a {item}',
  (respuesta: string, item: string) => {
    escribirRespuesta(`  ${respuesta} `, item);
  },
);

Then('la respuesta es {word}', comprobarCorreccion);

When('la persona responde a {item}', responderAcertando);

Then('la aplicación no le pregunta si cree que ha acertado', () => {
  const peticiones = [
    ...presente(mundo().presentado, 'el ítem presentado').acciones,
    ...Object.keys(presente(mundo().feedback, 'el feedback')),
  ];
  assert.deepEqual(
    peticiones.filter((peticion) => /acert|autocorr|autoeval|cre[eo]/i.test(peticion)),
    [],
  );
});

// --- RECU-4: el formato de la práctica es el de las pruebas ---------------------------------------------

When(
  'a la persona se le presenta {item} en una sesión de práctica, en un repaso y en una prueba de retención',
  (item: string) => {
    CONTEXTOS_DE_RECU_4.forEach((contexto) => {
      presentar(item, contexto);
    });
  },
);

Then('las tres veces lo responde eligiendo entre las opciones {textos}', (opciones: string[]) => {
  const { presentaciones } = mundo();
  assert.equal(presentaciones.length, CONTEXTOS_DE_RECU_4.length);
  presentaciones.forEach((visto) => {
    assert.deepEqual(visto.opciones, opciones);
    assert.ok(visto.acciones.includes(ACCION_DE_RESPONDER));
  });
});
