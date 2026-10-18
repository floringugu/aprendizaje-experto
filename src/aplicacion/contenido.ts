// Forma del contenido que aporta el autor: un fichero `contenido/<dominio>.json` por dominio
// (plan §0, «Formato del contenido»). La aplicación no genera contenido del dominio.

type TipoItem = 'hecho' | 'problema';

/** Respuesta de un ítem: o se elige entre opciones, o se escribe una de las aceptadas. */
type RespuestaContenido =
  { readonly opciones: readonly string[]; readonly correcta: string } | { readonly aceptadas: readonly string[] };

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
}

export interface EjemploResueltoContenido {
  readonly id: string;
  readonly pasos: readonly string[];
}

export interface ObjetivoContenido {
  readonly id: string;
  readonly instruccion: string;
  readonly ejemplos_resueltos: readonly EjemploResueltoContenido[];
}

/** Las categorías del mismo `grupo_parecidas` son las que se pueden intercalar entre sí. */
export interface CategoriaContenido {
  readonly id: string;
  readonly grupo_parecidas?: string;
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
}

export interface ContenidoDominio {
  readonly dominio: string;
  readonly objetivos: readonly ObjetivoContenido[];
  readonly categorias: readonly CategoriaContenido[];
  readonly items: readonly ItemContenido[];
  readonly tareas: readonly TareaContenido[];
}
