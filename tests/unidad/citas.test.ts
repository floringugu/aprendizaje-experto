import { describe, expect, it } from 'vitest';
import {
  contextoDeLaCita,
  marcadorDelMaterial,
  type Cita,
  type MarcaDeCita,
  type TextosDelMaterial,
} from '../../src/dominio/citas.ts';

const FRASE = 'La regla R1 también se aplica a los casos límite.';

/** El material de los tests: la frase está en la segunda página de apuntes.pdf, y otros.pdf no la tiene. */
const MATERIAL: TextosDelMaterial = new Map([
  ['apuntes.pdf', ['Portada del curso.', `Capítulo 1. ${FRASE}`, 'Cierre del capítulo.']],
  ['otros.pdf', ['Otro documento, sin esa frase.']],
  ['vacio.pdf', []],
]);

/** Un material con solo apuntes.pdf, con estas páginas. */
function materialCon(paginas: string[]): TextosDelMaterial {
  return new Map([['apuntes.pdf', paginas]]);
}

/** Una cita de `documento` con ese fragmento. El lugar solo importa para `contextoDeLaCita`. */
function citaDe(fragmento: string, lugar = 'página 2', documento = 'apuntes.pdf'): Cita {
  return { documento, lugar, fragmento };
}

/** La marca de una cita de `documento` con ese fragmento, en el material dado. */
function marcaDe(
  fragmento: string,
  material: TextosDelMaterial = MATERIAL,
  documento = 'apuntes.pdf',
): MarcaDeCita | undefined {
  return marcadorDelMaterial(material)(citaDe(fragmento, 'página 2', documento));
}

