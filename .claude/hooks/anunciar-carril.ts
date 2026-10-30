// Hook PostToolUse (EnterWorktree): al entrar la conversación en un carril, le dice en qué carril
// está, su fase y su área, qué exige el Stop, qué se fusiona sin el visto bueno del dueño, el modelo
// de la fase y si hay un relevo pendiente. El dueño lo ve como aviso (systemMessage) y Claude lo
// recibe como contexto (additionalContext). La lógica está en scripts/arnes/comun/anuncio-carril.ts.
import { anuncioDelCarril } from '../../scripts/arnes/comun/anuncio-carril.ts';
import { ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

ejecutarHook('anunciar-carril', async () => {
  const anuncio = anuncioDelCarril(RAIZ, await leerEntradaHook());
  if (anuncio === undefined) return;
  responder({
    systemMessage: anuncio.paraElDueno,
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: anuncio.paraClaude },
  });
});
