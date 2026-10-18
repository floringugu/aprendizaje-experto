import { describe, expect, it } from 'vitest';
import { areaDe, expresionEtiquetasCucumber } from '../../scripts/arnes/comun/alcance.ts';
import { citasEnTexto } from '../../scripts/arnes/comun/citas.ts';
import { leerSeccionesDelInforme, seccionesDelInforme } from '../../scripts/arnes/comun/informe.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

describe('seccionesDelInforme', () => {
  it('saca los números de sección de los encabezados ## y ###', () => {
    const texto = '# Título\n## 1. Intro\n### 2.2 Técnicas\n#### 2.2.1 No cuenta\n## Bibliografía\ntexto ## 3. no\n';
    expect(seccionesDelInforme(texto)).toEqual(new Set(['1', '2.2']));
  });

  it('encuentra en el informe real las secciones que usan los parámetros y las features', () => {
    const secciones = leerSeccionesDelInforme(RAIZ);
    for (const seccion of ['2.2', '2.3', '2.4', '2.5', '2.6', '3', '4', '5', '6']) {
      expect(secciones).toContain(seccion);
    }
  });
});

describe('citasEnTexto', () => {
  it('encuentra IDs con número, con su línea, e ignora prefijos sueltos', () => {
    const texto = '// @MAST-1.2: umbral\nconst a = 1; // @MAST y @CALI-3\n';
    expect(citasEnTexto(texto, 'src/a.ts', 'codigo')).toEqual([
      { id: 'MAST-1.2', fichero: 'src/a.ts', linea: 1, zona: 'codigo' },
      { id: 'CALI-3', fichero: 'src/a.ts', linea: 2, zona: 'codigo' },
    ]);
  });
});

describe('alcance', () => {
  it('el área de un ID es su prefijo', () => {
    expect(areaDe('MAST-1.2')).toBe('MAST');
    expect(areaDe('MAST')).toBe('MAST');
  });

  it('las áreas fuera de alcance se excluyen de Cucumber por etiqueta', () => {
    expect(expresionEtiquetasCucumber([])).toBe('');
    expect(expresionEtiquetasCucumber(['CALI', 'HORA'])).toBe('not (@CALI or @HORA)');
  });
});
