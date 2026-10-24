import { MS_PARA_INICIAR_SESION } from '../dominio/unidades.ts';
import type { CasosDeClaudeCode, InicioSesionEnCurso } from './claude-code.ts';
import type { ClaudeCode, EventoInicioSesion, ProcesoInicioSesion, Temporizador } from './puertos.ts';
import { aceptar, rechazar, rechazarElCampo } from './resultado.ts';
import type { Resultado } from './resultado.ts';

/**
 * Los casos de uso del inicio de sesión de Claude Code desde Ajustes (MATE-8), con el estado del
 * inicio en curso en memoria: si está en marcha, el enlace y si pide un código. Cada llamada es un
 * estado nuevo; la aplicación crea uno por persona. Devuelve un objeto de funciones, no una instancia
 * de clase: `crearAplicacion` lo reparte con `...`, que no copia los métodos de una clase.
 *
 * - `iniciarSesionClaudeCode` lanza `claudeCode.iniciarSesion` y programa con `temporizador` el corte
 *   a los `MS_PARA_INICIAR_SESION` (@MATE-8.3). Si ya había uno en marcha, lo corta antes y cancela su
 *   corte programado: solo hay un inicio en curso, y los eventos de un proceso que ya no es el actual
 *   se ignoran.
 * - De cada evento `salida` solo se saca la primera URL `https://`, sin la puntuación que la cierra
 *   (`.`, `,`, `;`, `:`, `)`, `»`…); el resto del texto se tira sin guardarlo ni escribirlo en ningún
 *   sitio (@MATE-8.7). El enlace es el de la primera salida que trae uno; las siguientes no lo cambian.
 *   `pide_codigo` muestra la casilla del código (@MATE-8.1). `terminado`, con o sin éxito, deja el
 *   inicio parado y cancela el corte programado.
 * - `consultarInicioSesion` da `{ enMarcha, enlace, pideCodigo }`; sin un inicio en marcha,
 *   `{ enMarcha: false, pideCodigo: false }`, sin enlace.
 * - `enviarCodigo` pasa el código a `proceso.enviar` tal cual, sin guardarlo (@MATE-8.2, @MATE-8.6).
 *   Rechaza si no hay un inicio en marcha, y con `campo` `codigo` si el código está vacío o solo tiene
 *   espacios.
 * - `cancelarInicioSesion` corta el proceso y cancela el corte programado (@MATE-8.4). Sin un inicio en
 *   marcha no hace nada y acepta.
 * - Al cortarse, por «Cancelar» o a los 5 minutos, el inicio queda parado: `enMarcha` es `false`.
 * - `consultarAjustes` devuelve solo `{ sesionClaudeCode }`, con `iniciada` de `claudeCode.estado()`; la
 *   cuenta no sale de aquí (@MATE-8.5).
 */
export function crearInicioSesion(claudeCode: ClaudeCode, temporizador: Temporizador): CasosDeClaudeCode {
  // El inicio en curso vive en este cierre: dos llamadas a la función no comparten nada.
  const inicios: Inicios = { claudeCode, temporizador, actual: undefined };
  return {
    consultarAjustes: () => consultarAjustes(claudeCode),
    iniciarSesionClaudeCode: () => Promise.resolve(iniciar(inicios)),
    consultarInicioSesion: () => Promise.resolve(aceptar(vistaDe(inicios.actual))),
    enviarCodigo: (peticion) => Promise.resolve(enviarCodigo(inicios, peticion)),
    cancelarInicioSesion: () => {
      cortarElActual(inicios);
      return Promise.resolve(aceptar(null));
    },
  };
}

/** Los puertos y el inicio en curso: lo que comparten los casos de un `crearInicioSesion`. */
interface Inicios {
  readonly claudeCode: ClaudeCode;
  readonly temporizador: Temporizador;
  /**
   * El inicio en curso, o `undefined` si no hay ninguno. Cada inicio es un objeto propio: los eventos y
   * el corte programado de un inicio que ya no es el actual solo cambian ese objeto, que ya no se enseña.
   */
  actual: Inicio | undefined;
}

interface Inicio {
  proceso?: ProcesoInicioSesion;
  /** Cancela el corte programado a los 5 minutos. */
  cancelarCorte?: () => void;
  // Con `| undefined` porque `??=` en `anotar` puede escribir un `undefined` explícito.
  enlace?: string | undefined;
  pideCodigo: boolean;
}

async function consultarAjustes(claudeCode: ClaudeCode): Promise<Resultado<{ readonly sesionClaudeCode: boolean }>> {
  const { iniciada } = await claudeCode.estado();
  // Solo la bandera: la cuenta no sale de aquí (@MATE-8.5).
  return aceptar({ sesionClaudeCode: iniciada });
}

