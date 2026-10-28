// Hook PreToolUse (Read): no deja leer de una vez más de 200 líneas de un .md largo del
// repositorio, y le devuelve a Claude el índice de encabezados con sus líneas.
// La regla está en scripts/arnes/comun/indice-markdown.ts.
//
// Solo mira los .md de este repositorio, en cualquiera de sus checkouts: los de fuera (los de un
// skill o los de un clon del scratchpad, por ejemplo) siguen sus propias instrucciones de lectura.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { checkoutDelRepositorio } from '../../scripts/arnes/comun/checkout.ts';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoDeIndice } from '../../scripts/arnes/comun/indice-markdown.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

ejecutarHook('indice-markdown', async () => {
  const entrada = await leerEntradaHook();
  const lectura = campo(entrada, 'tool_input');
  const ruta = path.resolve(RAIZ, campoTexto(lectura, 'file_path') ?? '');
  // Antes que git: casi ninguna lectura es de un .md.
  if (!ruta.endsWith('.md') || !existsSync(ruta)) return;
  const checkout = checkoutDelRepositorio(RAIZ, ruta);
  if (checkout === undefined) return;
  const limite = campo(lectura, 'limit');
  const motivo = motivoDeIndice({
    ruta: path.relative(checkout, ruta),
    texto: readFileSync(ruta, 'utf8'),
    limite: typeof limite === 'number' ? limite : undefined,
  });
  if (motivo === undefined) return;
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
});
