import { defineParameterType } from '@cucumber/cucumber';
import { instanteUtc } from './reloj.ts';

/** Número escrito con coma decimal («0,70», «7,5») como número de JavaScript. */
function aNumero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

/** «a», «b» y «c» → ['a', 'b', 'c'] */
function textosEntreComillas(texto: string): string[] {
  return [...texto.matchAll(/«([^»]*)»/g)].map((coincidencia) => coincidencia[1] ?? '');
}

/** «O1, O2 y O3» → ['O1', 'O2', 'O3'] */
function identificadores(texto: string): string[] {
  return texto.split(/, | y /);
}

// «ficticio» → ficticio. Los textos entre comillas latinas son nombres, respuestas o fases.
defineParameterType({
  name: 'texto',
  regexp: /«([^»]*)»/,
  transformer: (contenido: string) => contenido,
});

// «a», «b» y «c» → lista de textos.
defineParameterType({
  name: 'textos',
  regexp: /«[^»]*»(?:(?:, | y )«[^»]*»)*/,
  transformer: textosEntreComillas,
});

// «85 %» o «7,5 %» → fracción (0,85 y 0,075), que es como la aplicación guarda los umbrales.
defineParameterType({
  name: 'fraccion',
  regexp: /(\d+(?:,\d+)?) %/,
  transformer: (porcentaje: string) => aNumero(porcentaje) / 100,
});

// «0,70» → 0.7
defineParameterType({
  name: 'decimal',
  regexp: /(\d+,\d+)/,
  transformer: aNumero,
});

// «1 y 4» → [1, 4]
defineParameterType({
  name: 'numeros',
  regexp: /\d+(?: y \d+)*/,
  transformer: (lista: string) => lista.split(' y ').map(aNumero),
});

// «umbral_dominio» a 0,70 → el cambio que un escenario hace en config/parametros.json.
defineParameterType({
  name: 'cambio',
  regexp: /«([^»]+)» a («[^»]+»|\d+(?:,\d+)?(?: y \d+)?)/,
  transformer: (nombre: string, valor: string) => {
    if (valor.startsWith('«')) {
      return { nombre, valor: valor.slice(1, -1) };
    }
    return { nombre, valor: valor.includes(' y ') ? valor.split(' y ').map(aNumero) : aNumero(valor) };
  },
});

defineParameterType({ name: 'objetivo', regexp: /O\d+/, transformer: (id: string) => id });
defineParameterType({ name: 'tarea', regexp: /T\d+/, transformer: (id: string) => id });
defineParameterType({ name: 'categoria', regexp: /C\d+/, transformer: (id: string) => id });
defineParameterType({ name: 'grupo', regexp: /G\d+/, transformer: (id: string) => id });
defineParameterType({ name: 'item', regexp: /[A-Z]\d+/, transformer: (id: string) => id });
defineParameterType({ name: 'ids', regexp: /[A-Z]\d+(?:(?:, | y )[A-Z]\d+)*/, transformer: identificadores });
defineParameterType({ name: 'fecha', regexp: /\d{4}-\d{2}-\d{2}/, transformer: (fecha: string) => fecha });
defineParameterType({ name: 'fichero', regexp: /[a-z_]+\.csv/, transformer: (nombre: string) => nombre });
defineParameterType({ name: 'horizonte', regexp: /1 semana|1 año/, transformer: (nombre: string) => nombre });

// «2026-02-02 a las 10:00» → instante UTC
defineParameterType({
  name: 'instante',
  regexp: /(\d{4}-\d{2}-\d{2}) a las (\d{2}:\d{2}(?::\d{2})?)/,
  transformer: instanteUtc,
});

// FSRS o SM-2 → el identificador que usa config/parametros.json
defineParameterType({
  name: 'algoritmo',
  regexp: /FSRS|SM-2/,
  transformer: (nombre: string) => (nombre === 'FSRS' ? 'fsrs' : 'sm2'),
});

// «la correcta «b» y el feedback «Porque…»» → las dos cosas juntas, para no pasar de tres parámetros.
defineParameterType({
  name: 'correccion',
  regexp: /la correcta «([^»]*)» y el feedback «([^»]*)»/,
  transformer: (correcta: string, feedback: string) => ({ correcta, feedback }),
});

/** Una evaluación externa descrita en una frase: «T2 del 2026-01-15, a ciegas, con el percentil 85». */
export interface EvaluadaExterna {
  readonly tarea: string;
  readonly fecha: string;
  readonly percentil: number;
  /** `true` si la frase dice «a ciegas»; `undefined` si no dice nada (lo da otro paso). */
  readonly aCiegas: true | undefined;
}

defineParameterType({
  name: 'evaluada',
  regexp: /(T\d+) del (\d{4}-\d{2}-\d{2})(, a ciegas,)? con el percentil (-?\d+)/,
  transformer: (...grupos: (string | undefined)[]): EvaluadaExterna => {
    const [tarea = '', fecha = '', ciegas, percentil = ''] = grupos;
    return { tarea, fecha, percentil: Number(percentil), aCiegas: ciegas === undefined ? undefined : true };
  },
});

// «evaluada a ciegas» o «evaluada sin ocultar quién la hizo» → ¿a ciegas?
defineParameterType({
  name: 'ocultacion',
  regexp: /evaluada a ciegas|evaluada sin ocultar quién la hizo/,
  transformer: (frase: string) => frase === 'evaluada a ciegas',
});

// «un «2» en «Planteamiento» y un «1» en «Resultado»» → { Planteamiento: 2, Resultado: 1 }
defineParameterType({
  name: 'niveles',
  regexp: /un «\d+» en «[^»]+»(?: y un «\d+» en «[^»]+»)*/,
  transformer: (frase: string) =>
    Object.fromEntries([...frase.matchAll(/un «(\d+)» en «([^»]+)»/g)].map((m) => [m[2] ?? '', Number(m[1])])),
});
