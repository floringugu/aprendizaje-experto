import assert from 'node:assert/strict';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { NombreDePantalla } from '../../../src/aplicacion/pantallas.ts';
import type { Preferencias, Tema } from '../../../src/aplicacion/preferencias.ts';
import { aFase, progresoCompleto, progresoDe, responder, siguienteRepaso } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { respuestaPara } from '../soporte/contenido.ts';
import { filasDelDominio } from '../soporte/csv.ts';
import type { FilaCsv } from '../soporte/csv.ts';
import { DIRECCION_DE_PRUEBA } from '../soporte/escenario-pantallas.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { MS_POR_DIA, instanteUtc, soloFecha } from '../soporte/reloj.ts';

// Pasos de «Servidor y pantallas» (PANT): el emparejamiento por QR, el progreso que sobrevive a un reinicio
// del servidor y las preferencias. Todo pasa por los casos de uso de `Aplicacion` (docs/areas/PANT.md,
// «Cómo se prueban las pantallas»).

// La persona 0 de estos escenarios guarda su progreso en los ficheros de prueba; un reinicio es abrirla otra vez.
Before({ tags: '@PANT' }, function (this: Mundo) {
  this.persistente = true;
});

/** Cómo escribe el feature cada pantalla, y cómo la llama la aplicación. */
const PANTALLAS: Readonly<Record<string, NombreDePantalla>> = {
  Hoy: 'hoy',
  'Sesión de práctica': 'practica',
  Ajustes: 'ajustes',
};

const TEMAS: Readonly<Record<string, Tema>> = { automático: 'automatico', claro: 'claro', oscuro: 'oscuro' };

/** Una clave de 128 bits en base64url son 22 caracteres; en hexadecimal, 32. */
const CLAVE_DE_UN_SOLO_USO = /^[A-Za-z0-9_-]{22,}$/;
/** Con la forma de una clave de verdad, pero que no es la del QR. */
const CLAVE_AJENA = 'A'.repeat('0123456789012345678901'.length);
const HORA_DEL_REPASO = '09:00:00';

function aPantalla(nombre: string): NombreDePantalla {
  return presente(PANTALLAS[nombre], `ninguna pantalla llamada «${nombre}»`);
}

function aTema(nombre: string): Tema {
  return presente(TEMAS[nombre], `ningún tema llamado «${nombre}»`);
}

/** La clave de un solo uso que lleva el texto del QR (`<dirección>/entrar?clave=<clave>`). */
function claveDelQr(texto: string): string {
  return presente(new URL(texto).searchParams.get('clave') ?? undefined, 'la clave en el QR');
}

function qrMostrado(actual: Mundo): string {
  return presente(actual.pantallas.qr, 'ningún QR en el PC');
}

/** El móvil emparejado: si todavía no lo estaba, entra con la clave de un QR nuevo. */
function movilEmparejado(actual: Mundo): string {
  if (actual.pantallas.movil === undefined) {
    const app = actual.listo();
    const qr = app.abrirEmparejamiento().texto;
    actual.pantallas.movil = aceptado(app.emparejar({ clave: claveDelQr(qr) })).dispositivo;
  }
  return actual.pantallas.movil;
}

function abrirLaPantalla(nombre: string): void {
  const actual = mundo();
  const dispositivo = movilEmparejado(actual);
  actual.pantallas.pantalla = actual.listo().abrirPantalla({ dispositivo, pantalla: aPantalla(nombre) });
  aceptado(actual.pantallas.pantalla);
}

// --- PANT-1: sin emparejar no se entra -----------------------------------------------------------

Given('que el servidor está en marcha y el PC muestra un QR con una clave de un solo uso', () => {
  const actual = mundo();
  actual.preparar(() => {
    actual.pantallas.qr = actual.aplicacion().abrirEmparejamiento().texto;
  });
});

