// Los pasos del arnés en la CI de GitHub (.github/workflows/puerta.yml):
//   node scripts/arnes/ci.ts rama <rama>       el job «rama»: el nombre de la rama del PR sigue el
//                                              formato de los carriles (comun/ramas.ts) y su área existe
//   node scripts/arnes/ci.ts ajustes [<rama>]  guarda la fase y el área de la rama en los ajustes locales
//                                              (comun/ajustes-locales.ts), como «make abrir» en un carril
//   node scripts/arnes/ci.ts objetivo          el objetivo de make de esa fase, si no es make check
//
// En un push a main no hay rama de PR: «ajustes» no guarda nada y el checkout queda en impl sin área
// en curso, que comprueba la regresión de las áreas cerradas. «objetivo» no imprime nada.
import { fijarFase } from './comun/ajustes-locales.ts';
import { faseYAreaDelCheckout } from './comun/checkout.ts';
import type { FaseYArea } from './comun/checkout.ts';
import { OBJETIVO_POR_FASE } from './comun/fases.ts';
import { faseYAreaDeLaRama } from './comun/ramas.ts';
import { RAIZ } from './comun/raiz.ts';

/** La fase y el área de la rama `nombre`, tras imprimirlas; undefined, tras imprimir por qué no valen. */
function faseYAreaImpresas(nombre: string): FaseYArea | undefined {
  const deLaRama = faseYAreaDeLaRama(RAIZ, nombre);
  if ('problema' in deLaRama) {
    console.error(deLaRama.problema);
    return undefined;
  }
  console.log(`${nombre}: fase ${deLaRama.fase}, área ${deLaRama.area ?? 'ninguna'}.`);
  return deLaRama;
}

function rama(nombre: string): number {
  return faseYAreaImpresas(nombre) === undefined ? 1 : 0;
}

function ajustes(nombre: string): number {
  if (nombre === '') return 0;
  const deLaRama = faseYAreaImpresas(nombre);
  if (deLaRama === undefined) return 1;
  fijarFase(RAIZ, deLaRama);
  return 0;
}

function objetivo(): number {
  const deLaFase = OBJETIVO_POR_FASE[faseYAreaDelCheckout(RAIZ).fase];
  if (deLaFase !== 'check') console.log(deLaFase);
  return 0;
}

const SUBCOMANDOS = new Map<string, (nombre: string) => number>([
  ['rama', rama],
  ['ajustes', ajustes],
  ['objetivo', objetivo],
]);

function principal(): number {
  const [subcomando = '', nombre = ''] = process.argv.slice(2);
  const ejecutar = SUBCOMANDOS.get(subcomando);
  if (ejecutar === undefined) {
    console.error('Uso: node scripts/arnes/ci.ts rama <rama> | ajustes [<rama>] | objetivo');
    return 1;
  }
  return ejecutar(nombre);
}

process.exitCode = principal();
