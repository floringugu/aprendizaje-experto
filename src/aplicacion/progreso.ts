import { objetivosPendientes } from '../dominio/ruta.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { Progreso, ProgresoObjetivo } from './dominio.ts';
import type { Entorno, Situacion } from './estado.ts';
import { diagnosticoPendiente, enDominio } from './estado.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar } from './resultado.ts';

/** Lo que hace falta para describir cada objetivo del progreso. */
interface VistaDelProgreso {
  readonly situacion: Situacion;
  readonly ultimoIntento: ReadonlyMap<string, boolean>;
  /** El primer objetivo de la ruta, que es el que se practica; ninguno mientras dura el diagnóstico. */
  readonly abierto: string | undefined;
}

/**
 * Estado de un objetivo según el diagnóstico. El acierto sin ayuda no se informa todavía: su cálculo
 * durante la práctica (qué intentos cuentan como «sin ayuda») se implementa con el dominio de objetivos.
 */
function progresoDelObjetivo(objetivo: string, vista: VistaDelProgreso): ProgresoObjetivo {
  const { contenido, estado } = vista.situacion;
  const items = itemsDelObjetivo(contenido.items, objetivo).map((item) => item.id);
  const dominado = estado.dominados.has(objetivo);
  const abierto = objetivo === vista.abierto;
  return {
    objetivo,
    estado: dominado ? 'dominado' : abierto ? 'abierto' : 'cerrado',
    itemsSinIntento: items.filter((item) => !vista.ultimoIntento.has(item)).length,
    pasosRetirados: estado.pasosRetiradosDe(objetivo),
    enColaDePractica: abierto,
  };
}

/** Fase, ruta y estado de cada objetivo. Los pasos retirados salen del diagnóstico (@DIAG-2.5). */
export function consultarProgreso(entorno: Entorno, peticion: PeticionDominio): Resultado<Progreso> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const { contenido, estado } = situacion;
    const ids = contenido.objetivos.map((objetivo) => objetivo.id);
    const ruta = objetivosPendientes(ids, estado.dominados);
    const abierto = diagnosticoPendiente(estado) ? undefined : ruta[0];
    const vista: VistaDelProgreso = { situacion, ultimoIntento: estado.ultimoIntentoDeCadaItem(), abierto };
    const progreso: Progreso = {
      fase: estado.fase,
      objetivos: ids.map((objetivo) => progresoDelObjetivo(objetivo, vista)),
      ruta,
    };
    return aceptar(abierto === undefined ? progreso : { ...progreso, objetivoActual: abierto });
  });
}
