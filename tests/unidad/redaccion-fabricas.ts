// Ayudantes compartidos de los tests de `redaccion` (redaccion, redaccion-ids, redaccion-colocacion,
// redaccion-reservados, redaccion-casos y redaccion-documento). No es un fichero de tests: vitest solo recoge
// los *.test.ts, así que aquí no se ejecuta nada.
import type { ItemContenido } from '../../src/aplicacion/contenido.ts';
import { guardarDocumento } from '../../src/aplicacion/material-guardado.ts';
import type { EjemploDeObjetivoAprobado } from '../../src/aplicacion/mesa.ts';
import type { Ficheros } from '../../src/aplicacion/puertos.ts';
import type { EntregaIncorporada } from '../../src/aplicacion/redaccion.ts';
import { ejemplo, item, reservado } from './revision-fabricas.ts';

export const DOMINIO = 'ficticio';
export const DOCUMENTO = 'apuntes.pdf';
/** Los bytes de «apuntes.pdf»: no hace falta que sean un PDF de verdad, nadie los lee en estos tests. */
export const BYTES_DEL_PDF = new Uint8Array([1, 2, 3, 4]);
export const RUTA_DEL_APROBADO = `contenido/${DOMINIO}.json`;
export const RUTA_DEL_BORRADOR = `contenido/borradores/${DOMINIO}.json`;
/** Una página web que se añade como documento: la compartían los tests de `redactarBorrador` y de `pdfDelDocumento`. */
export const URL_TEMA3 = 'https://ejemplo.org/tema3';

/** Da de alta un PDF en el material del dominio, como lo deja `anadirMaterial`. */
export function conPdfEnElMaterial(ficheros: Ficheros, nombre = DOCUMENTO, bytes = BYTES_DEL_PDF): void {
  guardarDocumento(ficheros, DOMINIO, { nombre, bytes, paginas: [`texto de ${nombre}`] });
}

/** Los mismos `ficheros`, apuntando las rutas que se leen y las que se escriben a través de ellos. */
export function ficherosQueApuntan(base: Ficheros) {
  const lecturas: string[] = [];
  const escrituras: string[] = [];
  const ficheros: Ficheros = {
    leer: (ruta) => {
      lecturas.push(ruta);
      return base.leer(ruta);
    },
    escribir: (ruta, bytes) => {
      escrituras.push(ruta);
      base.escribir(ruta, bytes);
    },
  };
  return { ficheros, lecturas, escrituras };
}

/** Las `falta` de lo que se ha apartado, en el orden en que `incorporarEntrega` las da. */
export const faltas = ({ apartadas }: EntregaIncorporada): string[] => apartadas.map(({ falta }) => falta);

/** La misma pieza con otro id: lo que se espera de una pieza a la que `incorporarEntrega` cambia el id. */
export function conId<Pieza extends { readonly id: string }>(pieza: Pieza, id: string): Pieza {
  return { ...pieza, id };
}

/** Un ejemplo que va aparte: lleva el `objetivo` del que cuelga. */
export function ejemploAparte(id: string, objetivoDelEjemplo: string): EjemploDeObjetivoAprobado {
  return { ...ejemplo(id), objetivo: objetivoDelEjemplo };
}

/** Una entrega de la IA con esas listas: el JSON tal como lo da, con un `dominio` que no se lee. */
export const entregaCon = (listas: Record<string, unknown>): Record<string, unknown> => ({
  dominio: 'ficticio',
  ...listas,
});

/** Un ítem como lo entrega la IA al pedir reservados: de ese objetivo (por defecto O1) y con `reservado: true`. */
export const itemReservado = (id: string, objetivoDelItem = 'O1'): ItemContenido =>
  reservado(item(id, undefined, objetivoDelItem));
