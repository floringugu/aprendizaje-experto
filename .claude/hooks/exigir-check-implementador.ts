// Hook SubagentStop (implementador): el subagente no puede devolver su encargo mientras falle
// make check-implementador (tipos, lint, duplicación, capas y tests unitarios).
//
// Excepciones:
//   - si termina su mensaje con [DECISIÓN PENDIENTE], devuelve el encargo sin comprobar y
//     decide la conversación principal;
//   - si ya está continuando por un bloqueo de este hook (stop_hook_active), lo devuelve en rojo,
//     y la conversación principal lo arregla ella o lo reencarga. Un solo bloqueo por encargo: no
//     hace falta leer el registro, porque Claude Code ya dice si es la segunda vez.
// El mensaje está en comun/exigir-check.ts. Comprueba el checkout del cwd del subagente (comun/checkout.ts).
// Cada bloqueo se anota en .claude/registro-stop.jsonl de RAIZ, con el paso que falla.
import { checkoutDeLaEntrada } from '../../scripts/arnes/comun/checkout.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import {
  MARCA_DECISION_PENDIENTE,
  motivoDeBloqueoDelImplementador,
  pasoQueFalla,
} from '../../scripts/arnes/comun/exigir-check.ts';
import { OBJETIVO_DEL_IMPLEMENTADOR } from '../../scripts/arnes/comun/fases.ts';
import { ejecutarObjetivo } from '../../scripts/arnes/comun/make.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarParada, datosDeLaEntrada } from '../../scripts/arnes/comun/registro-stop.ts';

ejecutarHook('exigir-check-implementador', async () => {
  const entrada = await leerEntradaHook();
  if ((campoTexto(entrada, 'last_assistant_message') ?? '').includes(MARCA_DECISION_PENDIENTE)) return;
  const checkout = checkoutDeLaEntrada(RAIZ, entrada);
  const make = ejecutarObjetivo(checkout, OBJETIVO_DEL_IMPLEMENTADOR);
  if (make.verde) return;
  if (campo(entrada, 'stop_hook_active') === true) {
    responder({
      systemMessage: `El implementador devuelve su encargo con make ${OBJETIVO_DEL_IMPLEMENTADOR} en rojo.`,
    });
    return;
  }
  const paso = pasoQueFalla(make.salida);
  anotarParada(RAIZ, { ...datosDeLaEntrada(entrada, checkout), resultado: 'implementador-bloqueo', paso });
  responder({ decision: 'block', reason: motivoDeBloqueoDelImplementador({ paso, salida: make.salida }) });
});
