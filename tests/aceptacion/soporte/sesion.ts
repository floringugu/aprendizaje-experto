import type { EjemploPresentado, ItemPresentado, Sesion } from '../../../src/aplicacion/sesiones.ts';
import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';

/** Los ejemplos resueltos de la sesión, en el orden en que se presentan. */
export function ejemplosDe(sesion: Sesion): readonly EjemploPresentado[] {
  return sesion.elementos.flatMap((elemento) => (elemento.tipo === 'ejemplo' ? [elemento.ejemplo] : []));
}

/** Los ítems de la sesión, en el orden en que se presentan. */
export function itemsDe(sesion: Sesion): readonly ItemPresentado[] {
  return sesion.elementos.flatMap((elemento) => (elemento.tipo === 'item' ? [elemento.item] : []));
}

interface FiltroDeSesion {
  readonly objetivo?: string;
  readonly categoria?: string;
  readonly grupo?: string;
}

/** La persona empieza una sesión de práctica, opcionalmente de un objetivo, una categoría o un grupo. */
export function iniciarSesionDePractica(mundo: Mundo, filtro: FiltroDeSesion = {}): Sesion {
  const sesion = aceptado(mundo.listo().iniciarSesion({ dominio: mundo.dominio, tipo: 'practica', ...filtro }));
  mundo.sesion = sesion;
  return sesion;
}
