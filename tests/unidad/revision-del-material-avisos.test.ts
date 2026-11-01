import { describe, expect, it } from 'vitest';
import type { ContenidoDominio } from '../../src/aplicacion/contenido.ts';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import { crearRevisionDelMaterial } from '../../src/aplicacion/revision-del-material.ts';
import type { FiltroRevision, Revision } from '../../src/aplicacion/revision.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import {
  categoriaConGrupo,
  escribirMesa,
  mesaDe,
  objetivo,
  parametrosDeReservados,
  problema,
  reservado,
} from './revision-fabricas.ts';

// Los `avisos` de `abrirRevision` (MATE-3.6, MATE-3.7): salen del aprobado y del mínimo de los parámetros.
// Cómo se calculan está en avisos-de-reservados.test.ts; aquí, de dónde sale cada dato.

const DOMINIO = 'ficticio';

/** `cuantos` problemas reservados de C1, con ids que empiezan por `prefijo` (los ids no se pueden repetir en la mesa). */
const reservadosDeC1 = (prefijo: string, cuantos: number) =>
  Array.from({ length: cuantos }, (_, indice) => reservado(problema(`${prefijo}${String(indice)}`, 'C1')));

/** Un aprobado con O1 y C1 (con grupo) y los ítems que se den; el borrador, el que se dé. */
const mesaCon = (items: ContenidoDominio['items'], borrador: Partial<Mesa['borrador']> = {}): Mesa =>
  mesaDe(borrador, { objetivos: [objetivo('O1')], categorias: [categoriaConGrupo('C1')], items });

/**
 * Los casos de la revisión sobre los ficheros de `mesa`, con el mínimo que devuelva `minimo()` en cada lectura
 * de los parámetros: así un test lo cambia entre dos aperturas.
 */
function preparar(mesa: Mesa, minimo: () => number) {
  const { ficheros } = ficherosEnMemoria();
  escribirMesa(ficheros, mesa, DOMINIO);
  const externos = { ficheros, leerParametros: () => parametrosDeReservados(minimo()) };
  return crearRevisionDelMaterial(externos);
}

function abrir(casos: ReturnType<typeof preparar>, filtro?: FiltroRevision): Revision {
  const resultado = casos.abrirRevision(filtro === undefined ? { dominio: DOMINIO } : { dominio: DOMINIO, filtro });
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}

const pocos = (hay: number, hacenFalta: number) => ({ tipo: 'pocos_reservados', hay, hacen_falta: hacenFalta });

describe('abrirRevision: avisos de problemas reservados', () => {
  it('@MATE-3.7 los reservados pendientes del borrador no cuentan: solo el aprobado', () => {
    const pendientes = reservadosDeC1('B', 5);
    const casos = preparar(mesaCon(reservadosDeC1('A', 3), { items: pendientes }), () => 5);
    const revision = abrir(casos);
    expect(revision.avisos).toStrictEqual([pocos(3, 5)]);
    // Las piezas pendientes sí salen: lo que no cuentan es los avisos.
    expect(revision.grupos.flatMap((grupo) => grupo.piezas)).toHaveLength(pendientes.length);
  });

  it('@MATE-3.6 un reservado pendiente del borrador no evita el aviso de la categoría sin reservado aprobado', () => {
    const casos = preparar(mesaCon([problema('A1', 'C1')], { items: [reservado(problema('B1', 'C1'))] }), () => 0);
    expect(abrir(casos).avisos).toStrictEqual([{ tipo: 'categoria_sin_reservado', objetivo: 'O1', categoria: 'C1' }]);
  });

  it('@MATE-3.7 sin ningún aviso pendiente, la lista de avisos es vacía', () => {
    const casos = preparar(mesaCon(reservadosDeC1('A', 5)), () => 5);
    expect(abrir(casos).avisos).toStrictEqual([]);
  });

  it('@MATE-3.7 el mínimo se lee de los parámetros en cada apertura', () => {
    let minimo = 5;
    const casos = preparar(mesaCon(reservadosDeC1('A', 3)), () => minimo);
    expect(abrir(casos).avisos).toStrictEqual([pocos(3, 5)]);
    minimo = 4;
    expect(abrir(casos).avisos).toStrictEqual([pocos(3, 4)]);
    minimo = 3;
    expect(abrir(casos).avisos).toStrictEqual([]);
  });

  it.each(['pendientes', 'sin_fuente', 'cita_no_encontrada', 'un_solo_paso'] as const)(
    '@MATE-3.7 el filtro «%s» no cambia los avisos',
    (filtro) => {
      const casos = preparar(mesaCon(reservadosDeC1('A', 3), { items: [problema('B1', 'C1')] }), () => 5);
      expect(abrir(casos, filtro).avisos).toStrictEqual([pocos(3, 5)]);
    },
  );
});
