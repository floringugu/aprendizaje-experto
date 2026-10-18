import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { responder, siguienteRepaso } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { fechaDeRepasoDePrueba } from '../soporte/planificador.ts';
import { hastaMinutos, instanteUtc, soloFecha } from '../soporte/reloj.ts';

// Pasos de la planificación de repasos (PLAN). FSRS es un doble de prueba (soporte/planificador.ts)
// que anota lo que recibe, y SM-2 lo calcula la propia aplicación.

const PORCENTAJE = 100;
const HORA_DE_LAS_RESPUESTAS = '09:00:00';

/** La persona responde un ítem de tipo «hecho» o «problema» y la aplicación programa su repaso. */
function responderItem(item: string, correcta: boolean): void {
  const actual = mundo();
  actual.listo();
  responder(actual, { item, correcta });
}

function ultimaProgramacionDeFsrs(actual: Mundo): Mundo['planificador']['programaciones'][number] {
  return presente(actual.planificador.programaciones.at(-1), 'ninguna llamada a FSRS');
}

// --- Contenido y configuración ------------------------------------------------------------------

Given('que O1 tiene el ítem H1 de tipo «hecho» y el ítem Q1 de tipo «problema»', () => {
  mundo().contenido().agregarItem({ id: 'H1', objetivo: 'O1', tipo: 'hecho' });
  mundo().contenido().agregarItem({ id: 'Q1', objetivo: 'O1', tipo: 'problema' });
});

// El horizonte 1 semana o 1 año es una entrada de `intervalo_repaso_por_horizonte`; se cambia su fracción.
function cambiarFraccion(horizonte: string, fraccion: number, dias?: number): void {
  const entradas = mundo().parametros['intervalo_repaso_por_horizonte']?.valor;
  assert.ok(Array.isArray(entradas), 'intervalo_repaso_por_horizonte tiene que ser una lista');
  const nuevas = (entradas as { horizonte: string }[]).map((entrada) =>
    entrada.horizonte === horizonte
      ? { ...entrada, fraccion_usada: fraccion, ...(dias === undefined ? {} : { horizonte_dias: dias }) }
      : entrada,
  );
  mundo().establecerParametro('intervalo_repaso_por_horizonte', nuevas);
}

Given(
  'que la fracción configurada para el horizonte de {horizonte} es del {fraccion}',
  (horizonte: string, fraccion: number) => {
    cambiarFraccion(horizonte, fraccion);
  },
);

Given(
  'que la fracción configurada para el horizonte de {horizonte} es del {fraccion} con un horizonte de {int} días',
  (horizonte: string, fraccion: number, dias: number) => {
    cambiarFraccion(horizonte, fraccion, dias);
  },
);

Given('que la persona ha elegido el horizonte de retención de {horizonte}', (horizonte: string) => {
  const actual = mundo();
  actual.preparar(() => {
    // La persona 1 solo aparece en los escenarios que comparan dos personas; elige lo mismo.
    [0, 1].forEach((persona) => {
      aceptado(actual.aplicacion(persona).elegirHorizonte({ dominio: actual.dominio, horizonte }));
    });
  });
});

Given('que H1 tiene un intervalo de repaso de {int} días', (dias: number) => {
  // Con SM-2, dos aciertos seguidos dejan el intervalo en 6 días (PLAN-2.1).
  const intervalos = new Map([
    [1, 1],
    [6, 2],
  ]);
  const aciertos = intervalos.get(dias);
  assert.ok(aciertos !== undefined, `Este escenario no sabe llegar a un intervalo de ${String(dias)} días`);
  const actual = mundo();
  actual.preparar(() => {
    for (let numero = 0; numero < aciertos; numero += 1) {
      responder(actual, { item: 'H1', correcta: true });
      actual.reloj.avanzarDias(1);
    }
  });
});

Given('que la persona acierta {item} con una confianza del {fraccion}', (item: string, confianza: number) => {
  const actual = mundo();
  actual.preparar(() => {
    responder(actual, { item, correcta: true, confianza: Math.round(confianza * PORCENTAJE) });
  });
});

// «En el mismo estado»: otra persona que parte de cero y responde igual, para comparar los dos repasos.
Given(
  'que otra vez, en el mismo estado, acierta {item} con una confianza del {fraccion}',
  (item: string, confianza: number) => {
    const actual = mundo();
    actual.preparar(() => {
      responder(actual, { item, correcta: true, confianza: Math.round(confianza * PORCENTAJE), persona: 1 });
    });
  },
);

// --- Lo que hace la persona ----------------------------------------------------------------------

When('la persona responde {item} y la respuesta es {word}', (item: string, correccion: string) => {
  assert.ok(['correcta', 'incorrecta'].includes(correccion), `«${correccion}» no es una corrección`);
  responderItem(item, correccion === 'correcta');
});

When('la persona responde {item}', (item: string) => {
  responderItem(item, true);
});

When('la persona acierta {item}', (item: string) => {
  responderItem(item, true);
});

