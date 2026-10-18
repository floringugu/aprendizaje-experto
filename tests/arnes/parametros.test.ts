import { describe, expect, it } from 'vitest';
import { validarParametros } from '../../scripts/arnes/comun/parametros.ts';

const SECCIONES = new Set(['2.3', '3', '4']);

const VALIDO = {
  descripcion: 'Acierto mínimo para dar un objetivo por dominado.',
  valor: 0.85,
  seccion: ['4', '3'],
  nivel_evidencia: 'bien establecido',
  extrapolacion: true,
  nota: 'La cifra exacta es de la sección 4, que la declara extrapolación.',
};

function problemas(parametro: unknown): string[] {
  return validarParametros({ umbral: parametro }, SECCIONES);
}

describe('validarParametros', () => {
  it('acepta un parámetro completo', () => {
    expect(problemas(VALIDO)).toEqual([]);
    expect(problemas({ ...VALIDO, extrapolacion: false, nota: undefined })).toEqual([]);
  });

  it('exige que el fichero sea un objeto de parámetros', () => {
    expect(validarParametros([], SECCIONES)).toEqual([
      'config/parametros.json debe ser un objeto { "nombre_parametro": { … } }.',
    ]);
  });

  it('exige descripción, valor y la marca de extrapolación', () => {
    expect(problemas({ seccion: ['4'], nivel_evidencia: 'prometedor' })).toEqual([
      'config/parametros.json → umbral: falta «descripcion» (qué controla el parámetro).',
      'config/parametros.json → umbral: falta «valor».',
      'config/parametros.json → umbral: «extrapolacion» debe ser true o false.',
    ]);
  });

  it('rechaza campos desconocidos y secciones que el informe no tiene', () => {
    expect(problemas({ ...VALIDO, fuente: 'blog', seccion: ['4', '9'] })).toEqual([
      'config/parametros.json → umbral: campo desconocido «fuente». Los permitidos son: descripcion, valor, seccion, nivel_evidencia, extrapolacion, nota.',
      'config/parametros.json → umbral: la sección «9» no existe en docs/investigacion.md.',
    ]);
    expect(problemas({ ...VALIDO, seccion: [] })).toHaveLength(1);
  });

  it('solo acepta los niveles de evidencia del informe', () => {
    expect(problemas({ ...VALIDO, nivel_evidencia: 'probado' })[0]).toMatch(/«nivel_evidencia» debe ser uno de/);
  });

  it('una extrapolación del autor se marca como extrapolación y lleva nota', () => {
    expect(problemas({ ...VALIDO, nivel_evidencia: 'extrapolación del autor', extrapolacion: false })).toEqual([
      'config/parametros.json → umbral: un valor con nivel «extrapolación del autor» debe tener "extrapolacion": true.',
    ]);
    expect(problemas({ ...VALIDO, nota: ' ' })[0]).toMatch(/una extrapolación necesita «nota»/);
  });
});
