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

/**
 * De intermedio se pasa a avanzado/experto cuando el acierto en problemas intercalados sin pista del
 * tipo llega al umbral de paso (@MAST-6.2, @MAST-6.4). Sin acierto medido, o en otra fase, no cambia.
 * No mira si los objetivos siguen dominados: el paso se decide solo con esa métrica. Es extrapolación
 * del autor, como los umbrales de transición: el informe no da una regla de paso a la última fase.
 */
export function faseTrasProblemas(fase: Fase, aciertoProblemas: number | undefined, umbralPasoAAvanzado: number): Fase {
  return fase === 'intermedio' && llegaAlUmbral(aciertoProblemas, umbralPasoAAvanzado) ? 'avanzado_experto' : fase;
}