When('la persona responde {item} el {instante}', (item: string, instante: Date) => {
  mundo().listo();
  mundo().reloj.fijar(instante);
  responderItem(item, true);
});

When('la persona acierta {item} por primera vez el {fecha}', (item: string, fecha: string) => {
  mundo().listo();
  mundo().reloj.fijar(instanteUtc(fecha, HORA_DE_LAS_RESPUESTAS));
  responderItem(item, true);
});

When('la persona falla {item} el {fecha}', (item: string, fecha: string) => {
  mundo().listo();
  mundo().reloj.fijar(instanteUtc(fecha, HORA_DE_LAS_RESPUESTAS));
  responderItem(item, false);
});

When('la persona elige su horizonte de retención', () => {
  const actual = mundo();
  actual.opciones = aceptado(actual.listo().consultarHorizontes({ dominio: actual.dominio }));
});

// --- Lo que ve la persona ------------------------------------------------------------------------

Then('FSRS recibe la calificación {texto}', (calificacion: string) => {
  assert.equal(ultimaProgramacionDeFsrs(mundo()).calificacion, calificacion);
});

/** El repaso programado es el que calcula FSRS con la calificación que recibió y esa retención. */
function comprobarRepasoDeFsrs(item: string, retencion: number): void {
  const entrada = ultimaProgramacionDeFsrs(mundo());
  const esperado = fechaDeRepasoDePrueba(entrada.calificacion, retencion, mundo().reloj.ahora());
  assert.equal(entrada.retencionObjetivo, retencion, 'La retención que recibe FSRS');
  assert.equal(siguienteRepaso(mundo(), item).getTime(), esperado.getTime());
}

Then(
  'el siguiente repaso de {item} es el que calcula FSRS para esa calificación con una retención del {fraccion}',
  comprobarRepasoDeFsrs,
);

Then('el siguiente repaso de {item} es el que calcula FSRS con una retención del {fraccion}', comprobarRepasoDeFsrs);

Then('la aplicación no le pide que califique el repaso como difícil, bien o fácil', () => {
  const presentado = presente(mundo().presentado, 'el ítem presentado');
  const peticiones = [...presentado.acciones, ...Object.keys(presente(mundo().feedback, 'el feedback'))];
  assert.deepEqual(
    peticiones.filter((peticion) => /difícil|dificil|bien|fácil|facil|califi/i.test(peticion)),
    [],
  );
});

Then('FSRS nunca recibe las calificaciones {texto} ni {texto}', (primera: string, segunda: string) => {
  const recibidas = mundo().planificador.programaciones.map((entrada) => entrada.calificacion as string);
  assert.ok(recibidas.length > 0, 'FSRS no ha recibido ninguna calificación');
  assert.deepEqual(
    recibidas.filter((calificacion) => calificacion === primera || calificacion === segunda),
    [],
  );
});

Then('las dos veces el siguiente repaso de {item} cae en la misma fecha', (item: string) => {
  const primera = siguienteRepaso(mundo(), item, 0);
  const segunda = siguienteRepaso(mundo(), item, 1);
  assert.equal(primera.getTime(), segunda.getTime());
});

Then('el siguiente repaso de {item} es el {fecha}', (item: string, fecha: string) => {
  assert.equal(soloFecha(siguienteRepaso(mundo(), item)), fecha);
});

Then('si lo acierta el {fecha}, el siguiente repaso es el {fecha}', (acierto: string, siguiente: string) => {
  const actual = mundo();
  const item = presente(actual.presentado, 'el ítem que acaba de responder').id;
  actual.reloj.fijar(instanteUtc(acierto, HORA_DE_LAS_RESPUESTAS));
  responder(actual, { item, correcta: true });
  assert.equal(soloFecha(siguienteRepaso(actual, item)), siguiente);
});

Then('el siguiente repaso de {item} es el {instante}', (item: string, esperado: Date) => {
  assert.equal(hastaMinutos(siguienteRepaso(mundo(), item)), hastaMinutos(esperado));
});

Then('las únicas opciones son {textos}', (esperadas: string[]) => {
  assert.deepEqual(presente(mundo().opciones, 'ninguna lista de opciones'), esperadas);
});

Then('el siguiente repaso de {item} no depende de FSRS ni de SM-2', (item: string) => {
  const { planificador } = mundo();
  assert.equal(planificador.programaciones.length + planificador.recalculos.length, 0, 'Se ha llamado a FSRS');
  assert.ok(siguienteRepaso(mundo(), item).getTime() > mundo().reloj.ahora().getTime());
});

Then('es el mismo tanto si acierta como si falla', () => {
  // Otra persona falla el mismo ítem en el mismo instante y debe tener el mismo repaso.
  const actual = mundo();
  const item = presente(actual.presentado, 'el ítem que acaba de responder').id;
  responder(actual, { item, correcta: false, persona: 1 });
  assert.equal(siguienteRepaso(actual, item, 0).getTime(), siguienteRepaso(actual, item, 1).getTime());
});
