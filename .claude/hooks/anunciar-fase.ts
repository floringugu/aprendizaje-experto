// Hook SessionStart: al empezar cada conversación, dice en qué fase está y qué puede tocar.
//
// El dueño lo ve como aviso (systemMessage) y comprueba así que la fase que eligió con
// «make fase» ha llegado a los hooks. Claude lo recibe como contexto (additionalContext),
// de modo que una conversación nueva de VS Code arranca sabiendo su fase sin que nadie la repita.
import { leerAreasFueraDeAlcance } from '../../scripts/arnes/comun/alcance.ts';
import { ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { OBJETIVO_POR_FASE, PROPOSITO_POR_FASE } from '../../scripts/arnes/comun/fases.ts';
import { idDe, leerFeatures } from '../../scripts/arnes/comun/gherkin.ts';
import { faseDeEntorno, leerProtegidas } from '../../scripts/arnes/comun/protegidas.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

function areasEnAlcance(): string[] {
  const fuera = new Set(leerAreasFueraDeAlcance(RAIZ));
  const areas = leerFeatures(RAIZ).elementos.flatMap((elemento) =>
    elemento.tipo === 'Feature' ? (idDe(elemento) ?? []) : [],
  );
  return [...new Set(areas)].filter((area) => !fuera.has(area)).toSorted((a, b) => a.localeCompare(b));
}

function lista(elementos: readonly string[]): string {
  return elementos.length === 0 ? 'ninguna' : elementos.join(', ');
}

ejecutarHook('anunciar-fase', async () => {
  // El origen (startup, resume, clear o compact) no cambia el aviso: se repite siempre,
  // también al compactar la conversación, para que Claude no pierda la fase.
  await leerEntradaHook();
  const fase = faseDeEntorno(process.env);
  const objetivo = OBJETIVO_POR_FASE[fase];
  const desbloqueadas = leerProtegidas(RAIZ)
    .filter((entrada) => entrada.desbloqueadaEn === fase)
    .map((entrada) => entrada.ruta);
  const areas = areasEnAlcance();
  responder({
    systemMessage: `Arnés: fase ${fase} · Stop exige make ${objetivo} · áreas en alcance: ${lista(areas)}.`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        `Arnés: esta conversación está en la fase «${fase}» (${PROPOSITO_POR_FASE[fase]}).`,
        `El hook Stop exige «make ${objetivo}» en verde antes de terminar.`,
        `Rutas protegidas que esta fase desbloquea: ${lista(desbloqueadas)}.`,
        `Áreas en alcance (config/alcance.json): ${lista(areas)}.`,
        'La fase la elige el dueño antes de abrir la conversación; no se cambia desde aquí.',
      ].join('\n'),
    },
  });
});
