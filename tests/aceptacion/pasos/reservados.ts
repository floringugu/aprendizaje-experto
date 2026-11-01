import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { presente } from '../soporte/comprobar.ts';
import type { ItemDePrueba } from '../soporte/contenido.ts';
import {
  APUNTES,
  avisosDeLaRevision,
  borradorEnDisco,
  entregaDeLaIa,
  fuenteDeLosApuntes,
  idsDe,
  itemDePrueba,
  pedirMasReservados,
  piezaEnElBorrador,
  redactar,
} from '../soporte/escenario-material.ts';
import type { AvisoDeReservados, Revision } from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import { comprobarApartadas, entregar } from './redaccion-rechazos.ts';

// Pasos de los problemas reservados en el material: lo que marca la IA, lo que se le pide al pedir más y
// lo que avisa la revisión (MATE-2.8 a 2.11, MATE-3.6, MATE-3.7). La marca «Reservado» al corregir
// (MATE-4.12) va con los pasos de la revisión (`revision.ts`) y los de corregir (`aprobacion.ts`).

/** El ítem de O1 que la IA entrega completo en estos escenarios, y el que está de más (MATE-2.9, MATE-2.11). */
const COMPLETO = 'I8';
const DE_MAS = 'I9';

function itemDeLaIa(id: string, extra: Partial<ItemDePrueba> = {}): ItemDePrueba {
  return { ...itemDePrueba(id, 'O1', fuenteDeLosApuntes(mundo().material.frase)), ...extra };
}

// --- MATE-2.8 y 2.9: lo que la IA marca como reservado ---------------------------------------------------

When('la IA configurada entrega un borrador con un ítem de O1 completo y marcado como reservado', async () => {
  const actual = mundo();
  actual.externos.ia.respuesta = entregaDeLaIa(actual, { items: [itemDeLaIa(COMPLETO, { reservado: true })] });
  await redactar(actual, APUNTES);
});

Then('contenido\\/borradores\\/ficticio.json tiene ese ítem de O1 con «reservado» a verdadero', () => {
  const actual = mundo();
  aceptado(presente(actual.material.redaccion, 'ningún borrador redactado'));
  const item = presente(piezaEnElBorrador(actual, COMPLETO), `${COMPLETO} en el borrador`) as ItemDePrueba;
  assert.equal(item.reservado, true);
});

When(
  'la IA configurada entrega un borrador con un ítem de O1 completo y un ítem de O1 con «reservado» igual a {texto}',
  async (valor: string) => {
    const noEsBooleano = { ...itemDeLaIa(DE_MAS), reservado: valor };
    await entregar({ items: [noEsBooleano] });
  },
);

Then(
  'la aplicación indica que ha apartado {int} pieza porque su «reservado» no es verdadero ni falso',
  (cantidad: number) => {
    comprobarApartadas(cantidad, 'reservado');
  },
);

// --- MATE-2.10 y 2.11: pedir más reservados de un objetivo -----------------------------------------------

Given('que contenido\\/ficticio.json tiene los ítems {ids} de {objetivo}', (ids: string[], objetivo: string) => {
  ids.forEach((id) => {
    mundo().contenido().agregarItem({ id, objetivo });
  });
});

When(
  'la persona pide más problemas reservados de {objetivo} a partir de {texto}',
  async (objetivo: string, documento: string) => {
    const actual = mundo();
    actual.externos.ia.respuesta = entregaDeLaIa(actual, {});
    await pedirMasReservados(actual, objetivo, documento);
  },
);

/** Lo que la aplicación le pidió a la IA con la última petición: solo viene al pedir reservados. */
function reservadosPedidos(): { readonly objetivo: string; readonly enunciados: readonly string[] } {
  const peticion = presente(mundo().externos.ia.peticiones.at(-1), 'ninguna petición a la IA');
  return presente(peticion.reservadosDe, 'una petición de reservados a la IA');
}

Then('la petición a la IA pide solo ítems reservados de {objetivo}', (objetivo: string) => {
  assert.equal(reservadosPedidos().objetivo, objetivo);
});

Then('la petición incluye los enunciados de {ids}', (ids: string[]) => {
  const contenido = mundo().contenido();
  const esperados = ids.map((id) => contenido.item(id).enunciado);
  // El objetivo no tiene más ítems que estos, aprobados ni pendientes: la petición lleva justo sus enunciados.
  assert.deepEqual([...reservadosPedidos().enunciados].sort(), esperados.sort());
});

Given('que la persona pidió más problemas reservados de {objetivo}', (objetivo: string) => {
  mundo().material.reservadosDe = objetivo;
});

When(
  'la IA configurada entrega un ítem de O1 completo y reservado, y otro completo sin marcar como reservado',
  async () => {
    const actual = mundo();
    const objetivo = presente(actual.material.reservadosDe, 'el objetivo del que se pidieron reservados');
    const items = [itemDeLaIa(COMPLETO, { reservado: true }), itemDeLaIa(DE_MAS)];
    actual.externos.ia.respuesta = entregaDeLaIa(actual, { items });
    await pedirMasReservados(actual, objetivo, APUNTES);
  },
);

