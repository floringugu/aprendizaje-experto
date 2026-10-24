import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Fuente, ItemContenido } from '../../../src/aplicacion/contenido.ts';
import { presente } from '../soporte/comprobar.ts';
import { comoEnDisco, itemAprobado, piezaEnElBorrador, sinPropiedad } from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';

// Pasos de aprobar, corregir, descartar y deshacer en la revisión del material (MATE-4.4 a 4.10, MATE-5).

function aprobar(actual: Mundo, item: string): void {
  aceptado(actual.aplicacion().aprobarPieza({ dominio: actual.dominio, pieza: item }));
}

function descartar(actual: Mundo, item: string): void {
  aceptado(actual.aplicacion().descartarPieza({ dominio: actual.dominio, pieza: item }));
}

/** El ítem del borrador del «Dado», tal como estaba antes de que la persona hiciera nada. */
function itemInicial(actual: Mundo, item: string): ItemContenido {
  return actual.material.piezaInicial(item) as ItemContenido;
}

/** Guarda la pieza corregida y deja lo que respondió la aplicación para los pasos «Entonces». */
function corregir(actual: Mundo, item: string, corregida: object): void {
  actual.ultimoResultado = actual.aplicacion().corregirPieza({ dominio: actual.dominio, pieza: item, corregida });
}

function corregirEnunciado(actual: Mundo, item: string): void {
  corregir(actual, item, { ...itemInicial(actual, item), enunciado: `Enunciado corregido de ${item}` });
  aceptado(presente(actual.ultimoResultado, 'ninguna respuesta al corregir'));
}

function comprobarPendiente(item: string): void {
  assert.ok(piezaEnElBorrador(mundo(), item) !== undefined, `${item} no está en el borrador`);
}

function comprobarFueraDelBorrador(item: string): void {
  assert.equal(piezaEnElBorrador(mundo(), item), undefined, `${item} sigue en el borrador`);
}

function comprobarSinCambios(item: string): void {
  const actual = mundo();
  assert.deepEqual(piezaEnElBorrador(actual, item), comoEnDisco(actual.material.piezaInicial(item)));
}

function aprobadoConFuente(item: string, fuente: Fuente | undefined): void {
  const aprobado = presente(itemAprobado(mundo(), item), `${item} en el contenido aprobado`);
  assert.deepEqual(aprobado.fuente, fuente);
}

// --- MATE-4.4 a 4.8: aprobar, descartar y corregir --------------------------------------------------

When('la persona aprueba {item}', (item: string) => {
  aprobar(mundo(), item);
});

When('la persona descarta {item}', (item: string) => {
  descartar(mundo(), item);
});

When('la persona corrige el enunciado de {item} y guarda la corrección', (item: string) => {
  corregirEnunciado(mundo(), item);
});

When(
  'la persona corrige el fragmento de {item} a {texto} y guarda la corrección',
  (item: string, fragmento: string) => {
    const actual = mundo();
    const inicial = itemInicial(actual, item);
    const fuente = { ...presente(inicial.fuente, `la fuente de ${item}`), fragmento };
    corregir(actual, item, { ...inicial, fuente });
    aceptado(presente(actual.ultimoResultado, 'ninguna respuesta al corregir'));
  },
);

When('la persona borra el feedback de {item} y guarda la corrección', (item: string) => {
  const actual = mundo();
  corregir(actual, item, sinPropiedad(itemInicial(actual, item), 'feedback'));
});

Then('{item} ya no está en contenido\\/borradores\\/ficticio.json', comprobarFueraDelBorrador);
Then('{item} sigue fuera de contenido\\/borradores\\/ficticio.json', comprobarFueraDelBorrador);
Then('{item} sigue pendiente en contenido\\/borradores\\/ficticio.json', comprobarPendiente);
Then('{item} está pendiente en contenido\\/borradores\\/ficticio.json', comprobarPendiente);
Then('{item} sigue en contenido\\/borradores\\/ficticio.json sin cambios', comprobarSinCambios);
Then('{item} está pendiente en contenido\\/borradores\\/ficticio.json tal como estaba antes', comprobarSinCambios);

