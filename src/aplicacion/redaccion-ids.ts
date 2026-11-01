import { pendientesDelBorrador, type Mesa } from './mesa.ts';

// Los ids de las piezas que entrega la IA (@MATE-2.2, plan §0): la IA no conoce los de la mesa, así que una
// pieza nueva puede traer uno que ya está en uso. Aquí se decide qué id queda a cada pieza.

/** Da el id con el que entra una pieza que trae `id`. Hay que llamarla en el orden en que se recorre la entrega. */
export type Asignador = (id: string) => string;

/**
 * Crea el asignador de una entrega: una pieza conserva su id si no está en la mesa ni lo ha tomado ya otra
 * pieza anterior; si no, toma el primero libre con su mismo prefijo (`siguienteLibre`). `idsDeLaEntrega` son
 * los de todas las piezas de la entrega, válidas o no: un id nuevo no puede ser ninguno de ellos, para no
 * quitarle a una pieza que viene detrás el que ella trae.
 */
export function crearAsignador(mesa: Mesa, idsDeLaEntrega: ReadonlySet<string>): Asignador {
  // `pendientesDelBorrador` también da todas las piezas del aprobado: encaja como borrador sin ejemplos aparte.
  const piezasDeLaMesa = [...pendientesDelBorrador(mesa.borrador), ...pendientesDelBorrador(mesa.aprobado)];
  const enLaMesa = new Set(piezasDeLaMesa.map(({ pieza }) => pieza.id));
  const tomados = new Set<string>();
  const sinUsar = (id: string): boolean => !enLaMesa.has(id) && !tomados.has(id);
  return (id) => {
    const nuevo = sinUsar(id)
      ? id
      : siguienteLibre(id, (candidato) => sinUsar(candidato) && !idsDeLaEntrega.has(candidato));
    tomados.add(nuevo);
    return nuevo;
  };
}

/** Un id acabado en número, partido en su prefijo y su número: «I3» es `I` y 3. */
const ID_CON_NUMERO = /^(.*?)(\d+)$/;

/**
 * El primer id con el mismo prefijo que `id` que cumple `libre`, subiendo el número: «I3» pasa a «I4»,
 * «I5»… Un id que no acaba en número se cuenta como el primero de su serie: «X» pasa a «X2», «X3»…
 */
function siguienteLibre(id: string, libre: (candidato: string) => boolean): string {
  const [prefijo, numero] = partirId(id);
  for (let siguiente = numero + 1; ; siguiente += 1) {
    const candidato = `${prefijo}${String(siguiente)}`;
    if (libre(candidato)) {
      return candidato;
    }
  }
}

/**
 * El prefijo y el número de un id. Sin número al final, o con uno que JavaScript no representa con exactitud
 * (sumarle uno daría el mismo), el prefijo es el id entero y el número, 1: la serie sale «X2», «X3»…
 */
function partirId(id: string): readonly [prefijo: string, numero: number] {
  // Sin coincidencia no hay dígitos: `Number(undefined)` es `NaN`, que tampoco es un entero seguro.
  const [, prefijo = '', digitos] = ID_CON_NUMERO.exec(id) ?? [];
  const numero = Number(digitos);
  return Number.isSafeInteger(numero) ? [prefijo, numero] : [id, 1];
}
