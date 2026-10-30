import { spawn } from 'node:child_process';
import type { Resultado } from './resultado.ts';
import { aceptar, rechazarPorCausa } from './resultado.ts';

// El texto de un PDF, con pdftotext de Poppler (plan §0, «Texto de un PDF»). Es un programa del PC, como
// LibreOffice, y se llama con `node:child_process`, sin puerto: los escenarios usan el pdftotext de verdad.

const PROGRAMA = 'pdftotext';
// `-raw` deja el texto en el orden en que está escrito en el PDF, sin recolocar columnas ni unir palabras
// partidas con guion. `-enc UTF-8` fija la codificación de salida. Los dos `-` son «PDF por la entrada
// estándar» y «texto por la salida estándar».
const ARGUMENTOS = ['-raw', '-enc', 'UTF-8', '-', '-'];
// pdftotext escribe un salto de página (`\f`) detrás del texto de cada página.
const FIN_DE_PAGINA = '\f';
// Poppler 24.02 (el de Ubuntu 24.04) cierra también la última línea de cada página con `\n`; el 26.01, no.
const FIN_DE_LINEA = '\n';

/**
 * Las páginas de la salida de pdftotext: se parte por `\f`, se descarta lo que va detrás del último y se
 * quita el `\n` final de cada página, si lo tiene, para que el texto no dependa de la versión de Poppler.
 */
function paginasDeLaSalida(salida: string): readonly string[] {
  const trozos = salida.split(FIN_DE_PAGINA);
  return trozos
    .slice(0, trozos.length - 1)
    .map((pagina) => (pagina.endsWith(FIN_DE_LINEA) ? pagina.slice(0, -FIN_DE_LINEA.length) : pagina));
}

/**
 * Las páginas del PDF, en orden, cada una con su texto. Lanza `pdftotext -raw -enc UTF-8 - -`, le pasa el
 * PDF por la entrada estándar y decodifica la salida en UTF-8 cuando ya está entera: un carácter puede
 * llegar partido entre dos trozos. pdftotext cierra cada página con `\f`, así que la salida se parte por
 * `\f`, se quita el último trozo, el que va detrás del último `\f`, y cada página pierde el `\n` final que
 * le ponen algunas versiones de Poppler. Una página sin texto da `''`.
 * Con `-raw`, «tam-» y «bién» siguen en dos líneas, sin unirse (@MATE-3.4).
 *
 * Rechaza con `causa`:
 * - `falta_poppler` si pdftotext no está instalado: el proceso no arranca (`ENOENT`);
 * - `pdf_ilegible` si pdftotext termina con error: un fichero que no es un PDF, o uno roto.
 */
export function textoDelPdf(pdf: Uint8Array): Promise<Resultado<readonly string[]>> {
  // La promesa nunca se rechaza: los dos fallos son un `Resultado` que se resuelve. Si `resolver` se llama
  // más de una vez (Node emite `error` y luego `close` cuando el programa no existe), vale la primera.
  return new Promise((resolver) => {
    const proceso = spawn(PROGRAMA, ARGUMENTOS);
    const trozos: Buffer[] = [];

    proceso.stdout.on('data', (trozo: Buffer) => {
      trozos.push(trozo);
    });
    // Si pdftotext termina antes de leer todo el PDF (un fichero que no es un PDF), escribir en su entrada
    // da `EPIPE`. Sin este manejador Node lo lanzaría y tumbaría el proceso; no hay nada que hacer, porque
    // el resultado lo decide el código de salida en `close`.
    proceso.stdin.on('error', () => {
      // Se ignora a propósito: ver el comentario de arriba.
    });
    proceso.on('error', () => {
      resolver(rechazarPorCausa('falta_poppler', 'Falta instalar Poppler (pdftotext) para leer PDF.'));
    });
    proceso.on('close', (codigo) => {
      if (codigo !== 0) {
        resolver(rechazarPorCausa('pdf_ilegible', 'No se ha podido leer el PDF: está roto o no es un PDF.'));
        return;
      }
      // Se decodifica al final y no trozo a trozo: un carácter UTF-8 puede llegar partido entre dos trozos.
      resolver(aceptar(paginasDeLaSalida(Buffer.concat(trozos).toString('utf8'))));
    });

    proceso.stdin.end(pdf);
  });
}
