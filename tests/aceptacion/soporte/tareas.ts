import assert from 'node:assert/strict';
import type { Fuente } from '../../../src/aplicacion/contenido.ts';
import type { TareaPresentada } from '../../../src/aplicacion/tareas.ts';
import { llegarAFase } from './acciones.ts';
import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';

// Lo que comparten los pasos del orden de las tareas y del texto profesional (TARE-1.4 y TARE-1.5).
// Va aparte de contenido.ts, acciones.ts y mundo.ts, que comparten los pasos de todas las áreas.

const LUGAR_DEL_TEXTO = 'página 1';
const FRAGMENTO_DEL_TEXTO = 'Fragmento del texto profesional que la tarea obliga a leer.';

/**
 * La tarea parte de un texto profesional real (plan §0, hueco 1, petición T5): su `fuente` cita el
 * documento y su enunciado lo nombra. La tarea tiene que estar ya en el contenido.
 */
export function partirDeTextoProfesional(actual: Mundo, tarea: string, documento: string): void {
  const contenido = actual.contenido();
  const fuente: Fuente = { documento, lugar: LUGAR_DEL_TEXTO, fragmento: FRAGMENTO_DEL_TEXTO };
  assert.ok(
    contenido.tareas.some((candidata) => candidata.id === tarea),
    `El contenido no tiene la tarea ${tarea}`,
  );
  contenido.tareas = contenido.tareas.map((candidata) =>
    candidata.id === tarea
      ? { ...candidata, enunciado: `Lee ${documento} y resuelve lo que plantea.`, fuente }
      : candidata,
  );
}

/**
 * El documento del que parte la tarea presentada, o `undefined` si no lo dice. La aplicación lo da en
 * `fuente.documento`, con la forma de `Fuente`: hoy `TareaPresentada` no lo lleva y la implementación
 * de TARE lo añade (el paso falla hasta entonces).
 */
export function textoProfesionalPresentado(presentada: TareaPresentada): string | undefined {
  const { fuente } = presentada as TareaPresentada & { readonly fuente?: Fuente };
  return fuente?.documento;
}

/**
 * La persona llega a la fase avanzada y practica, en el orden del contenido, las tareas indicadas: la
 * aplicación presenta cada una en su turno. Falla aquí si una tarea no es la que toca.
 */
export function practicarEnOrden(actual: Mundo, tareas: readonly string[]): void {
  llegarAFase(actual, 'avanzado_experto');
  const app = actual.aplicacion();
  tareas.forEach((tarea) => {
    actual.tareaPresentada = aceptado(app.pedirTarea({ dominio: actual.dominio }));
    assert.equal(actual.tareaPresentada.tarea, tarea, `La aplicación debía presentar ${tarea} en su turno`);
  });
}