/**
 * Corta el inicio en curso, si lo hay, y lanza uno nuevo, que pasa a ser el actual antes de llamar a
 * `iniciarSesion`: un evento puede llegar dentro de esa llamada, antes de que el proceso esté guardado.
 * Programa el corte a los `MS_PARA_INICIAR_SESION` solo si el inicio sigue siendo el actual al volver: si
 * el proceso ya terminó dentro de la llamada, no queda nada que cortar.
 */
function iniciar(inicios: Inicios): Resultado<null> {
  cortarElActual(inicios);
  const inicio: Inicio = { pideCodigo: false };
  inicios.actual = inicio;
  // Un evento puede llegar dentro de `iniciarSesion`, antes de que `proceso` esté guardado.
  inicio.proceso = inicios.claudeCode.iniciarSesion((evento) => {
    alRecibir(inicios, inicio, evento);
  });
  // Si el proceso ya terminó en esa llamada, no queda nada que cortar a los 5 minutos.
  if (inicios.actual === inicio) {
    inicio.cancelarCorte = inicios.temporizador.programar(MS_PARA_INICIAR_SESION, () => {
      cortar(inicios, inicio);
    });
  }
  return aceptar(null);
}

/** Ver `enviarCodigo` en el comentario de `crearInicioSesion`. */
function enviarCodigo(inicios: Inicios, peticion: { readonly codigo: string }): Resultado<null> {
  const { actual } = inicios;
  if (actual === undefined) {
    return rechazar('No hay un inicio de sesión en marcha.');
  }
  if (peticion.codigo.trim() === '') {
    return rechazarElCampo('codigo', 'Escribe el código para continuar.');
  }
  // El código pasa tal cual al proceso: no se guarda ni se escribe en ningún sitio (@MATE-8.6).
  actual.proceso?.enviar(peticion.codigo);
  return aceptar(null);
}

function cortarElActual(inicios: Inicios): void {
  if (inicios.actual !== undefined) {
    cortar(inicios, inicios.actual);
  }
}

/** Corta el proceso (si ya lo tenemos) y cancela el corte programado: el inicio queda parado. */
function cortar(inicios: Inicios, inicio: Inicio): void {
  parar(inicios, inicio);
  inicio.proceso?.cortar();
}

/**
 * Deja el inicio parado sin cortar nada: cancela su corte programado y, si es el actual, deja de haber
 * uno. Sirve cuando el proceso ya ha terminado por su cuenta.
 */
function parar(inicios: Inicios, inicio: Inicio): void {
  inicio.cancelarCorte?.();
  if (inicios.actual === inicio) {
    inicios.actual = undefined;
  }
}

/**
 * `terminado` deja el inicio parado; los demás eventos se anotan en él. No mira si es el actual: un
 * inicio que ya no lo es solo se cambia a sí mismo, y `parar` no toca el actual (ver `Inicios.actual`).
 */
function alRecibir(inicios: Inicios, inicio: Inicio, evento: EventoInicioSesion): void {
  if (evento.tipo === 'terminado') {
    parar(inicios, inicio);
    return;
  }
  anotar(inicio, evento);
}

/** Lo que ve el móvil: sin inicio en marcha, nada de enlace ni de casilla. */
function vistaDe(inicio: Inicio | undefined): InicioSesionEnCurso {
  if (inicio === undefined) {
    return { enMarcha: false, pideCodigo: false };
  }
  const conEnlace = inicio.enlace === undefined ? {} : { enlace: inicio.enlace };
  return { enMarcha: true, ...conEnlace, pideCodigo: inicio.pideCodigo };
}

function anotar(inicio: Inicio, evento: Exclude<EventoInicioSesion, { tipo: 'terminado' }>): void {
  if (evento.tipo === 'pide_codigo') {
    inicio.pideCodigo = true;
    return;
  }
  // Solo cuenta la primera salida que trae un enlace; el resto del texto se tira (@MATE-8.7).
  inicio.enlace ??= extraerEnlace(evento.texto);
}

// La URL llega hasta el primer espacio o comilla; después se quita la puntuación que la cierra en la frase.
const ENLACE = /https:\/\/[^\s«»<>"]+/u;
const PUNTUACION_FINAL = /[.,;:!?)\]}'…]+$/u;

function extraerEnlace(texto: string): string | undefined {
  const encontrado = ENLACE.exec(texto);
  return encontrado?.[0].replace(PUNTUACION_FINAL, '');
}
