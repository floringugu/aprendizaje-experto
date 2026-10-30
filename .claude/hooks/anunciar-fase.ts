// Hook SessionStart: al empezar cada conversación, dice en qué fase y en qué área está.
//
// El dueño lo ve como aviso (systemMessage) y comprueba así que la fase que eligió con
// «make fase» ha llegado a los hooks. Claude lo recibe como contexto (additionalContext),
// de modo que una conversación nueva de VS Code arranca sabiendo su fase sin que nadie la repita.
//
// La fase y el área en curso son las del checkout del cwd de la conversación (comun/checkout.ts).
// También dice las áreas cerradas, el modelo y el esfuerzo de la fase (MODELO_POR_FASE en fases.ts),
// avisa si la conversación usa otro modelo, y señala los checkouts del repositorio (la carpeta
// principal y los carriles) que tienen un relevo pendiente (scripts/arnes/comun/relevo.ts).
import { leerAlcance } from '../../scripts/arnes/comun/alcance.ts';
import {
  checkoutDeLaEntrada,
  checkoutsDelRepositorio,
  faseYAreaDelCheckout,
} from '../../scripts/arnes/comun/checkout.ts';
import { campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import {
  avisoDeModelo,
  MODELO_POR_FASE,
  OBJETIVO_POR_FASE,
  PROPOSITO_POR_FASE,
} from '../../scripts/arnes/comun/fases.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';
import { avisoDeRelevoPendiente, carrilesConRelevo } from '../../scripts/arnes/comun/relevo.ts';

function lista(elementos: readonly string[]): string {
  return elementos.length === 0 ? 'ninguna' : elementos.join(', ');
}

ejecutarHook('anunciar-fase', async () => {
  // El origen (startup, resume, clear o compact) no cambia el aviso: se repite siempre,
  // también al compactar la conversación, para que Claude no pierda la fase.
  const entrada = await leerEntradaHook();
  const checkout = checkoutDeLaEntrada(RAIZ, entrada);
  const { fase } = faseYAreaDelCheckout(checkout);
  const objetivo = OBJETIVO_POR_FASE[fase];
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  const otroModelo = avisoDeModelo(fase, campoTexto(entrada, 'model'));
  const { principal, carriles } = checkoutsDelRepositorio(RAIZ);
  const relevos = carrilesConRelevo([principal, ...carriles]);
  const { cerradas, enCurso } = leerAlcance(checkout);
  const avisos = [
    `Arnés: fase ${fase} (${modelo}, esfuerzo ${esfuerzo})`,
    `Stop exige make ${objetivo}`,
    `área en curso: ${enCurso ?? 'ninguna'}`,
    `áreas cerradas: ${lista(cerradas)}`,
    ...(relevos.length === 0 ? [] : [`relevo pendiente: ${lista(relevos)}`]),
    ...(otroModelo === undefined ? [] : [`Aviso: ${otroModelo}`]),
  ];
  responder({
    systemMessage: `${avisos.join(' · ')}.`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        `Arnés: esta conversación está en la fase «${fase}» (${PROPOSITO_POR_FASE[fase]}).`,
        `El hook Stop exige «make ${objetivo}» en verde antes de terminar, si hay cambios respecto al último commit.`,
        `Área en curso de esta conversación (la de su checkout, ${checkout}): ${enCurso ?? 'ninguna'}.`,
        `Áreas cerradas (config/alcance.json): ${lista(cerradas)}.`,
        'La fase la elige el dueño antes de abrir la conversación; no se cambia desde aquí.',
        ...(relevos.length === 0 ? [] : [avisoDeRelevoPendiente(relevos)]),
      ].join('\n'),
    },
  });
});
