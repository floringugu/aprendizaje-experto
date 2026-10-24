import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Fuente } from '../../../src/aplicacion/contenido.ts';
import type { BorradorDominio } from '../../../src/aplicacion/material.ts';
import { presente } from '../soporte/comprobar.ts';
import {
  APUNTES,
  aprobadoEnDisco,
  borradorEnDisco,
  categoriaDePrueba,
  comoEnDisco,
  ejemploDePrueba,
  entregaDeLaIa,
  fuenteDeLosApuntes,
  idsDe,
  idsDeLaRevision,
  itemAprobado,
  itemDePrueba,
  listaDeMaterial,
  objetivoDePrueba,
  redactar,
  sinPropiedad,
  tareaDePrueba,
} from '../soporte/escenario-material.ts';
import type { Pieza } from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import { pdfDePrueba } from '../soporte/pdf.ts';

// Pasos de los borradores que redacta la IA a partir del material (MATE-2).

// --- MATE-2: la IA redacta borradores en un fichero aparte ----------------------------------------

/** Las piezas que entrega la IA en MATE-2.1, cada una con su fuente. */
function piezaRedactada(pieza: string, fuente: Fuente): Partial<Record<keyof BorradorDominio, unknown>> {
  const piezas: Readonly<Record<string, Partial<Record<keyof BorradorDominio, unknown>>>> = {
    'un objetivo': { objetivos: [objetivoDePrueba('O4', fuente)] },
    'un ejemplo resuelto de O1': { ejemplos_resueltos: [ejemploDePrueba('E9', 'O1', fuente)] },
    'un ítem de O1': { items: [itemDePrueba('I7', 'O1', fuente)] },
    'una tarea con rúbrica': { tareas: [tareaDePrueba('T9', fuente)] },
    'una categoría': { categorias: [categoriaDePrueba('C4', fuente)] },
  };
  return presente(piezas[pieza], `la pieza «${pieza}»`);
}

/** Las piezas del borrador que son del tipo que dice el escenario (MATE-2.1). */
function piezasDelTipo(borrador: BorradorDominio, pieza: string): readonly Pieza[] {
  const delTipo: Readonly<Record<string, readonly Pieza[]>> = {
    'un objetivo': borrador.objetivos,
    'un ejemplo resuelto de O1': (borrador.ejemplos_resueltos ?? []).filter((ejemplo) => ejemplo.objetivo === 'O1'),
    'un ítem de O1': borrador.items.filter((item) => item.objetivo === 'O1'),
    'una tarea con rúbrica': borrador.tareas.filter((tarea) => tarea.rubrica.length > 0),
    'una categoría': borrador.categorias,
  };
  return presente(delTipo[pieza], `la pieza «${pieza}»`);
}

/** Las piezas que no cumplen el formato del contenido en MATE-2.3. */
function piezaIncompleta(pieza: string, fuente: Fuente): Partial<Record<keyof BorradorDominio, unknown>> {
  const tarea = tareaDePrueba('T9', fuente);
  const [criterio] = tarea.rubrica;
  const nivelesSinDescriptor = (criterio?.niveles ?? []).map((nivel, posicion) =>
    posicion === 0 ? sinPropiedad(nivel, 'descriptor') : nivel,
  );
  const objetivo = objetivoDePrueba('O4', fuente);
  const piezas: Readonly<Record<string, Partial<Record<keyof BorradorDominio, unknown>>>> = {
    'un ítem de O1 sin respuesta': { items: [sinPropiedad(itemDePrueba('I9', 'O1', fuente), 'respuesta')] },
    'un ítem de O1 sin feedback': { items: [sinPropiedad(itemDePrueba('I9', 'O1', fuente), 'feedback')] },
    'un ejemplo resuelto de O1 sin pasos': { ejemplos_resueltos: [{ id: 'E9', objetivo: 'O1', fuente }] },
    'una tarea sin rúbrica': { tareas: [sinPropiedad(tarea, 'rubrica')] },
    'una tarea con un nivel de la rúbrica sin descriptor': {
      tareas: [{ ...tarea, rubrica: [{ criterio: 'Planteamiento', niveles: nivelesSinDescriptor }] }],
    },
    'un objetivo sin instrucción': { objetivos: [sinPropiedad(objetivo, 'instruccion')] },
    'una categoría sin descripción': { categorias: [sinPropiedad(categoriaDePrueba('C4', fuente), 'descripcion')] },
  };
  return presente(piezas[pieza], `la pieza «${pieza}»`);
}

