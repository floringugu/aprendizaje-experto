// Hook PreToolUse, PostToolUse y PostToolUseFailure (Bash): toma las huellas de los ficheros
// protegidos antes de cada comando y, después, devuelve a como estaba lo que el comando haya
// cambiado en ellos. La lógica está en scripts/arnes/comun/huellas.ts.
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { COMO_SE_CAMBIA } from '../../scripts/arnes/comun/guardia.ts';
import {
  almacenDeHuellas,
  describirRestauracion,
  ficherosConHuella,
  restaurarCambios,
  tomarHuellas,
} from '../../scripts/arnes/comun/huellas.ts';
import { faseDeEntorno, leerProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

const SIN_HUELLAS =
  'No había huellas de antes de este comando (¿se cortó el hook PreToolUse?), así que no se ha ' +
  'comprobado si tocó rutas protegidas. Lo comprobará integridad en el hook Stop.';

ejecutarHook('vigilar-huellas', async () => {
  const entrada = await leerEntradaHook();
  const evento = campoTexto(entrada, 'hook_event_name') ?? '';
  const idComando = campoTexto(entrada, 'tool_use_id');
  // Sin tool_use_id no se pueden unir las huellas de antes con las de después.
  if (idComando === undefined) throw new Error('La entrada del hook no trae tool_use_id.');
  const vigilancia = { raiz: RAIZ, almacen: almacenDeHuellas(RAIZ), idComando };
  const rutas = ficherosConHuella(RAIZ, leerProtegidas(RAIZ), faseDeEntorno(process.env));
  if (evento === 'PreToolUse') {
    tomarHuellas(vigilancia, rutas, new Date());
    return;
  }
  // PostToolUse si el comando acabó bien; PostToolUseFailure si acabó con error.
  const restauracion = restaurarCambios(vigilancia, rutas, new Date());
  if (restauracion === undefined) {
    responder({ hookSpecificOutput: { hookEventName: evento, additionalContext: SIN_HUELLAS } });
    return;
  }
  if (restauracion.diferencias.length === 0) return;
  const descripcion = describirRestauracion(restauracion);
  responder({
    // systemMessage lo ve el dueño; additionalContext, Claude.
    systemMessage: descripcion,
    hookSpecificOutput: { hookEventName: evento, additionalContext: `${descripcion}\n${COMO_SE_CAMBIA}` },
  });
});
