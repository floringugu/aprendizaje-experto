import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

/** Los cinco pasos del bucle semanal, en el orden del informe (BUCL-2.1). */
export type ClavePaso = 'resultados' | 'calibracion' | 'ajuste_ayuda' | 'repasos' | 'revision_plan';

/** Confianza y acierto en puntos de 0 a 100, igual que la escala de confianza (CALI-2.1). */
export interface Calibracion {
  readonly hayRespuestas: boolean;
  readonly confianzaMedia?: number;
  readonly acierto?: number;
  readonly diferencia?: number;
}

interface AjusteAyuda {
  readonly objetivo: string;
  readonly pasosRetiradosAntes: number;
  readonly pasosRetiradosDespues: number;
}

export interface ResultadoBucle {
  readonly pasos: readonly ClavePaso[];
  readonly resultados: {
    /** Fracción de 0 a 1 por objetivo con intentos sin ayuda en la semana. */
    readonly aciertoSinAyudaPorObjetivo: Readonly<Record<string, number>>;
    readonly pideAutoevaluacion: boolean;
  };
  readonly calibracion: Calibracion;
  readonly ajustes: readonly AjusteAyuda[];
  readonly repasos: { readonly ventanaDias: number; readonly cantidad: number };
  readonly revisionPlan: {
    readonly pideIntencion: boolean;
    readonly formatoIntencion: 'si X, entonces Y';
    readonly intencionAnterior?: string;
    readonly puedeConfirmarAnterior: boolean;
    readonly recordatorioSueno: boolean;
  };
}

export interface AperturaSesion {
  /** Cuántos bucles se han ejecutado al abrir la sesión: nunca más de uno (BUCL-1.2). */
  readonly bucles: number;
  readonly proximoBucle: Date;
}

export type IntencionDelPlan =
  { readonly accion: 'confirmar_anterior' } | { readonly accion: 'nueva'; readonly texto: string };

export interface CasosDeBucle {
  /** La persona abre la aplicación para estudiar; si toca, se ejecuta el bucle (BUCL-1). */
  abrirSesion(peticion: PeticionDominio): Resultado<AperturaSesion>;
  ejecutarBucle(peticion: PeticionDominio): Resultado<ResultadoBucle>;
  /** No se termina sin intención de implementación (BUCL-3.1). */
  terminarBucle(peticion: { readonly dominio: string; readonly intencion?: IntencionDelPlan }): Resultado<null>;
}
