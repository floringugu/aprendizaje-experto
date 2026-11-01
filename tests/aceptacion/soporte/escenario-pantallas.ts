import type { DispositivoEmparejado } from '../../../src/aplicacion/emparejamiento.ts';
import type { ModeloDePantalla } from '../../../src/aplicacion/pantallas.ts';
import type { Resultado } from '../../../src/aplicacion/resultado.ts';

/** La dirección con la que el servidor de prueba dice que lo ve el móvil (PANT-1.1). */
export const DIRECCION_DE_PRUEBA = 'http://192.168.1.20:3000';

/** Lo que recuerdan los pasos de PANT entre el «Dado», el «Cuando» y el «Entonces». */
export class EscenarioPantallas {
  /** El texto del QR que mostró el PC. */
  qr: string | undefined;
  /** El token del móvil emparejado: lo guarda el móvil, así que sobrevive al reinicio del servidor. */
  movil: string | undefined;
  /** Lo último que respondió el servidor a un intento de emparejar. */
  emparejamiento: Resultado<DispositivoEmparejado> | undefined;
  /** Lo último que respondió el servidor al pedir una pantalla. */
  pantalla: Resultado<ModeloDePantalla> | undefined;
}