Then('contenido\\/borradores\\/ficticio.json tiene el ítem reservado y ninguna otra pieza', () => {
  const actual = mundo();
  aceptado(presente(actual.material.redaccion, 'ningún borrador redactado'));
  assert.deepEqual(idsDe(borradorEnDisco(actual)), [COMPLETO]);
});

Then('la aplicación indica que ha apartado {int} pieza porque no es reservado', (cantidad: number) => {
  comprobarApartadas(cantidad, 'reservado');
});

// --- MATE-3.6: una categoría con grupo sin reservados en un objetivo -------------------------------------

Given('que C1 es de un grupo de parecidas y C5 no tiene grupo', () => {
  // C2 comparte grupo con C1 y no tiene problemas en O1: no debe llevar aviso.
  const delGrupo = ['C1', 'C2'].map((id) => ({ id, descripcion: `Descripción de ${id}`, grupo_parecidas: 'G1' }));
  mundo()
    .contenido()
    .fijarCategorias([...delGrupo, { id: 'C5', descripcion: 'Descripción de C5' }]);
});

/** Lo que dice el «Dado» de los problemas de O1 → las categorías cuyo problema es reservado. */
const RESERVADOS_EN_O1: Readonly<Record<string, readonly string[]>> = {
  'ninguno de ellos reservado': [],
  'el de C1 reservado': ['C1'],
  'solo el de C5 reservado': ['C5'],
};

for (const [frase, reservadas] of Object.entries(RESERVADOS_EN_O1)) {
  Given(`que contenido\\/ficticio.json tiene en O1 problemas de C1 y de C5, ${frase}`, () => {
    const contenido = mundo().contenido();
    [
      { id: 'I1', categoria: 'C1' },
      { id: 'I2', categoria: 'C5' },
    ].forEach(({ id, categoria }) => {
      const reservado = reservadas.includes(categoria);
      contenido.agregarItem({ id, objetivo: 'O1', tipo: 'problema', categoria, reservado });
    });
  });
}

function revisionAbierta(): Revision {
  return presente(mundo().material.revision, 'la revisión del material');
}

/** Las categorías de las que avisa la revisión bajo el objetivo: sin ningún problema reservado (MATE-3.6). */
function categoriasSinReservado(objetivo: string): readonly string[] {
  return avisosDeLaRevision(revisionAbierta()).flatMap((aviso) =>
    aviso.tipo === 'categoria_sin_reservado' && aviso.objetivo === objetivo ? [aviso.categoria] : [],
  );
}

Then('bajo {objetivo} ve el aviso {texto}', (objetivo: string, texto: string) => {
  const dicho = /^(C\d+) no tiene ningún problema reservado$/.exec(texto);
  const categoria = presente(dicho?.[1], `una categoría en «${texto}»`);
  // Solo C1 tiene grupo y problemas en O1: C2 (con grupo y sin problemas) y C5 (sin grupo) no llevan aviso.
  assert.deepEqual(categoriasSinReservado(objetivo), [categoria]);
});

Then('bajo {objetivo} no ve ningún aviso de problemas reservados', (objetivo: string) => {
  assert.deepEqual(categoriasSinReservado(objetivo), []);
});

// --- MATE-3.7: menos problemas reservados que el mínimo -------------------------------------------------

Given(
  'que contenido\\/ficticio.json tiene {int} problemas reservados en categorías con grupo de parecidas',
  (cantidad: number) => {
    mundo().contenido().agregarReservadosIntercalables(cantidad);
  },
);

Given(
  'que contenido\\/borradores\\/ficticio.json tiene otros {int} problemas reservados pendientes',
  (cantidad: number) => {
    const actual = mundo();
    for (let numero = 1; numero <= cantidad; numero += 1) {
      const pendiente = itemDeLaIa(`B${String(numero)}`, { tipo: 'problema', categoria: 'C1', reservado: true });
      actual.material.agregarAlBorrador(actual, pendiente);
    }
  },
);

/** Los avisos del mínimo de problemas reservados: no cuelgan de ningún objetivo (MATE-3.7). */
function avisosDelMinimo(): readonly AvisoDeReservados[] {
  return avisosDeLaRevision(revisionAbierta()).filter((aviso) => aviso.tipo === 'pocos_reservados');
}

Then('ve el aviso {texto}', (texto: string) => {
  const dicho = /^Hay (\d+) problemas reservados en categorías con grupo; hacen falta (\d+)$/.exec(texto);
  const [, hay, haceFalta] = presente(dicho ?? undefined, `«Hay N problemas reservados…» en «${texto}»`);
  assert.deepEqual(avisosDelMinimo(), [{ tipo: 'pocos_reservados', hay: Number(hay), hacen_falta: Number(haceFalta) }]);
});

Then('no ve ningún aviso de mínimo de problemas reservados', () => {
  assert.deepEqual(avisosDelMinimo(), []);
});
