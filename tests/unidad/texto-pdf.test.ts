import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { textoDelPdf } from '../../src/aplicacion/texto-pdf.ts';
import { pdfDePrueba } from '../aceptacion/soporte/pdf.ts';

/** Los bytes de un texto cualquiera: pdftotext no los puede leer como PDF. */
function bytesDe(texto: string): Uint8Array {
  return new Uint8Array(Buffer.from(texto, 'utf8'));
}

/** Las páginas del resultado; si el resultado es un rechazo, el test falla con su motivo. */
async function paginasDe(pdf: Uint8Array): Promise<readonly string[]> {
  const resultado = await textoDelPdf(pdf);
  if (!resultado.ok) {
    throw new Error(`Se esperaban las páginas y se rechazó: ${resultado.motivo}`);
  }
  return resultado.valor;
}

describe('textoDelPdf', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('@MATE-3.3 una frase partida en dos líneas da dos líneas, sin unirlas', async () => {
    const pdf = pdfDePrueba([['La regla R1 también se aplica', 'a los casos límite.']]);

    expect(await paginasDe(pdf)).toEqual(['La regla R1 también se aplica\na los casos límite.']);
  });

  it('@MATE-3.4 una palabra partida con guion a final de línea sigue en dos líneas', async () => {
    const pdf = pdfDePrueba([['La regla R1 tam-', 'bién se aplica a los casos límite.']]);

    expect(await paginasDe(pdf)).toEqual(['La regla R1 tam-\nbién se aplica a los casos límite.']);
  });

  it('@MATE-3.3 lee las vocales con tilde y la eñe de cada página como UTF-8', async () => {
    const pdf = pdfDePrueba([['también', 'límite', 'año']]);

    expect(await paginasDe(pdf)).toEqual(['también\nlímite\naño']);
  });

  it('@MATE-3.3 da una entrada por página y en orden, para leer la página 12 con su índice', async () => {
    const paginas = Array.from({ length: 12 }, (_, posicion) => [`Texto de la página ${String(posicion + 1)}`]);

    const texto = await paginasDe(pdfDePrueba(paginas));

    expect(texto).toHaveLength(paginas.length);
    expect(texto[0]).toBe('Texto de la página 1');
    expect(texto[11]).toBe('Texto de la página 12');
  });

  it('@MATE-3.3 una página sin texto da la cadena vacía y no descoloca las demás', async () => {
    const pdf = pdfDePrueba([['Primera'], [], ['Tercera']]);

    expect(await paginasDe(pdf)).toEqual(['Primera', '', 'Tercera']);
  });

  it('@MATE-3.3 un PDF de una sola página sin texto da una lista con la cadena vacía', async () => {
    expect(await paginasDe(pdfDePrueba([[]]))).toEqual(['']);
  });

  it('@MATE-3.3 unos bytes que no son un PDF se rechazan con pdf_ilegible', async () => {
    const resultado = await textoDelPdf(bytesDe('esto no es un PDF'));

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('@MATE-3.3 un fichero sin ningún byte se rechaza con pdf_ilegible', async () => {
    const resultado = await textoDelPdf(new Uint8Array());

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('@MATE-3.3 un PDF cortado por la mitad se rechaza con pdf_ilegible', async () => {
    const entero = pdfDePrueba([['La regla R1 también se aplica a los casos límite.']]);
    const mitad = entero.slice(0, entero.length / 2);

    const resultado = await textoDelPdf(mitad);

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('@MATE-3.3 sin pdftotext instalado se rechaza con falta_poppler', async () => {
    const carpetaVacia = mkdtempSync(join(tmpdir(), 'sin-poppler-'));
    vi.stubEnv('PATH', carpetaVacia);
    try {
      const resultado = await textoDelPdf(pdfDePrueba([['Texto']]));

      expect(resultado).toMatchObject({ ok: false, causa: 'falta_poppler' });
    } finally {
      rmSync(carpetaVacia, { recursive: true });
    }
  });

  it('@MATE-3.3 un rechazo trae el motivo que verá la persona', async () => {
    const resultado = await textoDelPdf(bytesDe('esto no es un PDF'));

    expect(resultado.ok).toBe(false);
    expect(resultado.ok ? '' : resultado.motivo).not.toBe('');
  });
});
