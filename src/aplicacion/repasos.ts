// Los repasos programados de un dominio. Por ahora solo las pruebas de retención de los objetivos
// dominados (MAST-7); los repasos de ítems llegan con el planificador.
//
// Las pruebas no se guardan: se calculan al consultarlas, con la fecha en que cada objetivo quedó
// dominado y las semanas que dice ahora la configuración. Así un cambio en la configuración cuenta
// enseguida, y un objetivo que pierde el dominio deja de tener pruebas sin que nadie las borre.
import { fechasDeRetencion } from '../dominio/criterio-dominio.ts';
import type { Entorno } from './estado.ts';
import { enDominio } from './estado.ts';
import { parametroListaNumerica } from './parametros.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';
import { aceptar } from './resultado.ts';
import type { Repaso } from './sesiones.ts';

/**
 * Una prueba de retención de cada objetivo dominado por cada valor de `retencion_diferida_semanas`,
 * contada desde que quedó dominado (@MAST-7.1, @MAST-7.3), también si fue en el diagnóstico. Contarla
 * desde esa fecha es extrapolación del autor: el informe da las semanas, pero no desde cuándo.
 */
export function consultarRepasos(entorno: Entorno, peticion: PeticionDominio): Resultado<readonly Repaso[]> {
  return enDominio(entorno, peticion.dominio, ({ contenido, estado }) => {
    const semanas = parametroListaNumerica(entorno.dependencias.leerParametros(), 'retencion_diferida_semanas');
    const repasos = contenido.objetivos.flatMap((objetivo) => {
      const dominadoEl = estado.dominadoDesde(objetivo.id);
      if (dominadoEl === undefined) {
        return [];
      }
      return fechasDeRetencion(dominadoEl, semanas).map((fecha): Repaso => ({
        clase: 'retencion',
        objetivo: objetivo.id,
        fecha,
      }));
    });
    return aceptar(repasos);
  });
}
