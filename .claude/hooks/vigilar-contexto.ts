// Hook PostToolUse (todas las herramientas): cuando el contexto de la conversación pasa de 120 k
// tokens, le pide a Claude que acabe el paso en curso y pase el relevo, y te avisa a ti. Vuelve a
// avisar cada 20 k tokens más. La regla está en scripts/arnes/comun/relevo.ts.
//
// El tamaño sale del transcript de Claude Code. El último tramo avisado de cada conversación se
// anota en .claude/registro-contexto.jsonl, para no repetir el aviso en cada herramienta. También
// se anota la bajada (al compactar, por ejemplo), para volver a avisar si el contexto sube otra vez.
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import {
  anotarTramo,
  avisoParaClaude,
  avisoParaElDueno,
  leerRegistroContexto,
  tokensDelTranscript,
  tramoDeContexto,
  ultimoTramo,
} from '../../scripts/arnes/comun/relevo.ts';

ejecutarHook('vigilar-contexto', async () => {
  const entrada = await leerEntradaHook();
  // Dentro de un subagente, el contexto que cuenta es el suyo, y se acaba con el encargo.
  if (campo(entrada, 'agent_id') !== undefined) return;
  const tokens = tokensDelTranscript(campoTexto(entrada, 'transcript_path'));
  if (tokens === undefined) return;
  const sesion = campoTexto(entrada, 'session_id') ?? 'desconocida';
  const tramo = tramoDeContexto(tokens);
  const anterior = ultimoTramo(leerRegistroContexto(RAIZ), sesion);
  if (tramo === anterior) return;
  anotarTramo(RAIZ, { fecha: new Date().toISOString(), sesion, tokens, tramo });
  if (tramo < anterior) return;
  responder({
    systemMessage: avisoParaElDueno(tokens),
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: avisoParaClaude(tokens) },
  });
});
