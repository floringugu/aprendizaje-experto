import assert from 'node:assert/strict';
import type { DataTable } from '@cucumber/cucumber';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Fuente } from '../../../src/aplicacion/contenido.ts';
import type { CasosDeMaterial } from '../../../src/aplicacion/material.ts';
import { presente } from '../soporte/comprobar.ts';
import {
  APUNTES,
  PAGINA_CITADA,
  comprobarHoja,
  ejemploDePrueba,
  fuenteDeLosApuntes,
  idsDeLaRevision,
  itemDePrueba,
  reservadoEnLaRevision,
} from '../soporte/escenario-material.ts';
import type { Revision } from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { leerFuente } from '../soporte/tipos-de-parametro.ts';
import type { PasosYFuente } from '../soporte/tipos-de-parametro.ts';

// Pasos del borrador que ya estaba en el disco y de las marcas y la revisión (MATE-3, MATE-4.1 a 4.3).

type FiltroRevision = NonNullable<Parameters<CasosDeMaterial['abrirRevision']>[0]['filtro']>;

/**
 * Lo que dice la pantalla → la marca que devuelve la aplicación (MATE-3). Son textos y no `Marca`: así los
 * steps no dependen de que el tipo ya declare `un_solo_paso` (MATE-3.5).
 */
const MARCAS: Readonly<Record<string, string>> = {
  'No está en tu material': 'sin_fuente',
  'Cita no encontrada': 'cita_no_encontrada',
  'Un solo paso': 'un_solo_paso',
};

/** Lo que dice el filtro de la revisión → el filtro que recibe la aplicación (MATE-4.2). */
const FILTROS: Readonly<Record<string, FiltroRevision>> = {
  Pendientes: 'pendientes',
  'No está en tu material': 'sin_fuente',
  'Cita no encontrada': 'cita_no_encontrada',
};

/** «Reservado» no es una marca de la aplicación: la revisión lo da en un campo propio de la pieza (MATE-4.12). */
const RESERVADO = 'Reservado';

function aMarca(texto: string): string {
  return presente(MARCAS[texto], `la marca «${texto}»`);
}

/** Pone un ítem pendiente en el borrador que estaba en el disco antes de que la persona hiciera nada. */
function dejarEnElBorrador(item: string, objetivo: string, fuente?: Fuente): void {
  const actual = mundo();
  actual.material.agregarAlBorrador(actual, itemDePrueba(item, objetivo, fuente));
}

function abrirLaRevision(actual: Mundo, dominio: string, filtro?: FiltroRevision): Revision {
  const peticion = filtro === undefined ? { dominio } : { dominio, filtro };
  const revision = aceptado(actual.aplicacion().abrirRevision(peticion));
  actual.material.revision = revision;
  return revision;
}

function revisionAbierta(): Revision {
  return presente(mundo().material.revision, 'la revisión del material');
}

function marcasDe(revision: Revision, item: string): readonly string[] {
  const piezas = revision.grupos.flatMap((grupo) => grupo.piezas);
  return presente(
    piezas.find((pendiente) => pendiente.id === item),
    `${item} en la revisión`,
  ).marcas;
}

