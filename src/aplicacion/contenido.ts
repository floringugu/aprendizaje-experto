// Forma del contenido que aporta el autor: un fichero `contenido/<dominio>.json` por dominio
// (plan §0, «Formato del contenido»). La aplicación no genera contenido del dominio.

type TipoItem = 'hecho' | 'problema';

/**
 * De dónde sale una pieza redactada a partir del material (plan §0, campo `fuente`). Es opcional en
 * objetivos, categorías, ítems, ejemplos resueltos y tareas: el contenido escrito a mano no la lleva.
 */
export interface Fuente {
  readonly documento: string;
  /** La página, la diapositiva o el apartado, en texto libre («página 12»). */
  readonly lugar: string;
  /** El texto citado tal cual. */
  readonly fragmento: string;
}

interface RespuestaDeOpciones {
  readonly opciones: readonly string[];
  readonly correcta: string;
}

/** Respuesta de un ítem: o se elige entre opciones, o se escribe una de las aceptadas. */
type RespuestaContenido = RespuestaDeOpciones | { readonly aceptadas: readonly string[] };

export interface ItemContenido {
  readonly id: string;
  readonly objetivo: string;
  readonly categoria?: string;
  readonly tipo: TipoItem;
  /** Solo los ítems marcados se usan en el diagnóstico. */
  readonly diagnostico: boolean;
  readonly enunciado: string;
  readonly respuesta: RespuestaContenido;
  readonly feedback: string;
  readonly fuente?: Fuente;
}

/** Los ítems de un objetivo, en el orden del contenido. */
export function itemsDelObjetivo(items: readonly ItemContenido[], objetivo: string): readonly ItemContenido[] {
  return items.filter((item) => item.objetivo === objetivo);
}

export interface EjemploResueltoContenido {
  readonly id: string;
  readonly pasos: readonly string[];
  readonly fuente?: Fuente;
}

export interface ObjetivoContenido {
  readonly id: string;
  readonly instruccion: string;
  readonly ejemplos_resueltos: readonly EjemploResueltoContenido[];
  /** En un objetivo, cita de dónde sale su instrucción. */
  readonly fuente?: Fuente;
}

/** Las categorías del mismo `grupo_parecidas` son las que se pueden intercalar entre sí. */
export interface CategoriaContenido {
  readonly id: string;
  /**
   * Qué rasgos de un problema indican que se aplica la regla o el procedimiento de la categoría y, si
   * tiene grupo, cómo distinguirla de las demás del grupo. La lee la persona al revisar el borrador y la
   * IA al clasificar ítems en categorías ya aprobadas (MATE-2.3).
   */
  readonly descripcion: string;
  readonly grupo_parecidas?: string;
  /** La IA redacta las categorías como una pieza más del borrador (plan §0, «Categorías en el borrador»). */
  readonly fuente?: Fuente;
}

export interface NivelRubrica {
  readonly nivel: number;
  readonly descriptor: string;
}

export interface CriterioRubrica {
  readonly criterio: string;
  readonly niveles: readonly NivelRubrica[];
}

export interface TareaContenido {
  readonly id: string;
  readonly enunciado: string;
  readonly rubrica: readonly CriterioRubrica[];
  readonly fuente?: Fuente;
}

export interface ContenidoDominio {
  readonly dominio: string;
  readonly objetivos: readonly ObjetivoContenido[];
  readonly categorias: readonly CategoriaContenido[];
  readonly items: readonly ItemContenido[];
  readonly tareas: readonly TareaContenido[];
}

/**
 * Un ítem del contenido ya validado. Si es de respuesta escrita, tiene al menos una aceptada: así el
 * feedback siempre tiene una respuesta correcta que enseñar (@RECU-2.1).
 */
export interface ItemValidado extends ItemContenido {
  readonly respuesta: RespuestaDeOpciones | { readonly aceptadas: readonly [string, ...string[]] };
}

/**
 * Contenido que ha pasado `validarContenido` (formato-contenido.ts). Es el único que ven los casos de
 * uso: lo que el fichero tenga mal se dice al leerlo, no cuando una sesión llega a la pieza (D16).
 */
export interface ContenidoValidado extends ContenidoDominio {
  readonly items: readonly ItemValidado[];
}
