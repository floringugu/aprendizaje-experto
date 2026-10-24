import type { ClaudeCode, EventoInicioSesion, ProcesoInicioSesion } from '../../../src/aplicacion/puertos.ts';

export const ENLACE_DE_ACCESO = 'https://ejemplo.org/acceso';

/**
 * Claude Code del PC. El escenario decide qué escribe el inicio de sesión al lanzarse y cuándo termina;
 * el doble anota los códigos que recibe y si alguien lo ha cortado (MATE-8).
 */
export class ClaudeCodeDePrueba implements ClaudeCode {
  sesion: { readonly iniciada: boolean; readonly cuenta?: string } = { iniciada: false };
  /** Lo que el proceso emite nada más lanzarse, en orden. Por defecto, solo el enlace. */
  eventosAlLanzar: EventoInicioSesion[] = [
    { tipo: 'salida', texto: `Abre ${ENLACE_DE_ACCESO} en el navegador para iniciar sesión.` },
  ];
  readonly codigosRecibidos: string[] = [];
  cortado = false;
  private alRecibir: ((evento: EventoInicioSesion) => void) | undefined;

  iniciarSesion(alRecibir: (evento: EventoInicioSesion) => void): ProcesoInicioSesion {
    this.alRecibir = alRecibir;
    this.cortado = false;
    return {
      enviar: (codigo) => {
        this.codigosRecibidos.push(codigo);
      },
      cortar: () => {
        this.cortado = true;
      },
    };
  }

  estado(): Promise<{ readonly iniciada: boolean; readonly cuenta?: string }> {
    return Promise.resolve(this.sesion);
  }

  /** Si la aplicación ha lanzado el inicio de sesión y nadie lo ha cortado. */
  get enMarcha(): boolean {
    return this.alRecibir !== undefined && !this.cortado;
  }

  /**
   * Emite lo que el proceso escribe al lanzarse. Va aparte de `iniciarSesion` para que la aplicación
   * reciba los eventos después de haber guardado el proceso, como pasa con un proceso de verdad.
   */
  emitirAlLanzar(): void {
    this.eventosAlLanzar.forEach((evento) => {
      this.emitir(evento);
    });
  }

  /** El proceso termina; si termina bien, queda una sesión iniciada con esa cuenta. */
  terminar(exito: boolean, cuenta = 'persona@ejemplo.org'): void {
    if (exito) {
      this.sesion = { iniciada: true, cuenta };
    }
    this.emitir({ tipo: 'terminado', exito });
  }

  private emitir(evento: EventoInicioSesion): void {
    if (this.alRecibir === undefined) {
      throw new Error('La aplicación no ha lanzado el inicio de sesión de Claude Code');
    }
    this.alRecibir(evento);
  }
}
