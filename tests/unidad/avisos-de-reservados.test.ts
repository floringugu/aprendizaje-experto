import { describe, expect, it } from 'vitest';
import { avisosDeReservados } from '../../src/aplicacion/avisos-de-reservados.ts';
import type { CategoriaContenido, ContenidoDominio, ItemContenido } from '../../src/aplicacion/contenido.ts';
import { categoria, categoriaConGrupo, itemDeCategoria, objetivo, problema, reservado } from './revision-fabricas.ts';

// Los avisos de la revisión sobre los problemas reservados del aprobado (MATE-3.6, MATE-3.7).
// Los tests de `categoria_sin_reservado` usan un mínimo de 0, que nunca da `pocos_reservados`.

const SIN_MINIMO = 0;
const CATEGORIAS: readonly CategoriaContenido[] = [categoriaConGrupo('C1'), categoria('C5')];

/** Un aprobado con esos ítems, las categorías de `CATEGORIAS` y los objetivos que se pidan (por defecto, O1). */
function aprobadoCon(
  items: readonly ItemContenido[],
  categorias = CATEGORIAS,
  objetivos = [objetivo('O1')],
): ContenidoDominio {
  return { dominio: 'ficticio', objetivos, categorias, items, tareas: [] };
}

const sinReservado = (objetivoDelAviso: string, categoriaDelAviso: string) => ({
  tipo: 'categoria_sin_reservado',
  objetivo: objetivoDelAviso,
  categoria: categoriaDelAviso,
});
const pocos = (hay: number, hacenFalta: number) => ({ tipo: 'pocos_reservados', hay, hacen_falta: hacenFalta });

/** `cuantos` problemas reservados de la categoría, de O1, con ids distintos. */
const reservadosDe = (categoriaDelProblema: string, cuantos: number): ItemContenido[] =>
  Array.from({ length: cuantos }, (_, indice) =>
    reservado(problema(`${categoriaDelProblema}-R${String(indice)}`, categoriaDelProblema)),
  );

describe('avisosDeReservados: categoria_sin_reservado', () => {
  it.each([
    ['ninguno de ellos reservado', [problema('P1', 'C1'), problema('P2', 'C5')], [sinReservado('O1', 'C1')]],
    ['el de C1 reservado', [reservado(problema('P1', 'C1')), problema('P2', 'C5')], []],
    ['solo el de C5 reservado', [problema('P1', 'C1'), reservado(problema('P2', 'C5'))], [sinReservado('O1', 'C1')]],
  ])('@MATE-3.6 con problemas de C1 (con grupo) y de C5 (sin grupo) en O1, %s', (_descripcion, items, avisos) => {
    expect(avisosDeReservados(aprobadoCon(items), SIN_MINIMO)).toStrictEqual(avisos);
  });

  it('@MATE-3.6 un reservado entre varios problemas de la categoría en el objetivo basta para no avisar', () => {
    const items = [problema('P1', 'C1'), reservado(problema('P2', 'C1')), problema('P3', 'C1')];
    expect(avisosDeReservados(aprobadoCon(items), SIN_MINIMO)).toStrictEqual([]);
  });

  it('@MATE-3.6 los avisos salen por objetivo, en su orden, y dentro de cada uno por categoría, en su orden', () => {
    const categorias = [categoriaConGrupo('C2', 'G2'), categoriaConGrupo('C1'), categoria('C5')];
    // Los ítems van en otro orden (O2 antes que O1, C1 antes que C2): el orden no sale de ellos.
    const items = [
      problema('P1', 'C1', 'O2'),
      problema('P2', 'C2', 'O2'),
      problema('P3', 'C1'),
      problema('P4', 'C2'),
      problema('P5', 'C5'),
    ];
    const aprobado = aprobadoCon(items, categorias, [objetivo('O1'), objetivo('O2')]);
    expect(avisosDeReservados(aprobado, SIN_MINIMO)).toStrictEqual([
      sinReservado('O1', 'C2'),
      sinReservado('O1', 'C1'),
      sinReservado('O2', 'C2'),
      sinReservado('O2', 'C1'),
    ]);
  });

  it('@MATE-3.6 una categoría con grupo sin problemas en el objetivo no lleva aviso', () => {
    const categorias = [categoriaConGrupo('C1'), categoriaConGrupo('C2')];
    const items = [problema('P1', 'C1'), problema('P2', 'C2', 'O2')];
    const aprobado = aprobadoCon(items, categorias, [objetivo('O1'), objetivo('O2')]);
    expect(avisosDeReservados(aprobado, SIN_MINIMO)).toStrictEqual([
      sinReservado('O1', 'C1'),
      sinReservado('O2', 'C2'),
    ]);
  });

  it('@MATE-3.6 una categoría sin grupo no lleva aviso, tenga o no reservados', () => {
    const items = [problema('P1', 'C5'), problema('P2', 'C5')];
    expect(avisosDeReservados(aprobadoCon(items), SIN_MINIMO)).toStrictEqual([]);
  });

  it('@MATE-3.6 el reservado de la categoría en otro objetivo no cuenta para este', () => {
    const items = [problema('P1', 'C1'), reservado(problema('P2', 'C1', 'O2'))];
    const aprobado = aprobadoCon(items, CATEGORIAS, [objetivo('O1'), objetivo('O2')]);
    expect(avisosDeReservados(aprobado, SIN_MINIMO)).toStrictEqual([sinReservado('O1', 'C1')]);
  });

  it('@MATE-3.6 los problemas de un objetivo que no está en el aprobado no dan aviso', () => {
    expect(avisosDeReservados(aprobadoCon([problema('P1', 'C1', 'O9')]), SIN_MINIMO)).toStrictEqual([]);
  });
});

