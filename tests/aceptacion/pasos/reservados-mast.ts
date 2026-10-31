import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import { validarContenido } from '../../../src/aplicacion/formato-contenido.ts';
import type { ItemPresentado, Sesion } from '../../../src/aplicacion/sesiones.ts';
import { aFase, dominarObjetivo, llegarAFase, responder, responderItems } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { filasDelDominio } from '../soporte/csv.ts';
import { respuestaPara } from '../soporte/contenido.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { instanteUtc } from '../soporte/reloj.ts';
import { iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos de los ítems reservados (MAST-8): dónde se presentan, que no cuentan para el dominio y que
// se presentan una sola vez. Un reservado (`reservado: true`) es un caso que la persona no practica.
// Los de la transferencia del paso a la fase avanzada (MAST-6) están en transferencia.ts.

/** Las semanas de retención diferida de los escenarios son 1 y 4: un objetivo dominado el 2 de marzo. */
const DOMINADO_EL = '2026-03-02';
const PRIMERA_PRUEBA = '2026-03-09';
const SEGUNDA_PRUEBA = '2026-03-30';
const DIAS_HASTA_EL_REPASO = 8;
const PERSONA_SIN_DIAGNOSTICO = 1;
const HECHOS_DE_RELLENO = 2;
const ITEMS_DEL_OBJETIVO = 20;

function a(fecha: string): Date {
  return instanteUtc(fecha, '09:00:00');
}

function anotarPresentados(actual: Mundo, items: readonly ItemPresentado[]): void {
  actual.presentaciones.push(...items);
}

function pruebaDeRetencion(actual: Mundo, objetivo: string, fecha?: string): Sesion {
  if (fecha !== undefined) {
    actual.reloj.fijar(a(fecha));
  }
  const sesion = aceptado(actual.listo().iniciarSesion({ dominio: actual.dominio, tipo: 'retencion', objetivo }));
  actual.sesion = sesion;
  return sesion;
}

function ids(sesion: Sesion): readonly string[] {
  return itemsDe(sesion).map((item) => item.id);
}

// --- Dónde se presentan los reservados (MAST-8.1) ------------------------------------------------

Given('que la persona está en la fase {texto} con O1, O2 y O3 dominados', (textoFase: string) => {
  const actual = mundo();
  actual.preparar(() => {
    llegarAFase(actual, aFase(textoFase));
  });
});

// O4 se aprueba cuando la persona ya está en la fase: se añade a la cola, después de llegar a ella.
// I5 es de O1 en el contenido de partida (los 20 ítems de cada objetivo): se libera ese `id` antes.
Given('que O4 se aprobó en la revisión del material con un ítem I5 reservado', () => {
  const actual = mundo();
  actual.contenido().liberarId('I5');
  actual.preparar(() => {
    const contenido = actual.contenido();
    contenido.agregarObjetivo('O4');
    contenido.agregarItems('O4', HECHOS_DE_RELLENO);
    contenido.agregarItem({ id: 'I5', objetivo: 'O4', tipo: 'problema', categoria: 'C1', reservado: true });
  });
});

Given('que I5 también está marcado para el diagnóstico', () => {
  const actual = mundo();
  actual.preparar(() => {
    actual.contenido().cambiarItem('I5', { diagnostico: true });
  });
});

When('se prepara el diagnóstico del dominio', () => {
  const actual = mundo();
  actual.listo();
  const apertura = aceptado(actual.aplicacion(PERSONA_SIN_DIAGNOSTICO).abrirDominio({ dominio: actual.dominio }));
  anotarPresentados(actual, itemsDe(presente(apertura.diagnostico, 'la sesión del diagnóstico')));
});

When('empieza una sesión de práctica de {objetivo}', (objetivo: string) => {
  anotarPresentados(mundo(), itemsDe(iniciarSesionDePractica(mundo(), { objetivo })));
});

// Para que haya algo que repasar, la persona responde los ítems del objetivo, también el reservado
// (que se presenta una vez, en la mezcla), y pasan los días: el repaso no puede traer el reservado.
When('se prepara un repaso programado de {objetivo}', (objetivo: string) => {
  const actual = mundo();
  actual.listo();
  const contenido = actual.contenido();
  contenido.items
    .filter((item) => item.objetivo === objetivo)
    .forEach((item) => {
      responder(actual, {
        item: item.id,
        correcta: true,
        contexto: contenido.esReservado(item) ? 'intercalado' : 'practica',
      });
    });
  actual.reloj.avanzarDias(DIAS_HASTA_EL_REPASO);
  const sesion = aceptado(actual.aplicacion().iniciarSesion({ dominio: actual.dominio, tipo: 'repaso', objetivo }));
  anotarPresentados(actual, itemsDe(sesion));
});

Then('{item} no se presenta', (item: string) => {
  const vistos = mundo().presentaciones.map((presentado) => presentado.id);
  assert.ok(!vistos.includes(item), `Se le presentó ${item}`);
});

Then('{item} se acepta con {textos} a la vez, sin error de formato', (item: string, campos: string[]) => {
  const contenido = mundo().contenido();
  const guardado = new Map(Object.entries(contenido.item(item)));
  campos.forEach((campo) => {
    assert.equal(guardado.get(campo), true, `${item} no tiene «${campo}»`);
  });
  const validacion = validarContenido(contenido.toContenido());
  assert.ok(validacion.ok, `La aplicación rechaza el contenido: ${validacion.ok ? '' : validacion.fallo.falta}`);
});

// --- Los reservados no cuentan para el dominio (MAST-8.2) ----------------------------------------

Given(
  'que {objetivo} tiene {int} ítems, {int} de ellos reservados',
  (objetivo: string, total: number, reservados: number) => {
    const contenido = mundo().contenido();
    contenido.asegurarItemsPorObjetivo(total);
    contenido.items
      .filter((item) => item.objetivo === objetivo)
      .slice(total - reservados, total)
      .forEach((item) => {
        contenido.reservar(item.id);
      });
  },
);

Given(
  'que la persona ha respondido los {int} ítems no reservados de {objetivo} y acertó {int} en su último intento',
  (cantidad: number, objetivo: string, aciertos: number) => {
    const actual = mundo();
    actual.objetivoEnCurso = objetivo;
    actual.preparar(() => {
      const items = actual.contenido().itemsDe(objetivo);
      assert.equal(items.length, cantidad, `${objetivo} no tiene ${String(cantidad)} ítems no reservados`);
      responderItems(actual, { items, aciertos });
    });
  },
);

Given('que nunca ha respondido ninguno de los {int} reservados', (cantidad: number) => {
  const actual = mundo();
  actual.preparar(() => {
    const reservados = actual.contenido().reservados(actual.objetivoEnCurso);
    assert.equal(reservados.length, cantidad, `${actual.objetivoEnCurso} no tiene ${String(cantidad)} reservados`);
    assert.ok(
      reservados.every((item) => !actual.intentos.has(item.id)),
      'Algún reservado ya tiene un intento',
    );
  });
});

// --- El reparto de los reservados (MAST-8.3) -----------------------------------------------------

Given('que C1 y C2 son de un grupo de parecidas y C5 no tiene grupo', () => {
  mundo()
    .contenido()
    .fijarCategorias([
      { id: 'C1', descripcion: 'Descripción de C1', grupo_parecidas: 'G1' },
      { id: 'C2', descripcion: 'Descripción de C2', grupo_parecidas: 'G1' },
      { id: 'C5', descripcion: 'Descripción de C5' },
    ]);
});

// Los ítems de la tabla son los de O1 que ya existen (los 20 de partida), en el orden del contenido.
Given('que {objetivo} tiene estos ítems reservados, en este orden:', (objetivo: string, tabla: DataTable) => {
  const contenido = mundo().contenido();
  tabla.hashes().forEach((fila) => {
    const tipo = fila['tipo'];
    assert.ok(tipo === 'hecho' || tipo === 'problema', `«${String(tipo)}» no es un tipo de ítem`);
    const item = fila['ítem'] ?? '';
    assert.equal(contenido.item(item).objetivo, objetivo, `${item} no es de ${objetivo}`);
    contenido.reservar(item, { tipo, categoria: fila['categoría'] ?? '' });
  });
});

Then('{item} entra en la mezcla de las sesiones intercaladas \\(INTE-5)', (item: string) => {
  const actual = mundo();
  // La mezcla solo se hace en la fase de intercalado configurada: la de la persona en este momento.
  const progreso = aceptado(actual.listo().consultarProgreso({ dominio: actual.dominio }));
  actual.establecerParametro('fase_intercalado', progreso.fase);
  const sesion = iniciarSesionDePractica(actual, { grupo: 'G1' });
  assert.ok(ids(sesion).includes(item), `${item} no está en la sesión intercalada`);
});

Then(
  'la prueba de retención de {objetivo} del {fecha} incluye {ids}',
  (objetivo: string, fecha: string, esperados: string[]) => {
    const actual = mundo();
    const sesion = pruebaDeRetencion(actual, objetivo, fecha);
    esperados.forEach((item) => {
      assert.ok(ids(sesion).includes(item), `La prueba del ${fecha} no incluye ${item}`);
    });
    anotarPresentados(actual, itemsDe(sesion));
  },
);

Then('ninguna prueba de retención de {objetivo} incluye {item}', (_objetivo: string, item: string) => {
  const vistos = mundo().presentaciones.map((presentado) => presentado.id);
  assert.notEqual(vistos.length, 0, 'No se ha preparado ninguna prueba de retención');
  assert.ok(!vistos.includes(item), `Una prueba de retención incluye ${item}`);
});

// --- En la prueba de retención un reservado solo se registra (MAST-8.4) --------------------------

// I19 va a la prueba del 30 de marzo, la segunda (MAST-8.3): el reservado anterior, I18, va a la primera.
// El objetivo conserva sus 20 ítems no reservados, para que el acierto del 85 % siga siendo 17 de 20.
// Y se domina el 2 de marzo, antes de todo lo demás.
Given(
  'que el ítem {item} de {objetivo} es un reservado de la prueba de retención del 2026-03-30',
  (item: string, objetivo: string) => {
    const actual = mundo();
    const contenido = actual.contenido();
    const anterior = contenido.items.filter((candidato) => candidato.objetivo === objetivo).at(-2);
    contenido.reservar(presente(anterior, `un ítem anterior a ${item}`).id);
    contenido.reservar(item);
    contenido.asegurarItemsPorObjetivo(ITEMS_DEL_OBJETIVO);
    actual.prepararAntes(() => {
      actual.reloj.fijar(a(DOMINADO_EL));
    });
  },
);

When('la persona falla {item} en esa prueba de retención', (item: string) => {
  const actual = mundo();
  actual.listo();
  actual.reloj.fijar(a(SEGUNDA_PRUEBA));
  responder(actual, { item, correcta: false, contexto: 'retencion' });
});

// --- Un reservado se presenta una sola vez (MAST-8.5, MAST-8.6) ----------------------------------

/** El objetivo se domina el 2 de marzo, con el ítem ya reservado, y la persona está en el día de la prueba. */
function prepararPruebaDelPrimerDia(
  actual: Mundo,
  prueba: { readonly objetivo: string; readonly item: string; readonly fecha: string },
): void {
  actual.contenido().reservar(prueba.item);
  actual.reloj.fijar(a(DOMINADO_EL));
  dominarObjetivo(actual, prueba.objetivo);
  actual.reloj.fijar(a(prueba.fecha));
}

Given(
  'que la persona respondió el reservado {item} de {objetivo} en la prueba de retención del {fecha}',
  (item: string, objetivo: string, fecha: string) => {
    const actual = mundo();
    actual.preparar(() => {
      prepararPruebaDelPrimerDia(actual, { objetivo, item, fecha });
      responder(actual, { item, correcta: true, contexto: 'retencion' });
    });
  },
);

// Se le presentó y escribió su respuesta, pero no llegó a declarar la confianza: el intento no está completo.
Given(
  'que se le presentó a la persona el reservado {item} de {objetivo} y cerró la aplicación sin declarar su confianza',
  (item: string, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      prepararPruebaDelPrimerDia(actual, { objetivo, item, fecha: PRIMERA_PRUEBA });
      const app = actual.aplicacion();
      aceptado(app.presentarItem({ dominio: actual.dominio, item, contexto: 'retencion' }));
      const respuesta = respuestaPara(actual.contenido().item(item), true);
      aceptado(app.responderItem({ dominio: actual.dominio, item, contexto: 'retencion', respuesta }));
    });
  },
);

