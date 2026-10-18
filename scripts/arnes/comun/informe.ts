// Datos que el arnés extrae de docs/investigacion.md, la única fuente de verdad.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const RUTA_INFORME = 'docs/investigacion.md';

/** Números de sección del informe («1», «2.2», «4»…), sacados de sus encabezados. */
export function seccionesDelInforme(texto: string): Set<string> {
  const secciones = new Set<string>();
  for (const coincidencia of texto.matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.? /gm)) {
    if (coincidencia[1] !== undefined) secciones.add(coincidencia[1]);
  }
  return secciones;
}

export function leerSeccionesDelInforme(raiz: string): Set<string> {
  return seccionesDelInforme(readFileSync(path.join(raiz, RUTA_INFORME), 'utf8'));
}
