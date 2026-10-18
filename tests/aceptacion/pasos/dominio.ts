import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  dominarObjetivo,
  fallarRepaso,
  fallosParaPerderElDominio,
  llevarAcierto,
  problemasIntercalables,
  progresoCompleto,
  progresoDe,
  responder,
  responderItems,
} from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { instanteUtc, soloFecha } from '../soporte/reloj.ts';

// Pasos del criterio de dominio (MAST). Los escenarios dicen cosas como «O1 queda dominado» tanto
// como acción (Cuando) como comprobación (Entonces); `esComprobacion` distingue cuál de las dos toca.

const PORCENTAJE = 100;

function esComprobacion(): boolean {
  return mundo().tipoPasoActual === 'Outcome';
}

/** El umbral de dominio que hay ahora mismo en la configuración. */
function umbralDeDominio(actual: Mundo): number {
  const valor = actual.parametros['umbral_dominio']?.valor;
  assert.equal(typeof valor, 'number', 'umbral_dominio tiene que ser un número');
  return valor as number;
}

/** Hace que el objetivo esté dominado, salvo que la persona ya haya respondido todos sus ítems. */
function dominarSiHaceFalta(actual: Mundo, objetivo: string): void {
  const items = actual.contenido().itemsDe(objetivo);
  if (!items.every((item) => actual.intentos.has(item.id))) {
    dominarObjetivo(actual, objetivo);
  }
}

/** Falla en repasos los ítems justos para que el acierto del objetivo baje del umbral. */
function quitarDominio(actual: Mundo, objetivo: string): void {
  const total = actual.contenido().itemsDe(objetivo).length;
  const cantidad = fallosParaPerderElDominio(total, umbralDeDominio(actual));
  fallarRepaso(actual, { objetivo, contexto: 'repaso', cantidad });
}

function comprobarEstado(objetivo: string, dominado: boolean): void {
  const estado = progresoDe(mundo(), objetivo).estado;
  assert.equal(estado === 'dominado', dominado, `${objetivo} está «${estado}»`);
}

// --- Cómo ha respondido la persona ---------------------------------------------------------------

Given('que la persona ha respondido los {int} ítems de {objetivo}', (cantidad: number, objetivo: string) => {
  mundo().objetivoEnCurso = objetivo;
  assert.equal(
    mundo().contenido().itemsDe(objetivo).length,
    cantidad,
    `${objetivo} no tiene ${String(cantidad)} ítems`,
  );
});

Given(
  'que la persona ha respondido los {int} ítems de {objetivo} con una confianza del {fraccion} en cada uno',
  (cantidad: number, objetivo: string, confianza: number) => {
    mundo().objetivoEnCurso = objetivo;
    mundo().confianza = Math.round(confianza * PORCENTAJE);
    assert.equal(
      mundo().contenido().itemsDe(objetivo).length,
      cantidad,
      `${objetivo} no tiene ${String(cantidad)} ítems`,
    );
  },
);

Given('que en su último intento acertó {int} de ellos', (aciertos: number) => {
  const actual = mundo();
  const objetivo = actual.objetivoEnCurso;
  actual.preparar(() => {
    responderItems(actual, { items: actual.contenido().itemsDe(objetivo), aciertos });
  });
});

Given('que la persona ha acertado {int} ítems de {objetivo}', (aciertos: number, objetivo: string) => {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    responderItems(actual, { items: actual.contenido().itemsDe(objetivo).slice(0, aciertos), aciertos });
  });
});

Given('que nunca ha respondido el ítem {item} de {objetivo}', (item: string, objetivo: string) => {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    assert.ok(!actual.intentos.has(item), `${item} ya tiene un intento y el escenario dice que no`);
  });
});

Given('que la persona falló el ítem {item} de {objetivo} en su primer intento', (item: string, objetivo: string) => {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    responder(actual, { item, correcta: false });
  });
});

Given('que acertó {item} en su segundo intento', (item: string) => {
  const actual = mundo();
  actual.preparar(() => {
    responder(actual, { item, correcta: true });
  });
});

