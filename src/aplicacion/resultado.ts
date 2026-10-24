/**
 * Resultado de un caso de uso que puede rechazar la petición (confianza fuera de escala,
 * evaluación con datos que faltan, objetivo todavía cerrado…).
 * `campo` indica qué dato falta o no es válido, cuando el rechazo es por un dato concreto: es el
 * nombre de la propiedad de la petición (por ejemplo, `percentil` o `aCiegas`). Así la interfaz sabe
 * qué casilla señalar sin depender del texto de `motivo`.
 * `causa` es un código que distingue rechazos que no son por un dato (por ejemplo, `falta_libreoffice`
 * frente a `tipo_no_admitido` al añadir material), también sin depender del texto de `motivo`.
 */
export type Resultado<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly motivo: string; readonly campo?: string; readonly causa?: string };

export function aceptar<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

/** `motivo` es la frase que verá la persona: explica por qué no se puede hacer lo que pidió. */
export function rechazar(motivo: string): Resultado<never> {
  return { ok: false, motivo };
}

/** Rechaza por un dato concreto de la petición: `campo` es la casilla que la interfaz señala. */
export function rechazarElCampo(campo: string, motivo: string): Resultado<never> {
  return { ok: false, motivo, campo };
}

/** Rechaza por algo que no es un dato de la petición: `causa` es el código que la interfaz distingue. */
export function rechazarPorCausa(causa: string, motivo: string): Resultado<never> {
  return { ok: false, motivo, causa };
}
