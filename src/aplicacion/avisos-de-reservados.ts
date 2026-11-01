import { problemasIntercalables } from '../dominio/diagnostico.ts';
import type { ContenidoDominio, ItemContenido } from './contenido.ts';
import { itemsDelObjetivo } from './contenido.ts';

// Los avisos de la revisión sobre los problemas reservados (MATE-3.6, MATE-3.7): lo que falta en el contenido
// aprobado para medir la transferencia. Lógica pura; la revisión los pide cada vez que se abre y no se guardan,
// como las marcas. El texto lo compone la interfaz.

export type AvisoDeReservados =
  /** `categoria` tiene grupo de parecidas, tiene problemas en `objetivo` y ninguno es reservado (MATE-3.6). */
  | { readonly tipo: 'categoria_sin_reservado'; readonly objetivo: string; readonly categoria: string }
  /** Hay `hay` problemas reservados en categorías con grupo, menos que `hacen_falta` (MATE-3.7). */
  | { readonly tipo: 'pocos_reservados'; readonly hay: number; readonly hacen_falta: number };

/**
 * Los avisos del contenido aprobado, con `minimo` problemas reservados en categorías con grupo
 * (`minimo_problemas_reservados`). Lo pendiente del borrador no cuenta (@MATE-3.7): una sesión solo
 * presenta lo aprobado (MAST-6.7). Un problema cuenta en una categoría si su `categoria` es el `id` de
 * una categoría del aprobado con `grupo_parecidas`; los hechos, y los problemas sin categoría o de una
 * categoría sin grupo, no cuentan para nada.
 *
 * Primero, por cada objetivo del aprobado, en su orden, y dentro de él por cada categoría con grupo, en el
 * orden de las categorías: `categoria_sin_reservado` si tiene al menos un problema de ese objetivo y
 * ninguno con `reservado: true` (@MATE-3.6). Una categoría con grupo sin problemas en el objetivo no lleva
 * aviso (regla que la feature no cubre, «Reservados» de MATE). Después, un único `pocos_reservados` si los
 * problemas reservados de todas las categorías con grupo son menos que `minimo`, también si no hay
 * ninguno (@MATE-3.7). Vacío si no falta nada.
 */
export function avisosDeReservados(aprobado: ContenidoDominio, minimo: number): readonly AvisoDeReservados[] {
  // Los ids de las categorías con grupo, en el orden de `categorias`: de ellos depende todo lo demás.
  const conGrupo = aprobado.categorias.filter(({ grupo_parecidas: grupo }) => grupo !== undefined).map(({ id }) => id);
  // Solo estos problemas cuentan: los hechos y los de una categoría sin grupo (o sin categoría) no miden transferencia.
  // La regla ya existe en el dominio (`problemasIntercalables`); aquí solo se queda con los ítems que nombra.
  const ids = new Set(problemasIntercalables(aprobado.items, aprobado.categorias));
  const problemas = aprobado.items.filter(({ id }) => ids.has(id));
  const sinReservado = aprobado.objetivos.flatMap(({ id }) => categoriasSinReservado(problemas, conGrupo, id));
  const reservados = problemas.filter(esReservado).length;
  // `pocos_reservados` va al final y una sola vez; con `hay: 0` también sale (lo que no existe cuenta como cero).
  return reservados < minimo
    ? [...sinReservado, { tipo: 'pocos_reservados', hay: reservados, hacen_falta: minimo }]
    : sinReservado;
}

/**
 * Los avisos `categoria_sin_reservado` de un objetivo, en el orden de `conGrupo`. La comparación es por
 * objetivo y categoría a la vez: que haya un reservado de la categoría en otro objetivo no basta, porque la
 * transferencia se mide dentro de cada objetivo (@MATE-3.6).
 */
function categoriasSinReservado(
  problemas: readonly ItemContenido[],
  conGrupo: readonly string[],
  objetivo: string,
): readonly AvisoDeReservados[] {
  const delObjetivo = itemsDelObjetivo(problemas, objetivo);
  return conGrupo
    .filter((categoria) => {
      const suyos = delObjetivo.filter((problema) => problema.categoria === categoria);
      // Sin problemas en el objetivo no hay nada que reservar: no se avisa.
      return suyos.length > 0 && !suyos.some(esReservado);
    })
    .map((categoria) => ({ tipo: 'categoria_sin_reservado', objetivo, categoria }));
}

/** Un ítem es reservado solo con `reservado: true`; sin el campo, o con `false`, no lo es. */
function esReservado({ reservado }: ItemContenido): boolean {
  return reservado === true;
}
