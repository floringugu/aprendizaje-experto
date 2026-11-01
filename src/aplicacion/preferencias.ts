import type { Resultado } from './resultado.ts';

// Las preferencias de la persona (PANT-3), en `preferencias.json`. No se llaman «ajustes»: ese nombre ya es
// de MATE-8.5 (`consultarAjustes`, la sesión de Claude Code).

export type Tema = 'automatico' | 'claro' | 'oscuro';

export interface Preferencias {
  readonly tema: Tema;
  readonly vibracion: boolean;
}

export interface CasosDePreferencias {
  /**
   * Las preferencias guardadas. Sin fichero valen `automatico` y vibración encendida (PANT-3.1); un valor
   * no válido en el fichero se ignora y vale el de ese campo por defecto.
   */
  consultarPreferencias(): Preferencias;
  /** Cambia los campos que se pasan, los guarda y devuelve las preferencias resultantes (PANT-3.2). */
  cambiarPreferencias(cambios: Partial<Preferencias>): Resultado<Preferencias>;
}
