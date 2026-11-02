import assert from 'node:assert/strict';
import { Given } from '@cucumber/cucumber';
import type { ContextoRespuesta } from '../../../src/aplicacion/sesiones.ts';
import { responder } from '../soporte/acciones.ts';
import { mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { aprobarObjetivo } from './exploracion.ts';

// Pasos de las prepreguntas de un objetivo nuevo (AYUD-8) que usa MAST: no cuentan como intento del
// ítem (MAST-1.6) y el intento posterior sí cuenta (MAST-1.7). Los pasos «la persona responde de nuevo»,
// «ese intento cuenta como el primero» y «faltan {int} ítems» son los de exploracion.ts.

/**
 * El contexto de una respuesta a una prepregunta. `ContextoRespuesta` aún no lo tiene (lo añade la etapa
 * 4): está en «Transferencia y exploración (etapa 3)» de docs/areas/MAST.md.
 */
const PREPREGUNTA = 'prepregunta' as unknown as ContextoRespuesta;

function responderPrepregunta(actual: Mundo, item: string, objetivo: string): void {
  assert.equal(actual.contenido().item(item).objetivo, objetivo, `${item} no es de ${objetivo}`);
  responder(actual, { item, correcta: true, contexto: PREPREGUNTA });
}

// Los H1 a H20 de O4: AYUD-8 pregunta como prepreguntas los hechos con opciones (features/ayuda.feature).
Given(
  'que {objetivo} se aprobó en la revisión del material, sin dominarlo ni practicarlo, con {int} ítems de tipo «hecho» con opciones',
  (objetivo: string, cantidad: number) => {
    const actual = mundo();
    aprobarObjetivo(actual, objetivo, () => {
      actual.contenido().agregarHechosConOpciones(objetivo, cantidad);
    });
  },
);

Given(
  'que la persona acierta el ítem {item} de {objetivo} como prepregunta',
  (item: string, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      responderPrepregunta(actual, item, objetivo);
    });
  },
);

Given(
  'que la persona acierta los ítems {ids} de {objetivo} como prepreguntas',
  (items: string[], objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      for (const item of items) {
        responderPrepregunta(actual, item, objetivo);
      }
    });
  },
);
