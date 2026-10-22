// Frases vagas en los pasos de resultado de features/ (paso «specs» y «cobertura-ids»).
//
// Un «Entonces se muestra correctamente» no falla nunca por la razón correcta: es el step
// el que decide qué significa «correctamente», y acaba comprobando lo que haga el código.
// Solo se miran los pasos de resultado (Entonces y los Y o Pero que lo siguen): en un Dado
// o un Cuando la misma palabra describe la situación o la acción, no lo que se comprueba.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { StepKeywordType } from '@cucumber/messages';
import type { Feature, Step } from '@cucumber/messages';
import { listarFicheros } from './ficheros.ts';
import { parsearFeature } from './gherkin.ts';
import type { ProblemaSpec } from './gherkin.ts';

interface FraseVaga {
  /** Se buscan como palabras enteras, sin distinguir mayúsculas. */
  readonly frases: readonly string[];
  readonly porQue: string;
}

const FRASES_VAGAS: readonly FraseVaga[] = [
  {
    frases: ['correctamente', 'de forma correcta', 'de manera correcta', 'de modo correcto'],
    porQue: '¿correcto según qué? Escribe el valor, el estado o el texto que se espera.',
  },
  {
    frases: ['funciona', 'funcionan', 'funcione', 'funcionen'],
    porQue: '«funciona» no se puede observar: escribe qué cambia, qué se guarda o qué se ve.',
  },
  {
    frases: [
      'como se espera',
      'como es de esperar',
      'lo esperado',
      'el resultado esperado',
      'los resultados esperados',
    ],
    porQue: 'escribe qué se espera: si no, el step lo decide y comprueba lo que haga el código.',
  },
  {
    frases: ['adecuado', 'adecuada', 'adecuados', 'adecuadas', 'adecuadamente'],
    porQue: '¿adecuado según qué? Fija el criterio: un valor, un umbral de config/parametros.json o una regla.',
  },
  {
    frases: ['apropiado', 'apropiada', 'apropiados', 'apropiadas', 'apropiadamente'],
    porQue: '¿apropiado según qué? Fija el criterio: un valor, un umbral de config/parametros.json o una regla.',
  },
  {
    frases: ['sin errores', 'sin problemas', 'sin fallos'],
    porQue: 'que no haya errores no dice qué debe pasar: escribe el resultado que sí se ve.',
  },
  {
    frases: ['rápido', 'rápida', 'rápidamente', 'lento', 'lenta', 'lentamente', 'enseguida'],
    porQue: 'la velocidad necesita una cifra: un tiempo máximo, mejor como parámetro con su sección del informe.',
  },
  {
    // «fácil» solo no está: es una de las calificaciones del repaso (otra vez, difícil, bien, fácil).
    frases: ['fácilmente', 'intuitivo', 'intuitiva', 'amigable', 'cómodo', 'cómoda'],
    porQue: 'es una opinión, no un hecho observable: describe qué ve o qué puede hacer la persona.',
  },
  {
    frases: ['etc', 'etcétera', 'y demás', 'y similares'],
    porQue: 'una lista abierta no se puede comprobar: enumera los casos o usa un Esquema del escenario con Ejemplos.',
  },
  {
    frases: ['y/o'],
    porQue: '«y/o» mete dos escenarios en uno: sepáralos o di cuál de los dos.',
  },
  {
    frases: ['se procesa', 'se procesan', 'se gestiona', 'se gestionan', 'se maneja', 'se manejan'],
    porQue: '«procesar» o «gestionar» no dicen el resultado: escribe en qué estado queda o qué se ve después.',
  },
  {
    frases: ['suficiente', 'suficientes', 'suficientemente', 'razonable', 'razonables', 'aproximadamente'],
    porQue: '¿cuánto? Pon la cifra, mejor como parámetro con su sección del informe.',
  },
  {
    frases: ['algunos', 'algunas', 'varios', 'varias', 'unos cuantos', 'unas cuantas'],
    porQue: 'una cantidad sin cifra no se puede comprobar: escribe el número.',
  },
  {
    frases: ['la información', 'los datos', 'el contenido', 'los resultados'],
    porQue: '¿qué información? Nombra los campos o el texto que deben verse.',
  },
  {
    frases: ['normalmente', 'con normalidad', 'como siempre'],
    porQue: '«normal» depende de quien lee: escribe el comportamiento concreto.',
  },
];

/** Una expresión por grupo. \p{L} es «cualquier letra», también las acentuadas, que \b no reconoce. */
const PATRONES = FRASES_VAGAS.map((frase) => ({
  patron: new RegExp(String.raw`(?<!\p{L})(?:${frase.frases.map(escaparRegex).join('|')})(?!\p{L})`, 'iu'),
  porQue: frase.porQue,
}));

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\/]/g, String.raw`\$&`);
}

/**
 * Quita lo que va entre «» o entre comillas: es un texto literal que el step compara tal
 * cual (un descriptor, un mensaje de la interfaz), no una forma vaga de describir el resultado.
 */
function sinTextosCitados(texto: string): string {
  return texto.replace(/«[^»]*»|"[^"]*"/g, '«»');
}

export function leerFrasesVagas(raiz: string, directorio = 'features'): ProblemaSpec[] {
  return listarFicheros(raiz, directorio, '.feature').flatMap((fichero) => {
    try {
      return frasesVagasDeFeature(readFileSync(path.join(raiz, fichero), 'utf8'), fichero);
    } catch {
      // Un Gherkin que no se puede leer ya lo informa leerFeatures (gherkin.ts).
      return [];
    }
  });
}

export function frasesVagasDeFeature(texto: string, fichero: string): ProblemaSpec[] {
  const feature = parsearFeature(texto);
  if (feature === undefined) return [];
  return pasosDeResultado(feature).flatMap((paso) => {
    const pasoCompleto = `${paso.keyword}${paso.text}`.trim();
    const textoSinCitas = sinTextosCitados(paso.text);
    return PATRONES.flatMap(({ patron, porQue }) => {
      const frase = patron.exec(textoSinCitas)?.[0];
      if (frase === undefined) return [];
      return [{ fichero, linea: paso.location.line, mensaje: `Frase vaga «${frase}» en «${pasoCompleto}»: ${porQue}` }];
    });
  });
}

/** Pasos Entonces, y los Y o Pero que los siguen, de todos los escenarios y antecedentes. */
function pasosDeResultado(feature: Feature): Step[] {
  const bloques = feature.children.flatMap((hijo) => [
    hijo.background,
    hijo.scenario,
    ...(hijo.rule?.children.flatMap((nieto) => [nieto.background, nieto.scenario]) ?? []),
  ]);
  return bloques.flatMap((bloque) => (bloque === undefined ? [] : soloResultado(bloque.steps)));
}

function soloResultado(pasos: readonly Step[]): Step[] {
  const resultado: Step[] = [];
  let tipoActual: StepKeywordType | undefined;
  for (const paso of pasos) {
    // Y y Pero (Conjunction) heredan el tipo del paso anterior.
    if (paso.keywordType !== StepKeywordType.CONJUNCTION) tipoActual = paso.keywordType;
    if (tipoActual === StepKeywordType.OUTCOME) resultado.push(paso);
  }
  return resultado;
}