When('se lee el texto del QR', () => {
  const actual = mundo();
  actual.listo();
  qrMostrado(actual);
});

Then('el texto es la dirección del servidor con la clave de un solo uso', () => {
  const texto = qrMostrado(mundo());
  assert.ok(texto.startsWith(`${DIRECCION_DE_PRUEBA}/entrar?clave=`), `El QR «${texto}» no lleva la dirección`);
  assert.match(claveDelQr(texto), CLAVE_DE_UN_SOLO_USO);
});

When('un dispositivo sin emparejar pide la pantalla {texto}', (nombre: string) => {
  const actual = mundo();
  actual.pantallas.pantalla = actual.listo().abrirPantalla({ pantalla: aPantalla(nombre) });
});

Then('el servidor no se la muestra', () => {
  const resultado = presente(mundo().pantallas.pantalla, 'ninguna respuesta a la pantalla pedida');
  assert.equal(resultado.ok, false, 'El servidor mostró la pantalla a un dispositivo sin emparejar');
});

Then('la respuesta no contiene ningún dato del progreso', () => {
  const actual = mundo();
  const respuesta = JSON.stringify(actual.pantallas.pantalla);
  const progreso = progresoCompleto(actual);
  const datos = [actual.dominio, progreso.fase, ...progreso.objetivos.map((objetivo) => objetivo.objetivo)];
  datos.forEach((dato) => {
    assert.ok(!respuesta.includes(dato), `La respuesta lleva «${dato}»: ${respuesta}`);
  });
});

When('un móvil entra con la clave del QR', () => {
  const actual = mundo();
  const app = actual.listo();
  actual.pantallas.emparejamiento = app.emparejar({ clave: claveDelQr(qrMostrado(actual)) });
});

Then('el móvil queda emparejado', () => {
  const actual = mundo();
  const emparejamiento = presente(actual.pantallas.emparejamiento, 'ninguna respuesta al emparejar');
  actual.pantallas.movil = aceptado(emparejamiento).dispositivo;
});

Then('puede pedir la pantalla {texto} sin repetir la clave', (nombre: string) => {
  const actual = mundo();
  const dispositivo = presente(actual.pantallas.movil, 'ningún móvil emparejado');
  aceptado(actual.listo().abrirPantalla({ dispositivo, pantalla: aPantalla(nombre) }));
});

When('un móvil entra con una clave que no es la del QR', () => {
  const actual = mundo();
  const app = actual.listo();
  assert.notEqual(claveDelQr(qrMostrado(actual)), CLAVE_AJENA);
  actual.pantallas.emparejamiento = app.emparejar({ clave: CLAVE_AJENA });
});

Then('el móvil no queda emparejado', () => {
  const resultado = presente(mundo().pantallas.emparejamiento, 'ninguna respuesta al emparejar');
  assert.equal(resultado.ok, false, 'El servidor emparejó el móvil con una clave que no vale');
});

// El que no se emparejó no tiene token; si el servidor se lo hubiera dado, lo usaría.
Then('no ve ninguna pantalla', () => {
  const actual = mundo();
  const emparejamiento = presente(actual.pantallas.emparejamiento, 'ninguna respuesta al emparejar');
  const dispositivo = emparejamiento.ok ? emparejamiento.valor.dispositivo : undefined;
  Object.values(PANTALLAS).forEach((pantalla) => {
    const resultado = actual.listo().abrirPantalla({ dispositivo, pantalla });
    assert.equal(resultado.ok, false, `El servidor mostró la pantalla «${pantalla}»`);
  });
});

Given('que un móvil se emparejó con la clave del QR', () => {
  const actual = mundo();
  actual.preparar(() => {
    const clave = claveDelQr(qrMostrado(actual));
    actual.pantallas.movil = aceptado(actual.aplicacion().emparejar({ clave })).dispositivo;
  });
});