Then('contenido\\/ficticio.json tiene {item} con la fuente {fuente}', aprobadoConFuente);

Then('contenido\\/ficticio.json tiene {item} sin fuente', (item: string) => {
  aprobadoConFuente(item, undefined);
});

Then('contenido\\/ficticio.json no tiene {item}', (item: string) => {
  assert.equal(itemAprobado(mundo(), item), undefined, `${item} está en el contenido aprobado`);
});

Then('{item} sigue pendiente en contenido\\/borradores\\/ficticio.json, con el enunciado corregido', (item: string) => {
  const pendiente = presente(piezaEnElBorrador(mundo(), item), `${item} en el borrador`) as ItemContenido;
  assert.equal(pendiente.enunciado, `Enunciado corregido de ${item}`);
});

Then('la aplicación no guarda la corrección e indica que falta {falta}', (falta: string) => {
  const resultado = presente(mundo().ultimoResultado, 'ninguna respuesta al corregir');
  assert.ok(!resultado.ok, 'La aplicación guardó la corrección');
  assert.equal(resultado.campo, falta);
});

// --- MATE-4.9 y 4.10: deshacer ------------------------------------------------------------------------

Given('que la persona ha aprobado {ids}', (ids: string[]) => {
  const actual = mundo();
  actual.preparar(() => {
    ids.forEach((item) => {
      aprobar(actual, item);
    });
  });
});

Given('que la persona ha descartado {item}', (item: string) => {
  const actual = mundo();
  actual.preparar(() => {
    descartar(actual, item);
  });
});

Given('que la persona ha corregido el enunciado de {item}', (item: string) => {
  const actual = mundo();
  actual.preparar(() => {
    corregirEnunciado(actual, item);
  });
});

Given('que la persona ha descartado {item} y después ha aprobado {item}', (descartado: string, aprobado: string) => {
  const actual = mundo();
  actual.preparar(() => {
    descartar(actual, descartado);
    aprobar(actual, aprobado);
  });
});

When('pulsa «Deshacer»', () => {
  const actual = mundo();
  aceptado(actual.aplicacion().deshacer({ dominio: actual.dominio }));
});

// --- MATE-5: solo las piezas sin marca se aprueban en bloque -----------------------------------------

Then('la revisión ofrece «Aprobar las {int} sin marca»', (cantidad: number) => {
  assert.ok(cantidad > 0, 'Aprobar en bloque solo se ofrece si hay alguna pieza sin marca');
  assert.equal(presente(mundo().material.revision, 'la revisión del material').aprobablesEnBloque, cantidad);
});

Then('la revisión no ofrece aprobar ninguna pieza en bloque', () => {
  assert.equal(presente(mundo().material.revision, 'la revisión del material').aprobablesEnBloque, 0);
});

When('la persona pulsa «Aprobar las {int} sin marca»', (cantidad: number) => {
  const actual = mundo();
  const app = actual.aplicacion();
  // El botón dice cuántas aprobará: se comprueba antes de pulsarlo (MATE-5.1).
  assert.equal(aceptado(app.abrirRevision({ dominio: actual.dominio })).aprobablesEnBloque, cantidad);
  aceptado(app.aprobarSinMarca({ dominio: actual.dominio }));
});

Then('contenido\\/ficticio.json tiene {ids}, cada uno con su fuente', (ids: string[]) => {
  const actual = mundo();
  ids.forEach((item) => {
    aprobadoConFuente(item, comoEnDisco(itemInicial(actual, item).fuente) as Fuente);
  });
});

Then('contenido\\/borradores\\/ficticio.json sigue teniendo {ids}, pendientes', (ids: string[]) => {
  ids.forEach(comprobarPendiente);
});
