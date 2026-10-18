/** Lo que el contenido da por bueno: elegir la opción correcta, o escribir una de las aceptadas. */
type RespuestaEsperada =
  { readonly opciones: readonly string[]; readonly correcta: string } | { readonly aceptadas: readonly string[] };

/** Todas las respuestas que se corrigen como acertadas; la primera es la que se enseña en el feedback. */
export function respuestasAceptadas(esperada: RespuestaEsperada): readonly string[] {
  return 'aceptadas' in esperada ? esperada.aceptadas : [esperada.correcta];
}

/**
 * La corrección es siempre automática: la respuesta se compara con las que da por buenas el contenido
 * del autor, y nunca se pregunta a la persona si cree que ha acertado (@DIAG-1.2).
 */
export function esCorrecta(respuesta: string, esperada: RespuestaEsperada): boolean {
  return respuestasAceptadas(esperada).includes(respuesta);
}
