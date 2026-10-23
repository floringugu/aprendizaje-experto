// La ruta de un dominio: los objetivos que la persona tiene que dominar, en el orden del contenido.

/** Objetivos que quedan por dominar, en el orden del contenido: son la ruta (@DIAG-2.1). */
export function objetivosPendientes(objetivos: readonly string[], dominados: ReadonlySet<string>): readonly string[] {
  return objetivos.filter((objetivo) => !dominados.has(objetivo));
}
