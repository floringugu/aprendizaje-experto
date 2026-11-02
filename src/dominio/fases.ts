// Las reglas de cambio de fase. Las dos solo hacen avanzar: la fase nunca retrocede (@MAST-6.3).

import { llegaAlUmbral } from './acierto.ts';

export type Fase = 'diagnostico' | 'novato' | 'intermedio' | 'avanzado_experto';

/**
 * Con todos los objetivos dominados, la persona pasa de novato a intermedio (@MAST-6.1). En otra fase
 * no cambia nada: perder después el dominio de un objetivo no la devuelve a novato (@MAST-6.3).
 */
export function faseTrasDominio(fase: Fase, todosDominados: boolean): Fase {
  return fase === 'novato' && todosDominados ? 'intermedio' : fase;
}

/** Lo que decide el paso de intermedio a avanzado/experto. */
interface MetricasDelPasoAAvanzado {
  /** Acierto en problemas intercalados sin pista del tipo; `undefined` si aún no se puede medir. */
  readonly aciertoProblemas: number | undefined;
  readonly umbralPasoAAvanzado: number;
  /** Si se ha superado la transferencia con los problemas reservados (`evaluarTransferencia`). */
  readonly transferenciaSuperada: boolean;
}

/**
 * De intermedio se pasa a avanzado/experto cuando el acierto en problemas intercalados sin pista del
 * tipo llega al umbral de paso (@MAST-6.2, @MAST-6.4) y, además, se ha superado la transferencia
 * (@MAST-6.7). Sin acierto medido, o en otra fase, no cambia. No mira si los objetivos siguen
 * dominados: el paso se decide solo con esas dos métricas. Es extrapolación del autor, como los
 * umbrales de transición: el informe no da una regla de paso a la última fase.
 */
export function faseTrasProblemas(fase: Fase, metricas: MetricasDelPasoAAvanzado): Fase {
  const { aciertoProblemas, umbralPasoAAvanzado, transferenciaSuperada } = metricas;
  return fase === 'intermedio' && transferenciaSuperada && llegaAlUmbral(aciertoProblemas, umbralPasoAAvanzado)
    ? 'avanzado_experto'
    : fase;
}