describe('avisosDeReservados: qué problemas cuentan', () => {
  it('@MATE-3.6 un hecho de una categoría con grupo no hace que se avise ni evita el aviso', () => {
    // Solo hay un hecho (reservado, además): sin problemas no hay aviso. Con un problema, el hecho reservado no basta.
    const hecho = itemDeCategoria('H1', 'C1');
    expect(avisosDeReservados(aprobadoCon([hecho]), SIN_MINIMO)).toStrictEqual([]);
    expect(avisosDeReservados(aprobadoCon([reservado(hecho), problema('P1', 'C1')]), SIN_MINIMO)).toStrictEqual([
      sinReservado('O1', 'C1'),
    ]);
  });

  it('@MATE-3.6 un problema sin categoría, o de una categoría que no está en el aprobado, no cuenta para nada', () => {
    const items = [problema('P1'), reservado(problema('P2')), reservado(problema('P3', 'C9'))];
    expect(avisosDeReservados(aprobadoCon(items), SIN_MINIMO)).toStrictEqual([]);
  });

  it('@MATE-3.7 los hechos, los problemas sin categoría y los de categorías sin grupo no suman reservados', () => {
    const ajenos = [
      reservado(itemDeCategoria('H1', 'C1')),
      reservado(problema('P1')),
      reservado(problema('P2', 'C9')),
      ...reservadosDe('C5', 2),
    ];
    expect(avisosDeReservados(aprobadoCon([...reservadosDe('C1', 2), ...ajenos]), 5)).toStrictEqual([pocos(2, 5)]);
  });
});

describe('avisosDeReservados: pocos_reservados', () => {
  it.each([
    [0, [pocos(0, 5)]],
    [3, [pocos(3, 5)]],
    [4, [pocos(4, 5)]],
    [5, []],
    [6, []],
  ])('@MATE-3.7 con %i reservados en categorías con grupo y un mínimo de 5, los avisos son %j', (cuantos, avisos) => {
    expect(avisosDeReservados(aprobadoCon(reservadosDe('C1', cuantos)), 5)).toStrictEqual(avisos);
  });

  it('@MATE-3.7 cuenta juntos los reservados de todas las categorías con grupo, sean del grupo que sean', () => {
    const categorias = [categoriaConGrupo('C1'), categoriaConGrupo('C2', 'G2')];
    const items = [...reservadosDe('C1', 2), ...reservadosDe('C2', 2)];
    expect(avisosDeReservados(aprobadoCon(items, categorias), 5)).toStrictEqual([pocos(4, 5)]);
  });

  it('@MATE-3.7 sin categorías con grupo avisa con hay 0, aunque haya reservados en categorías sin grupo', () => {
    const items = reservadosDe('C5', 6);
    expect(avisosDeReservados(aprobadoCon(items, [categoria('C5')]), 5)).toStrictEqual([pocos(0, 5)]);
    expect(avisosDeReservados(aprobadoCon([], []), 5)).toStrictEqual([pocos(0, 5)]);
  });

  it('@MATE-3.7 `hacen_falta` es el mínimo que se pasa', () => {
    expect(avisosDeReservados(aprobadoCon(reservadosDe('C1', 1)), 2)).toStrictEqual([pocos(1, 2)]);
    expect(avisosDeReservados(aprobadoCon(reservadosDe('C1', 2)), 2)).toStrictEqual([]);
  });

  it('@MATE-3.7 sale una sola vez y después de los avisos de categorías', () => {
    const items = [problema('P1', 'C1'), problema('P2', 'C1', 'O2')];
    const aprobado = aprobadoCon(items, CATEGORIAS, [objetivo('O1'), objetivo('O2')]);
    expect(avisosDeReservados(aprobado, 5)).toStrictEqual([
      sinReservado('O1', 'C1'),
      sinReservado('O2', 'C1'),
      pocos(0, 5),
    ]);
  });

  it('@MATE-3.7 sin mínimo no hay aviso, ni siquiera con 0 reservados', () => {
    expect(avisosDeReservados(aprobadoCon([]), SIN_MINIMO)).toStrictEqual([]);
  });
});

describe('avisosDeReservados: sin avisos', () => {
  it('@MATE-3.6 @MATE-3.7 la lista es vacía si cada categoría con grupo tiene su reservado y se llega al mínimo', () => {
    const categorias = [categoriaConGrupo('C1'), categoriaConGrupo('C2', 'G2')];
    const items = [...reservadosDe('C1', 3), ...reservadosDe('C2', 2), problema('P1', 'C1')];
    expect(avisosDeReservados(aprobadoCon(items, categorias), 5)).toStrictEqual([]);
  });

  it('@MATE-3.6 @MATE-3.7 un aprobado sin nada, con mínimo 0, no avisa de nada', () => {
    expect(avisosDeReservados(aprobadoCon([], []), SIN_MINIMO)).toStrictEqual([]);
  });
});
