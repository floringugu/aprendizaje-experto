import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Sesion } from '../../../src/aplicacion/sesiones.ts';
import { progresoCompleto, responder } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { mundo } from '../soporte/mundo.ts';
import { iniciarSesionDePractica, itemsDe } from '../soporte/sesion.ts';

// Pasos del intercalado de categorías parecidas (INTE). Los ítems de la sesión no dicen su categoría
// (INTE-3.1), así que los pasos la buscan en el contenido del dominio de prueba.

const PROBLEMAS_POR_CATEGORIA = 2;
const HECHOS_POR_CATEGORIA = 1;

/** Categoría de cada ítem de la sesión, en el orden en que se presentan. */
function categoriasDe(sesion: Sesion): readonly string[] {
  return itemsDe(sesion).map((visto) => mundo().contenido().item(visto.id).categoria ?? '');
}

/** Cada categoría aparece en un único tramo seguido: nunca se vuelve a una categoría ya dejada. */
function estanEnBloques(categorias: readonly string[]): boolean {
  const dejadas = new Set<string>();
  return categorias.every((categoria, posicion) => {
    const anterior = categorias[posicion - 1];
    if (anterior !== undefined && anterior !== categoria) {
      dejadas.add(anterior);
    }
    return !dejadas.has(categoria);
  });
}

function hayCambiosDeCategoria(categorias: readonly string[]): boolean {
  return categorias.some((categoria, posicion) => posicion > 0 && categoria !== categorias[posicion - 1]);
}

function sesionActual(): Sesion {
  return presente(mundo().sesion, 'la sesión');
}

// --- Contenido ------------------------------------------------------------------------------------

// Las categorías se reparten entre los objetivos, para que cada objetivo tenga ítems de varias.
Given('que cada categoría tiene ítems de tipo «problema» y de tipo «hecho»', () => {
  const contenido = mundo().contenido();
  contenido.categorias.forEach((categoria, posicion) => {
    const objetivo = contenido.objetivos[posicion % contenido.objetivos.length]?.id ?? 'O1';
    contenido.agregarItems(objetivo, PROBLEMAS_POR_CATEGORIA, { tipo: 'problema', categoria: categoria.id });
    contenido.agregarItems(objetivo, HECHOS_POR_CATEGORIA, { tipo: 'hecho', categoria: categoria.id });
  });
});

// --- Lo que hace la persona ----------------------------------------------------------------------

When('empieza una sesión de práctica', () => {
  iniciarSesionDePractica(mundo());
});

When('empieza una sesión intercalada del grupo {grupo}', (grupo: string) => {
  iniciarSesionDePractica(mundo(), { grupo });
});

When('la persona practica la categoría {categoria}', (categoria: string) => {
  mundo().categoriaEnCurso = categoria;
  iniciarSesionDePractica(mundo(), { categoria });
});

// Responde un problema de la sesión intercalada: así se ve lo que se le presentó y queda su intento.
When('se le presenta un problema en una sesión intercalada', () => {
  const actual = mundo();
  const agrupada = actual.contenido().categorias.find((categoria) => categoria.grupo_parecidas !== undefined);
  const grupo = presente(agrupada?.grupo_parecidas, 'una categoría con grupo de parecidas');
  const sesion = iniciarSesionDePractica(actual, { grupo });
  const problema = presente(itemsDe(sesion)[0], 'un problema en la sesión');
  responder(actual, { item: problema.id, correcta: true, contexto: 'intercalado' });
});

// --- Lo que ve la persona ------------------------------------------------------------------------

Then('la sesión presenta los ítems por bloques, todos del objetivo actual', () => {
  const actual = mundo();
  const sesion = sesionActual();
  const objetivoActual = presente(progresoCompleto(actual).objetivoActual, 'el objetivo actual');
  assert.equal(sesion.intercalada, false);
  assert.ok(itemsDe(sesion).length > 0, 'La sesión no tiene ítems');
  assert.ok(estanEnBloques(categoriasDe(sesion)), 'Los ítems no van por bloques de categoría');
  itemsDe(sesion).forEach((visto) => {
    assert.equal(actual.contenido().item(visto.id).objetivo, objetivoActual);
  });
});

Then('la sesión intercala problemas de categorías parecidas', () => {
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  const grupos = new Set(
    categorias.map(
      (id) =>
        mundo()
          .contenido()
          .categorias.find((categoria) => categoria.id === id)?.grupo_parecidas,
    ),
  );
  assert.equal(sesion.intercalada, true);
  assert.ok(hayCambiosDeCategoria(categorias), 'La sesión no mezcla categorías');
  assert.equal(grupos.size, 1, 'Mezcla categorías de grupos distintos');
  assert.ok(!grupos.has(undefined), 'Mezcla categorías sin grupo de parecidas');
});

Then('la sesión no intercala', () => {
  assert.equal(sesionActual().intercalada, false);
});

Then('la sesión mezcla problemas de {categoria} y de {categoria}', (primera: string, segunda: string) => {
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  assert.equal(sesion.intercalada, true);
  assert.deepEqual([...new Set(categorias)].sort(), [primera, segunda]);
  assert.ok(hayCambiosDeCategoria(categorias), 'La sesión no mezcla las categorías');
});

Then(
  'no incluye ningún ítem de {categoria}, {categoria} ni {categoria}',
  (primera: string, segunda: string, tercera: string) => {
    const categorias = categoriasDe(sesionActual());
    assert.ok(categorias.length > 0, 'La sesión no tiene ítems');
    assert.deepEqual(
      categorias.filter((categoria) => [primera, segunda, tercera].includes(categoria)),
      [],
    );
  },
);

Then('la sesión no incluye ningún ítem de tipo {texto}', (tipo: string) => {
  const items = itemsDe(sesionActual());
  assert.ok(items.length > 0, 'La sesión no tiene ítems');
  assert.deepEqual(
    items.filter((visto) => mundo().contenido().item(visto.id).tipo === tipo),
    [],
  );
});

Then('sus problemas se presentan por bloques, sin mezclar con otras categorías', () => {
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  assert.equal(sesion.intercalada, false);
  assert.ok(categorias.length > 0, 'La sesión no tiene ítems');
  assert.ok(estanEnBloques(categorias), 'Los ítems no van por bloques');
  assert.deepEqual([...new Set(categorias)], [mundo().categoriaEnCurso]);
});

Then('no ve el nombre de su categoría ni el de su objetivo', () => {
  const visto = presente(mundo().presentado, 'el problema presentado');
  const contenido = mundo().contenido().item(visto.id);
  const texto = JSON.stringify(visto);
  assert.deepEqual([visto.categoria, visto.objetivo], [undefined, undefined]);
  assert.ok(!texto.includes(contenido.categoria ?? 'sin categoría'), 'Se ve la categoría');
  assert.ok(!texto.includes(contenido.objetivo), 'Se ve el objetivo');
});
