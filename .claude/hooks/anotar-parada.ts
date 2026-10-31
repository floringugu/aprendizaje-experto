// Hook Stop: anota cada parada de la conversación en .claude/registro-stop.jsonl
// (scripts/arnes/comun/registro-stop.ts) y acepta el relevo. No ejecuta make y nunca bloquea: la
// comprobación de la fase la exige el hook exigir-check-push.ts antes de git push y gh pr create
// (docs/plan.md §5).
//
// Cada parada se anota con los tokens de contexto de la última llamada y con uno de estos resultados:
//   - decision: Claude termina su mensaje con [DECISIÓN PENDIENTE] porque necesita una decisión del
//     dueño, que ve un aviso;
//   - espera: quedan subagentes trabajando en segundo plano (el implementador). Claude Code despierta
//     a Claude cuando terminan, y el hook vuelve a ejecutarse al parar de nuevo;
//   - relevo: el contexto ha pasado del umbral (scripts/arnes/comun/relevo.ts), y Claude acaba el paso
//     en curso, apunta el relevo y termina con [RELEVO]. El dueño sigue en una conversación nueva. Por
//     debajo del umbral, la marca no cuenta. Solo vale una vez por conversación: después el hook
//     bloquear-tras-relevo.ts le niega las ediciones;
//   - sin-cambios o con-cambios: cualquier otra parada, según el árbol de trabajo del checkout
//     difiera o no del último commit.
//
// Checkout: la fase, el área en curso y los cambios son los del checkout del cwd de la conversación
// (comun/checkout.ts). El registro es siempre el de RAIZ, con el carril de cada parada.
import { checkoutDeLaEntrada } from '../../scripts/arnes/comun/checkout.ts';
import {
  campo,
  campoTexto,
  ejecutarHook,
  leerEntradaHook,
  responder,
  subagentesEnCurso,
} from '../../scripts/arnes/comun/entrada-hook.ts';
import { MARCA_DECISION_PENDIENTE } from '../../scripts/arnes/comun/exigir-check.ts';
import { hayCambiosSinCommitear } from '../../scripts/arnes/comun/git.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { anotarParada, datosDeLaEntrada, leerRegistro, relevoPasado } from '../../scripts/arnes/comun/registro-stop.ts';
import {
  avisoDeRelevoPasado,
  MARCA_RELEVO,
  puedePasarElRelevo,
  tokensDelTranscript,
} from '../../scripts/arnes/comun/relevo.ts';

ejecutarHook('anotar-parada', async () => {
  const entrada = await leerEntradaHook();
  const checkout = checkoutDeLaEntrada(RAIZ, entrada);
  const tokens = tokensDelTranscript(campoTexto(entrada, 'transcript_path'));
  const datos = { ...datosDeLaEntrada(entrada, checkout), ...(tokens === undefined ? {} : { tokens }) };
  const ultimoMensaje = campoTexto(entrada, 'last_assistant_message') ?? '';
  if (ultimoMensaje.includes(MARCA_DECISION_PENDIENTE)) {
    anotarParada(RAIZ, { ...datos, resultado: 'decision' });
    responder({ systemMessage: `Claude ha parado con ${MARCA_DECISION_PENDIENTE}: espera tu decisión.` });
    return;
  }
  const subagentes = subagentesEnCurso(campo(entrada, 'background_tasks'));
  if (subagentes > 0) {
    anotarParada(RAIZ, { ...datos, resultado: 'espera' });
    responder({ systemMessage: `Claude espera a ${String(subagentes)} subagente(s) en segundo plano.` });
    return;
  }
  // Se mira después de la espera: con un subagente aún escribiendo, el relevo saldría a medias.
  if (
    ultimoMensaje.includes(MARCA_RELEVO) &&
    tokens !== undefined &&
    puedePasarElRelevo(tokens) &&
    !relevoPasado(leerRegistro(RAIZ), datos.sesion)
  ) {
    anotarParada(RAIZ, { ...datos, resultado: 'relevo' });
    responder({ systemMessage: avisoDeRelevoPasado(tokens) });
    return;
  }
  anotarParada(RAIZ, { ...datos, resultado: hayCambiosSinCommitear(checkout) ? 'con-cambios' : 'sin-cambios' });
});
