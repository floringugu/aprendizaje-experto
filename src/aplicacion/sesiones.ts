import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

/** De dónde sale una respuesta. Es la columna `contexto` de respuestas.csv (INST-1.3). */
export type ContextoRespuesta = 'diagnostico' | 'practica' | 'repaso' | 'intercalado' | 'retencion';

type TipoSesion = 'diagnostico' | 'practica' | 'repaso' | 'retencion';

export interface ItemPresentado {
  readonly id: string;
  readonly enunciado: string;
  /** Solo en los ítems en que se elige entre opciones. */
  readonly opciones?: readonly string[];
  /** Ausentes cuando mostrarlos daría una pista del tipo de problema (DIAG-1.3, INTE-3.1). */
  readonly objetivo?: string;
  readonly categoria?: string;
  /** Lo único que la persona puede hacer con el ítem antes de responder (RECU-1.2). */
  readonly acciones: readonly string[];
}

export interface EjemploPresentado {
  readonly id: string;
  readonly objetivo: string;
  /** Solo los pasos que no se han retirado (AYUD-1.2). */
  readonly pasos: readonly string[];
  /** Instrucciones de autoexplicación que se le muestran; vacío por defecto (AYUD-3.1). */
  readonly instruccionesAutoexplicacion: readonly string[];
}

type ElementoSesion =
  | { readonly tipo: 'item'; readonly item: ItemPresentado }
  | { readonly tipo: 'ejemplo'; readonly ejemplo: EjemploPresentado };

export interface Sesion {
  readonly tipo: TipoSesion;
  readonly intercalada: boolean;
  /** En el orden en que se presentan a la persona. */
  readonly elementos: readonly ElementoSesion[];
}

/** El feedback habla solo de la tarea (RECU-2.2). */
export interface Feedback {
  readonly correcta: boolean;
  readonly respuestaCorrecta: string;
  readonly explicacion: string;
}

interface Repaso {
  /** «repaso» de un ítem, o «retencion»: prueba diferida de un objetivo dominado (MAST-7). */
  readonly clase: 'repaso' | 'retencion';
  readonly objetivo: string;
  readonly item?: string;
  readonly fecha: Date;
}

export interface CasosDeSesiones {
  iniciarSesion(peticion: {
    readonly dominio: string;
    readonly tipo: TipoSesion;
    readonly objetivo?: string;
    readonly categoria?: string;
    readonly grupo?: string;
  }): Resultado<Sesion>;
  presentarItem(peticion: {
    readonly dominio: string;
    readonly item: string;
    readonly contexto: ContextoRespuesta;
  }): Resultado<ItemPresentado>;
  /** La persona estudia un ejemplo resuelto: el siguiente ítem que responda cuenta «tras ejemplo». */
  estudiarEjemplo(peticion: {
    readonly dominio: string;
    readonly objetivo: string;
    readonly ejemplo: string;
  }): Resultado<EjemploPresentado>;
  /** Recoge la respuesta. Hasta declarar la confianza no hay corrección ni feedback (CALI-1.1). */
  responderItem(peticion: {
    readonly dominio: string;
    readonly item: string;
    readonly contexto: ContextoRespuesta;
    readonly respuesta: string;
  }): Resultado<{ readonly esperandoConfianza: true }>;
  /** Registra el intento y devuelve el feedback (CALI-1.2, CALI-1.3). */
  declararConfianza(peticion: {
    readonly dominio: string;
    readonly item: string;
    readonly confianza: number;
  }): Resultado<Feedback>;
  consultarRepasos(peticion: PeticionDominio): Resultado<readonly Repaso[]>;
  /** Los horizontes de retención entre los que la persona elige para repasar los problemas (PLAN-3.2). */
  consultarHorizontes(peticion: PeticionDominio): Resultado<readonly string[]>;
  /** El horizonte decide cada cuánto se repasan los ítems de tipo «problema» (PLAN-3.1). */
  elegirHorizonte(peticion: { readonly dominio: string; readonly horizonte: string }): Resultado<null>;
}