Given('que en su último intento acertó otros {int} ítems de {objetivo}', (aciertos: number, objetivo: string) => {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    // Los ítems que el escenario no menciona se fallan: así el acierto es exactamente el que dice.
    const sinIntento = actual
      .contenido()
      .itemsDe(objetivo)
      .filter((item) => !actual.intentos.has(item.id));
    responderItems(actual, { items: sinIntento, aciertos });
  });
});

// Deja el objetivo con ese acierto sin ayuda; si llega al umbral, además queda dominado.
function prepararAcierto(objetivo: string, fraccion: number): void {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    llevarAcierto(actual, objetivo, fraccion);
  });
}

Given('que el acierto sin ayuda de {objetivo} es del {fraccion}', prepararAcierto);
Given('que {objetivo} está dominado con un acierto sin ayuda del {fraccion}', prepararAcierto);

Given('que {ids} están dominados', (objetivos: string[]) => {
  const actual = mundo();
  actual.preparar(() => {
    objetivos.forEach((objetivo) => {
      dominarSiHaceFalta(actual, objetivo);
    });
  });
});

Given('que {objetivo} es el objetivo actual', (objetivo: string) => {
  const actual = mundo();
  actual.objetivoEnCurso = objetivo;
  actual.preparar(() => {
    // Un objetivo se abre al dominar los anteriores, así que se dominan por el camino de verdad.
    const anteriores = actual.contenido().objetivos.map((candidato) => candidato.id);
    anteriores.slice(0, anteriores.indexOf(objetivo)).forEach((anterior) => {
      dominarSiHaceFalta(actual, anterior);
    });
  });
});

Given('que cada uno tiene al menos un intento en sesiones intercaladas', () => {
  const actual = mundo();
  actual.preparar(() => {
    const problemas = problemasIntercalables(actual);
    responderItems(actual, { items: problemas, aciertos: problemas.length, contexto: 'intercalado' });
  });
});

Given('que en su último intento intercalado acertó {int} de ellos', (aciertos: number) => {
  const actual = mundo();
  actual.preparar(() => {
    responderItems(actual, { items: problemasIntercalables(actual), aciertos, contexto: 'intercalado' });
  });
});

// --- Lo que hace la persona ----------------------------------------------------------------------

When('la aplicación evalúa {objetivo}', (objetivo: string) => {
  mundo().evaluacionObjetivo = aceptado(mundo().listo().evaluarObjetivo({ dominio: mundo().dominio, objetivo }));
});

When('la aplicación evalúa la fase', () => {
  mundo().evaluacionFase = aceptado(mundo().listo().evaluarFase({ dominio: mundo().dominio }));
});

When('{objetivo} queda dominado', (objetivo: string) => {
  if (esComprobacion()) {
    comprobarEstado(objetivo, true);
    return;
  }
  mundo().listo();
  dominarObjetivo(mundo(), objetivo);
});

When('{objetivo} queda dominado el {fecha}', (objetivo: string, fecha: string) => {
  mundo().listo();
  mundo().reloj.fijar(instanteUtc(fecha, '09:00:00'));
  dominarObjetivo(mundo(), objetivo);
});

When('{objetivo} deja de estar dominado', (objetivo: string) => {
  if (esComprobacion()) {
    comprobarEstado(objetivo, false);
    return;
  }
  mundo().listo();
  quitarDominio(mundo(), objetivo);
});

When('la persona falla un repaso de un ítem de {objetivo} que había acertado', (objetivo: string) => {
  mundo().listo();
  fallarRepaso(mundo(), { objetivo, contexto: 'repaso', cantidad: 1 });
});

When('la persona falla en la prueba de retención un ítem de {objetivo} que había acertado', (objetivo: string) => {
  mundo().listo();
  fallarRepaso(mundo(), { objetivo, contexto: 'retencion', cantidad: 1 });
});

When('la persona intenta practicar {objetivo}', (objetivo: string) => {
  const actual = mundo();
  actual.ultimoResultado = actual.listo().iniciarSesion({ dominio: actual.dominio, tipo: 'practica', objetivo });
});

When('la persona consulta el objetivo {objetivo}', (objetivo: string) => {
  const actual = mundo();
  actual.consultado = aceptado(actual.listo().consultarObjetivo({ dominio: actual.dominio, objetivo }));
});

