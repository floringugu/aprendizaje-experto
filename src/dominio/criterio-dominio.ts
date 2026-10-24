// El criterio de dominio de un objetivo (MAST): cuándo está dominado y cuándo se mide si lo retiene.

import type { MedidaAcierto } from './acierto.ts';
import { llegaAlUmbral, medirAcierto } from './acierto.ts';
import { MS_POR_SEMANA } from './unidades.ts';

interface EntradaDominio {
  /** Todos los ítems del objetivo. */
  readonly items: readonly string[];
  /**
   * Último intento de cada ítem, sea del contexto que sea (@MAST-1.2): una prueba de retención cuenta
   * como cualquier otro intento (@MAST-7.2), y también el de una práctica que empieza con un ejemplo
   * resuelto. Que todos cuenten igual es extrapolación del autor: el informe mide «recuperación sin
   * ayuda», pero no la define.
   */
  readonly ultimoIntento: ReadonlyMap<string, boolean>;
  readonly umbral: number;
  /** Si el objetivo estaba dominado antes de esta evaluación. */
  readonly dominadoAntes: boolean;
}

export interface EvaluacionDominio extends MedidaAcierto {
  readonly dominado: boolean;
}

/**
 * Con todos los ítems respondidos, el objetivo está dominado si su acierto sin ayuda llega al umbral
 * (@MAST-1.1, @MAST-1.2, @MAST-5.1), y deja de estarlo en cuanto baja de él (@MAST-4.1). La confianza
 * declarada no entra (@MAST-3.1).
 *
 * Mientras falte algún ítem por responder, el objetivo no se evalúa y sigue como estaba (@MAST-1.3).
 * Así un objetivo dominado en el diagnóstico, que solo usa algunos ítems, no pierde el dominio por
 * los que aún no ha visto. Es decisión del autor: el informe no trata un dominio medido con parte
 * de los ítems.
 */
export function evaluarDominio(entrada: EntradaDominio): EvaluacionDominio {
  const medida = medirAcierto(entrada.items, entrada.ultimoIntento);
  const dominado =
    medida.aciertoSinAyuda === undefined
      ? entrada.dominadoAntes
      : llegaAlUmbral(medida.aciertoSinAyuda, entrada.umbral);
  return { ...medida, dominado };
}

/**
 * Al dominar un objetivo se programa una prueba de retención por cada número de semanas configurado,
 * contado desde el instante en que quedó dominado (@MAST-7.1, @MAST-7.3).
 */
export function fechasDeRetencion(dominadoEl: Date, semanas: readonly number[]): readonly Date[] {
  return semanas.map((semana) => new Date(dominadoEl.getTime() + semana * MS_POR_SEMANA));
}