When('otro dispositivo entra con esa misma clave', () => {
  const actual = mundo();
  const app = actual.listo();
  actual.pantallas.emparejamiento = app.emparejar({ clave: claveDelQr(qrMostrado(actual)) });
});

Then('el otro dispositivo no queda emparejado', () => {
  const resultado = presente(mundo().pantallas.emparejamiento, 'ninguna respuesta al emparejar');
  assert.equal(resultado.ok, false, 'El servidor emparejó un segundo dispositivo con la clave ya gastada');
});

// --- PANT-2: el progreso sobrevive a un reinicio del servidor -------------------------------------

Given(
  'que la persona respondió {int} ítems de {objetivo} y declaró su confianza en cada uno',
  (cantidad: number, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      actual.contenido().asegurarItemsPorObjetivo(cantidad);
      actual
        .contenido()
        .itemsDe(objetivo)
        .slice(0, cantidad)
        .forEach((item) => {
          responder(actual, { item: item.id, correcta: true });
        });
    });
  },
);

/** Domina el objetivo sin repetir ítems: los que ya tienen intento se dejan, para que O1 siga con 20 intentos. */
function dominarSinRepetir(actual: Mundo, objetivo: string): void {
  const items = actual.contenido().itemsDe(objetivo);
  items.forEach((item) => {
    if (!actual.intentos.has(item.id)) {
      responder(actual, { item: item.id, correcta: true });
    }
  });
  aceptado(actual.aplicacion().evaluarObjetivo({ dominio: actual.dominio, objetivo }));
}

Given('que {ids} están dominados y la fase es {texto}', (objetivos: string[], fase: string) => {
  const actual = mundo();
  actual.preparar(() => {
    objetivos.forEach((objetivo) => {
      dominarSinRepetir(actual, objetivo);
    });
    aceptado(actual.aplicacion().evaluarFase({ dominio: actual.dominio }));
    assert.equal(progresoCompleto(actual).fase, aFase(fase));
  });
});

/** El ítem, si es del objetivo que dice el escenario; si no, el paso falla. */
function itemDelObjetivo(actual: Mundo, item: string, objetivo: string): string {
  assert.equal(actual.contenido().item(item).objetivo, objetivo, `${item} no es de ${objetivo}`);
  return item;
}

// Con SM-2 el primer acierto de un ítem de tipo «hecho» programa el repaso para el día siguiente (PLAN-2.1):
// el reloj empieza el día anterior, antes que cualquier respuesta de la preparación.
Given(
  'que hay un repaso de {item} de {objetivo} programado para el {fecha}',
  (item: string, objetivo: string, fecha: string) => {
    const actual = mundo();
    const respuesta = new Date(instanteUtc(fecha, HORA_DEL_REPASO).getTime() - MS_POR_DIA);
    actual.prepararAntes(() => {
      actual.contenido().asegurarItem(item, objetivo);
      actual.establecerParametro('planificador_algoritmo', { principal: 'sm2', alternativa: 'fsrs' });
      actual.reloj.fijar(respuesta);
    });
  },
);

Given('que la persona responde {item} de {objetivo} y declara su confianza', (item: string, objetivo: string) => {
  const actual = mundo();
  actual.preparar(() => {
    actual.contenido().asegurarItem(item, objetivo);
    responder(actual, { item: itemDelObjetivo(actual, item, objetivo), correcta: true });
  });
});

// Presenta el ítem y recoge la respuesta, pero la persona cierra la aplicación antes de declarar la confianza.
Given('que la persona responde {item} de {objetivo} sin declarar su confianza', (item: string, objetivo: string) => {
  const actual = mundo();
  actual.preparar(() => {
    actual.contenido().asegurarItem(item, objetivo);
    const app = actual.aplicacion();
    const peticion = {
      dominio: actual.dominio,
      item: itemDelObjetivo(actual, item, objetivo),
      contexto: 'practica',
    } as const;
    aceptado(app.presentarItem(peticion));
    aceptado(app.responderItem({ ...peticion, respuesta: respuestaPara(actual.contenido().item(item), true) }));
  });
});

