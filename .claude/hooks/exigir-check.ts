// Hook Stop: Claude no puede terminar el turno mientras falle la comprobación de su fase
// (make check, make check-specs o make check-aceptacion).
//
// Excepción: si Claude necesita una decisión del dueño, termina su mensaje con la marca
// [DECISIÓN PENDIENTE]. Entonces puede parar, y el dueño ve un aviso de que la
// comprobación no se ha hecho.
import { spawnSync } from 'node:child_process';
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { faseDeEntorno } from '../../scripts/arnes/comun/protegidas.ts';
import type { Fase } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

const MARCA_DECISION_PENDIENTE = '[DECISIÓN PENDIENTE]';

const OBJETIVO_POR_FASE: Readonly<Record<Fase, string>> = {
  specs: 'check-specs',
  aceptacion: 'check-aceptacion',
  impl: 'check',
};

const LINEAS_DE_SALIDA = 150;
const BYTES_MAXIMOS_DE_SALIDA = 64 * 1024 * 1024;

function ultimasLineas(texto: string, cantidad: number): string {
  return texto.trimEnd().split('\n').slice(-cantidad).join('\n');
}

ejecutarHook('exigir-check', async () => {
  const entrada = await leerEntradaHook();
  if ((campoTexto(entrada, 'last_assistant_message') ?? '').includes(MARCA_DECISION_PENDIENTE)) {
    responder({
      systemMessage: `Claude ha parado con ${MARCA_DECISION_PENDIENTE}: espera tu decisión. La comprobación no se ha ejecutado.`,
    });
    return;
  }
  const objetivo = OBJETIVO_POR_FASE[faseDeEntorno(process.env)];
  const make = spawnSync('sh', ['-c', `make --no-print-directory ${objetivo} 2>&1`], {
    cwd: RAIZ,
    encoding: 'utf8',
    maxBuffer: BYTES_MAXIMOS_DE_SALIDA,
  });
  if (make.status === 0) return;
  responder({
    decision: 'block',
    reason:
      `make ${objetivo} falla y no puedes terminar hasta que pase. Arregla la causa, no la comprobación ` +
      `(los ficheros del arnés están protegidos). Últimas líneas:\n\n${ultimasLineas(make.stdout, LINEAS_DE_SALIDA)}\n\n` +
      `Si necesitas una decisión del dueño (un escenario o un parámetro que parece incorrecto, una dependencia nueva…), ` +
      `explícala y termina tu mensaje con ${MARCA_DECISION_PENDIENTE}.`,
  });
});
