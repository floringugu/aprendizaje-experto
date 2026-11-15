import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Then, When } from '@cucumber/cucumber';
import type { ItemContenido } from '../../../src/aplicacion/contenido.ts';
import { presente } from '../soporte/comprobar.ts';
import type { RespuestaNumerica } from '../soporte/contenido.ts';
import {
  APUNTES,
  borradorEnDisco,
  ejemploDePrueba,
  entregaDeLaIa,
  fuenteDeLosApuntes,
  idsDe,
  itemDePrueba,
  objetivoDePrueba,
  piezaEnElBorrador,
  redactar,
} from '../soporte/escenario-material.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import { leerFuente } from '../soporte/tipos-de-parametro.ts';

// Pasos de lo que la aplicación aparta o corrige del borrador que entrega la IA (MATE-2.3, MATE-2.5 a 2.7),
// y del ítem numérico, que aparta si está mal formado o si trae una unidad ilegible y deja entrar si no
// (MATE-2.12 a MATE-2.14).

/** Un ítem completo de O1 y el borrador que entrega la IA con él y con las demás piezas. */
export async function entregar(piezas: Readonly<Record<string, unknown>>): Promise<void> {
  const actual = mundo();
  const completo = itemDePrueba('I8', 'O1', fuenteDeLosApuntes(actual.material.frase));
  const { items = [], ...demas } = piezas;
  actual.externos.ia.respuesta = entregaDeLaIa(actual, { ...demas, items: [completo, ...(items as unknown[])] });
  await redactar(actual, APUNTES);
}

/** Lo que la aplicación apartó: una entrada por pieza, con la propiedad del formato que le falta. */
export function comprobarApartadas(cantidad: number, falta: string): void {
  const redactado = aceptado(presente(mundo().material.redaccion, 'ningún borrador redactado'));
  assert.deepEqual(
    redactado.apartadas,
    Array.from({ length: cantidad }, () => ({ falta })),
  );
}

Then('la aplicación indica que ha apartado {int} pieza porque le falta {falta}', comprobarApartadas);

// --- MATE-2.5: dos opciones iguales ---------------------------------------------------------------------

When(
  'la IA configurada entrega un borrador con un ítem de O1 completo y un ítem de O1 con las opciones {textos}',
  async (opciones: string[]) => {
    const fuente = fuenteDeLosApuntes(mundo().material.frase);
    const repetidas = { ...itemDePrueba('I9', 'O1', fuente), respuesta: { opciones, correcta: opciones[0] ?? '' } };
    await entregar({ items: [repetidas] });
  },
);

Then('contenido\\/borradores\\/ficticio.json tiene el ítem de O1 completo y ninguna otra pieza', () => {
  assert.deepEqual(idsDe(borradorEnDisco(mundo())), ['I8']);
});

Then('la aplicación indica que ha apartado {int} pieza porque tiene dos opciones iguales', (cantidad: number) => {
  comprobarApartadas(cantidad, 'opciones');
});

// --- MATE-2.6: el diagnóstico no lo marca la IA ---------------------------------------------------------

When('la IA configurada entrega un borrador con un ítem de O1 marcado para el diagnóstico', async () => {
  const marcado = { ...itemDePrueba('I8', 'O1', fuenteDeLosApuntes(mundo().material.frase)), diagnostico: true };
  const actual = mundo();
  actual.externos.ia.respuesta = entregaDeLaIa(actual, { items: [marcado] });
  await redactar(actual, APUNTES);
});

Then('contenido\\/borradores\\/ficticio.json tiene ese ítem de O1, sin marcar para el diagnóstico', () => {
  const actual = mundo();
  aceptado(presente(actual.material.redaccion, 'ningún borrador redactado'));
  const item = presente(piezaEnElBorrador(actual, 'I8'), 'I8 en el borrador') as ItemContenido;
  assert.equal(item.diagnostico, false);
});

// --- MATE-2.7: un diagrama que no es SVG ----------------------------------------------------------------

When(
  'la IA configurada entrega un borrador con un ítem de O1 completo y {pieza_redactada} cuyo diagrama es {texto}',
  async (pieza: string, diagrama: string) => {
    const fuente = fuenteDeLosApuntes(mundo().material.frase);
    const conDiagrama: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
      'un objetivo': { objetivos: [{ ...objetivoDePrueba('O4', fuente), diagrama }] },
      'un ejemplo resuelto de O1': { ejemplos_resueltos: [{ ...ejemploDePrueba('E9', 'O1', fuente), diagrama }] },
    };
    await entregar(presente(conDiagrama[pieza], `un diagrama en ${pieza}`));
  },
);

Then('la aplicación indica que ha apartado {int} pieza porque su diagrama no es SVG', (cantidad: number) => {
  comprobarApartadas(cantidad, 'diagrama');
});

// --- MATE-2.12: un ítem numérico mal formado ------------------------------------------------------------

const UNIDADES = ['m/s²', 'm/s2'];

/** La `respuesta` que trae cada ítem numérico mal formado, tal como la escribe la IA en el JSON. */
const NUMERICO_MAL_FORMADO: Readonly<Record<string, unknown>> = {
  'sin valor': { unidades: UNIDADES },
  'con el valor «nueve»': { valor: 'nueve', unidades: UNIDADES },
  'con el valor «9,81» escrito como texto': { valor: '9,81', unidades: UNIDADES },
  'con las unidades vacías': { valor: 9.81, unidades: [] },
  'con la tolerancia 1,5': { valor: 9.81, unidades: UNIDADES, tolerancia: 1.5 },
  'con la tolerancia -0,1': { valor: 9.81, unidades: UNIDADES, tolerancia: -0.1 },
  'con la tolerancia «5 %» escrita como texto': { valor: 9.81, unidades: UNIDADES, tolerancia: '5 %' },
  'con el valor 0 y la tolerancia 0,05': { valor: 0, unidades: UNIDADES, tolerancia: 0.05 },
};

