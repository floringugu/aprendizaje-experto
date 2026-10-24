// El nivel experto lo deciden las evaluaciones externas (TARE-3), que todavía no se implementan. Lo
// que ya se sabe es que el criterio de dominio no basta: dominar todos los objetivos, aun en la fase
// avanzado/experto, no da el nivel experto (@MAST-6.5).
import type { Entorno } from './estado.ts';
import { enDominio } from './estado.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar } from './resultado.ts';
import type { NivelExperto } from './tareas.ts';

/** Mientras no haya evaluaciones externas, nadie cumple la definición operativa. */
export function evaluarNivelExperto(entorno: Entorno, peticion: PeticionDominio): Resultado<NivelExperto> {
  return enDominio(entorno, peticion.dominio, () =>
    aceptar({
      cumpleDefinicionOperativa: false,
      avisos: ['nivel_experto_lo_deciden_evaluaciones_externas'],
      descartadas: [],
    }),
  );
}
