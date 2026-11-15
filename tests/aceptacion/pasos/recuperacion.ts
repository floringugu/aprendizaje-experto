import assert from 'node:assert/strict';
import { Given, Then, When, defineParameterType } from '@cucumber/cucumber';
import type { ContextoRespuesta, Feedback, ItemPresentado } from '../../../src/aplicacion/sesiones.ts';
import { responder, responderTexto } from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import type { RespuestaNumerica } from '../soporte/contenido.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { OpcionesCorregidas } from '../soporte/tipos-de-parametro.ts';

// Pasos de la práctica de recuperación con feedback correctivo (RECU).

/** Lo que la persona puede hacer con un ítem antes de responder: solo responder (RECU-1.2). */
const ACCION_DE_RESPONDER = 'responder';
const ACCIONES_PROHIBIDAS = /(ver|mostrar|revelar).*respuesta|sab|conoc|salt|dominad/i;
/** Lo único que dice el feedback: si acertó, cuál era la respuesta y por qué (RECU-2.2). */
const CLAVES_DEL_FEEDBACK = ['correcta', 'explicacion', 'respuestaCorrecta'];
const CONTEXTOS_DE_RECU_4: readonly ContextoRespuesta[] = ['practica', 'repaso', 'retencion'];

/**
 * Lo que el feedback de un ítem numérico dice de la parte que falla (RECU-5.7, RECU-5.9 a RECU-5.13), en
 * el campo `numerico` del feedback. `Feedback` aún no lo tiene (lo añade recu-impl-item-numerico), así
 * que la vista que lee el test lo declara aquí. Un campo ausente es una parte que no falla.
 */
interface FalloNumerico {
  /** `distinto`: se entiende como un número pero no vale; `ilegible`: no se entiende como un número. */
  readonly valor?: 'distinto' | 'ilegible';
  /** `distinta`: no es una de las del contenido; `falta` o `sobra`: según lo que el ítem pide. */
  readonly unidad?: 'distinta' | 'falta' | 'sobra';
  /** Margen relativo que se acepta (0,01 es el 1 %); solo si falla el valor. */
  readonly margen?: number;
  /** Cómo se escribe un número; solo si no se entendió. */
  readonly formato?: string;
}
type FeedbackNumerico = Feedback & { readonly numerico?: FalloNumerico };

/** Cómo se presenta un ítem numérico: la persona escribe un número, con su unidad si el ítem la tiene (RECU-4.2). */
type ItemPresentadoNumerico = ItemPresentado & { readonly entrada?: 'numero_con_unidad' | 'numero' };

const CAMPOS_DEL_FALLO_NUMERICO = ['formato', 'margen', 'unidad', 'valor'];
/** Dominio aparte para el ítem numérico de RECU-2.2, que no está en los antecedentes del escenario. */
const DOMINIO_NUMERICO = 'numerico';

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

const TEXTO_ENTRE_COMILLAS = '«[^»]*»';
const NUMERO_ESCRITO = '\\d+(?:,\\d+)?(?:e-?\\d+)?';

// «9,81 con las unidades «m/s²» y «m/s2»», «12 sin unidades» o «100 con la unidad «kPa» y la tolerancia del 5 %».
// Un solo parámetro, sin grupos de captura: el transformer recibe la frase entera (max-params).
defineParameterType({
  name: 'respuesta_numerica',
  regexp: new RegExp(
    `${NUMERO_ESCRITO} (?:sin unidades|con las unidades ${TEXTO_ENTRE_COMILLAS}(?:(?:, | y )${TEXTO_ENTRE_COMILLAS})*` +
      `|con la unidad ${TEXTO_ENTRE_COMILLAS}(?: y la tolerancia del \\d+(?:,\\d+)? %)?)`,
  ),
  transformer: (frase: string): RespuestaNumerica => {
    const unidades = [...frase.matchAll(/«([^»]*)»/g)].map((coincidencia) => coincidencia[1] ?? '');
    const tolerancia = /tolerancia del (\d+(?:,\d+)?) %/.exec(frase)?.[1];
    return {
      valor: Number((frase.split(' ')[0] ?? '').replace(',', '.')),
      ...(unidades.length > 0 ? { unidades } : {}),
      ...(tolerancia === undefined ? {} : { tolerancia: Number(tolerancia.replace(',', '.')) / 100 }),
    };
  },
});

/** Lo que dice el feedback de la parte que falla, tal como lo escribe el escenario. */
const FALLOS_NUMERICOS: Readonly<Record<string, FalloNumerico>> = {
  'el valor no es el esperado': { valor: 'distinto' },
  'la unidad no es la esperada': { unidad: 'distinta' },
  'el valor y la unidad no son los esperados': { valor: 'distinto', unidad: 'distinta' },
  'falta la unidad': { unidad: 'falta' },
  'el valor no es el esperado y falta la unidad': { valor: 'distinto', unidad: 'falta' },
  'sobra la unidad': { unidad: 'sobra' },
  'no se entiende como un número': { valor: 'ilegible' },
};