When(
  'la IA configurada redacta a partir de {texto} un borrador con {pieza_redactada}, que cita la página {int}',
  async (documento: string, pieza: string, pagina: number) => {
    const actual = mundo();
    const fuente = { documento, lugar: `página ${String(pagina)}`, fragmento: actual.material.frase };
    actual.externos.ia.respuesta = entregaDeLaIa(actual, piezaRedactada(pieza, fuente));
    await redactar(actual, documento);
  },
);

When(
  'la IA configurada entrega un borrador con un ítem de {objetivo} cuyo id es {item}',
  async (objetivo: string, item: string) => {
    const actual = mundo();
    const fuente = fuenteDeLosApuntes(actual.material.frase);
    actual.externos.ia.respuesta = entregaDeLaIa(actual, { items: [itemDePrueba(item, objetivo, fuente)] });
    await redactar(actual, APUNTES);
  },
);

When('la IA configurada entrega un borrador con un ítem de O1 completo y {pieza_incompleta}', async (pieza: string) => {
  const actual = mundo();
  const fuente = fuenteDeLosApuntes(actual.material.frase);
  const incompleta = piezaIncompleta(pieza, fuente);
  const items = [itemDePrueba('I8', 'O1', fuente), ...((incompleta.items as unknown[] | undefined) ?? [])];
  actual.externos.ia.respuesta = entregaDeLaIa(actual, { ...incompleta, items });
  await redactar(actual, APUNTES);
});

Then(
  'contenido\\/borradores\\/ficticio.json tiene {pieza_redactada} con la fuente {fuente}',
  (pieza: string, fuente: Fuente) => {
    const actual = mundo();
    aceptado(presente(actual.material.redaccion, 'ningún borrador redactado'));
    const candidatas = piezasDelTipo(borradorEnDisco(actual), pieza);
    assert.ok(
      candidatas.some((candidata) => isDeepStrictEqual(candidata.fuente, fuente)),
      `El borrador no tiene ${pieza} con esa fuente`,
    );
  },
);

Then('contenido\\/ficticio.json no cambia', () => {
  const actual = mundo();
  assert.deepEqual(aprobadoEnDisco(actual), comoEnDisco(actual.contenido().toContenido()));
});

Given('que contenido\\/ficticio.json tiene el ítem {item} de {objetivo}', (item: string, objetivo: string) => {
  mundo().contenido().agregarItem({ id: item, objetivo });
});

Then('ningún id de contenido\\/borradores\\/ficticio.json está también en contenido\\/ficticio.json', () => {
  const actual = mundo();
  const delBorrador = idsDe(borradorEnDisco(actual));
  assert.notEqual(delBorrador.length, 0, 'El borrador está vacío');
  const aprobados = new Set(idsDe(aprobadoEnDisco(actual)));
  assert.deepEqual(
    delBorrador.filter((id) => aprobados.has(id)),
    [],
  );
});

Then('el ítem {item} de contenido\\/ficticio.json no cambia', (item: string) => {
  const actual = mundo();
  assert.deepEqual(itemAprobado(actual, item), comoEnDisco(actual.contenido().item(item)));
});

Then('contenido\\/borradores\\/ficticio.json tiene ese ítem de O1 y ninguna otra pieza', () => {
  assert.deepEqual(idsDe(borradorEnDisco(mundo())), ['I8']);
});

Given('que no hay ninguna IA configurada', () => {
  mundo().externos.iaConfigurada = false;
});

When('la persona pide un borrador a partir de {texto}', async (documento: string) => {
  await redactar(mundo(), documento);
});

Then('la aplicación no redacta ningún borrador e indica que hay que configurar una IA en Ajustes', () => {
  const actual = mundo();
  const resultado = presente(actual.material.redaccion, 'ninguna respuesta al pedir el borrador');
  assert.ok(!resultado.ok, 'La aplicación redactó un borrador');
  assert.equal(resultado.causa, 'sin_ia');
  assert.deepEqual(actual.externos.ia.documentosPedidos, []);
  assert.deepEqual(borradorEnDisco(actual), comoEnDisco(actual.material.borradorInicial()));
});

Then('la persona sigue pudiendo añadir material y revisar {item}', async (item: string) => {
  const actual = mundo();
  const app = actual.aplicacion();
  const bytes = pdfDePrueba([['Contenido de tema1.pdf']]);
  aceptado(await app.anadirMaterial({ dominio: actual.dominio, nombre: 'tema1.pdf', bytes }));
  assert.ok(listaDeMaterial(actual).includes('tema1.pdf'), 'tema1.pdf no está en la lista de material');
  const revision = aceptado(app.abrirRevision({ dominio: actual.dominio }));
  assert.ok(idsDeLaRevision(revision).includes(item), `${item} no está en la revisión`);
});
