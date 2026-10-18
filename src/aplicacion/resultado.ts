/**
 * Resultado de un caso de uso que puede rechazar la petición (confianza fuera de escala,
 * evaluación con datos que faltan, objetivo todavía cerrado…).
 * `campo` indica qué dato falta o no es válido, cuando el rechazo es por un dato concreto: es el
 * nombre de la propiedad de la petición (por ejemplo, `percentil` o `aCiegas`). Así la interfaz sabe
 * qué casilla señalar sin depender del texto de `motivo`.
 */
export type Resultado<T> =
  { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly motivo: string; readonly campo?: string };

export function aceptar<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

/** `motivo` es la frase que verá la persona: explica por qué no se puede hacer lo que pidió. */
export function rechazar(motivo: string): Resultado<never> {
  return { ok: false, motivo };
}