describe('marcadorDelMaterial', () => {
  it('@MATE-3.1 una pieza sin fuente lleva la marca «sin_fuente»', () => {
    expect(marcadorDelMaterial(MATERIAL)(undefined)).toBe('sin_fuente');
  });

  it('@MATE-3.2 un fragmento que aparece tal cual en su documento no lleva marca', () => {
    expect(marcaDe(FRASE)).toBeUndefined();
  });

  it('@MATE-3.2 un fragmento parcial de una página no lleva marca', () => {
    expect(marcaDe('también se aplica a los casos límite')).toBeUndefined();
  });

  it('@MATE-3.2 una palabra distinta da «cita_no_encontrada»', () => {
    expect(marcaDe('La regla R2 también se aplica a los casos límite.')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.2 una tilde de menos da «cita_no_encontrada»', () => {
    expect(marcaDe('La regla R1 tambien se aplica a los casos límite.')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.2 una mayúscula distinta da «cita_no_encontrada»', () => {
    expect(marcaDe('la regla R1 también se aplica a los casos límite.')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.2 un documento que no tiene esa frase, o que no está en el material, da «cita_no_encontrada»', () => {
    expect(marcaDe(FRASE, MATERIAL, 'otros.pdf')).toBe('cita_no_encontrada');
    expect(marcaDe(FRASE, MATERIAL, 'notas.pdf')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.2 un documento sin páginas no tiene ninguna cita', () => {
    expect(marcaDe(FRASE, MATERIAL, 'vacio.pdf')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.2 los espacios del principio y del final del fragmento no cuentan', () => {
    expect(marcaDe(`  ${FRASE}  `)).toBeUndefined();
  });

  it('@MATE-3.2 un fragmento que solo tiene espacios, o está vacío, no cita nada', () => {
    expect(marcaDe('   ')).toBe('cita_no_encontrada');
    expect(marcaDe('\t\n')).toBe('cita_no_encontrada');
    expect(marcaDe('')).toBe('cita_no_encontrada');
  });

  it('@MATE-3.3 un salto de línea dentro de la frase cuenta como un solo espacio', () => {
    const partida = materialCon(['Capítulo 1. La regla R1 también se aplica\na los casos límite.']);
    expect(marcaDe(FRASE, partida)).toBeUndefined();
  });

  it('@MATE-3.3 los espacios repetidos del fragmento cuentan como uno', () => {
    expect(marcaDe('La regla R1 también se aplica   a los casos límite.')).toBeUndefined();
    expect(marcaDe('La regla R1 \r\n\t también se aplica a los casos límite.')).toBeUndefined();
  });

  it.each([
    { nombre: 'un tabulador', espacio: '\t' },
    { nombre: 'un salto de línea', espacio: '\n' },
    { nombre: 'un retorno de carro', espacio: '\r' },
    { nombre: 'un salto de página', espacio: '\f' },
    { nombre: 'un tabulador vertical', espacio: '\v' },
    { nombre: 'un espacio de no separación', espacio: ' ' },
  ])('@MATE-3 $nombre cuenta como un espacio, en el texto y en el fragmento', ({ espacio }) => {
    const conEspacio = materialCon([`Capítulo 1. La regla R1${espacio}también se aplica a los casos límite.`]);
    expect(marcaDe(FRASE, conEspacio)).toBeUndefined();
    expect(marcaDe(`La regla R1${espacio}también se aplica a los casos límite.`)).toBeUndefined();
  });

  it('@MATE-3.4 una palabra partida con guion a final de línea no se une', () => {
    const partida = materialCon(['Capítulo 1. La regla R1 tam-\nbién se aplica a los casos límite.']);
    expect(marcaDe(FRASE, partida)).toBe('cita_no_encontrada');
    expect(marcaDe('también', partida)).toBe('cita_no_encontrada');
  });

  it('@MATE-3 una cita que cruza de una página a la siguiente no lleva marca', () => {
    const cruza = materialCon(['Capítulo 1. La regla R1 también se aplica', 'a los casos límite.', 'Cierre.']);
    expect(marcaDe(FRASE, cruza)).toBeUndefined();
    expect(marcaDe('aplica a los casos', cruza)).toBeUndefined();
  });

  it('@MATE-3 una página vacía entre dos no corta la cita', () => {
    const conVacia = materialCon(['Uno, dos', '   ', 'tres']);
    expect(marcaDe('Uno, dos tres', conVacia)).toBeUndefined();
  });

  it('@MATE-3 normaliza un documento la primera vez que una cita lo necesita, no antes', () => {
    const paginas = ['Capítulo 1. Nada aquí.'];
    const marcador = marcadorDelMaterial(materialCon(paginas));
    paginas.push(FRASE);
    expect(marcador(citaDe(FRASE))).toBeUndefined();
  });

  it('@MATE-3 recuerda el documento normalizado: una página añadida después de la primera cita no cuenta', () => {
    const paginas = ['Capítulo 1. Nada aquí.'];
    const marcador = marcadorDelMaterial(materialCon(paginas));
    expect(marcador(citaDe(FRASE))).toBe('cita_no_encontrada');
    paginas.push(FRASE);
    expect(marcador(citaDe(FRASE))).toBe('cita_no_encontrada');
  });
});

describe('contextoDeLaCita', () => {
  it('@MATE-4.3 trae la página entera que contiene el fragmento, y no las otras', () => {
    expect(contextoDeLaCita(citaDe('también se aplica'), MATERIAL)).toBe(`Capítulo 1. ${FRASE}`);
    expect(contextoDeLaCita(citaDe('Portada'), MATERIAL)).toBe('Portada del curso.');
  });

  it('@MATE-4.3 trae la página tal como está en el documento, con sus espacios', () => {
    const original = 'Capítulo 1.\tLa regla  R1 también se aplica a los casos límite.  ';
    expect(contextoDeLaCita(citaDe('también se aplica'), materialCon([original]))).toBe(original);
  });

  it('@MATE-4.3 una cita que empieza al principio de una página trae esa página, no la anterior', () => {
    expect(contextoDeLaCita(citaDe('Capítulo 1.'), MATERIAL)).toBe(`Capítulo 1. ${FRASE}`);
    expect(contextoDeLaCita(citaDe('Cierre del'), MATERIAL)).toBe('Cierre del capítulo.');
  });

  it('@MATE-4.3 un lugar de dos cifras también da su página, como «página 12»', () => {
    const doce = materialCon(Array.from({ length: 12 }, (_, indice) => `Página ${String(indice + 1)}.`));
    expect(contextoDeLaCita(citaDe('no está en el texto', 'página 12'), doce)).toBe('Página 12.');
  });

  it('@MATE-4.3 con dos apariciones, trae la página de la primera', () => {
    const dos = materialCon([`Uno. ${FRASE}`, `Dos. ${FRASE}`]);
    expect(contextoDeLaCita(citaDe(FRASE), dos)).toBe(`Uno. ${FRASE}`);
  });

  it('@MATE-4.3 una cita que cruza dos páginas trae las dos unidas con un salto de línea', () => {
    const cruza = materialCon(['Capítulo 1. La regla R1 también se aplica', 'a los casos límite.', 'Cierre.']);
    const unidas = 'Capítulo 1. La regla R1 también se aplica\na los casos límite.';
    expect(contextoDeLaCita(citaDe(FRASE), cruza)).toBe(unidas);
  });

  it('@MATE-4.3 una cita que abarca tres páginas las trae todas, también la del medio', () => {
    const tres = materialCon(['Inicio aplica', 'todo el medio', 'casos fin']);
    expect(contextoDeLaCita(citaDe('aplica todo el medio casos'), tres)).toBe(
      'Inicio aplica\ntodo el medio\ncasos fin',
    );
  });

  it('@MATE-4.3 una página vacía entre las dos que abarca la cita sale en el contexto', () => {
    const conVacia = materialCon(['Uno', '   ', 'Dos']);
    expect(contextoDeLaCita(citaDe('Uno Dos'), conVacia)).toBe('Uno\n   \nDos');
  });

  it('@MATE-4.3 si el fragmento no aparece, trae la página que dice el lugar', () => {
    expect(contextoDeLaCita(citaDe('no está en el texto', 'página 2'), MATERIAL)).toBe(`Capítulo 1. ${FRASE}`);
    expect(contextoDeLaCita(citaDe('no está en el texto', 'diapositiva 3'), MATERIAL)).toBe('Cierre del capítulo.');
  });

  it('@MATE-4.3 un fragmento que solo tiene espacios no aparece, así que cuenta el lugar', () => {
    expect(contextoDeLaCita(citaDe('   ', 'página 1'), MATERIAL)).toBe('Portada del curso.');
  });

  it('@MATE-4.3 si el fragmento aparece, manda sobre el lugar', () => {
    expect(contextoDeLaCita(citaDe(FRASE, 'página 3'), MATERIAL)).toBe(`Capítulo 1. ${FRASE}`);
  });

  it.each(['apartado 2.3', 'página 0', 'página 99', 'sin número'])(
    '@MATE-4.3 con el lugar «%s» y un fragmento que no aparece, no hay contexto',
    (lugar) => {
      expect(contextoDeLaCita(citaDe('no está en el texto', lugar), MATERIAL)).toBeUndefined();
    },
  );

  it('@MATE-4.3 un documento que no está en el material no tiene contexto', () => {
    expect(contextoDeLaCita(citaDe(FRASE, 'página 2', 'notas.pdf'), MATERIAL)).toBeUndefined();
  });

  it('@MATE-4.3 un documento sin páginas no tiene contexto, ni aunque el lugar sea una página', () => {
    expect(contextoDeLaCita(citaDe(FRASE, 'página 1', 'vacio.pdf'), MATERIAL)).toBeUndefined();
  });
});
