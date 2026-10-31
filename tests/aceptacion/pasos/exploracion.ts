import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ContextoRespuesta } from '../../../src/aplicacion/sesiones.ts';
import { progresoDe, responder } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos del intento de exploración de un objetivo nuevo (AYUD-5) que usa MAST: no cuenta como
// intento del ítem (MAST-1.4, MAST-1.5), no intercala los problemas del objetivo (MAST-6.6) y no
// presenta reservados (MAST-8.1).

/**
 * El contexto de una respuesta al intento de exploración. `ContextoRespuesta` aún no lo tiene (lo
 * añade la etapa 4): está en «Transferencia y exploración (etapa 3)» de docs/areas/MAST.md.
 */
const EXPLORACION = 'exploracion' as unknown as ContextoRespuesta;

function responderExploracion(actual: Mundo, item: string): void {
  responder(actual, { item, correcta: true, contexto: EXPLORACION });
}

/** O4 se aprueba cuando la persona ya está en la fase: se añade a la cola, después de llegar a ella. */
function aprobarObjetivo(actual: Mundo, objetivo: string, anadir: () => void): void {
  actual.preparar(() => {
    actual.contenido().agregarObjetivo(objetivo);
    anadir();
  });
}

// I1 es de O1 en el contenido de partida (los 20 ítems de cada objetivo): se libera ese `id` antes.
// El intento de exploración es un problema (AYUD-5), así que I1 lo es.
Given(
  'que {objetivo} se aprobó en la revisión del material, sin dominarlo ni practicarlo, con {int} ítems',
  (objetivo: string, cantidad: number) => {
    const actual = mundo();
    actual.contenido().liberarId('I1');
    aprobarObjetivo(actual, objetivo, () => {
      const contenido = actual.contenido();
      contenido.agregarItem({ id: 'I1', objetivo, tipo: 'problema' });
      contenido.agregarItems(objetivo, cantidad - 1);
    });
  },
);

Given(
  'que {objetivo} se aprobó en la revisión del material con problemas en categorías intercalables',
  (objetivo: string) => {
    const actual = mundo();
    aprobarObjetivo(actual, objetivo, () => {
      const contenido = actual.contenido();
      contenido.agregarItems(objetivo, contenido.itemsDe('O1').length, { tipo: 'problema' });
      contenido.asignarCategoriasIntercalables();
    });
  },
);

Given(
  'que la persona acierta el ítem {item} de {objetivo} como intento de exploración',
  (item: string, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      assert.equal(actual.contenido().item(item).objetivo, objetivo, `${item} no es de ${objetivo}`);
      responderExploracion(actual, item);
    });
  },
);

Given('que la persona acertó el problema de exploración de {objetivo}', (objetivo: string) => {
  const actual = mundo();
  actual.preparar(() => {
    const problema = actual
      .contenido()
      .itemsDe(objetivo)
      .find((item) => item.tipo === 'problema');
    responderExploracion(actual, presente(problema, `un problema de ${objetivo}`).id);
  });
});

// El intento de exploración es el primer problema de la primera sesión de práctica del objetivo.
When('la persona hace el intento de exploración de {objetivo}', (objetivo: string) => {
  const actual = mundo();
  actual.presentaciones.push(...itemsDe(iniciarSesionDePractica(actual, { objetivo })));
});

// Para que este intento sea el primero del ítem, el de exploración no ha debido contar.
When('la persona responde de nuevo {item} de {objetivo} y lo acierta', (item: string, objetivo: string) => {
  const actual = mundo();
  actual.listo();
  const total = actual.contenido().itemsDe(objetivo).length;
  assert.equal(
    progresoDe(actual, objetivo).itemsSinIntento,
    total,
    `El intento de exploración de ${item} ya cuenta como intento`,
  );
  responder(actual, { item, correcta: true, contexto: 'practica' });
});

Then('ese intento cuenta como el primero de {item}', (item: string) => {
  const actual = mundo();
  const objetivo = actual.contenido().item(item).objetivo;
  const total = actual.contenido().itemsDe(objetivo).length;
  assert.equal(progresoDe(actual, objetivo).itemsSinIntento, total - 1, `${item} no tiene un intento que cuente`);
});

Then('la aplicación indica que faltan {int} ítems de {objetivo}', (faltan: number, objetivo: string) => {
  assert.equal(progresoDe(mundo(), objetivo).itemsSinIntento, faltan, `Ítems sin responder de ${objetivo}`);
});