/**
 * El motivo que dice la aplicación → la propiedad de `respuesta` que falla (`apartadas[].falta`). Un valor 0
 * con tolerancia falla en `tolerancia`, que es la propiedad que sobra.
 */
const FALTA_DEL_NUMERICO: Readonly<Record<string, string>> = {
  'le falta el valor': 'valor',
  'su valor no es un número': 'valor',
  'sus unidades están vacías': 'unidades',
  'su tolerancia no está entre 0 y 1': 'tolerancia',
  'su valor es 0 y lleva tolerancia': 'tolerancia',
  // MATE-2.14: la unidad que la corrección no puede leer detrás de un número también falla en `unidades`.
  'sus unidades no se pueden leer detrás de un número': 'unidades',
};

// Con expresión regular: las frases de los ejemplos llevan comillas y comas, y no son un tipo de parámetro.
// La excluye «con las unidades «…»», que es el paso de MATE-2.14 (más abajo).
When(
  /^la IA configurada entrega un borrador con un ítem de O1 completo y un ítem numérico de O1 (?!con las unidades «)(.+)$/,
  async (variante: string) => {
    const respuesta = presente(NUMERICO_MAL_FORMADO[variante], `el ítem numérico «${variante}»`);
    const fuente = fuenteDeLosApuntes(mundo().material.frase);
    await entregar({ items: [{ ...itemDePrueba('I9', 'O1', fuente), respuesta }] });
  },
);

Then(
  new RegExp(
    `^la aplicación indica que ha apartado (\\d+) pieza porque (${Object.keys(FALTA_DEL_NUMERICO).join('|')})$`,
  ),
  (cantidad: number, motivo: string) => {
    comprobarApartadas(cantidad, presente(FALTA_DEL_NUMERICO[motivo], `el motivo «${motivo}»`));
  },
);

// --- MATE-2.13: un ítem numérico bien formado -----------------------------------------------------------

/** La `respuesta` de cada ítem numérico bien formado. */
const NUMERICO_BIEN_FORMADO: Readonly<Record<string, RespuestaNumerica>> = {
  'con valor y unidades': { valor: 9.81, unidades: UNIDADES },
  'con valor, unidades y la tolerancia 0,02': { valor: 9.81, unidades: UNIDADES, tolerancia: 0.02 },
  'con valor y sin unidades': { valor: 9.81 },
  'con la tolerancia 0': { valor: 9.81, unidades: UNIDADES, tolerancia: 0 },
  'con la tolerancia 1': { valor: 9.81, unidades: UNIDADES, tolerancia: 1 },
  'con el valor 0 y sin tolerancia': { valor: 0, unidades: UNIDADES },
};

function numericoBienFormado(variante: string): RespuestaNumerica {
  return presente(NUMERICO_BIEN_FORMADO[variante], `el ítem numérico «${variante}»`);
}

When(
  /^la IA configurada redacta a partir de «([^»]+)» un borrador con un ítem numérico de O1 (.+), que cita la página (\d+)$/,
  async (documento: string, variante: string, pagina: number) => {
    const actual = mundo();
    const fuente = { documento, lugar: `página ${String(pagina)}`, fragmento: actual.material.frase };
    const numerico = { ...itemDePrueba('I7', 'O1', fuente), respuesta: numericoBienFormado(variante) };
    actual.externos.ia.respuesta = entregaDeLaIa(actual, { items: [numerico] });
    await redactar(actual, documento);
  },
);

/** El borrador tiene un ítem de O1 con esa misma respuesta numérica, sin nada de más ni de menos, y esa fuente. */
Then(
  /^contenido\/borradores\/ficticio\.json tiene un ítem numérico de O1 (.+) con la fuente («.+»)$/,
  (variante: string, cita: string) => {
    const actual = mundo();
    aceptado(presente(actual.material.redaccion, 'ningún borrador redactado'));
    const respuesta = numericoBienFormado(variante);
    const fuente = leerFuente(cita);
    const delObjetivo = borradorEnDisco(actual).items.filter((item) => item.objetivo === 'O1');
    assert.ok(
      delObjetivo.some(
        (item) => isDeepStrictEqual(item.respuesta, respuesta) && isDeepStrictEqual(item.fuente, fuente),
      ),
      `El borrador no tiene un ítem numérico de O1 ${variante} con esa fuente`,
    );
  },
);

Then('la aplicación no indica que haya apartado ninguna pieza', () => {
  comprobarApartadas(0, '');
});

// --- MATE-2.14: un ítem numérico con una unidad que la corrección no puede leer -------------------------

When(
  'la IA configurada entrega un borrador con un ítem de O1 completo y un ítem numérico de O1 con las unidades {textos}',
  async (unidades: string[]) => {
    const fuente = fuenteDeLosApuntes(mundo().material.frase);
    const respuesta: RespuestaNumerica = { valor: 9.81, unidades };
    await entregar({ items: [{ ...itemDePrueba('I9', 'O1', fuente), respuesta }] });
  },
);
