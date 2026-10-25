import { aciertoSinAyuda, llegaAlUmbral } from './acierto.ts';
import type { Fase } from './fases.ts';
import { faseTrasDominio } from './fases.ts';
import { objetivosPendientes } from './ruta.ts';

interface ObjetivoDiagnosticado {
  readonly id: string;
  /** Ítems del diagnóstico de este objetivo. */
  readonly items: readonly string[];
}

export interface EntradaDiagnostico {
  /** En el orden del contenido, que es el orden de la ruta. */
  readonly objetivos: readonly ObjetivoDiagnosticado[];
  /** Problemas del diagnóstico de categorías intercalables: su acierto se informa, no decide la fase. */
  readonly problemasIntercalables: readonly string[];
  /** Último intento de cada ítem del diagnóstico: `true` si lo acertó. */
  readonly respuestas: ReadonlyMap<string, boolean>;
  readonly umbralDominio: number;
}

/**
 * Lo que concluye el diagnóstico. Solo lleva lo que se midió: ninguna estimación de cuánto falta
 * ni fecha prevista (@DIAG-3.1).
 */
interface ConclusionDiagnostico {
  readonly fase: Fase;
  readonly ruta: readonly string[];
  readonly objetivosDominados: readonly string[];
  readonly aciertoPorObjetivo: Readonly<Record<string, number>>;
  /** Se informa aunque no cambie la fase (@DIAG-2.4). Falta si algún problema quedó sin responder. */
  readonly aciertoProblemasSinPista?: number;
}

/** Lo que hace falta saber de un ítem para decidir si es un problema intercalable. */
interface ItemClasificado {
  readonly id: string;
  readonly tipo: string;
  readonly categoria?: string;
}

interface CategoriaClasificada {
  readonly id: string;
  readonly grupo_parecidas?: string;
}

/**
 * Problemas de categorías que tienen un grupo de parecidas, es decir, que se pueden intercalar con
 * otras. Su acierto es la métrica del paso a la fase avanzada en la práctica (@MAST-6.2); el
 * diagnóstico solo la mide e informa de ella (@DIAG-2.4).
 */
export function problemasIntercalables(
  items: readonly ItemClasificado[],
  categorias: readonly CategoriaClasificada[],
): readonly string[] {
  const intercalables = new Set(
    categorias.filter((categoria) => categoria.grupo_parecidas !== undefined).map((categoria) => categoria.id),
  );
  return items
    .filter((item) => item.tipo === 'problema' && item.categoria !== undefined && intercalables.has(item.categoria))
    .map((item) => item.id);
}

/**
 * Un objetivo con un acierto igual o superior al umbral de dominio queda dominado y sale de la ruta
 * (@DIAG-2.1, @DIAG-2.2). La confianza declarada no entra en el cálculo (@DIAG-1.2).
 *
 * La fase es «novato» mientras quede algún objetivo por dominar, e «intermedio» con todos dominados
 * (@DIAG-2.3, @MAST-6.1). Nunca «avanzado_experto», acierte lo que acierte en los problemas
 * intercalables: esa fase exige haberlos practicado intercalados y acertar los reservados, y el
 * diagnóstico no hace ninguna de las dos cosas (@DIAG-2.4, @MAST-6.7).
 */
export function evaluarDiagnostico(entrada: EntradaDiagnostico): ConclusionDiagnostico {
  const aciertoPorObjetivo: Record<string, number> = {};
  const dominados = new Set<string>();
  entrada.objetivos.forEach((objetivo) => {
    const acierto = aciertoSinAyuda(objetivo.items, entrada.respuestas);
    if (acierto !== undefined) {
      aciertoPorObjetivo[objetivo.id] = acierto;
    }
    if (llegaAlUmbral(acierto, entrada.umbralDominio)) {
      dominados.add(objetivo.id);
    }
  });
  const ids = entrada.objetivos.map((objetivo) => objetivo.id);
  const pendientes = objetivosPendientes(ids, dominados);
  const aciertoProblemas = aciertoSinAyuda(entrada.problemasIntercalables, entrada.respuestas);
  const conclusion: ConclusionDiagnostico = {
    fase: faseTrasDominio('novato', pendientes.length === 0),
    ruta: pendientes,
    objetivosDominados: ids.filter((id) => dominados.has(id)),
    aciertoPorObjetivo,
  };
  // Con `exactOptionalPropertyTypes`, un campo opcional sin valor se omite: no se pone a `undefined`.
  return aciertoProblemas === undefined ? conclusion : { ...conclusion, aciertoProblemasSinPista: aciertoProblemas };
}

/**
 * Un objetivo dominado en el diagnóstico empieza sin ejemplos resueltos: se retiran tantos pasos como
 * tiene su ejemplo más largo, así que no queda ninguno a la vista. Los demás empiezan con los ejemplos
 * completos (@DIAG-2.5).
 */
export function pasosRetiradosIniciales(dominado: boolean, pasosDeCadaEjemplo: readonly number[]): number {
  return dominado ? Math.max(0, ...pasosDeCadaEjemplo) : 0;
}