When('se prepara la prueba de retención de {objetivo} del {fecha}', (objetivo: string, fecha: string) => {
  pruebaDeRetencion(mundo(), objetivo, fecha);
});

// La siguiente prueba es la del día en que quedó sin completar el reservado.
When('se prepara la siguiente prueba de retención de {objetivo}', (objetivo: string) => {
  pruebaDeRetencion(mundo(), objetivo);
});

Then('la prueba no incluye {item}', (item: string) => {
  const sesion = presente(mundo().sesion, 'ninguna prueba preparada');
  assert.ok(!ids(sesion).includes(item), `La prueba incluye ${item}`);
});

Then('{item} sigue disponible para presentarse', (item: string) => {
  const sesion = presente(mundo().sesion, 'ninguna prueba preparada');
  assert.ok(ids(sesion).includes(item), `${item} no está en la prueba`);
});

Then('{item} no se presenta en ninguna sesión de práctica, repaso ni sesión intercalada', (item: string) => {
  const actual = mundo();
  const app = actual.listo();
  const dominio = actual.dominio;
  const practica = aceptado(app.iniciarSesion({ dominio, tipo: 'practica', objetivo: 'O1' }));
  // El repaso o la sesión intercalada pueden no tener nada que presentar y rechazarse: solo cuenta lo que se presenta.
  const otras = [
    app.iniciarSesion({ dominio, tipo: 'repaso', objetivo: 'O1' }),
    app.iniciarSesion({ dominio, tipo: 'practica', grupo: 'G1' }),
  ].flatMap((resultado) => (resultado.ok ? [resultado.valor] : []));
  [practica, ...otras].forEach((sesion) => {
    assert.ok(!ids(sesion).includes(item), `Se le presenta ${item}`);
  });
});

// Un intento se registra al declarar la confianza, y cada intento registrado es una fila de respuestas.csv.
Then('{item} no tiene ningún intento registrado', (item: string) => {
  const filas = filasDelDominio(mundo(), 'respuestas.csv').filter((fila) => fila['item'] === item);
  assert.deepEqual(filas, [], `${item} tiene intentos registrados`);
});
