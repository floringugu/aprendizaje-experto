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

/**
 * Respuesta de un ítem numérico (RECU-5): la persona escribe un número y, si el ítem la tiene, su unidad.
 */
interface RespuestaNumerica {
  readonly valor: number;
  /** Todas las formas de escribir la unidad que valen, con la que se enseña en primer lugar. Sin ellas, sin unidad. */
  readonly unidades?: readonly string[];
  /**
   * Margen relativo (0,05 es el 5 %), entre 0 y 1. Sin él vale `tolerancia_numerica_relativa`, de
   * config/parametros.json. Un valor 0 no la lleva: el margen es relativo y sobre 0 no deja nada.
   */
  readonly tolerancia?: number;
}

/**
 * Respuesta de un ítem: o se elige entre opciones, o se escribe una de las aceptadas, o se escribe un
 * número. Una respuesta con `valor` es numérica. Es un solo ítem con tres respuestas posibles, y no dos
 * tipos de ítem: quien descarta la numérica pregunta por la respuesta (`'valor' in item.respuesta`), y
 * así lo hace ya el soporte de aceptación.
 */
type RespuestaContenido = RespuestaDeOpciones | { readonly aceptadas: readonly string[] } | RespuestaNumerica;

export interface ItemContenido {
  readonly id: string;
  readonly objetivo: string;
  readonly categoria?: string;
  readonly tipo: TipoItem;
  /** Solo los ítems marcados se usan en el diagnóstico. */
  readonly diagnostico: boolean;
  /**
   * Un ítem reservado mide la transferencia: solo cuenta para pasar a la fase avanzada y en las pruebas
   * de retención, y se presenta una sola vez (plan §0, «Transferencia»; MAST-8). Sin el campo, no lo es.
   */
  readonly reservado?: boolean;
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
  /** Un SVG que acompaña a los pasos (MATE-2.7); el formato del contenido solo deja entrar SVG. */
  readonly diagrama?: string;
  readonly fuente?: Fuente;
}

export interface ObjetivoContenido {
  readonly id: string;
  readonly instruccion: string;
  readonly ejemplos_resueltos: readonly EjemploResueltoContenido[];
  /** Un SVG que acompaña a la instrucción (MATE-2.7); el formato del contenido solo deja entrar SVG. */
  readonly diagrama?: string;
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
 * feedback siempre tiene una respuesta correcta que enseñar (@RECU-2.1). Si es numérico y trae
 * `unidades`, trae al menos una: así se sabe cuál enseñar y si la respuesta tiene que llevar unidad.
 */
export interface ItemValidado extends ItemContenido {
  readonly respuesta:
    | RespuestaDeOpciones
    | { readonly aceptadas: readonly [string, ...string[]] }
    | (RespuestaNumerica & { readonly unidades?: readonly [string, ...string[]] });
}

/**
 * Contenido que ha pasado `validarContenido` (formato-contenido.ts). Es el único que ven los casos de
 * uso: lo que el fichero tenga mal se dice al leerlo, no cuando una sesión llega a la pieza (D16).
 */
export interface ContenidoValidado extends ContenidoDominio {
  readonly items: readonly ItemValidado[];
}
