---
fase: impl
area: PLAN
depende: [arnes-retirar-rebase]
toca: [scripts/arnes/despachador.ts, scripts/arnes/aprobar.ts, scripts/arnes/manana.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/aprobados.ts, tests/arnes/despachador.test.ts, tests/arnes/aprobados.test.ts, Makefile, CLAUDE.md, docs/plan.md]
estado: abierto
---
# El Despachador ejecuta de noche los tickets aprobados, uno tras otro, contra `main`

**Qué:** paso 2 de la noche desatendida (plan §6, «Noche desatendida»): un script, el Despachador, que toma los tickets listos y aprobados, abre su carril, lanza `claude -p` con el modelo y el esfuerzo de la fase, decide qué hacer cuando la sesión para y retira el carril cuando GitHub dice que su PR está fusionado. Con él, `make aprobar N=<ticket>` y `make manana`. Todavía sin rama de lote, sin usuario aparte y sin temporizador: lo lanza el dueño a mano, de día, con su usuario. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** las reglas de parada son una función pura con tests en `tests/arnes/` (una fila de la tabla de abajo, un test); una pasada real del Despachador lleva un ticket de la lista blanca desde `make aprobar` hasta su PR fusionado y su carril retirado sin que nadie toque nada, y otra deja en la cola de la mañana un ticket que para con decisión pendiente; `make manana` muestra las dos; el plan §5, §6 y §11 dicen lo construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida» (búscalo con Grep), y §5, `anotar-parada.ts`; `scripts/arnes/comun/registro-stop.ts:27-40` (los tipos de parada); `scripts/arnes/comun/worktrees.ts:75-110` (abrir) y `:195-240` (retirar); `scripts/arnes/comun/estado-tickets.ts` (qué es «listo»); `scripts/arnes/comun/fases.ts:50-58` (modelo y esfuerzo); `/home/florin/aprendizaje-experto/reports/humo/impl.sh` (cómo se lanzó la prueba de humo; fuera de git).

## Decisiones ya tomadas (13-11-2026; no se reabren)

- Un solo carril a la vez y, por ticket, 4 relevos como mucho. La reproducción de los registros (36 carriles, 38 PR) da las mismas noches con 1 carril que con 3.
- `aprobado` vive fuera del repositorio, en una lista que solo escribe el dueño con `make aprobar N=<ticket>` (se niega si lo lanza Claude, como `make fase`). El Despachador solo abre tickets que estén listos y en esa lista.
- Ventana de 00:30 a 07:00, y ningún ticket nuevo después de las 06:00. En este paso la ventana es un parámetro; el temporizador es del ticket `noche-usuario-y-tapa`.
- Fuera de la primera versión: el Aprobador (no hay dato que lo justifique). La revisión la hace la propia sesión con los revisores que ya existen.

## Reglas de parada

| La sesión termina y… | El Despachador… |
|---|---|
| el Stop anotó `relevo` | lanza una sesión nueva en el mismo carril (hasta 4 por ticket; después, cola) |
| el Stop anotó `decision` | deja el ticket en la cola de la mañana |
| quedan cambios sin commitear (`con-cambios`) | cola |
| no hay cambios ni PR (`sin-cambios`) | reanuda con `--resume` y «sigue», hasta 2 veces; después, cola |
| hay PR y su CI está en rojo | cola |
| hay PR abierto que espera el visto bueno | cola (hasta el ticket `noche-lote`, es lo normal fuera de la lista blanca) |
| GitHub dice que el PR está fusionado | `hecho`: retira el carril y pasa al siguiente ticket |
| se agota el límite de uso | espera al reinicio si cae dentro de la ventana; si no, termina la noche |

«Espera» no necesita regla: mientras hay subagentes, el proceso no sale.

## Lo medido en la prueba de humo (13 y 14-11-2026, Claude Code 2.1.316)

- El código de salida de `claude -p` no sirve: es 0 también con Ctrl+C y cuando el tope de espera mata a un subagente. `result` es solo el último turno. Hay que lanzar con `--output-format stream-json --verbose`, que se escribe sobre la marcha, guardar el stream de cada sesión y preguntar a GitHub por el PR.
- A los 10 minutos exactos del último turno, `claude -p` mata lo que siga en segundo plano, aunque el subagente esté trabajando, y sale con 0 y `success`. Se cambia con `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` (0 lo quita): el Despachador tiene que fijarla.
- Si un subagente termina su turno con un comando propio en segundo plano, la principal recibe un resultado «provisional» y el comando muere al salir.
- Una sesión lanzada dentro del carril anota sus paradas en el `.claude/registro-stop.jsonl` del carril, no en el de la carpeta principal.
- El stream trae eventos `rate_limit_event` con `status`, `utilization` y `resetsAt` (epoch) de las ventanas `five_hour` y `seven_day`: de ahí sale cuánto queda y cuándo se reinicia. Sin probar: qué sale cuando el límite se agota. El Despachador guarda el stream, y la primera vez que pase es el dato.
- Sin red (14-11-2026, sesión de prueba con haiku, corte a los 20 s): con la red cortada 60 s la sesión sigue sola, sin eventos de reintento, y sale con 0; con un corte de 600 s, tras 70 s de silencio y 10 eventos `system`/`api_retry`, a los 4 min 11 s sale con código 1, con `is_error: true` en el `result` (el `subtype` sigue en `success`) y un `assistant` con `api_error` `connection_failed`; llevaba 9 de 80 llamadas. Un corte largo se detecta por `is_error` o por el `api_error`, no por el `subtype`. Sin probar: reanudar con `--resume` una sesión que acabó así.
- `total_cost_usd` no vale para un modelo que Claude Code no reconoce (`costBasis: unknown`), y los `output_tokens` de los eventos `assistant` son parciales: el total bueno está en `modelUsage` del evento `result`.
- Un ticket impl de dos líneas (`mast-prepreguntas`, PR #40) con Opus `xhigh`: 9 min 26 s y 1,26 USD a precio de lista hasta la CI en verde, 4 de esos minutos en `gh pr checks --watch`; la ventana de 5 horas subió 8 puntos. La misma tarea con Fable 5.2 `medium`, hasta los commits: 1 min 47 s frente a 3 min 56 s, y el mismo código. Es una muestra por configuración: impl sigue en Opus `xhigh`, y se repetirá con los streams de una noche entera si hace falta.

## Detalle

- La sesión corre en `bypassPermissions`, con los hooks como guardia, y con la frase «No hay nadie delante: no preguntes; si necesitas una decisión del dueño, termina con la marca de decisión pendiente del arnés» (así se lanzó la prueba).
- El Despachador retira el carril con lo mismo que `make retirar`; por eso depende de `arnes-retirar-rebase`.
- `make manana` no guarda ningún fichero ni pinta el grafo de módulos: lee lo que dejó la noche (los streams, los registros de parada y GitHub) y lista la cola con su motivo y lo fusionado.
- 0 de los 31 tickets abiertos el 13-11-2026 caben enteros en la lista blanca: hasta `noche-lote`, casi todo acabará en «espera el visto bueno». Para la pasada real de «Hecho cuando» hace falta un ticket que sí quepa.