// --- El borrador del «Dado» -------------------------------------------------------------------------

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, sin fuente',
  (item: string, objetivo: string) => {
    dejarEnElBorrador(item, objetivo);
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, con la fuente {fuente}',
  (item: string, objetivo: string, fuente: Fuente) => {
    dejarEnElBorrador(item, objetivo, fuente);
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, que cita de esa página {texto}',
  (item: string, objetivo: string, fragmento: string) => {
    dejarEnElBorrador(item, objetivo, fuenteDeLosApuntes(fragmento));
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, que cita esa frase de {texto}',
  (item: string, objetivo: string, url: string) => {
    const fuente = { documento: url, lugar: 'página web', fragmento: mundo().material.fraseWeb };
    dejarEnElBorrador(item, objetivo, fuente);
  },
);

/** Un ítem pendiente que cita la frase de los antecedentes, sin marcas (MATE-2.4, MATE-4.1). */
function dejarPendiente(item: string, objetivo: string): void {
  dejarEnElBorrador(item, objetivo, fuenteDeLosApuntes(mundo().material.frase));
}

Given('que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, pendiente', dejarPendiente);

/**
 * El ítem pendiente, sin marcas, que está o no marcado como reservado (MATE-4.12). Sustituye al de los
 * antecedentes de MATE-4, que tiene el mismo id.
 */
function dejarPendienteReservado(item: string, objetivo: string, reservado: boolean): void {
  const actual = mundo();
  const { borrador } = actual.material;
  borrador.items = borrador.items.filter((candidato) => candidato.id !== item);
  const fuente = fuenteDeLosApuntes(actual.material.frase);
  actual.material.agregarAlBorrador(actual, { ...itemDePrueba(item, objetivo, fuente), reservado });
}

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, pendiente y marcado como reservado',
  (item: string, objetivo: string) => {
    dejarPendienteReservado(item, objetivo, true);
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ítem {item} de {objetivo}, pendiente y sin marcar',
  (item: string, objetivo: string) => {
    dejarPendienteReservado(item, objetivo, false);
  },
);
Given(
  'que contenido\\/borradores\\/ficticio.json tiene también el ítem {item} de {objetivo}, pendiente',
  dejarPendiente,
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene estos ítems pendientes de {objetivo}:',
  (objetivo: string, tabla: DataTable) => {
    tabla.hashes().forEach((fila) => {
      dejarEnElBorrador(presente(fila['ítem'], 'la columna «ítem»'), objetivo, leerFuente(fila['fuente'] ?? ''));
    });
  },
);

// --- MATE-3: las marcas las pone la aplicación ------------------------------------------------------

Given(
  'que en la página 12 de «apuntes.pdf» la frase {texto} está partida en dos líneas después de {texto}',
  (frase: string, corte: string) => {
    const { material } = mundo();
    assert.equal(frase, material.frase);
    const fin = frase.indexOf(corte) + corte.length;
    assert.ok(fin >= corte.length, `«${corte}» no está en la frase`);
    material.lineasDeLaFrase = [frase.slice(0, fin), frase.slice(fin).trimStart()];
  },
);

Given(
  'que en la página 12 de «apuntes.pdf» la palabra {texto} está partida a final de línea en {textos}',
  (palabra: string, trozos: string[]) => {
    const { material } = mundo();
    const [inicio = '', fin = ''] = trozos;
    // «tam-» y «bién» son «también» partida con guion: el guion queda al final de la primera línea.
    assert.equal(`${inicio.replace(/-$/, '')}${fin}`, palabra);
    const posicion = material.frase.indexOf(palabra);
    assert.ok(posicion >= 0, `«${palabra}» no está en la frase`);
    material.lineasDeLaFrase = [
      `${material.frase.slice(0, posicion)}${inicio}`,
      `${fin}${material.frase.slice(posicion + palabra.length)}`,
    ];
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene el ejemplo resuelto {item} de {objetivo}, con {pasos_y_fuente}',
  (ejemplo: string, objetivo: string, { cantidad, fuente }: PasosYFuente) => {
    const actual = mundo();
    const { material } = actual;
    const pasos = Array.from({ length: cantidad }, (_, posicion) => `P${String(posicion + 1)}`);
    material.ejemplosSueltos = [...material.ejemplosSueltos, { ...ejemploDePrueba(ejemplo, objetivo, fuente), pasos }];
    material.dejarBorrador(actual);
  },
);

When('la persona abre la revisión del material de {texto}', (dominio: string) => {
  abrirLaRevision(mundo(), dominio);
});

function tieneLaMarca(item: string, marca: string): boolean {
  const revision = revisionAbierta();
  return marca === RESERVADO ? reservadoEnLaRevision(revision, item) : marcasDe(revision, item).includes(aMarca(marca));
}

Then('{item} tiene la marca {texto}', (item: string, marca: string) => {
  assert.ok(tieneLaMarca(item, marca), `${item} no tiene la marca «${marca}»`);
});

Then('{item} no tiene la marca {texto}', (item: string, marca: string) => {
  assert.ok(!tieneLaMarca(item, marca), `${item} tiene la marca «${marca}»`);
});

Then('{item} no tiene ninguna marca', (item: string) => {
  assert.deepEqual(marcasDe(revisionAbierta(), item), []);
});

Then('{item} ya no tiene la marca {texto}', (item: string, marca: string) => {
  // Las marcas se vuelven a calcular al corregir: se mira la revisión tal como está ahora (MATE-4.7).
  const actual = mundo();
  const revision = abrirLaRevision(actual, actual.dominio);
  assert.ok(!marcasDe(revision, item).includes(aMarca(marca)), `${item} sigue con la marca «${marca}»`);
});

// --- MATE-4.1 a 4.3: la revisión, por objetivo, con filtros y «Ver fuente» ---------------------------

Then('ve {ids} bajo {objetivo}', (ids: string[], objetivo: string) => {
  const grupo = presente(
    revisionAbierta().grupos.find((candidato) => candidato.objetivo === objetivo),
    `el grupo de ${objetivo} en la revisión`,
  );
  assert.deepEqual(
    grupo.piezas.map((pendiente) => pendiente.id),
    ids,
  );
});

When('la persona elige el filtro {texto} en la revisión del material de {texto}', (filtro: string, dominio: string) => {
  abrirLaRevision(mundo(), dominio, presente(FILTROS[filtro], `el filtro «${filtro}»`));
});

Then('ve solo {ids}', (ids: string[]) => {
  assert.deepEqual(idsDeLaRevision(revisionAbierta()), ids);
});

When('la persona abre «Ver fuente» de {item}', (item: string) => {
  const actual = mundo();
  actual.material.fuenteAbierta = aceptado(actual.aplicacion().verFuente({ dominio: actual.dominio, pieza: item }));
});

Then(
  'se abre una hoja con el fragmento {texto} dentro del texto de la página {int} de {texto}',
  (fragmento: string, pagina: number, documento: string) => {
    const actual = mundo();
    assert.equal(pagina, PAGINA_CITADA);
    assert.equal(documento, APUNTES);
    comprobarHoja(actual, presente(actual.material.fuenteAbierta, 'la hoja de «Ver fuente»'), fragmento);
  },
);
