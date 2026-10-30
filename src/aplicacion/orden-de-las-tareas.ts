import type { TareaContenido } from './contenido.ts';
import type { TareaDelBorrador } from './mesa.ts';

// El orden de las tareas en la revisión del material (@MATE-4.11, plan §0, «Reglas de `MATE` que la
// feature no cubre»): cada tarea del borrador puede decir con `antes_de` qué tarea va justo detrás de
// ella, aprobada o del borrador. La revisión (revision.ts) usa estas dos funciones al aprobar y al
// descartar una tarea; ninguna rechaza nada.

/**
 * Las tareas aprobadas con `tarea` dentro, ya sin `antes_de`. Entra delante de la primera tarea aprobada
 * que se encuentra siguiendo los `antes_de` desde el suyo: si apunta a una tarea de `borrador`, se sigue
 * el de esa. Si la cadena se corta (una tarea sin `antes_de`, o un id que no es de ninguna tarea) o
 * vuelve a una tarea por la que ya ha pasado, empezando por la propia, entra al final. Así da igual en
 * qué orden se aprueben las tareas de una cadena.
 *
 * `borrador` son las tareas pendientes, con `tarea` o sin ella: la cadena no vuelve a pasar por ella.
 */
export function conLaTareaAprobada(
  aprobadas: readonly TareaContenido[],
  tarea: TareaDelBorrador,
  borrador: readonly TareaDelBorrador[],
): readonly TareaContenido[] {
  const delante = primeraAprobadaDelante(aprobadas, tarea, borrador);
  const entra = sinElAntesDe(tarea);
  // Sin tarea aprobada delante, entra al final: es lo que pasa con una cadena cortada o con un ciclo.
  if (delante === undefined) {
    return [...aprobadas, entra];
  }
  const posicion = aprobadas.findIndex(({ id }) => id === delante);
  return [...aprobadas.slice(0, posicion), entra, ...aprobadas.slice(posicion)];
}

/**
 * El id de la primera tarea aprobada que se encuentra siguiendo los `antes_de` desde el de `tarea`, o
 * `undefined` si la cadena se corta o vuelve sobre sí misma. `pasadas` guarda los ids ya visitados, empezando
 * por la propia tarea: si se repite uno, la cadena es un ciclo y no se sigue (siempre acaba, porque cada
 * vuelta del bucle añade un id nuevo y las tareas son finitas).
 */
function primeraAprobadaDelante(
  aprobadas: readonly TareaContenido[],
  tarea: TareaDelBorrador,
  borrador: readonly TareaDelBorrador[],
): string | undefined {
  const pasadas = new Set([tarea.id]);
  let siguiente = tarea.antes_de;
  while (siguiente !== undefined && !pasadas.has(siguiente)) {
    const actual = siguiente;
    if (aprobadas.some(({ id }) => id === actual)) {
      return actual;
    }
    pasadas.add(actual);
    // Un id que no es de ninguna tarea del borrador no tiene `antes_de`: la cadena se corta aquí.
    siguiente = borrador.find(({ id }) => id === actual)?.antes_de;
  }
  return undefined;
}

/** La tarea tal como entra en el aprobado: `antes_de` es solo del borrador. Se conserva la fuente, si la tiene. */
function sinElAntesDe(tarea: TareaDelBorrador): TareaContenido {
  const { id, enunciado, rubrica, fuente } = tarea;
  return fuente === undefined ? { id, enunciado, rubrica } : { id, enunciado, rubrica, fuente };
}

/**
 * Las tareas del borrador sin `descartada`. Las que llevaban `antes_de` hacia ella pasan a llevar el suyo,
 * o ninguno si ella no lo llevaba o si es el id de la propia tarea (el ciclo T3→T4→T3, al descartar T3):
 * siguen en el mismo sitio de la cadena. Las demás no cambian.
 */
export function sinLaTareaDescartada(
  borrador: readonly TareaDelBorrador[],
  descartada: TareaDelBorrador,
): readonly TareaDelBorrador[] {
  return borrador
    .filter(({ id }) => id !== descartada.id)
    .map((tarea) => {
      if (tarea.antes_de !== descartada.id) {
        return tarea;
      }
      return conElAntesDe(tarea, descartada.antes_de === tarea.id ? undefined : descartada.antes_de);
    });
}

/** La tarea con ese `antes_de`, o sin la propiedad si no hay: `antes_de: undefined` no vale con `exactOptionalPropertyTypes`. */
function conElAntesDe(tarea: TareaDelBorrador, antesDe: string | undefined): TareaDelBorrador {
  return antesDe === undefined ? sinElAntesDe(tarea) : { ...sinElAntesDe(tarea), antes_de: antesDe };
}
