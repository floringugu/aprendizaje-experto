import type { CriterioRubrica } from './contenido.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

export interface TareaPresentada {
  readonly tarea: string;
  readonly enunciado: string;
  readonly rubrica: readonly CriterioRubrica[];
  /** Siempre falso: la persona no puntúa su propio trabajo (TARE-1.2). */
  readonly pideAutoevaluacion: boolean;
}

export interface TareaListada {
  readonly tarea: string;
  readonly practicada: boolean;
}

export interface CriterioEvaluado {
  readonly criterio: string;
  readonly nivel: number;
  readonly descriptorNivel: string;
  readonly descriptorNivelMaximo: string;
}

export interface EvaluacionTarea {
  readonly tarea: string;
  readonly criterios: readonly CriterioEvaluado[];
}

/** Lo que da el evaluador externo; la aplicación no puntúa ni calcula percentiles. */
export interface PeticionEvaluacionExterna {
  readonly dominio: string;
  readonly tarea: string;
  /** AAAA-MM-DD; vacía si no se indica. */
  readonly fecha: string;
  readonly percentil: number;
  /** `undefined` cuando no se indica si la evaluación fue a ciegas (TARE-2.2). */
  readonly aCiegas: boolean | undefined;
  /** Nivel dado por el evaluador en cada criterio de la rúbrica. */
  readonly niveles: Readonly<Record<string, number>>;
}

/** Avisos que acompañan al nivel; son códigos, el texto sale del catálogo de textos. */
export type CodigoAviso = 'nivel_experto_lo_deciden_evaluaciones_externas' | 'definicion_es_convencion_no_estandar';

export type MotivoDescarte = 'percentil_bajo' | 'no_a_ciegas' | 'tarea_practicada' | 'separacion_insuficiente';

export interface NivelExperto {
  readonly cumpleDefinicionOperativa: boolean;
  readonly avisos: readonly CodigoAviso[];
  readonly descartadas: readonly { readonly tarea: string; readonly motivo: MotivoDescarte }[];
}

export interface CasosDeTareas {
  /** Presenta la siguiente tarea no practicada y la marca como practicada (TARE-1.1). */
  pedirTarea(peticion: PeticionDominio): Resultado<TareaPresentada>;
  consultarTareas(peticion: PeticionDominio): Resultado<readonly TareaListada[]>;
  registrarEvaluacionExterna(peticion: PeticionEvaluacionExterna): Resultado<null>;
  consultarEvaluacionTarea(peticion: { readonly dominio: string; readonly tarea: string }): Resultado<EvaluacionTarea>;
  /** También responde a «consultar su nivel»: el nivel lo deciden las evaluaciones externas. */
  evaluarNivelExperto(peticion: PeticionDominio): Resultado<NivelExperto>;
}
