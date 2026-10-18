import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import type { Sesion } from './sesiones.ts';

interface PeticionObjetivo {
  readonly dominio: string;
  readonly objetivo: string;
}

export type Fase = 'diagnostico' | 'novato' | 'intermedio' | 'avanzado_experto';

/** «cerrado»: aún no se puede practicar. «abierto»: se practica. «dominado»: superó el umbral. */
type EstadoObjetivo = 'cerrado' | 'abierto' | 'dominado';

export interface ProgresoObjetivo {
  readonly objetivo: string;
  readonly estado: EstadoObjetivo;
  /** Fracción de 0 a 1; `undefined` mientras algún ítem no tiene intento (MAST-1.3). */
  readonly aciertoSinAyuda?: number;
  readonly itemsSinIntento: number;
  readonly pasosRetirados: number;
  readonly enColaDePractica: boolean;
}

export interface Progreso {
  readonly fase: Fase;
  readonly objetivoActual?: string;
  readonly objetivos: readonly ProgresoObjetivo[];
  /** Objetivos pendientes de dominar, en el orden en que se practican. */
  readonly ruta: readonly string[];
}

export interface AperturaDominio {
  readonly diagnosticoPendiente: boolean;
  readonly diagnostico?: Sesion;
}

/** No incluye ninguna estimación de tiempo ni fecha prevista (DIAG-3.1). */
export interface ResultadoDiagnostico {
  readonly fase: Fase;
  readonly ruta: readonly string[];
  readonly objetivosDominados: readonly string[];
  readonly aciertoPorObjetivo: Readonly<Record<string, number>>;
  /** Fracción de problemas de categorías intercalables acertados sin pista del tipo. */
  readonly aciertoProblemasSinPista?: number;
}

export interface ObjetivoConsultado {
  readonly objetivo: string;
  readonly instruccion: string;
  /** Lo que la persona puede hacer con el objetivo; nunca darlo por dominado (MAST-3.2). */
  readonly acciones: readonly string[];
}

export interface EvaluacionObjetivo {
  readonly dominado: boolean;
  readonly aciertoSinAyuda?: number;
  readonly itemsSinIntento: number;
}

export interface EvaluacionFase {
  readonly fase: Fase;
  readonly aciertoProblemasSinPista?: number;
}

export interface CasosDeDominio {
  abrirDominio(peticion: PeticionDominio): Resultado<AperturaDominio>;
  terminarDiagnostico(peticion: PeticionDominio): Resultado<ResultadoDiagnostico>;
  consultarProgreso(peticion: PeticionDominio): Resultado<Progreso>;
  consultarObjetivo(peticion: PeticionObjetivo): Resultado<ObjetivoConsultado>;
  /** Recalcula si el objetivo está dominado con el último intento de cada ítem (MAST-1). */
  evaluarObjetivo(peticion: PeticionObjetivo): Resultado<EvaluacionObjetivo>;
  /** Recalcula la fase con el acierto en problemas intercalados sin pista (MAST-6). */
  evaluarFase(peticion: PeticionDominio): Resultado<EvaluacionFase>;
}