// --- Lo que ve la persona ------------------------------------------------------------------------

Then('{objetivo} no queda dominado', (objetivo: string) => {
  comprobarEstado(objetivo, false);
});

Then('el acierto sin ayuda de {objetivo} es del {fraccion}', (objetivo: string, fraccion: number) => {
  esperarCasiIgual(progresoDe(mundo(), objetivo).aciertoSinAyuda, fraccion, `Acierto sin ayuda de ${objetivo}`);
});

Then('la aplicación indica que falta responder {int} ítem(s) de {objetivo}', (faltan: number, objetivo: string) => {
  const evaluacion = presente(mundo().evaluacionObjetivo, 'ninguna evaluación de objetivo');
  assert.equal(evaluacion.itemsSinIntento, faltan, `Ítems sin responder según la evaluación de ${objetivo}`);
  assert.equal(progresoDe(mundo(), objetivo).itemsSinIntento, faltan, `Ítems sin responder según el progreso`);
});

Then('{objetivo} pasa a ser el objetivo actual', (objetivo: string) => {
  assert.equal(progresoCompleto(mundo()).objetivoActual, objetivo);
});

Then('{objetivo} sigue siendo el objetivo actual', (objetivo: string) => {
  assert.equal(progresoCompleto(mundo()).objetivoActual, objetivo);
});

Then('{objetivo} sigue cerrado', (objetivo: string) => {
  assert.equal(progresoDe(mundo(), objetivo).estado, 'cerrado');
});

Then('la aplicación no se lo permite', () => {
  const resultado = presente(mundo().ultimoResultado, 'ninguna respuesta a la petición');
  assert.equal(resultado.ok, false, 'La aplicación aceptó una petición que debía rechazar');
});

Then('{objetivo} vuelve a la cola de práctica', (objetivo: string) => {
  assert.equal(progresoDe(mundo(), objetivo).enColaDePractica, true, `${objetivo} no está en la cola de práctica`);
});

Then('{objetivo} sigue abierto y la fase sigue siendo {texto}', (objetivo: string, fase: string) => {
  assert.equal(progresoDe(mundo(), objetivo).estado, 'abierto');
  assert.equal(progresoCompleto(mundo()).fase, fase);
});

Then('la fase sigue siendo {texto}', (fase: string) => {
  assert.equal(progresoCompleto(mundo()).fase, fase);
});

Then('la fase es {texto}', (fase: string) => {
  const evaluacion = presente(mundo().evaluacionFase, 'ninguna evaluación de fase');
  assert.equal(evaluacion.fase, fase);
});

Then('no hay ninguna opción para darlo por dominado, saltarlo o declarar que ya lo sabe', () => {
  const consultado = presente(mundo().consultado, 'el objetivo consultado');
  const prohibidas = consultado.acciones.filter((accion) => /dominad|salt|sab|conoc/i.test(accion));
  assert.deepEqual(prohibidas, [], 'La aplicación ofrece saltar o dar por sabido el objetivo');
});

// --- Retención en diferido ----------------------------------------------------------------------

function fechasDeRetencion(objetivo: string): string[] {
  const repasos = aceptado(mundo().listo().consultarRepasos({ dominio: mundo().dominio }));
  return repasos
    .filter((repaso) => repaso.clase === 'retencion' && repaso.objetivo === objetivo)
    .map((repaso) => soloFecha(repaso.fecha));
}

Then('se programa una prueba de retención de {objetivo} para el {fecha}', (objetivo: string, fecha: string) => {
  mundo().objetivoEnCurso = objetivo;
  assert.ok(fechasDeRetencion(objetivo).includes(fecha), `${objetivo} no tiene prueba de retención el ${fecha}`);
});

Then('otra para el {fecha}', (fecha: string) => {
  const fechas = fechasDeRetencion(mundo().objetivoEnCurso);
  assert.ok(fechas.includes(fecha), `No hay otra prueba de retención el ${fecha}`);
  assert.equal(fechas.length, 2, 'Se esperaban exactamente dos pruebas de retención');
});
