import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Sesion } from '../../../src/aplicacion/sesiones.ts';
import { dominarObjetivo, progresoCompleto, responder } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import {
  aprobarObjetivoNuevo,
  conIntentoIntercalado,
  grupoDe,
  problemasDe,
  reservarProblema,
  responderEnIntercalado,
} from '../soporte/intercalado.ts';
import { mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
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

/**
 * Intercalar es lo contrario de ir por bloques: se vuelve a una categoría ya dejada. Que haya un cambio de
 * categoría no basta: dos bloques seguidos (C1, C1, C2, C2) también lo tienen.
 */
function estanMezcladas(categorias: readonly string[]): boolean {
  return !estanEnBloques(categorias);
}

function sesionActual(): Sesion {
  return presente(mundo().sesion, 'la sesión');
}

/** La persona empieza una sesión intercalada del grupo de la categoría del ítem y responde el ítem. */
function responderEnSesionIntercalada(actual: Mundo, item: string): void {
  actual.listo();
  const contenido = actual.contenido();
  const categoria = presente(contenido.item(item).categoria, `la categoría de ${item}`);
  iniciarSesionDePractica(actual, { grupo: grupoDe(contenido, categoria) });
  responder(actual, { item, correcta: true, contexto: 'intercalado' });
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

// O4 se aprueba cuando la persona ya está en la fase: no tiene ningún intento, así que no está dominado.
Given(
  'que {objetivo} se aprobó en la revisión del material, sin dominarlo ni practicarlo, con problemas de {categoria} y de {categoria}',
  (objetivo: string, primera: string, segunda: string) => {
    aprobarObjetivoNuevo(mundo(), objetivo, [primera, segunda]);
  },
);

Given('que {objetivo} queda dominado', (objetivo: string) => {
  const actual = mundo();
  actual.preparar(() => {
    dominarObjetivo(actual, objetivo);
  });
});

// Los problemas reservados no tienen intentos (MAST-8): la persona no los practica.
Given(
  'que el ítem {item} de {objetivo} es un problema reservado de la categoría {categoria}',
  (item: string, objetivo: string, categoria: string) => {
    reservarProblema(mundo(), { item, objetivo, categoria });
  },
);

// Todos los demás problemas del grupo ya se intercalaron, para que solo falte ese: si el reservado entra
// con él pendiente, el escenario lo ve.
Given('que un problema no reservado de {categoria} aún no tiene ningún intento intercalado', (categoria: string) => {
  const actual = mundo();
  actual.preparar(() => {
    const contenido = actual.contenido();
    const delGrupo = contenido.categorias
      .filter((candidata) => candidata.grupo_parecidas === grupoDe(contenido, categoria))
      .map((candidata) => candidata.id);
    const sinIntento = presente(problemasDe(contenido, [categoria])[0], `un problema no reservado de ${categoria}`);
    responderEnIntercalado(
      actual,
      problemasDe(contenido, delGrupo).filter((item) => item.id !== sinIntento.id),
    );
    assert.ok(!conIntentoIntercalado(actual).has(sinIntento.id), `${sinIntento.id} ya tiene un intento intercalado`);
  });
});

Given(
  'que todos los problemas no reservados de {categoria} y de {categoria} tienen un intento intercalado',
  (primera: string, segunda: string) => {
    const actual = mundo();
    actual.preparar(() => {
      responderEnIntercalado(actual, problemasDe(actual.contenido(), [primera, segunda]));
    });
  },
);

Given('que la persona ya respondió {item} en una sesión intercalada', (item: string) => {
  const actual = mundo();
  actual.preparar(() => {
    responderEnSesionIntercalada(actual, item);
  });
});

// --- Lo que hace la persona ----------------------------------------------------------------------

When('empieza una sesión de práctica', () => {
  iniciarSesionDePractica(mundo());
});

When('empieza una sesión intercalada del grupo {grupo}', (grupo: string) => {
  iniciarSesionDePractica(mundo(), { grupo });
});

When('empieza otra sesión intercalada del grupo {grupo}', (grupo: string) => {
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

When('la persona responde {item} en una sesión intercalada', (item: string) => {
  responderEnSesionIntercalada(mundo(), item);
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

Then('la sesión intercala problemas de categorías parecidas de objetivos dominados', () => {
  const actual = mundo();
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  const grupos = new Set(categorias.map((id) => grupoDe(actual.contenido(), id)));
  const progreso = progresoCompleto(actual);
  assert.equal(sesion.intercalada, true);
  assert.ok(estanMezcladas(categorias), 'La sesión no mezcla categorías');
  assert.equal(grupos.size, 1, 'Mezcla categorías de grupos distintos');
  itemsDe(sesion).forEach((visto) => {
    const objetivo = actual.contenido().item(visto.id).objetivo;
    assert.equal(
      progreso.objetivos.find((candidato) => candidato.objetivo === objetivo)?.estado,
      'dominado',
      `${visto.id} es de ${objetivo}, que no está dominado`,
    );
  });
});

Then('la sesión no intercala', () => {
  assert.equal(sesionActual().intercalada, false);
});

/** La sesión intercalada tiene problemas de las dos categorías, y no de otras, mezclados. */
function comprobarMezcla(primera: string, segunda: string): readonly string[] {
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  assert.equal(sesion.intercalada, true);
  assert.deepEqual([...new Set(categorias)].sort(), [primera, segunda]);
  assert.ok(estanMezcladas(categorias), 'La sesión no mezcla las categorías');
  return itemsDe(sesion).map((visto) => visto.id);
}

Then('la sesión mezcla problemas de {categoria} y de {categoria}', (primera: string, segunda: string) => {
  comprobarMezcla(primera, segunda);
});

Then(
  'la sesión mezcla problemas de {categoria} y de {categoria}, incluidos los de {objetivo}',
  (primera: string, segunda: string, objetivo: string) => {
    const presentados = comprobarMezcla(primera, segunda);
    const deObjetivo = problemasDe(mundo().contenido(), [primera, segunda]).filter(
      (item) => item.objetivo === objetivo,
    );
    assert.ok(deObjetivo.length > 0, `${objetivo} no tiene problemas de ${primera} ni de ${segunda}`);
    deObjetivo.forEach((item) => {
      assert.ok(presentados.includes(item.id), `La sesión no incluye ${item.id}, de ${objetivo}`);
    });
  },
);

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

// Practicar una categoría presenta solo la suya; practicar un objetivo, solo los suyos, de la categoría que sea.
Then('sus problemas se presentan por bloques, sin mezclar con otras categorías', () => {
  const actual = mundo();
  const sesion = sesionActual();
  const categorias = categoriasDe(sesion);
  assert.equal(sesion.intercalada, false);
  assert.ok(categorias.length > 0, 'La sesión no tiene ítems');
  assert.ok(estanEnBloques(categorias), 'Los ítems no van por bloques');
  if (actual.categoriaEnCurso === undefined) {
    itemsDe(sesion).forEach((visto) => {
      assert.equal(actual.contenido().item(visto.id).objetivo, actual.objetivoEnCurso);
    });
  } else {
    assert.deepEqual([...new Set(categorias)], [actual.categoriaEnCurso]);
  }
});

Then('no ve el nombre de su categoría ni el de su objetivo', () => {
  const visto = presente(mundo().presentado, 'el problema presentado');
  const contenido = mundo().contenido().item(visto.id);
  const texto = JSON.stringify(visto);
  assert.deepEqual([visto.categoria, visto.objetivo], [undefined, undefined]);
  assert.ok(!texto.includes(contenido.categoria ?? 'sin categoría'), 'Se ve la categoría');
  assert.ok(!texto.includes(contenido.objetivo), 'Se ve el objetivo');
});

Then('la sesión no incluye ningún problema de {objetivo}', (objetivo: string) => {
  const items = itemsDe(sesionActual());
  assert.ok(items.length > 0, 'La sesión no tiene ítems');
  assert.deepEqual(
    items.filter((visto) => mundo().contenido().item(visto.id).objetivo === objetivo).map((visto) => visto.id),
    [],
  );
});

Then('la sesión no incluye {item}', (item: string) => {
  const items = itemsDe(sesionActual());
  assert.ok(items.length > 0, 'La sesión no tiene ítems');
  assert.ok(!items.some((visto) => visto.id === item), `La sesión incluye ${item}`);
});

Then('la sesión incluye {item}', (item: string) => {
  assert.ok(
    itemsDe(sesionActual()).some((visto) => visto.id === item),
    `La sesión no incluye ${item}`,
  );
});

// Presentado como un problema cualquiera: mismos campos y ninguna mención de «reservado».
Then('{item} se presenta como los demás problemas, sin nada que lo distinga como reservado', (item: string) => {
  const items = itemsDe(sesionActual());
  const presentado = presente(
    items.find((visto) => visto.id === item),
    `${item} en la sesión`,
  );
  const otro = presente(
    items.find((visto) => visto.id !== item),
    'otro problema en la sesión',
  );
  assert.deepEqual(Object.keys(presentado).sort(), Object.keys(otro).sort());
  assert.ok(!JSON.stringify(presentado).toLowerCase().includes('reservado'), 'Se ve que es un reservado');
});
