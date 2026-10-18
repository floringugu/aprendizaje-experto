import assert from 'node:assert/strict';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { ItemContenido } from '../../../src/aplicacion/contenido.ts';
import type { ResultadoDiagnostico } from '../../../src/aplicacion/dominio.ts';
import type { ItemPresentado } from '../../../src/aplicacion/sesiones.ts';
import { progresoDe, responder } from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';

// Pasos del diagnóstico inicial (DIAG). Aquí la persona nunca ha hecho el diagnóstico antes del
// escenario: lo hace el propio escenario, así que se desactiva el diagnóstico previo de los demás.

Before({ tags: '@DIAG' }, function (this: Mundo) {
  this.diagnosticoPrevio = false;
});

const PORCENTAJE = 100;

function itemsDeDiagnostico(actual: Mundo): readonly ItemContenido[] {
  return actual.contenido().items.filter((item) => item.diagnostico);
}

/** Los ítems del diagnóstico del objetivo (de un tipo, si se indica). */
function itemsDe(actual: Mundo, objetivo: string, tipo?: ItemContenido['tipo']): readonly ItemContenido[] {
  return itemsDeDiagnostico(actual).filter(
    (item) => item.objetivo === objetivo && (tipo === undefined || item.tipo === tipo),
  );
}

/** Anota qué ítems acierta en el diagnóstico: los `aciertos` primeros de la lista; el resto, no. */
function acertarEnElDiagnostico(items: readonly ItemContenido[], aciertos: number): void {
  items.forEach((item, posicion) => {
    mundo().respuestasDiagnostico.set(item.id, posicion < aciertos);
  });
}

function respuestaPrevista(actual: Mundo, item: ItemContenido): boolean {
  if (actual.respuestasDiagnostico.size > 0) {
    return actual.respuestasDiagnostico.get(item.id) === true;
  }
  // Sin un plan, se alterna acierto y fallo para que se vea que la corrección es de verdad. Se alterna
  // por el orden del contenido y no por el de la sesión, que la aplicación puede barajar distinto para
  // cada persona: así dos personas aciertan siempre los mismos ítems (DIAG-1.2).
  const posicionEnElContenido = itemsDeDiagnostico(actual).findIndex((candidato) => candidato.id === item.id);
  return posicionEnElContenido % 2 === 0;
}

interface PeticionDiagnostico {
  readonly persona: number;
  readonly confianza: number;
}

/** La persona abre el dominio, responde todos los ítems que se le presentan y termina el diagnóstico. */
function hacerDiagnostico(actual: Mundo, peticion: PeticionDiagnostico): ResultadoDiagnostico {
  const app = actual.aplicacion(peticion.persona);
  const apertura = aceptado(app.abrirDominio({ dominio: actual.dominio }));
  const sesion = presente(apertura.diagnostico, 'la sesión del diagnóstico');
  if (peticion.persona === 0) {
    actual.apertura = apertura;
    actual.sesion = sesion;
  }
  sesion.elementos.forEach((elemento) => {
    if (elemento.tipo !== 'item') {
      return;
    }
    const esperada = respuestaPrevista(actual, actual.contenido().item(elemento.item.id));
    const feedback = responder(actual, {
      ...peticion,
      item: elemento.item.id,
      correcta: esperada,
      contexto: 'diagnostico',
    });
    if (peticion.persona === 0) {
      actual.correcciones.push({ esperada, recibida: feedback.correcta });
    }
  });
  return aceptado(app.terminarDiagnostico({ dominio: actual.dominio }));
}

function itemsPresentados(): readonly ItemPresentado[] {
  const sesion = presente(mundo().sesion, 'la sesión del diagnóstico');
  return sesion.elementos.flatMap((elemento) => (elemento.tipo === 'item' ? [elemento.item] : []));
}

function resultadoDelDiagnostico(): ResultadoDiagnostico {
  return presente(mundo().diagnostico, 'el resultado del diagnóstico');
}

// --- Qué responde la persona --------------------------------------------------------------------

Given('que la persona no ha empezado el dominio {texto}', () => {
  mundo().diagnosticoPrevio = false;
});

Given(
  'que en el diagnóstico la persona acierta los {int} ítems de {objetivo}',
  (aciertos: number, objetivo: string) => {
    acertarEnElDiagnostico(itemsDe(mundo(), objetivo), aciertos);
  },
);

Given(
  'que en el diagnóstico la persona acierta {int} de los {int} ítems de {objetivo}',
  (aciertos: number, total: number, objetivo: string) => {
    assert.equal(
      itemsDe(mundo(), objetivo).length,
      total,
      `${objetivo} no tiene ${String(total)} ítems de diagnóstico`,
    );
    acertarEnElDiagnostico(itemsDe(mundo(), objetivo), aciertos);
  },
);