defineParameterType({
  name: 'fallo_numerico',
  regexp: new RegExp(
    Object.keys(FALLOS_NUMERICOS)
      .sort((a, b) => b.length - a.length)
      .join('|'),
  ),
  transformer: (frase: string): FalloNumerico => FALLOS_NUMERICOS[frase] ?? {},
});

/** El feedback de la última respuesta, con lo que dice del fallo numérico (puede no decir nada). */
function falloNumerico(): FalloNumerico {
  const feedback: FeedbackNumerico = presente(mundo().feedback, 'el feedback');
  return presente(feedback.numerico, 'qué parte de la respuesta numérica falla');
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

Given(
  'que {objetivo} tiene el ítem {item} con la respuesta numérica {respuesta_numerica}',
  (objetivo: string, item: string, respuesta: RespuestaNumerica) => {
    mundo().contenido().agregarItemNumerico({ id: item, objetivo, respuesta });
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

/** Contesta con `respuesta` al ítem numérico N1 (9,81 m/s²) del dominio aparte y devuelve su feedback. */
function feedbackDeUnItemNumerico(respuesta: string): FeedbackNumerico {
  const actual = mundo();
  const contenido = actual.contenido(DOMINIO_NUMERICO);
  const item = contenido.agregarItemNumerico({
    id: 'N1',
    objetivo: 'O1',
    respuesta: { valor: 9.81, unidades: ['m/s²'] },
  });
  // Lo que la persona ve del ítem I1 no cambia: los pasos siguientes siguen hablando de él.
  const { presentado, feedback } = actual;
  try {
    const visto: FeedbackNumerico = responderTexto(actual, { item: item.id, respuesta, dominio: DOMINIO_NUMERICO });
    assert.equal(visto.correcta, false, `«${respuesta}» no es correcta`);
    assert.equal(visto.explicacion, item.feedback);
    return visto;
  } finally {
    actual.presentado = presentado;
    actual.feedback = feedback;
  }
}

Then(
  /^en un ítem numérico incorrecto, además, qué parte de la respuesta falla, cómo se escribe un número si no se entendió y el margen que se acepta \(.*\)$/,
  () => {
    const permitidas = [...CLAVES_DEL_FEEDBACK, 'numerico'].sort();
    const fallado = feedbackDeUnItemNumerico('12 m/s');
    assert.ok(
      Object.keys(fallado).every((clave) => permitidas.includes(clave)),
      'El feedback trae datos de más',
    );
    const { numerico } = fallado;
    assert.deepEqual(Object.keys(presente(numerico, 'qué parte de la respuesta falla')).sort(), [
      'margen',
      'unidad',
      'valor',
    ]);
    const ilegible = feedbackDeUnItemNumerico('muy rápido').numerico;
    assert.deepEqual(Object.keys(presente(ilegible, 'cómo se escribe un número')).sort(), ['formato', 'valor']);
    assert.ok(
      [...Object.keys(numerico ?? {}), ...Object.keys(ilegible ?? {})].every((campo) =>
        CAMPOS_DEL_FALLO_NUMERICO.includes(campo),
      ),
    );
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

Then('las tres veces lo responde escribiendo un número y su unidad', () => {
  const { presentaciones } = mundo();
  assert.equal(presentaciones.length, CONTEXTOS_DE_RECU_4.length);
  presentaciones.forEach((visto) => {
    const numerico: ItemPresentadoNumerico = visto;
    assert.equal(numerico.opciones, undefined);
    assert.ok(visto.acciones.includes(ACCION_DE_RESPONDER));
    assert.equal(numerico.entrada, 'numero_con_unidad');
  });
});

// --- RECU-5: un ítem numérico se corrige con tolerancia y unidades ------------------------------------------

Then('ve que {fallo_numerico}', (esperado: FalloNumerico) => {
  const real = falloNumerico();
  assert.equal(real.valor, esperado.valor, 'Lo que dice el feedback del valor');
  assert.equal(real.unidad, esperado.unidad, 'Lo que dice el feedback de la unidad');
});

Then('ve que se escribe con dígitos, con coma o punto como separador decimal y sin separador de miles', () => {
  const { formato } = falloNumerico();
  const dicho = presente(formato, 'cómo se escribe un número');
  ['dígitos', 'coma', 'punto', 'miles'].forEach((palabra) => {
    assert.ok(dicho.includes(palabra), `El feedback no menciona «${palabra}»: «${dicho}»`);
  });
});

Then('ve que se acepta un margen del {fraccion} sobre {texto}', (margen: number, correcta: string) => {
  esperarCasiIgual(falloNumerico().margen, margen, 'El margen que dice el feedback');
  assert.equal(presente(mundo().feedback, 'el feedback').respuestaCorrecta, correcta);
});

Then('ve el feedback del ítem', () => {
  const explicacion = presente(mundo().feedback, 'el feedback').explicacion;
  const item = mundo().contenido().item(presente(mundo().presentado, 'el ítem presentado').id);
  assert.equal(explicacion, item.feedback);
});
