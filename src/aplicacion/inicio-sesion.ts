import { MS_PARA_INICIAR_SESION } from '../dominio/unidades.ts';
import type { CasosDeClaudeCode, InicioSesionEnCurso } from './claude-code.ts';
import type { ClaudeCode, EventoInicioSesion, ProcesoInicioSesion, Temporizador } from './puertos.ts';
import { aceptar, rechazar, rechazarElCampo } from './resultado.ts';
import type { Resultado } from './resultado.ts';

/**
 * Los casos de uso del inicio de sesión de Claude Code desde Ajustes (MATE-8), con el estado del
 * inicio en curso en memoria: si está en marcha, el enlace y si pide un código. Cada llamada es un
 * estado nuevo; la aplicación crea uno por persona.
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
  return new CasosDeInicioSesion(claudeCode, temporizador);
}

class CasosDeInicioSesion implements CasosDeClaudeCode {
  // El inicio en curso, o `undefined` si no hay ninguno. Cada inicio es un objeto propio: los eventos
  // y el corte programado de un inicio comparan con él para saber si siguen siendo los del actual.
  private actual: Inicio | undefined;

  private readonly claudeCode: ClaudeCode;
  private readonly temporizador: Temporizador;

  constructor(claudeCode: ClaudeCode, temporizador: Temporizador) {
    this.claudeCode = claudeCode;
    this.temporizador = temporizador;
  }

  async consultarAjustes(): Promise<Resultado<{ readonly sesionClaudeCode: boolean }>> {
    const { iniciada } = await this.claudeCode.estado();
    // Solo la bandera: la cuenta no sale de aquí (@MATE-8.5).
    return aceptar({ sesionClaudeCode: iniciada });
  }

  iniciarSesionClaudeCode(): Promise<Resultado<null>> {
    this.cortarElActual();
    const inicio: Inicio = { pideCodigo: false };
    this.actual = inicio;
    // Un evento puede llegar dentro de `iniciarSesion`, antes de que `proceso` esté guardado.
    inicio.proceso = this.claudeCode.iniciarSesion((evento) => {
      this.alRecibir(inicio, evento);
    });
    // Si el proceso ya terminó en esa llamada, no queda nada que cortar a los 5 minutos.
    if (this.actual === inicio) {
      inicio.cancelarCorte = this.temporizador.programar(MS_PARA_INICIAR_SESION, () => {
        this.cortar(inicio);
      });
    }
    return Promise.resolve(aceptar(null));
  }

  consultarInicioSesion(): Promise<Resultado<InicioSesionEnCurso>> {
    return Promise.resolve(aceptar(vistaDe(this.actual)));
  }

  enviarCodigo(peticion: { readonly codigo: string }): Promise<Resultado<null>> {
    if (this.actual === undefined) {
      return Promise.resolve(rechazar('No hay un inicio de sesión en marcha.'));
    }
    if (peticion.codigo.trim() === '') {
      return Promise.resolve(rechazarElCampo('codigo', 'Escribe el código para continuar.'));
    }
    // El código pasa tal cual al proceso: no se guarda ni se escribe en ningún sitio (@MATE-8.6).
    this.actual.proceso?.enviar(peticion.codigo);
    return Promise.resolve(aceptar(null));
  }

  cancelarInicioSesion(): Promise<Resultado<null>> {
    this.cortarElActual();
    return Promise.resolve(aceptar(null));
  }

  private cortarElActual(): void {
    if (this.actual !== undefined) {
      this.cortar(this.actual);
    }
  }

  /** Corta el proceso (si ya lo tenemos) y cancela el corte programado: el inicio queda parado. */
  private cortar(inicio: Inicio): void {
    this.parar(inicio);
    inicio.proceso?.cortar();
  }

  /** Deja el inicio parado sin cortar nada: sirve cuando el proceso ya ha terminado por su cuenta. */
  private parar(inicio: Inicio): void {
    inicio.cancelarCorte?.();
    if (this.actual === inicio) {
      this.actual = undefined;
    }
  }

  private alRecibir(inicio: Inicio, evento: EventoInicioSesion): void {
    // Un proceso que ya no es el actual (relanzado, cortado o terminado) no cambia nada.
    if (this.actual !== inicio) {
      return;
    }
    if (evento.tipo === 'terminado') {
      this.parar(inicio);
      return;
    }
    anotar(inicio, evento);
  }
}

interface Inicio {
  proceso?: ProcesoInicioSesion;
  /** Cancela el corte programado a los 5 minutos. */
  cancelarCorte?: () => void;
  enlace?: string;
  pideCodigo: boolean;
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
  const enlace = extraerEnlace(evento.texto);
  if (inicio.enlace === undefined && enlace !== undefined) {
    inicio.enlace = enlace;
  }
}

// La URL llega hasta el primer espacio o comilla; después se quita la puntuación que la cierra en la frase.
const ENLACE = /https:\/\/[^\s«»<>"]+/u;
const PUNTUACION_FINAL = /[.,;:!?)\]}'…]+$/u;

function extraerEnlace(texto: string): string | undefined {
  const encontrado = ENLACE.exec(texto);
  return encontrado?.[0].replace(PUNTUACION_FINAL, '');
}
