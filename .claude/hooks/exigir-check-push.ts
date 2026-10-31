// Hook PreToolUse (Bash): Claude no sube trabajo a GitHub (git push, gh pr create) mientras falle la
// comprobación de su fase (make check, make check-specs o make check-aceptacion). Es la puerta antes
// del PR: el hook Stop ya no comprueba (docs/plan.md §5).
//
// Ninguna marca la salta, ni [DECISIÓN PENDIENTE] ni [RELEVO]. Si el propio hook falla, niega el
// comando (ejecutarHook sale con 2).
//
// La puerta mira el texto del comando (subeAGitHub en comun/exigir-check.ts) y comprueba el árbol de
// trabajo del checkout del cwd de la conversación (comun/checkout.ts), no los commits que se suben.
// Cada comprobación se anota en .claude/registro-stop.jsonl de RAIZ, en verde o con el paso que falla,
// y con lo que ha tardado make.
import { checkoutDeLaEntrada } from '../../scripts/arnes/comun/checkout.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoDeBloqueo, pasoQueFalla, subeAGitHub } from '../../scripts/arnes/comun/exigir-check.ts';
import { OBJETIVO_POR_FASE } from '../../scripts/arnes/comun/fases.ts';
import { ejecutarObjetivo } from '../../scripts/arnes/comun/make.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarParada, datosDeLaEntrada } from '../../scripts/arnes/comun/registro-stop.ts';

ejecutarHook('exigir-check-push', async () => {
  const entrada = await leerEntradaHook();
  if (!subeAGitHub(campoTexto(campo(entrada, 'tool_input'), 'command') ?? '')) return;
  const checkout = checkoutDeLaEntrada(RAIZ, entrada);
  const datos = datosDeLaEntrada(entrada, checkout);
  const objetivo = OBJETIVO_POR_FASE[datos.fase];
  const inicio = performance.now();
  const make = ejecutarObjetivo(checkout, objetivo);
  const milisegundos = Math.round(performance.now() - inicio);
  if (make.verde) {
    anotarParada(RAIZ, { ...datos, resultado: 'push-verde', milisegundos });
    responder({ systemMessage: `make ${objetivo} en verde (${String(Math.round(milisegundos / 1000))} s).` });
    return;
  }
  const paso = pasoQueFalla(make.salida);
  anotarParada(RAIZ, { ...datos, resultado: 'push-bloqueo', paso, milisegundos });
  responder({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: motivoDeBloqueo({ objetivo, paso, salida: make.salida }),
    },
  });
});
