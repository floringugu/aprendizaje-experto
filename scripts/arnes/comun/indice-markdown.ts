// Índice de los Markdown largos del repositorio: la regla del hook PreToolUse sobre Read
// (.claude/hooks/indice-markdown.ts). Separada del hook para poder probarla con tests unitarios.
//
// docs/plan.md, docs/investigacion.md, docs/arnes.md y docs/arnes-verificacion.md tienen cientos
// de líneas, y Claude casi nunca necesita más que una sección. Leer uno entero mete en el contexto
// miles de tokens que luego se vuelven a leer en cada llamada de la conversación. Por eso, si Claude
// intenta leer de una vez más de LINEAS_POR_LECTURA líneas de un .md así, el hook bloquea la lectura
// y le devuelve el índice de encabezados con sus líneas, para que lea solo la sección que necesita.

/** Líneas que se pueden leer de una vez de un .md. Un .md más corto se lee entero. */
export const LINEAS_POR_LECTURA = 200;

export interface LecturaPedida {
  /** Ruta del fichero tal como se le muestra a Claude, relativa a la raíz del repositorio. */
  readonly ruta: string;
  readonly texto: string;
  /** El campo limit de Read: cuántas líneas pide. Sin él, Read lee hasta el final. */
  readonly limite: number | undefined;
}

/** El motivo del bloqueo, con el índice, o undefined si la lectura puede seguir. */
export function motivoDeIndice(lectura: LecturaPedida): string | undefined {
  // Un fichero que acaba en salto de línea no tiene una línea vacía más al final.
  const lineas = lectura.texto.replace(/\n$/, '').split('\n');
  if (lineas.length <= LINEAS_POR_LECTURA) return undefined;
  if (lectura.limite !== undefined && lectura.limite <= LINEAS_POR_LECTURA) return undefined;
  return [
    `${lectura.ruta} tiene ${String(lineas.length)} líneas: no se lee entero. Busca lo que necesitas ` +
      `(Grep) o elige una sección del índice, y léela con Read usando offset y limit ` +
      `(hasta ${String(LINEAS_POR_LECTURA)} líneas por lectura).`,
    '',
    'Índice (líneas de cada sección y su encabezado):',
    ...indiceDeEncabezados(lineas).map(
      (seccion) => `${String(seccion.desde)}-${String(seccion.hasta)} ${seccion.encabezado}`,
    ),
  ].join('\n');
}

export interface Seccion {
  readonly encabezado: string;
  /** Línea del encabezado, contando desde 1, como el offset de Read. */
  readonly desde: number;
  /** Última línea de la sección: la anterior al siguiente encabezado del mismo nivel o superior. */
  readonly hasta: number;
}

/** Los encabezados (# …) del Markdown, sin los que caen dentro de un bloque de código. */
export function indiceDeEncabezados(lineas: readonly string[]): Seccion[] {
  const encabezados: { readonly texto: string; readonly nivel: number; readonly linea: number }[] = [];
  let dentroDeCodigo = false;
  for (const [indice, linea] of lineas.entries()) {
    // Un comentario de shell (# …) dentro de ``` no es un encabezado.
    if (linea.trimStart().startsWith('```')) dentroDeCodigo = !dentroDeCodigo;
    const nivel = /^(#{1,6}) /.exec(linea)?.[1]?.length;
    if (!dentroDeCodigo && nivel !== undefined) encabezados.push({ texto: linea, nivel, linea: indice + 1 });
  }
  return encabezados.map((encabezado, posicion) => {
    const siguiente = encabezados.slice(posicion + 1).find((otro) => otro.nivel <= encabezado.nivel);
    return {
      encabezado: encabezado.texto,
      desde: encabezado.linea,
      hasta: siguiente === undefined ? lineas.length : siguiente.linea - 1,
    };
  });
}
