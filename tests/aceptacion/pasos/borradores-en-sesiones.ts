import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Fuente, ItemContenido } from '../../../src/aplicacion/contenido.ts';
import type { Sesion } from '../../../src/aplicacion/sesiones.ts';
import {
  aFase,
  dominarObjetivo,
  llegarAFase,
  progresoCompleto,
  responder,
  siguienteRepaso,
} from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import {
  APUNTES,
  PAGINA_CITADA,
  comprobarHoja,
  ejemploDePrueba,
  fuenteDeLosApuntes,
  itemDePrueba,
  objetivoDePrueba,
  tareaDePrueba,
} from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { ejemplosDe, iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos de lo que pasa en las sesiones con el borrador y con lo aprobado (MATE-6, MATE-7). Los comparten
// MATE-6.1, PLAN-4.1, MAST-7.4 e INTE-6.1 (ticket mate-sesiones-a-plan-inte).

/**
 * La persona del escenario ya hizo el diagnóstico al prepararlo; quien hace el diagnóstico en MATE-6.1
 * es una persona que abre el dominio por primera vez.
 */
const PERSONA_SIN_DIAGNOSTICO = 1;
/** Cuántas tareas pide como mucho la persona al pedirlas una a una, por si la aplicación nunca dice que no quedan. */
const MAXIMO_DE_TAREAS = 20;
/**
 * El ítem aprobado que se parece a I9 del borrador: así cada sesión tiene algo que presentar (MATE-6.1,
 * PLAN-4.1, MAST-7.4, INTE-6.1).
 */
const PARECIDO_A_I9 = 'I20';

function anotarVistos(ids: readonly string[]): void {
  mundo().material.vistos = ids;
}

function anotarItemsDe(sesion: Sesion): void {
  anotarVistos(itemsDe(sesion).map((item) => item.id));
}

/** Inicia una sesión del tipo indicado, que no es de práctica, a la hora que marca el reloj de prueba. */
function iniciarSesion(actual: Mundo, tipo: 'repaso' | 'retencion', objetivo?: string): Sesion {
  const peticion =
    objetivo === undefined ? { dominio: actual.dominio, tipo } : { dominio: actual.dominio, tipo, objetivo };
  return aceptado(actual.aplicacion().iniciarSesion(peticion));
}

/** La primera prueba de retención programada para el objetivo; falla el paso si no hay ninguna. */
function primeraRetencion(actual: Mundo, objetivo: string): Date {
  const repasos = aceptado(actual.aplicacion().consultarRepasos({ dominio: actual.dominio }));
  return presente(
    repasos.find((repaso) => repaso.clase === 'retencion' && repaso.objetivo === objetivo),
    `ninguna prueba de retención de ${objetivo}`,
  ).fecha;
}

function comprobarNoVisto(id: string): void {
  const { vistos } = mundo().material;
  assert.notEqual(vistos.length, 0, 'No se le presentó nada a la persona');
  assert.ok(!vistos.includes(id), `Se le presentó ${id}`);
}

// --- MATE-6: un borrador nunca aparece en una sesión ---------------------------------------------------

Given(
  'que contenido\\/borradores\\/ficticio.json tiene, sin aprobar, el objetivo O4, el ejemplo resuelto E9 de O1, la tarea T9 y el ítem I9 de O1',
  () => {
    const actual = mundo();
    const { material } = actual;
    const fuente = fuenteDeLosApuntes(material.frase);
    material.borrador.objetivos = [objetivoDePrueba('O4', fuente)];
    material.borrador.tareas = [tareaDePrueba('T9', fuente)];
    material.ejemplosSueltos = [ejemploDePrueba('E9', 'O1', fuente)];
    material.agregarAlBorrador(actual, itemDePrueba('I9', 'O1', fuente));
    // Los antecedentes de MAST-7.4 dan 20 ítems por objetivo (I1 a I60): I9 e I20 ya son ítems aprobados de
    // O1 y la prueba de retención los presentaría. Se les da otro id, si existen (como MAST-1.4).
    actual.contenido().liberarId('I9');
    actual.contenido().liberarId(PARECIDO_A_I9);
    // Lo aprobado tiene ítems en cada objetivo y una tarea, para que cada sesión tenga algo que presentar.
    actual.contenido().asegurarItemsPorObjetivo(1);
    actual.contenido().asegurarTarea('T1');
  },
);

Given('que I9 es de tipo «problema», está marcado para el diagnóstico y es de una categoría intercalable', () => {
  const actual = mundo();
  const contenido = actual.contenido();
  contenido.hacerIntercalables(2);
  const comoI9: Partial<ItemContenido> = { tipo: 'problema', diagnostico: true, categoria: 'C1' };
  contenido.agregarItem({ ...comoI9, id: PARECIDO_A_I9, objetivo: 'O1' });
  // Las categorías son las aprobadas: copiarlas al borrador repetiría sus ids y la revisión lo rechazaría.
  const { borrador } = actual.material;
  borrador.items = borrador.items.map((item) => (item.id === 'I9' ? { ...item, ...comoI9 } : item));
});

When('la persona hace el diagnóstico de {texto}', (dominio: string) => {
  const app = mundo().aplicacion(PERSONA_SIN_DIAGNOSTICO);
  const apertura = aceptado(app.abrirDominio({ dominio }));
  anotarItemsDe(presente(apertura.diagnostico, 'la sesión del diagnóstico'));
});

When('la persona hace una sesión de práctica de {objetivo}', (objetivo: string) => {
  anotarItemsDe(iniciarSesionDePractica(mundo(), { objetivo }));
});

When('la persona hace los repasos del día', () => {
  const actual = mundo();
  responder(actual, { item: PARECIDO_A_I9, correcta: true });
  actual.reloj.fijar(siguienteRepaso(actual, PARECIDO_A_I9));
  anotarItemsDe(iniciarSesion(actual, 'repaso'));
});

When('la persona hace una prueba de retención de {objetivo}', (objetivo: string) => {
  const actual = mundo();
  dominarObjetivo(actual, objetivo);
  actual.reloj.fijar(primeraRetencion(actual, objetivo));
  anotarItemsDe(iniciarSesion(actual, 'retencion', objetivo));
});

When('la persona hace una sesión intercalada', () => {
  anotarItemsDe(iniciarSesionDePractica(mundo(), { grupo: 'G1' }));
});

Then('no se le presenta {item}', comprobarNoVisto);

When('la persona estudia los ejemplos resueltos de {objetivo}', (objetivo: string) => {
  const sesion = iniciarSesionDePractica(mundo(), { objetivo });
  anotarVistos(ejemplosDe(sesion).map((ejemplo) => ejemplo.id));
});

Then('no se le muestra {item}', comprobarNoVisto);

When('pide tareas de práctica hasta que no quedan más', () => {
  const actual = mundo();
  const pedidas: string[] = [];
  for (let vez = 0; vez < MAXIMO_DE_TAREAS; vez += 1) {
    const pedida = actual.aplicacion().pedirTarea({ dominio: actual.dominio });
    // Cuando no quedan más, la aplicación dice que no o vuelve a presentar una que ya presentó.
    if (!pedida.ok || pedidas.includes(pedida.valor.tarea)) {
      break;
    }
    pedidas.push(pedida.valor.tarea);
  }
  anotarVistos(pedidas);
});

Then('ninguna de ellas es {tarea}', comprobarNoVisto);

Given('que la persona está en la fase {texto} con O1 y O2 dominados', (textoFase: string) => {
  const actual = mundo();
  actual.contenido().asegurarItemsPorObjetivo(1);
  actual.preparar(() => {
    llegarAFase(actual, aFase(textoFase));
    dominarObjetivo(actual, 'O1');
    dominarObjetivo(actual, 'O2');
  });
});

Then('{objetivo} no figura entre los objetivos de la ruta', (objetivo: string) => {
  const progreso = progresoCompleto(mundo());
  assert.ok(!progreso.ruta.includes(objetivo), `${objetivo} está en la ruta`);
  assert.ok(
    !progreso.objetivos.some((candidato) => candidato.objetivo === objetivo),
    `${objetivo} cuenta en el progreso`,
  );
});

Then('{item} está en la cola de práctica de {objetivo}', (item: string, objetivo: string) => {
  const sesion = iniciarSesionDePractica(mundo(), { objetivo });
  assert.ok(
    itemsDe(sesion).some((presentado) => presentado.id === item),
    `${item} no está en la práctica de ${objetivo}`,
  );
});

// --- MATE-7: lo aprobado conserva su fuente, y la fuente no adelanta la respuesta ---------------------

function fuenteAprobada(actual: Mundo, item: string): Fuente {
  return presente(actual.contenido().item(item).fuente, `la fuente de ${item}`);
}

function intentarVerFuente(actual: Mundo): ReturnType<ReturnType<Mundo['aplicacion']>['verFuente']> {
  const presentado = presente(actual.presentado, 'el ítem presentado');
  return actual.aplicacion().verFuente({ dominio: actual.dominio, pieza: presentado.id });
}

Given(
  'que contenido\\/ficticio.json tiene el ítem {item} de {objetivo}, aprobado con la fuente {fuente}',
  (item: string, objetivo: string, fuente: Fuente) => {
    mundo().contenido().agregarItem({ id: item, objetivo, fuente });
  },
);

Given(
  'que contenido\\/ficticio.json tiene el ítem {item} de {objetivo}, escrito a mano y sin fuente',
  (item: string, objetivo: string) => {
    const escrito = mundo().contenido().asegurarItem(item, objetivo);
    assert.equal(escrito.fuente, undefined);
  },
);

When('se le presenta {item} a la persona en una sesión de práctica', (item: string) => {
  const actual = mundo();
  actual.presentado = aceptado(
    actual.aplicacion().presentarItem({ dominio: actual.dominio, item, contexto: 'practica' }),
  );
});

When('se le presenta {item} a la persona en una sesión de práctica y responde', (item: string) => {
  responder(mundo(), { item, correcta: true });
});

Then('no hay «Ver fuente» mientras no haya respondido', () => {
  const actual = mundo();
  const presentado = presente(actual.presentado, 'el ítem presentado');
  assert.ok(!presentado.acciones.some((accion) => /fuente/i.test(accion)), 'La persona puede ver la fuente');
  assert.ok(!intentarVerFuente(actual).ok, 'La aplicación enseña la fuente antes de que la persona responda');
});

Then('ve el feedback de {item}', (item: string) => {
  const actual = mundo();
  assert.equal(presente(actual.feedback, 'el feedback').explicacion, actual.contenido().item(item).feedback);
});

Then(
  '«Ver fuente» abre la hoja con el fragmento dentro del texto de la página {int} de {texto}',
  (pagina: number, documento: string) => {
    const actual = mundo();
    assert.equal(pagina, PAGINA_CITADA);
    assert.equal(documento, APUNTES);
    const presentado = presente(actual.presentado, 'el ítem presentado');
    comprobarHoja(actual, aceptado(intentarVerFuente(actual)), fuenteAprobada(actual, presentado.id).fragmento);
  },
);

Then('no hay «Ver fuente»', () => {
  assert.ok(!intentarVerFuente(mundo()).ok, 'La aplicación ofrece «Ver fuente» de un ítem sin fuente');
});
