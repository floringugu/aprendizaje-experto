import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { EventoInicioSesion } from '../../../src/aplicacion/puertos.ts';
import { presente } from '../soporte/comprobar.ts';
import { ENLACE_DE_ACCESO } from '../soporte/claude-code.ts';
import { aTexto } from '../soporte/externos.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';

// Pasos del inicio de sesión de Claude Code desde Ajustes (MATE-8).

const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;

/** Lo que dice Ajustes → si hay una sesión iniciada (MATE-8.5). */
const ESTADOS: Readonly<Record<string, boolean>> = {
  'Sesión iniciada': true,
  'Sin sesión iniciada': false,
};

function salidaConEnlace(enlace: string): EventoInicioSesion {
  return { tipo: 'salida', texto: `Abre ${enlace} en el navegador para iniciar sesión.` };
}

/** Lo que escribe el inicio de sesión del PC al lanzarse: el enlace y, si se indica, la petición de un código. */
function prepararSalida(enlace: string, pideCodigo: boolean): void {
  const eventos: EventoInicioSesion[] = [salidaConEnlace(enlace)];
  if (pideCodigo) {
    eventos.push({ tipo: 'pide_codigo' });
  }
  mundo().externos.claudeCode.eventosAlLanzar = eventos;
}

/** La persona pulsa «Iniciar sesión en Claude Code» y el proceso del PC escribe lo que tenga que escribir. */
async function lanzar(actual: Mundo): Promise<void> {
  aceptado(await actual.aplicacion().iniciarSesionClaudeCode());
  actual.externos.claudeCode.emitirAlLanzar();
}

function prepararLanzamiento(): void {
  const actual = mundo();
  actual.prepararAsincrono(() => lanzar(actual));
}

async function sesionIniciada(actual: Mundo): Promise<boolean> {
  return aceptado(await actual.aplicacion().consultarAjustes()).sesionClaudeCode;
}

async function comprobarAjustes(texto: string): Promise<void> {
  const esperado = presente(ESTADOS[texto], `el estado «${texto}» de Ajustes`);
  assert.equal(await sesionIniciada(mundo()), esperado);
}

function comprobarCortado(): void {
  assert.ok(mundo().externos.claudeCode.cortado, 'El inicio de sesión del PC no se ha cortado');
}

/** «4 minutos y 59 segundos», «5 minutos» → milisegundos (MATE-8.3). */
function aMilisegundos(tiempo: string): number {
  const minutos = Number(/(\d+) minutos?/.exec(tiempo)?.[1] ?? 0);
  const segundos = Number(/(\d+) segundos?/.exec(tiempo)?.[1] ?? 0);
  assert.ok(minutos + segundos > 0, `No se entiende el tiempo «${tiempo}»`);
  return (minutos * SEGUNDOS_POR_MINUTO + segundos) * MS_POR_SEGUNDO;
}

function comprobarFueraDeLosFicheros(secreto: string): void {
  const escritos = mundo().externos.ficheros.escritos;
  const conSecreto = escritos.find((escrito) => aTexto(escrito.bytes).includes(secreto));
  assert.equal(conSecreto?.ruta, undefined, `«${secreto}» aparece en un fichero`);
}

function comprobarFueraDeLaConsola(secreto: string): void {
  const { consola } = mundo().material;
  assert.ok(!consola.join('').includes(secreto), `«${secreto}» aparece en la consola`);
}

// --- Cómo está el inicio de sesión antes de que la persona haga nada --------------------------------

Given('que no hay ninguna sesión de Claude Code iniciada', () => {
  mundo().externos.claudeCode.sesion = { iniciada: false };
});

Given('que hay una sesión de Claude Code iniciada con la cuenta {texto}', (cuenta: string) => {
  mundo().externos.claudeCode.sesion = { iniciada: true, cuenta };
});

Given('que el inicio de sesión del PC pide abrir el enlace {texto}', (enlace: string) => {
  prepararSalida(enlace, false);
});

Given('que el inicio de sesión del PC pide abrir el enlace {texto} y escribir un código', (enlace: string) => {
  prepararSalida(enlace, true);
});

Given('que el inicio de sesión del PC ha pedido un código', () => {
  prepararSalida(ENLACE_DE_ACCESO, true);
  prepararLanzamiento();
});

Given('que la persona ha pulsado «Iniciar sesión en Claude Code»', prepararLanzamiento);
Given('que el inicio de sesión está en marcha', prepararLanzamiento);

