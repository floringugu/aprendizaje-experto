// Hook PreToolUse (Read): no deja leer de una vez más de 200 líneas de un .md largo del
// repositorio, y le devuelve a Claude el índice de encabezados con sus líneas.
// La regla está en scripts/arnes/comun/indice-markdown.ts.
//
// Solo mira los .md de este repositorio: los de fuera (los de un skill, por ejemplo) siguen
// sus propias instrucciones de lectura.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { motivoDeIndice } from '../../scripts/arnes/comun/indice-markdown.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

ejecutarHook('indice-markdown', async () => {
  const entrada = await leerEntradaHook();
  const lectura = campo(entrada, 'tool_input');
  const ruta = path.resolve(RAIZ, campoTexto(lectura, 'file_path') ?? '');
  const relativa = path.relative(RAIZ, ruta);
  const dentroDelRepositorio = !relativa.startsWith('..') && !path.isAbsolute(relativa);
  if (!dentroDelRepositorio || !ruta.endsWith('.md') || !existsSync(ruta)) return;
  const limite = campo(lectura, 'limit');
  const motivo = motivoDeIndice({
    ruta: relativa,
    texto: readFileSync(ruta, 'utf8'),
    limite: typeof limite === 'number' ? limite : undefined,
  });
  if (motivo === undefined) return;
  responder({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
  });
});
