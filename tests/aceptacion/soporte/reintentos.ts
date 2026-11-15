import assert from 'node:assert/strict';
import type { Feedback } from '../../../src/aplicacion/sesiones.ts';
import { responder } from './acciones.ts';
import { presente } from './comprobar.ts';
import { respuestaPara } from './contenido.ts';
import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';

// Los reintentos de una sesión (RECU-6): qué queda por presentar y cómo se responde un ítem que vuelve.

/** Más vueltas de las que da cualquier sesión de prueba: corta un bucle si el ítem no deja de volver. */
const MAXIMO_DE_RESPUESTAS = 50;

/** Un ítem que queda por presentar en la sesión en curso; `reintento` si es uno que vuelve. */
export interface ItemPendiente {
  readonly id: string;
  readonly reintento: boolean;
}

/** Los ítems que quedan por presentar en la sesión en curso, en el orden en que se presentan. */
export function itemsPendientes(mundo: Mundo): readonly ItemPendiente[] {
  const sesion = aceptado(mundo.listo().consultarSesion({ dominio: mundo.dominio }));
  return sesion.elementos.flatMap((elemento) =>
    elemento.tipo === 'item' ? [{ id: elemento.item.id, reintento: elemento.reintento === true }] : [],
  );
}

/** Si `item` está entre los pendientes como ítem que vuelve. */
export function vuelve(pendientes: readonly ItemPendiente[], item: string): boolean {
  return pendientes.some((pendiente) => pendiente.id === item && pendiente.reintento);
}

/**
 * La persona ve el ítem que vuelve y lo responde, acertando o fallando. El reintento no pide confianza:
 * el feedback llega con la respuesta (RECU-6.3). Devuelve ese feedback, que queda también en el mundo.
 */
export function responderReintento(mundo: Mundo, peticion: { item: string; correcta: boolean }): Feedback {
  const { dominio } = mundo;
  const { item } = peticion;
  const app = mundo.listo();
  mundo.presentado = aceptado(app.presentarItem({ dominio, item, contexto: 'reintento' }));
  const respuesta = respuestaPara(mundo.contenido().item(item), peticion.correcta);
  const recogida = aceptado(app.responderItem({ dominio, item, contexto: 'reintento', respuesta }));
  if (recogida.esperandoConfianza) {
    assert.fail(`La aplicación pide la confianza en el reintento de ${item}`);
  }
  mundo.feedback = recogida.feedback;
  return recogida.feedback;
}

/** La persona acierta un ítem pendiente de una sesión de práctica, sea su primer intento o un reintento. */
function acertarPendiente(mundo: Mundo, pendiente: ItemPendiente): void {
  if (pendiente.reintento) {
    responderReintento(mundo, { item: pendiente.id, correcta: true });
  } else {
    responder(mundo, { item: pendiente.id, correcta: true });
  }
}

/** La persona acierta los `cantidad` ítems siguientes de la sesión de práctica que no son `salvo`. */
export function responderOtros(mundo: Mundo, peticion: { cantidad: number; salvo: string }): void {
  for (let respondidos = 0; respondidos < peticion.cantidad; respondidos += 1) {
    const siguiente = itemsPendientes(mundo).find((pendiente) => pendiente.id !== peticion.salvo);
    acertarPendiente(mundo, presente(siguiente, `otro ítem que presentar antes de ${peticion.salvo}`));
  }
}

/**
 * La persona acierta lo que se le presenta en la sesión de práctica hasta que lo siguiente es `item`
 * otra vez. Falla el paso si el ítem no vuelve.
 */
export function llegarAlReintento(mundo: Mundo, item: string): void {
  for (let respondidos = 0; respondidos < MAXIMO_DE_RESPUESTAS; respondidos += 1) {
    const pendientes = itemsPendientes(mundo);
    const [siguiente] = pendientes;
    if (siguiente === undefined || !vuelve(pendientes, item)) {
      assert.fail(`${item} no vuelve a presentarse en la sesión`);
    }
    if (siguiente.id === item && siguiente.reintento) {
      return;
    }
    acertarPendiente(mundo, siguiente);
  }
  assert.fail(`${item} no llega a presentarse otra vez tras ${String(MAXIMO_DE_RESPUESTAS)} respuestas`);
}
