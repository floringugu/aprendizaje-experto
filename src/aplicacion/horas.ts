import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

export interface RegistroHoras {
  /** Fecha en formato AAAA-MM-DD. */
  readonly fecha: string;
  readonly minutos: number;
}

export interface ConsultaHoras {
  readonly registros: readonly RegistroHoras[];
  /** Lo que la persona puede hacer en esta pantalla; nunca fijar una meta de horas (HORA-2.1). */
  readonly acciones: readonly string[];
}

export interface CasosDeHoras {
  registrarHoras(peticion: {
    readonly dominio: string;
    readonly fecha: string;
    readonly minutos: number;
  }): Resultado<RegistroHoras>;
  consultarHoras(peticion: PeticionDominio): Resultado<ConsultaHoras>;
}
