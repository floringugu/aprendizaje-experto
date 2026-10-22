import { describe, expect, it } from 'vitest';
import { frasesVagasDeFeature, leerFrasesVagas } from '../../scripts/arnes/comun/frases-vagas.ts';
import { directorioTemporal, escribirFicheros } from './temporal.ts';

function feature(pasos: string): string {
  return `# language: es
Característica: Ejemplo

  Escenario: Uno
${pasos}
`;
}

function frases(pasos: string): string[] {
  return frasesVagasDeFeature(feature(pasos), 'features/x.feature').map(({ mensaje }) => mensaje);
}

describe('frasesVagasDeFeature', () => {
  it('marca una frase vaga en un Entonces, con el fichero, la línea y el porqué', () => {
    const problemas = frasesVagasDeFeature(
      feature('    Dado un objetivo\n    Entonces la ficha se muestra correctamente'),
      'features/x.feature',
    );
    expect(problemas.map(({ fichero, linea }) => ({ fichero, linea }))).toEqual([
      { fichero: 'features/x.feature', linea: 6 },
    ]);
    expect(problemas[0]?.mensaje).toMatch(
      /^Frase vaga «correctamente» en «Entonces la ficha se muestra correctamente»: /,
    );
  });

  it('marca también los Y y Pero que siguen a un Entonces', () => {
    expect(
      frases('    Entonces el estado es «dominado»\n    Y el resto funciona\n    Pero tarda poco y es rápido'),
    ).toEqual([expect.stringMatching(/«funciona»/), expect.stringMatching(/«rápido»/)]);
  });

  it('no mira los Dado ni los Cuando, ni sus Y', () => {
    expect(frases('    Dado algunos objetivos\n    Y varios intentos\n    Cuando responde correctamente')).toEqual([]);
  });

  it('busca palabras enteras: «funciona» dentro de «funcionario» o «etc» dentro de «Ketc» no cuentan', () => {
    expect(frases('    Entonces aparece el funcionario Ana\n    Y la ficha Ketc')).toEqual([]);
  });

  it('no distingue mayúsculas y reconoce los bordes de palabra con tildes', () => {
    expect(frases('    Entonces Rápidamente aparece «hecho»')).toEqual([expect.stringMatching(/«Rápidamente»/)]);
    expect(frases('    Entonces ganan los rápidos')).toEqual([]);
  });

  it('no mira el texto citado entre «» o comillas, porque el step lo compara tal cual', () => {
    expect(
      frases('    Entonces ve el descriptor «elige bien los datos»\n    Y ve el aviso "funciona sin red"'),
    ).toEqual([]);
    expect(frases('    Entonces ve «Hecho» y todo funciona')).toEqual([expect.stringMatching(/«funciona»/)]);
  });

  it('«fácil» solo no cuenta, porque es una calificación del repaso; «fácilmente» sí', () => {
    expect(frases('    Entonces no le pide calificarlo como difícil, bien o fácil')).toEqual([]);
    expect(frases('    Entonces lo encuentra fácilmente')).toEqual([expect.stringMatching(/«fácilmente»/)]);
  });

  it('reconoce frases de varias palabras y la barra de «y/o»', () => {
    expect(frases('    Entonces se ve como se espera\n    Y avisa y/o guarda')).toEqual([
      expect.stringMatching(/«como se espera»/),
      expect.stringMatching(/«y\/o»/),
    ]);
  });

  it('mira también los antecedentes y los escenarios dentro de una Regla', () => {
    const texto = `# language: es
Característica: Ejemplo

  Antecedentes:
    Dado un objetivo
    Entonces todo funciona

  Regla: Una regla

    Escenario: Uno
      Entonces los datos aparecen
`;
    expect(frasesVagasDeFeature(texto, 'features/x.feature').map(({ linea }) => linea)).toEqual([6, 11]);
  });
});

describe('leerFrasesVagas', () => {
  it('recorre los .feature del directorio y se salta los que no se pueden leer', () => {
    const raiz = directorioTemporal();
    escribirFicheros(raiz, {
      'features/a.feature': feature('    Entonces funciona'),
      'features/sub/b.feature': feature('    Entonces el estado es «dominado»'),
      // El Gherkin roto ya lo informa leerFeatures; aquí no se repite.
      'features/roto.feature': 'Esto no es Gherkin\n  Entonces funciona',
      'features/notas.md': 'Entonces funciona',
    });
    expect(leerFrasesVagas(raiz).map(({ fichero }) => fichero)).toEqual(['features/a.feature']);
  });
});
