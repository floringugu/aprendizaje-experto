import { describe, expect, it } from 'vitest';
import { indiceDeEncabezados, LINEAS_POR_LECTURA, motivoDeIndice } from '../../scripts/arnes/comun/indice-markdown.ts';

/** Un Markdown con las líneas dadas y relleno hasta tener `total` líneas. */
function markdown(lineas: readonly string[], total: number): string {
  return [...lineas, ...Array.from({ length: total - lineas.length }, () => 'texto')].join('\n');
}

describe('indiceDeEncabezados', () => {
  it('da cada encabezado con su línea y la última de su sección', () => {
    const lineas = ['# Plan', '', '## 1. Uno', 'texto', '### 1.1 Detalle', 'texto', '## 2. Dos', 'texto'];
    expect(indiceDeEncabezados(lineas)).toEqual([
      { encabezado: '# Plan', desde: 1, hasta: 8 },
      { encabezado: '## 1. Uno', desde: 3, hasta: 6 },
      { encabezado: '### 1.1 Detalle', desde: 5, hasta: 6 },
      { encabezado: '## 2. Dos', desde: 7, hasta: 8 },
    ]);
  });

  it('no confunde un comentario dentro de un bloque de código con un encabezado', () => {
    const lineas = ['## Comandos', '```sh', '# Aplicar', 'git status', '```', '#sin espacio no cuenta'];
    expect(indiceDeEncabezados(lineas)).toEqual([{ encabezado: '## Comandos', desde: 1, hasta: 6 }]);
  });
});

describe('motivoDeIndice', () => {
  const largo = markdown(['# Plan', '## 1. Uno'], LINEAS_POR_LECTURA + 1);

  it('deja leer entero un .md corto, sin contar el salto de línea final como una línea más', () => {
    const corto = `${markdown(['# Corto'], LINEAS_POR_LECTURA)}\n`;
    expect(motivoDeIndice({ ruta: 'docs/corto.md', texto: corto, limite: undefined })).toBeUndefined();
  });

  it('deja leer una parte de un .md largo con limit', () => {
    expect(motivoDeIndice({ ruta: 'docs/plan.md', texto: largo, limite: LINEAS_POR_LECTURA })).toBeUndefined();
  });

  it('bloquea leer entero un .md largo, o con un limit mayor, y devuelve el índice', () => {
    for (const limite of [undefined, LINEAS_POR_LECTURA + 1]) {
      const motivo = motivoDeIndice({ ruta: 'docs/plan.md', texto: largo, limite });
      expect(motivo).toContain(`docs/plan.md tiene ${String(LINEAS_POR_LECTURA + 1)} líneas`);
      expect(motivo).toContain(`1-${String(LINEAS_POR_LECTURA + 1)} # Plan`);
      expect(motivo).toContain(`2-${String(LINEAS_POR_LECTURA + 1)} ## 1. Uno`);
    }
  });
});
