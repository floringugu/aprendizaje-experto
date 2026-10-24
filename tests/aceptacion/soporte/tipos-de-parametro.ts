import { defineParameterType } from '@cucumber/cucumber';
import type { Fuente } from '../../../src/aplicacion/contenido.ts';
import { instanteUtc } from './reloj.ts';

/** Número escrito con coma decimal («0,70», «7,5») como número de JavaScript. */
function aNumero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

/** «a», «b» y «c» → ['a', 'b', 'c'] */
function textosEntreComillas(texto: string): string[] {
  return [...texto.matchAll(/«([^»]*)»/g)].map((coincidencia) => coincidencia[1] ?? '');
}

/** «O1, O2 y O3» → ['O1', 'O2', 'O3']; también «I9 e I10», como se escribe ante una «i». */
function identificadores(texto: string): string[] {
  return texto.split(/, | y | e /);
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
defineParameterType({ name: 'ids', regexp: /[A-Z]\d+(?:(?:, | y | e )[A-Z]\d+)*/, transformer: identificadores });
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

/** Las opciones de un ítem y cómo se corrige: «a», «b» y «c», la correcta «b» y el feedback «Porque…». */
export interface OpcionesCorregidas {
  readonly opciones: readonly string[];
  readonly correcta: string;
  readonly feedback: string;
}

// Un solo parámetro (sin grupos de captura, así que el transformer recibe la frase entera) para que
// el paso no pase de tres parámetros (max-params).
defineParameterType({
  name: 'opciones_corregidas',
  regexp: /«[^»]*»(?:(?:, | y )«[^»]*»)*, la correcta «[^»]*» y el feedback «[^»]*»/,
  transformer: (frase: string): OpcionesCorregidas => {
    const [correcta = '', feedback = ''] = textosEntreComillas(frase.slice(frase.lastIndexOf(', la correcta ')));
    return { opciones: textosEntreComillas(frase.slice(0, frase.lastIndexOf(', la correcta '))), correcta, feedback };
  },
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

const FUENTE = /«([^»]+)», página (\d+), «([^»]*)»/;

/** «apuntes.pdf», página 12, «La regla…» → la fuente de una pieza; «sin fuente» → `undefined` (MATE). */
export function leerFuente(texto: string): Fuente | undefined {
  const partes = FUENTE.exec(texto);
  if (partes === null) {
    if (texto.trim() !== 'sin fuente') {
      throw new Error(`«${texto}» no es una fuente`);
    }
    return undefined;
  }
  const [, documento = '', pagina = '', fragmento = ''] = partes;
  return { documento, lugar: `página ${pagina}`, fragmento };
}

defineParameterType({
  name: 'fuente',
  regexp: FUENTE,
  transformer: (documento: string, pagina: string, fragmento: string): Fuente => ({
    documento,
    lugar: `página ${pagina}`,
    fragmento,
  }),
});

/** Una página de un documento del material y la frase que dice: «apuntes.pdf», cuya página 12 dice «…». */
export interface PaginaCitada {
  readonly documento: string;
  readonly pagina: number;
  readonly frase: string;
}

defineParameterType({
  name: 'pagina_citada',
  regexp: /«([^»]+)», cuya página (\d+) dice «([^»]*)»/,
  transformer: (documento: string, pagina: string, frase: string): PaginaCitada => ({
    documento,
    pagina: Number(pagina),
    frase,
  }),
});

// Las piezas que redacta la IA (MATE-2.1) y las que entrega sin el formato del contenido (MATE-2.3).
defineParameterType({
  name: 'pieza_redactada',
  regexp: /un objetivo|un ejemplo resuelto de O1|un ítem de O1|una tarea con rúbrica/,
  transformer: (frase: string) => frase,
});

defineParameterType({
  name: 'pieza_incompleta',
  regexp:
    /un ítem de O1 sin respuesta|un ítem de O1 sin feedback|un ejemplo resuelto de O1 sin pasos|una tarea sin rúbrica|una tarea con un nivel de la rúbrica sin descriptor|un objetivo sin instrucción/,
  transformer: (frase: string) => frase,
});

/** Lo que le falta a una pieza → la propiedad del formato del contenido (`campo` o `falta`, MATE-2.3, MATE-4.8). */
const PROPIEDAD_QUE_FALTA: Readonly<Record<string, string>> = {
  'la respuesta': 'respuesta',
  'el feedback': 'feedback',
  'los pasos': 'pasos',
  'la rúbrica': 'rubrica',
  'el descriptor del nivel': 'descriptor',
  'la instrucción': 'instruccion',
};

defineParameterType({
  name: 'falta',
  regexp: /la respuesta|el feedback|los pasos|la rúbrica|el descriptor del nivel|la instrucción/,
  transformer: (frase: string) => PROPIEDAD_QUE_FALTA[frase] ?? frase,
});
