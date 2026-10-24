import { medirAcierto } from '../dominio/acierto.ts';
import { objetivosPendientes } from '../dominio/ruta.ts';
import { itemsDelObjetivo } from './contenido.ts';
import type { Progreso, ProgresoObjetivo } from './dominio.ts';
import type { Entorno } from './estado.ts';
import { enDominio, recorridoDeRuta } from './estado.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar } from './resultado.ts';

/**
 * Fase, ruta y estado de cada objetivo. El acierto sin ayuda sale del último intento de cada ítem
 * en cualquier contexto (@MAST-1.2) y no se informa mientras falte alguno (@MAST-1.3). Los pasos
 * retirados salen del diagnóstico (@DIAG-2.5).
 */
export function consultarProgreso(entorno: Entorno, peticion: PeticionDominio): Resultado<Progreso> {
  return enDominio(entorno, peticion.dominio, (situacion) => {
    const { contenido, estado } = situacion;
    const ids = contenido.objetivos.map((objetivo) => objetivo.id);
    const recorrido = recorridoDeRuta(situacion);
    const ultimoIntento = estado.ultimoIntentoDeCadaItem();
    const objetivos = Array.from(recorrido.estados, ([objetivo, estadoEnRuta]): ProgresoObjetivo => ({
      objetivo,
      estado: estadoEnRuta,
      ...medirAcierto(
        itemsDelObjetivo(contenido.items, objetivo).map((item) => item.id),
        ultimoIntento,
      ),
      pasosRetirados: estado.pasosRetiradosDe(objetivo),
      // Un objetivo abierto es uno que toca practicar, también si perdió el dominio (@MAST-4.1).
      enColaDePractica: estadoEnRuta === 'abierto',
    }));
    const progreso: Progreso = { fase: estado.fase, objetivos, ruta: objetivosPendientes(ids, estado.dominados) };
    return aceptar(recorrido.actual === undefined ? progreso : { ...progreso, objetivoActual: recorrido.actual });
  });
}