// «acierta 10 de los 20 ítems de O2 y 10 de los 20 ítems de O3»: son seis datos, más de los tres que
// admite el lint por función, así que el paso lee los grupos de la expresión regular a mano.
Given(/^acierta (\d+) de los (\d+) ítems de (O\d+) y (\d+) de los (\d+) ítems de (O\d+)$/, (...grupos: string[]) => {
  for (const [aciertos = '', total = '', objetivo = ''] of [grupos.slice(0, 3), grupos.slice(3, 6)]) {
    assert.equal(
      itemsDe(mundo(), objetivo).length,
      Number(total),
      `${objetivo} no tiene ${total} ítems de diagnóstico`,
    );
    acertarEnElDiagnostico(itemsDe(mundo(), objetivo), Number(aciertos));
  }
});

Given('que en el diagnóstico la persona acierta los {int} ítems de tipo «hecho»', (total: number) => {
  const hechos = itemsDeDiagnostico(mundo()).filter((item) => item.tipo === 'hecho');
  assert.equal(hechos.length, total, 'El número de ítems de tipo «hecho» no coincide');
  acertarEnElDiagnostico(hechos, total);
});

Given('acierta {int} de los {int} ítems de tipo «problema» de cada objetivo', (aciertos: number, total: number) => {
  mundo()
    .contenido()
    .objetivos.forEach((objetivo) => {
      const problemas = itemsDe(mundo(), objetivo.id, 'problema');
      assert.equal(problemas.length, total, `${objetivo.id} no tiene ${String(total)} problemas de diagnóstico`);
      acertarEnElDiagnostico(problemas, aciertos);
    });
});

Given('que en el diagnóstico la persona domina {objetivo} y no domina {objetivo}', (dominado: string, otro: string) => {
  acertarEnElDiagnostico(itemsDe(mundo(), dominado), itemsDe(mundo(), dominado).length);
  acertarEnElDiagnostico(itemsDe(mundo(), otro), 0);
});

// --- Lo que hace la persona ----------------------------------------------------------------------

When('abre el dominio {texto}', (dominio: string) => {
  mundo().apertura = aceptado(mundo().listo().abrirDominio({ dominio }));
});

function hacerElDiagnosticoDeLaPersona(): void {
  const actual = mundo();
  actual.listo();
  actual.diagnostico = hacerDiagnostico(actual, { persona: 0, confianza: actual.confianza });
}

When('la persona hace el diagnóstico del dominio {texto}', hacerElDiagnosticoDeLaPersona);
When('la persona termina el diagnóstico del dominio {texto}', hacerElDiagnosticoDeLaPersona);
When('termina el diagnóstico', hacerElDiagnosticoDeLaPersona);

// --- Lo que ve la persona ------------------------------------------------------------------------

Then('la aplicación le presenta el diagnóstico', () => {
  const apertura = presente(mundo().apertura, 'la apertura del dominio');
  assert.equal(apertura.diagnosticoPendiente, true, 'El diagnóstico no está pendiente');
  assert.equal(presente(apertura.diagnostico, 'la sesión del diagnóstico').tipo, 'diagnostico');
});

Then('no le deja practicar ningún objetivo hasta terminarlo', () => {
  const actual = mundo();
  actual.contenido().objetivos.forEach((objetivo) => {
    const intento = actual
      .aplicacion()
      .iniciarSesion({ dominio: actual.dominio, tipo: 'practica', objetivo: objetivo.id });
    assert.equal(intento.ok, false, `La aplicación deja practicar ${objetivo.id} sin diagnóstico`);
  });
});

Then('se le presentan los {int} ítems de diagnóstico y ningún otro', (cantidad: number) => {
  const presentados = itemsPresentados().map((item) => item.id);
  const esperados = itemsDeDiagnostico(mundo()).map((item) => item.id);
  assert.equal(
    esperados.length,
    cantidad,
    'El contenido de prueba no tiene los ítems de diagnóstico que dice el escenario',
  );
  assert.deepEqual([...presentados].sort(), [...esperados].sort());
});

Then('cada respuesta se corrige comparándola con la respuesta del contenido', () => {
  const { correcciones } = mundo();
  assert.ok(correcciones.length > 0, 'No se ha corregido ninguna respuesta');
  correcciones.forEach((correccion, posicion) => {
    assert.equal(correccion.recibida, correccion.esperada, `La respuesta ${String(posicion + 1)} se corrigió mal`);
  });
});

Then('el resultado no depende de la confianza que declare', () => {
  // Otra persona hace el mismo diagnóstico declarando la confianza contraria.
  const actual = mundo();
  const otraConfianza = actual.confianza < PORCENTAJE / 2 ? PORCENTAJE : 0;
  const otro = hacerDiagnostico(actual, { persona: 1, confianza: otraConfianza });
  assert.deepEqual(otro, resultadoDelDiagnostico());
});