// El móvil ya estaba emparejado antes del reinicio, y por eso tiene que seguir emparejado después.
function reiniciarElServidor(): void {
  const actual = mundo();
  movilEmparejado(actual);
  actual.reiniciarServidor();
}

When('se reinicia el servidor', reiniciarElServidor);
// El feedback lo muestra la app a quien responde, y el reinicio mata esa pantalla: solo hace falta que el ítem se respondiera.
When('se reinicia el servidor sin que la persona haya visto el feedback de {item}', (item: string) => {
  const actual = mundo();
  actual.listo();
  assert.ok(actual.intentos.has(item), `La persona no respondió ${item} antes del reinicio`);
  reiniciarElServidor();
});
When('la persona abre la pantalla {texto}', abrirLaPantalla);

function intentosRegistrados(): readonly FilaCsv[] {
  return filasDelDominio(mundo(), 'respuestas.csv');
}

Then('{objetivo} tiene {int} intento(s) registrado(s)', (objetivo: string, cantidad: number) => {
  const delObjetivo = intentosRegistrados().filter((fila) => fila['objetivo'] === objetivo);
  assert.equal(delObjetivo.length, cantidad, `Intentos de ${objetivo}`);
});

Then('{ids} siguen dominados y la fase sigue siendo {texto}', (objetivos: string[], fase: string) => {
  const actual = mundo();
  objetivos.forEach((objetivo) => {
    assert.equal(progresoDe(actual, objetivo).estado, 'dominado', `${objetivo} ya no está dominado`);
  });
  assert.equal(progresoCompleto(actual).fase, aFase(fase));
});

Then(
  'el repaso de {item} de {objetivo} sigue programado para el {fecha}',
  (item: string, objetivo: string, fecha: string) => {
    const actual = mundo();
    assert.equal(soloFecha(siguienteRepaso(actual, itemDelObjetivo(actual, item, objetivo))), fecha);
  },
);

Then('es el intento de {item}', (item: string) => {
  assert.deepEqual(
    intentosRegistrados().map((fila) => fila['item']),
    [item],
  );
});

Then('{item} sigue sin intento', (item: string) => {
  assert.deepEqual(
    intentosRegistrados().filter((fila) => fila['item'] === item),
    [],
    `${item} tiene intentos registrados`,
  );
});

// --- PANT-3: los ajustes ---------------------------------------------------------------------------

Given('que la persona nunca ha cambiado sus ajustes', () => {
  const actual = mundo();
  actual.preparar(() => {
    assert.equal(actual.externos.ficheros.leer('preferencias.json'), undefined, 'Ya hay preferencias guardadas');
  });
});

When('abre la pantalla {texto}', abrirLaPantalla);

Given('que la persona cambia el tema a {texto} y apaga la vibración', (tema: string) => {
  const actual = mundo();
  actual.preparar(() => {
    aceptado(actual.aplicacion().cambiarPreferencias({ tema: aTema(tema), vibracion: false }));
  });
});

/** Las preferencias que muestra la pantalla de Ajustes que se abrió en el «Cuando». */
function preferenciasMostradas(): Preferencias {
  const pantalla = aceptado(presente(mundo().pantallas.pantalla, 'ninguna pantalla abierta'));
  if (pantalla.pantalla !== 'ajustes') {
    throw new Error(`La pantalla abierta es «${pantalla.pantalla}», no la de Ajustes`);
  }
  return pantalla.preferencias;
}

Then('el tema es {texto}', (tema: string) => {
  assert.equal(preferenciasMostradas().tema, aTema(tema));
});

Then('la vibración está encendida', () => {
  assert.equal(preferenciasMostradas().vibracion, true);
});

Then('la vibración está apagada', () => {
  assert.equal(preferenciasMostradas().vibracion, false);
});
