import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { Calibracion } from '../../../src/aplicacion/bucle.ts';
import type { Progreso } from '../../../src/aplicacion/dominio.ts';
import { responder } from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import { respuestaPara } from '../soporte/contenido.ts';
import { filasDelDominio, ultimaFila } from '../soporte/csv.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';

// Pasos de la calibración de la confianza (CALI). La confianza va de 0 a 100, igual que los puntos
// de la calibración del bucle semanal.

const PORCENTAJE = 100;
const ITEMS_POR_OBJETIVO = 2;
const PERSONAS = [0, 1];

function calibracionDelBucle(): Calibracion {
  return presente(mundo().bucle, 'el resultado del bucle semanal').calibracion;
}

/** Filas de respuestas.csv de un ítem. */
function filasDe(item: string): number {
  return filasDelDominio(mundo(), 'respuestas.csv').filter((fila) => fila['item'] === item).length;
}

function clavesDe(valor: unknown): string[] {
  return typeof valor === 'object' && valor !== null ? Object.keys(valor) : [];
}

// --- Declarar la confianza (CALI-1) ---------------------------------------------------------------

// La persona escribe su respuesta, pero todavía no dice cuánto cree que sabe.
Given('que la persona ha respondido el ítem {item}', (item: string) => {
  const actual = mundo();
  const contenido = actual.contenido().asegurarItem(item);
  actual.preparar(() => {
    const app = actual.aplicacion();
    const peticion = { dominio: actual.dominio, item, contexto: 'practica' } as const;
    actual.presentado = aceptado(app.presentarItem(peticion));
    actual.ultimoResultado = app.responderItem({ ...peticion, respuesta: respuestaPara(contenido, true) });
  });
});

When('aún no ha declarado su confianza', () => {
  mundo().listo();
});

Then('no ve si ha acertado ni el feedback de {item}', (item: string) => {
  const actual = mundo();
  const recogida = presente(actual.ultimoResultado, 'el resultado de recoger la respuesta');
  assert.ok(recogida.ok, 'La aplicación rechazó la respuesta');
  assert.deepEqual(clavesDe(recogida.valor), ['esperandoConfianza']);
  assert.equal(actual.feedback, undefined);
  assert.equal(filasDe(item), 0, 'El intento ya consta en respuestas.csv sin haber declarado la confianza');
});

When('la persona declara una confianza del {int} % en {item}', (confianza: number, item: string) => {
  const actual = mundo();
  const contenido = actual.contenido().asegurarItem(item);
  const app = actual.listo();
  const peticion = { dominio: actual.dominio, item, contexto: 'practica' } as const;
  aceptado(app.presentarItem(peticion));
  aceptado(app.responderItem({ ...peticion, respuesta: respuestaPara(contenido, true) }));
  actual.ultimoResultado = app.declararConfianza({ dominio: actual.dominio, item, confianza });
});

/** Una confianza aceptada deja el intento registrado; una rechazada no deja nada. */
function comprobarConfianza(aceptada: boolean): void {
  const actual = mundo();
  assert.equal(presente(actual.ultimoResultado, 'el resultado de declarar la confianza').ok, aceptada);
  assert.equal(filasDe('I1'), aceptada ? 1 : 0);
}

Then('la confianza se acepta', () => {
  comprobarConfianza(true);
});

Then('la confianza se rechaza', () => {
  comprobarConfianza(false);
});

When('la persona responde {item} y declara una confianza del {int} %', (item: string, confianza: number) => {
  const actual = mundo();
  actual.contenido().asegurarItem(item);
  actual.listo();
  responder(actual, { item, correcta: true, confianza });
});

Then('respuestas.csv registra ese intento con la confianza {int}', (confianza: number) => {
  const actual = mundo();
  const fila = ultimaFila(actual, 'respuestas.csv');
  assert.equal(fila['item'], presente(actual.presentado, 'el ítem respondido').id);
  assert.equal(fila['confianza'], String(confianza));
});

// --- Calibración en el bucle semanal (CALI-2) ------------------------------------------------------

Given('que en la última semana la persona respondió estos ítems:', (tabla: DataTable) => {
  const actual = mundo();
  const filas = tabla.hashes();
  filas.forEach((fila) => actual.contenido().asegurarItem(fila['ítem'] ?? ''));
  actual.preparar(() => {
    filas.forEach((fila) => {
      responder(actual, {
        item: fila['ítem'] ?? '',
        correcta: fila['correcta'] === 'sí',
        confianza: Number(fila['confianza']),
      });
    });
  });
});