Then('no se le pide que diga cuánto cree que sabe del dominio ni de ningún objetivo', () => {
  const sesion = presente(mundo().sesion, 'la sesión del diagnóstico');
  assert.ok(
    sesion.elementos.every((elemento) => elemento.tipo === 'item'),
    'El diagnóstico presenta algo que no es un ítem',
  );
  const peticiones = itemsPresentados().flatMap((item) => item.acciones);
  assert.deepEqual(
    peticiones.filter((accion) => /cu[aá]nto|cree|autoeval|sabe/i.test(accion)),
    [],
  );
});

Then('ningún ítem del diagnóstico va precedido de un ejemplo resuelto', () => {
  const sesion = presente(mundo().sesion, 'la sesión del diagnóstico');
  assert.deepEqual(
    sesion.elementos.filter((elemento) => elemento.tipo === 'ejemplo'),
    [],
  );
});

Then('ningún ítem muestra su objetivo ni su categoría', () => {
  const conPista = itemsPresentados().filter((item) => item.objetivo !== undefined || item.categoria !== undefined);
  assert.deepEqual(
    conPista.map((item) => item.id),
    [],
  );
});

Then('su ruta es, en este orden: {ids}', (ruta: string[]) => {
  assert.deepEqual(resultadoDelDiagnostico().ruta, ruta);
});

Then('su ruta no tiene objetivos pendientes', () => {
  assert.deepEqual(resultadoDelDiagnostico().ruta, []);
});

Then('su fase es {texto}', (fase: string) => {
  assert.equal(resultadoDelDiagnostico().fase, fase);
});

Then(
  'su fase es {texto}, porque su acierto en problemas sin pista del tipo es del {fraccion}',
  (fase: string, acierto: number) => {
    assert.equal(resultadoDelDiagnostico().fase, fase);
    esperarCasiIgual(
      resultadoDelDiagnostico().aciertoProblemasSinPista,
      acierto,
      'Acierto en problemas sin pista del tipo',
    );
  },
);

Then('{ids} quedan dominados, con un {fraccion} de acierto cada uno', (objetivos: string[], acierto: number) => {
  const resultado = resultadoDelDiagnostico();
  objetivos.forEach((objetivo) => {
    assert.ok(resultado.objetivosDominados.includes(objetivo), `${objetivo} no figura como dominado`);
    esperarCasiIgual(resultado.aciertoPorObjetivo[objetivo], acierto, `Acierto de ${objetivo} en el diagnóstico`);
  });
});

Then('{objetivo} empieza sin ejemplos resueltos', (objetivo: string) => {
  // Un objetivo con todos los pasos retirados no muestra ejemplos.
  const pasos = mundo()
    .contenido()
    .objetivos.find((candidato) => candidato.id === objetivo)?.ejemplos_resueltos[0]?.pasos;
  assert.equal(progresoDe(mundo(), objetivo).pasosRetirados, presente(pasos, `el ejemplo de ${objetivo}`).length);
});

Then('{objetivo} empieza con la ayuda completa: sus ejemplos resueltos con todos los pasos', (objetivo: string) => {
  const actual = mundo();
  const esperados = actual.contenido().objetivos.find((candidato) => candidato.id === objetivo)
    ?.ejemplos_resueltos[0]?.pasos;
  assert.equal(progresoDe(actual, objetivo).pasosRetirados, 0);
  const sesion = aceptado(actual.aplicacion().iniciarSesion({ dominio: actual.dominio, tipo: 'practica', objetivo }));
  const ejemplo = sesion.elementos.find((elemento) => elemento.tipo === 'ejemplo');
  assert.deepEqual(ejemplo?.tipo === 'ejemplo' ? ejemplo.ejemplo.pasos : undefined, esperados);
});

Then('el resultado muestra su fase y su ruta', () => {
  const resultado = resultadoDelDiagnostico();
  assert.ok(resultado.fase.length > 0 && Array.isArray(resultado.ruta), 'Falta la fase o la ruta');
});

Then('no muestra ninguna estimación de días, semanas, meses, años ni horas hasta la pericia', () => {
  const texto = JSON.stringify(resultadoDelDiagnostico());
  assert.doesNotMatch(texto, /estim|d[ií]as|semanas|meses|años|horas|plazo|tiempo/i);
});

Then('no muestra ninguna fecha prevista para terminar la ruta', () => {
  const texto = JSON.stringify(resultadoDelDiagnostico());
  assert.doesNotMatch(texto, /fecha|prevista|\d{4}-\d{2}-\d{2}/i);
});
