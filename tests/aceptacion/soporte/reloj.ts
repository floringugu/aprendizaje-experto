import type { Reloj } from '../../../src/aplicacion/puertos.ts';

export const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Reloj que controlan los escenarios: solo se mueve cuando un paso lo pide. */
export class RelojDePrueba implements Reloj {
  private instante: Date;

  constructor(inicio: Date) {
    this.instante = inicio;
  }

  ahora(): Date {
    return new Date(this.instante);
  }

  fijar(instante: Date): void {
    this.instante = new Date(instante);
  }

  avanzarMs(milisegundos: number): void {
    this.instante = new Date(this.instante.getTime() + milisegundos);
  }

  avanzarDias(dias: number): void {
    this.avanzarMs(dias * MS_POR_DIA);
  }
}

/** Instante UTC a partir de «AAAA-MM-DD» y, si hace falta, una hora «HH:MM[:SS]». */
export function instanteUtc(fecha: string, hora = '00:00:00'): Date {
  const horaCompleta = hora.length === '00:00'.length ? `${hora}:00` : hora;
  return new Date(`${fecha}T${horaCompleta}Z`);
}

/** «AAAA-MM-DD» de un instante, en UTC. */
export function soloFecha(instante: Date): string {
  return instante.toISOString().slice(0, 'AAAA-MM-DD'.length);
}

/** «AAAA-MM-DDTHH:MM» de un instante, en UTC. */
export function hastaMinutos(instante: Date): string {
  return instante.toISOString().slice(0, 'AAAA-MM-DDTHH:MM'.length);
}