Given(
  'que el inicio de sesión del PC escribe en su salida el enlace {texto} y el token {texto}',
  (enlace: string, token: string) => {
    const actual = mundo();
    actual.material.secreto = token;
    actual.externos.claudeCode.eventosAlLanzar = [
      salidaConEnlace(enlace),
      { tipo: 'salida', texto: `Token: ${token}` },
    ];
  },
);

// --- MATE-8.1 a 8.4: lanzar, enviar el código, esperar y cancelar ----------------------------------

When('la persona pulsa «Iniciar sesión en Claude Code» en Ajustes, desde el móvil', async () => {
  const actual = mundo();
  await lanzar(actual);
  actual.material.inicioSesion = aceptado(await actual.aplicacion().consultarInicioSesion());
});

When('la persona escribe {texto} en la casilla del móvil y lo envía', async (codigo: string) => {
  const actual = mundo();
  actual.material.secreto = codigo;
  aceptado(await actual.aplicacion().enviarCodigo({ codigo }));
});

When(/^pasan (.+) sin que el inicio de sesión termine$/, (tiempo: string) => {
  mundo().externos.temporizador.avanzar(aMilisegundos(tiempo));
});

When('la persona pulsa «Cancelar»', async () => {
  aceptado(await mundo().aplicacion().cancelarInicioSesion());
});

When('la persona abre Ajustes', async () => {
  const actual = mundo();
  actual.ultimoResultado = await actual.aplicacion().consultarAjustes();
});

When('la persona inicia sesión en Claude Code con el código {texto}', async (codigo: string) => {
  const actual = mundo();
  actual.material.secreto = codigo;
  prepararSalida(ENLACE_DE_ACCESO, true);
  await lanzar(actual);
  aceptado(await actual.aplicacion().enviarCodigo({ codigo }));
  actual.externos.claudeCode.terminar(true);
});

Then('el móvil muestra el enlace {texto}', (enlace: string) => {
  const inicio = presente(mundo().material.inicioSesion, 'lo que muestra el móvil');
  assert.equal(inicio.enlace, enlace);
  assert.equal(inicio.pideCodigo, false);
});

Then('el móvil muestra el enlace {texto} y una casilla para el código', (enlace: string) => {
  const inicio = presente(mundo().material.inicioSesion, 'lo que muestra el móvil');
  assert.equal(inicio.enlace, enlace);
  assert.equal(inicio.pideCodigo, true);
});

Then('el inicio de sesión del PC recibe {texto}', (codigo: string) => {
  assert.deepEqual(mundo().externos.claudeCode.codigosRecibidos, [codigo]);
});

Then('Ajustes indica «Sesión iniciada» en cuanto el inicio de sesión termina', async () => {
  const actual = mundo();
  actual.externos.claudeCode.terminar(true);
  assert.equal(await sesionIniciada(actual), true);
});

Then('el inicio de sesión sigue en marcha', async () => {
  const actual = mundo();
  assert.ok(actual.externos.claudeCode.enMarcha, 'El inicio de sesión del PC se ha cortado');
  assert.ok(aceptado(await actual.aplicacion().consultarInicioSesion()).enMarcha, 'El móvil no lo ve en marcha');
});

Then('el inicio de sesión del PC se ha cortado', comprobarCortado);

Then('el inicio de sesión del PC se ha cortado y Ajustes indica «Sin sesión iniciada»', async () => {
  comprobarCortado();
  await comprobarAjustes('Sin sesión iniciada');
});

Then('Ajustes indica {texto}', comprobarAjustes);

// --- MATE-8.5 a 8.7: ni la cuenta, ni el código, ni el token salen de donde deben ----------------------

Then('no muestra la cuenta ni ningún token', () => {
  const ajustes = aceptado(presente(mundo().ultimoResultado, 'Ajustes sin abrir'));
  assert.deepEqual(Object.keys(ajustes as object), ['sesionClaudeCode']);
});

Then('{texto} no aparece en ningún fichero que escriba la aplicación', comprobarFueraDeLosFicheros);

Then('no aparece en lo que el servidor escribe en la consola', () => {
  comprobarFueraDeLaConsola(mundo().material.secreto);
});

Then('no muestra {texto}', (secreto: string) => {
  const inicio = presente(mundo().material.inicioSesion, 'lo que muestra el móvil');
  assert.ok(!JSON.stringify(inicio).includes(secreto), `El móvil muestra «${secreto}»`);
});

Then(
  '{texto} no aparece en ningún fichero que escriba la aplicación ni en lo que el servidor escribe en la consola',
  (secreto: string) => {
    comprobarFueraDeLosFicheros(secreto);
    comprobarFueraDeLaConsola(secreto);
  },
);
