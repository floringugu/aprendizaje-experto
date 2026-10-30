import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
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

  it('una frase partida en dos líneas da dos líneas, sin unirlas (regla que la feature no cubre)', async () => {
    const pdf = pdfDePrueba([['La regla R1 también se aplica', 'a los casos límite.']]);

    expect(await paginasDe(pdf)).toEqual(['La regla R1 también se aplica\na los casos límite.']);
  });

  it('@MATE-3.4 una palabra partida con guion a final de línea sigue en dos líneas', async () => {
    const pdf = pdfDePrueba([['La regla R1 tam-', 'bién se aplica a los casos límite.']]);

    expect(await paginasDe(pdf)).toEqual(['La regla R1 tam-\nbién se aplica a los casos límite.']);
  });

  it('lee las vocales con tilde y la eñe de cada página como UTF-8 (regla que la feature no cubre)', async () => {
    const pdf = pdfDePrueba([['también', 'límite', 'año']]);

    expect(await paginasDe(pdf)).toEqual(['también\nlímite\naño']);
  });

  it('da una entrada por página y en orden, para leer la página 12 con su índice (regla que la feature no cubre)', async () => {
    const paginas = Array.from({ length: 12 }, (_, posicion) => [`Texto de la página ${String(posicion + 1)}`]);

    const texto = await paginasDe(pdfDePrueba(paginas));

    expect(texto).toHaveLength(paginas.length);
    expect(texto[0]).toBe('Texto de la página 1');
    expect(texto[11]).toBe('Texto de la página 12');
  });

  it('una página sin texto da la cadena vacía y no descoloca las demás (regla que la feature no cubre)', async () => {
    const pdf = pdfDePrueba([['Primera'], [], ['Tercera']]);

    expect(await paginasDe(pdf)).toEqual(['Primera', '', 'Tercera']);
  });

  it('un PDF de una sola página sin texto da una lista con la cadena vacía (regla que la feature no cubre)', async () => {
    expect(await paginasDe(pdfDePrueba([[]]))).toEqual(['']);
  });

  it('unos bytes que no son un PDF se rechazan con pdf_ilegible (regla que la feature no cubre)', async () => {
    const resultado = await textoDelPdf(bytesDe('esto no es un PDF'));

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('un fichero sin ningún byte se rechaza con pdf_ilegible (regla que la feature no cubre)', async () => {
    const resultado = await textoDelPdf(new Uint8Array());

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('un PDF cortado por la mitad se rechaza con pdf_ilegible (regla que la feature no cubre)', async () => {
    const entero = pdfDePrueba([['La regla R1 también se aplica a los casos límite.']]);
    const mitad = entero.slice(0, entero.length / 2);

    const resultado = await textoDelPdf(mitad);

    expect(resultado).toMatchObject({ ok: false, causa: 'pdf_ilegible' });
  });

  it('quita el «\\n» con el que Poppler 24.02 cierra cada página, para dar lo mismo que el 26.01 (regla que la feature no cubre)', async () => {
    // Un pdftotext falso, delante en el PATH, que escribe lo que da Poppler 24.02 con tres páginas, la segunda sin texto.
    const carpeta = mkdtempSync(join(tmpdir(), 'poppler-24-'));
    const programa = "#!/bin/sh\ncat > /dev/null\nprintf 'Primera\\nlínea\\n\\f\\fTercera\\n\\f'\n";
    writeFileSync(join(carpeta, 'pdftotext'), programa, { mode: 0o755 });
    vi.stubEnv('PATH', `${carpeta}${delimiter}${process.env['PATH'] ?? ''}`);
    try {
      expect(await paginasDe(pdfDePrueba([['Texto']]))).toEqual(['Primera\nlínea', '', 'Tercera']);
    } finally {
      rmSync(carpeta, { recursive: true });
    }
  });

  it('sin pdftotext instalado se rechaza con falta_poppler (regla que la feature no cubre)', async () => {
    const carpetaVacia = mkdtempSync(join(tmpdir(), 'sin-poppler-'));
    vi.stubEnv('PATH', carpetaVacia);
    try {
      const resultado = await textoDelPdf(pdfDePrueba([['Texto']]));

      expect(resultado).toMatchObject({ ok: false, causa: 'falta_poppler' });
    } finally {
      rmSync(carpetaVacia, { recursive: true });
    }
  });

  it('un rechazo trae el motivo que verá la persona (regla que la feature no cubre)', async () => {
    const resultado = await textoDelPdf(bytesDe('esto no es un PDF'));

    expect(resultado.ok).toBe(false);
    expect(resultado.ok ? '' : resultado.motivo).not.toBe('');
  });
});
