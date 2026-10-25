/**
 * Lo que el contenido da por bueno: elegir la opción correcta, o escribir una de las aceptadas. Una
 * respuesta escrita tiene al menos una aceptada: el contenido se valida al leerlo.
 */
type RespuestaEsperada =
  | { readonly opciones: readonly string[]; readonly correcta: string }
  | { readonly aceptadas: readonly [string, ...string[]] };

/** Todas las respuestas que se corrigen como acertadas. */
function respuestasAceptadas(esperada: RespuestaEsperada): readonly string[] {
  return 'aceptadas' in esperada ? esperada.aceptadas : [esperada.correcta];
}

/**
 * La respuesta que el feedback enseña como correcta (@RECU-2.1): la opción correcta o, en una
 * respuesta escrita, la primera de las aceptadas, que es la que el autor pone como principal.
 */
export function respuestaMostrada(esperada: RespuestaEsperada): string {
  return 'aceptadas' in esperada ? esperada.aceptadas[0] : esperada.correcta;
}

/**
 * Deja la respuesta en una forma comparable: sin espacios en los extremos, con los espacios repetidos
 * reducidos a uno y en minúsculas (@RECU-3.1, @RECU-3.2). Los acentos se conservan: ninguna regla pide
 * ignorarlos, así que «proporcion» no cuenta como «proporción». También decide cuándo dos opciones de un
 * ítem son la misma (MATE-2.5): `formato-contenido.ts` usa esta misma función para que elegir una opción
 * repetida no pueda contar como acierto.
 */
export function normalizar(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * La corrección es siempre automática: la respuesta se compara con las que da por buenas el contenido
 * del autor, y nunca se pregunta a la persona si cree que ha acertado (@DIAG-1.2, @RECU-3.3).
 */
export function esCorrecta(respuesta: string, esperada: RespuestaEsperada): boolean {
  const respuestaNormalizada = normalizar(respuesta);
  return respuestasAceptadas(esperada).some((aceptada) => normalizar(aceptada) === respuestaNormalizada);
}
