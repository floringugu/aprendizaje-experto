import type { Resultado } from './resultado.ts';

// Inicio de sesión de Claude Code desde Ajustes (MATE-8). La aplicación nunca guarda, registra ni
// muestra credenciales: solo dice si hay una sesión iniciada.

interface Ajustes {
  readonly sesionClaudeCode: boolean;
}

/** Lo que muestra el móvil mientras dura el inicio de sesión (MATE-8.1). */
interface InicioSesionEnCurso {
  readonly enMarcha: boolean;
  /** El enlace que hay que abrir. Nada más de lo que escribe el proceso llega al móvil (MATE-8.7). */
  readonly enlace?: string;
  /** Si hay que mostrar la casilla para el código. */
  readonly pideCodigo: boolean;
}

export interface CasosDeClaudeCode {
  consultarAjustes(): Promise<Resultado<Ajustes>>;
  /** Lanza el inicio de sesión en el PC. Se corta solo a los 5 minutos (MATE-8.3). */
  iniciarSesionClaudeCode(): Promise<Resultado<null>>;
  consultarInicioSesion(): Promise<Resultado<InicioSesionEnCurso>>;
  /** Le pasa al inicio de sesión el código que la persona escribe en el móvil (MATE-8.2). */
  enviarCodigo(peticion: { readonly codigo: string }): Promise<Resultado<null>>;
  cancelarInicioSesion(): Promise<Resultado<null>>;
}
