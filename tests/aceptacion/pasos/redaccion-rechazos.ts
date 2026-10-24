import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import type { ItemContenido } from '../../../src/aplicacion/contenido.ts';
import { presente } from '../soporte/comprobar.ts';
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

// Pasos de lo que la aplicación aparta o corrige del borrador que entrega la IA (MATE-2.3, MATE-2.5 a 2.7).

/** Un ítem completo de O1 y el borrador que entrega la IA con él y con las demás piezas. */
async function entregar(piezas: Readonly<Record<string, unknown>>): Promise<void> {
  const actual = mundo();
  const completo = itemDePrueba('I8', 'O1', fuenteDeLosApuntes(actual.material.frase));
  const { items = [], ...demas } = piezas;
  actual.externos.ia.respuesta = entregaDeLaIa(actual, { ...demas, items: [completo, ...(items as unknown[])] });
  await redactar(actual, APUNTES);
}

/** Lo que la aplicación apartó: una entrada por pieza, con la propiedad del formato que le falta. */
function comprobarApartadas(cantidad: number, falta: string): void {
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
