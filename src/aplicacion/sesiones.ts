import type { FalloNumerico } from '../dominio/correccion.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

/**
 * De dónde sale una respuesta. Es la columna `contexto` de respuestas.csv (INST-1.3). La respuesta a
 * un ítem reservado se registra siempre como `transferencia`, se haya presentado donde se haya
 * presentado (MAST-8.4, INTE-5.4). `exploracion` (AYUD-5) y `prepregunta` (AYUD-8) se responden antes
 * de la instrucción y no son intentos del ítem para el dominio (MAST-1.4 a 1.7). `reintento` es la
 * vuelta, en la misma sesión, de un ítem que aún no está cerrado en ella (RECU-6): no pide confianza.
 * `experimento_estudio` y `experimento_prueba` son los de los experimentos de CALI-12 y CALI-13.
 */
export type ContextoRespuesta =
  | 'diagnostico'
  | 'practica'
  | 'repaso'
  | 'intercalado'
  | 'retencion'
  | 'exploracion'
  | 'prepregunta'
  | 'transferencia'
  | 'reintento'
  | 'experimento_estudio'
  | 'experimento_prueba';

type TipoSesion = 'diagnostico' | 'practica' | 'repaso' | 'retencion';

/** Lo que se puede hacer con un ítem presentado: ni ver la respuesta ni darlo por sabido (RECU-1.2). */
export type AccionDeItem = 'responder';

export interface ItemPresentado {
  readonly id: string;
  readonly enunciado: string;
  /** Solo en los ítems en que se elige entre opciones. */
  readonly opciones?: readonly string[];
  /**
   * Solo en los ítems numéricos, que no llevan `opciones`: qué escribe la persona. `numero_con_unidad` si
   * el ítem tiene unidades y `numero` si no (RECU-4.2, RECU-5.8).
   */
  readonly entrada?: 'numero_con_unidad' | 'numero';
  /** Ausentes cuando mostrarlos daría una pista del tipo de problema (DIAG-1.3, INTE-3.1). */
  readonly objetivo?: string;
  readonly categoria?: string;
  /** Lo único que la persona puede hacer con el ítem antes de responder (RECU-1.2). */
  readonly acciones: readonly AccionDeItem[];
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
  /** `reintento`: el ítem vuelve en esta sesión y se presenta y se responde con el contexto `reintento` (RECU-6). */
  | { readonly tipo: 'item'; readonly item: ItemPresentado; readonly reintento?: true }
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
  /** En un ítem numérico, el valor con coma decimal y la primera unidad: «9,81 m/s²» (RECU-5.11). */
  readonly respuestaCorrecta: string;
  readonly explicacion: string;
  /**
   * Solo en un ítem numérico incorrecto: qué parte de la respuesta falla, el margen que se acepta si
   * falla el valor y cómo se escribe un número si no se entendió (RECU-5.7, RECU-5.9 a RECU-5.13).
   */
  readonly numerico?: FalloNumerico;
}

/** Lo que sigue a una respuesta: declarar la confianza o, en un reintento, el feedback (RECU-6.3). */
type RespuestaRecogida =
  | { readonly esperandoConfianza: true }
  | { readonly esperandoConfianza: false; readonly feedback: Feedback };

export interface Repaso {
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
  /**
   * Lo que queda por presentar de la sesión en curso, en el orden en que se presenta: lo que la persona
   * aún no ha respondido y, en su sitio, los ítems que vuelven (RECU-6), marcados con `reintento`. La
   * sesión en curso es la última que se inició, o el diagnóstico mientras esté pendiente. Sin elementos,
   * la sesión ha terminado.
   */
  consultarSesion(peticion: PeticionDominio): Resultado<Sesion>;
  /**
   * La persona deja la sesión en curso. Se acepta aunque queden ítems por volver, y esos ítems no
   * pasan a la sesión siguiente (RECU-6.7).
   */
  terminarSesion(peticion: PeticionDominio): Resultado<null>;
  /**
   * Recoge la respuesta. Hasta declarar la confianza no hay corrección ni feedback (CALI-1.1), salvo en
   * un reintento, que no la pide: registra el intento y devuelve ya el feedback (RECU-6.3, CALI-1.4).
   */
  responderItem(peticion: {
    readonly dominio: string;
    readonly item: string;
    readonly contexto: ContextoRespuesta;
    readonly respuesta: string;
  }): Resultado<RespuestaRecogida>;
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