Given('que en la última semana la persona no respondió ningún ítem', () => {
  // Es el estado de partida: el diagnóstico sin ítems marcados no deja ninguna respuesta.
});

Then('el paso de calibración muestra una confianza media del {fraccion}', (fraccion: number) => {
  esperarCasiIgual(calibracionDelBucle().confianzaMedia, fraccion * PORCENTAJE, 'confianza media');
});

Then('un acierto del {fraccion}', (fraccion: number) => {
  esperarCasiIgual(calibracionDelBucle().acierto, fraccion * PORCENTAJE, 'acierto de la semana');
});

// El signo va en el texto («+25»): `{word}` lo deja pasar y `Number` lo entiende.
Then('una diferencia de {word} puntos entre confianza y acierto', (puntos: string) => {
  esperarCasiIgual(calibracionDelBucle().diferencia, Number(puntos), 'diferencia entre confianza y acierto');
});

Then('el paso de calibración indica que no hay respuestas para calibrar', () => {
  const calibracion = calibracionDelBucle();
  assert.equal(calibracion.hayRespuestas, false);
  assert.deepEqual(
    [calibracion.confianzaMedia, calibracion.acierto, calibracion.diferencia],
    [undefined, undefined, undefined],
  );
});

// --- La confianza no afecta al progreso (CALI-3) ---------------------------------------------------

Given('dos personas con los mismos intentos y aciertos en el dominio {texto}', (dominio: string) => {
  assert.equal(mundo().dominio, dominio);
  mundo().contenido().asegurarItemsPorObjetivo(ITEMS_POR_OBJETIVO);
});

/** Las dos personas responden lo mismo: aciertan todo O1 y solo el primer ítem de los demás objetivos. */
function repetirLaHistoria(persona: number, confianza: number): void {
  const actual = mundo();
  actual.contenido().objetivos.forEach((objetivo, posicion) => {
    actual
      .contenido()
      .itemsDe(objetivo.id)
      .forEach((item, orden) => {
        const correcta = posicion === 0 || orden === 0;
        responder(actual, { item: item.id, correcta, confianza, persona });
      });
  });
}

// Las historias se crean aquí y no en el paso anterior porque solo ahora se sabe la confianza de cada una.
Given(
  'una declaró siempre una confianza del {fraccion} y la otra del {fraccion}',
  (primera: number, segunda: number) => {
    const actual = mundo();
    actual.preparar(() => {
      [primera, segunda].forEach((confianza, persona) => {
        repetirLaHistoria(persona, Math.round(confianza * PORCENTAJE));
      });
    });
  },
);

When('la aplicación evalúa a las dos', () => {
  const actual = mundo();
  actual.listo();
  PERSONAS.forEach((persona) => {
    const app = actual.aplicacion(persona);
    actual.contenido().objetivos.forEach((objetivo) => {
      aceptado(app.evaluarObjetivo({ dominio: actual.dominio, objetivo: objetivo.id }));
    });
    aceptado(app.evaluarFase({ dominio: actual.dominio }));
  });
});

function progresoDePersona(persona: number): Progreso {
  return aceptado(mundo().aplicacion(persona).consultarProgreso({ dominio: mundo().dominio }));
}

Then('las dos tienen los mismos objetivos dominados y la misma fase', () => {
  const primera = progresoDePersona(0);
  const segunda = progresoDePersona(1);
  const estados = (progreso: Progreso): string[] => progreso.objetivos.map((objetivo) => objetivo.estado);
  assert.ok(estados(primera).includes('dominado'), 'La historia de prueba no domina ningún objetivo');
  assert.deepEqual(estados(primera), estados(segunda));
  assert.equal(primera.fase, segunda.fase);
});

Then('los mismos pasos retirados en cada objetivo', () => {
  const pasos = (persona: number): number[] => progresoDePersona(persona).objetivos.map((o) => o.pasosRetirados);
  assert.deepEqual(pasos(0), pasos(1));
});

Then('las mismas fechas de repaso', () => {
  const actual = mundo();
  const repasos = PERSONAS.map((persona) =>
    aceptado(actual.aplicacion(persona).consultarRepasos({ dominio: actual.dominio })),
  );
  assert.ok((repasos[0]?.length ?? 0) > 0, 'Las personas no tienen ningún repaso programado');
  assert.deepEqual(repasos[0], repasos[1]);
});
