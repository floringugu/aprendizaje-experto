# Contexto de traspaso: AI Factory para aprendizaje-experto

Nov 15, 2026 · @Florin Gugu

## Nota del repositorio (15-11-2026): qué vale de este documento

Este documento se escribió sin ver el código. El 15-11-2026 se contrastó con el repositorio, y esta nota dice el resultado. Después de la nota, desde «Cómo usar este documento», el texto es el original, sin cambios.

**Manda el plan.** Este documento es una propuesta archivada, no una norma del arnés. Donde no coincide con `docs/plan.md` (§5, §6 y §11), vale el plan.

### Qué no vale

Son decisiones del dueño del 13-11-2026, que mantuvo el 15-11-2026. Están en el plan §6, «Noche desatendida», bajo «Lo acordado, que los tickets no reabren».

| Lo que dice este documento | Lo que vale | Por qué |
| --- | --- | --- |
| 3 carriles a la vez (`maxCarriles: 3`) | Un carril a la vez. | Con 3, la reproducción de los registros da las mismas noches. |
| Rama `etapa/N` | Rama `lote/N` (ticket `noche-lote`): una sola viva a la vez, que fusiona el dueño con `--admin`. Solo acumula aceptación e impl. | Las specs siguen yendo a `main` una a una, con el visto bueno del dueño. |
| Aprobador y estado «en revisión» (transiciones 5 a 8) | No hay Aprobador. La sesión revisa con los revisores del plan §7 y abre ella el PR. | No hay dato que lo justifique. |
| Fusión por squash | Fusión por rebase. | El ruleset «main: CI» solo admite rebase, y el arnés reconoce una rama fusionada comparando sus parches (`estaFusionada`, `scripts/arnes/comun/ramas.ts`). |
| Informe de etapa con el grafo de módulos | `make manana` lista lo fusionado y la cola, y con `noche-lote` resume el lote. No guarda ningún fichero ni pinta el grafo. | Decisión del 13-11-2026. |
| `aprobado` como campo del ticket | Una lista fuera del repositorio (`~/.config/aprendizaje-experto/aprobados`) que solo escribe el dueño con `make aprobar`. | `docs/tickets/` se fusiona sin visto bueno: un campo del ticket lo podría escribir Claude. |
| Un registro de paradas para todos los carriles | Una sesión de la noche anota en el registro de su carril (plan §5, «Los hooks en una sesión sin nadie delante»). | Ese registro se borra con el carril. Por eso el Despachador lleva su diario. |

### Qué ya está construido

Este documento da por planeadas, sin implementar, piezas que ya están en `main` desde el 14-11-2026 (ticket `noche-despachador`; plan §6, «Lo construido en el paso 2»):

- **El Despachador** (`make despachar`), con sus reglas de parada: `queHacer`, en `scripts/arnes/comun/despachador.ts`, tiene 9 reglas ordenadas, y la última manda a la cola todo lo que las demás no nombran.
- **`make aprobar`** y **`make manana`,** que es la cola de la mañana.
- **El resultado de una parada como enumeración cerrada:** `RESULTADOS`, en `scripts/arnes/comun/registro-stop.ts`.

### La fase A, punto por punto

| Punto de la fase A | Estado en el repositorio | Qué se hace |
| --- | --- | --- |
| 1. Tabla total y `timeoutSesion` | La tabla ya es total (`queHacer`). No hay tope de sesión: el plan §11 lo admite en «El Despachador no corta nada». | Un tope en el servicio de systemd, dentro del ticket `noche-usuario-y-tapa`. |
| 2. Relevo archivado con SHA y `make check` | El relevo es prosa libre en `reports/relevo.md`. El hook Stop acepta `[RELEVO]` sin mirar si el fichero existe, y nadie lo archiva. | Ticket nuevo, `relevo-archivado`. No lleva `make check`: se quitó del hook Stop el 31-10-2026. |
| 3. `make check` antes del Aprobador | No hay Aprobador. El hook del push (`exigir-check-push.ts`) ya exige la comprobación de la fase. | Nada. |
| 4. Hallazgos bloqueantes a la cola | Los revisores ya dan severidad y `fichero:línea`, pero nadie lo consume. Depende del Aprobador. | Nada. Lo reabriría un dato: lo que el dueño rechace en el diff de `lote/N`. |
| 5. `toca` en la CI y solapes | El solape ya cuenta para que un ticket esté listo (`scripts/arnes/comun/estado-tickets.ts`). El `toca` no se hace cumplir, a propósito (plan §6, «Tickets»). | Nada: 0 de los 31 PR con ticket fusionados tocaron algo fuera de su `toca`. |
| 6. Un commit por ticket y CI tras cada fusión | Solo se fusiona con rebase. Con un carril, cada PR nace de la punta del lote. | Lo cubre el ticket `noche-lote`. |

Las cuatro decisiones abiertas de la fase A las responde el código:

- **`con-cambios`** es que `git status --porcelain` no sale vacío cuando la sesión para.
- **El PR** lo abre la sesión que hace el ticket, y «hecho» es solo cuando GitHub lo da por fusionado.
- **Una CI en rojo** va a la cola, sin reintento.
- **Subagentes:** en las dos sesiones que lanzó el Despachador el 14-11-2026 hubo 0.

### Decisiones del 15-11-2026

1. Se mantiene lo del 13-11-2026: un carril, `lote/N`, sin Aprobador y fusión por rebase.
2. Se construyen dos piezas por petición del dueño, sin dato de los registros que las pida: el tope de sesión, en systemd, y el relevo archivado con su commit.
3. El `toca` en la CI no se construye.

### Fases B y C

Son una propuesta sin ticket. Esperan a que haya noches con lote que medir. De la ficha de ticket ya existe una parte: el diario de la noche (`reports/noche/diario.jsonl`, fuera de git) anota cada sesión que lanza el Despachador y lo que decide al terminar cada una. No guarda tokens ni coste.

### El «Prompt de arranque»

Ya se usó, el 15-11-2026. No hay que pegarlo otra vez.

## Cómo usar este documento

Este documento traslada una conversación de diseño a un chat nuevo que va a implementar el resultado. Está escrito para que lo lea un agente sin más contexto: léelo entero antes de tocar código.

- **Archivos que lo acompañan:** `ai-factory-aprendizaje-experto-v3.svg` (diagrama de piezas) y `ai-factory-estados-ticket-v2.svg` (ciclo de vida del ticket). Contienen la misma información que las tablas de este documento, en forma de dibujo.
- **Límite importante:** quien escribió este documento no ha visto el código del repositorio. Todo lo que describe del arnés sale de un diagrama del propio usuario y de lo que contó en la conversación.
- **Primer paso obligatorio:** contrastar la sección «Lo que ya existe» con el repositorio real y señalar lo que no coincida antes de construir encima.

Cada afirmación lleva una de estas tres marcas, explícita o por la sección en la que está:

- **Hecho:** lo dijo el usuario o aparece en su diagrama.
- **Propuesta:** diseño acordado en la conversación, sin implementar.
- **Inferencia:** supuesto sin confirmar. Están reunidas en «Decisiones abiertas e inferencias».

## Objetivo y alcance

El objetivo es montar una fábrica de software agéntica en el repositorio `github.com/floringugu/aprendizaje-experto`: los agentes trabajan tickets sin supervisión y el dueño revisa por etapas con un informe hecho de datos verificables.

- **Dentro del alcance:** la parte que ejecutan los agentes y el código determinista que la controla (despacho, relevo, verificación, revisión, integración, medición y mejora).
- **Fuera del alcance por ahora:** las decisiones de negocio y los pasos humanos. Aparecen solo como bordes del sistema (aprobar tickets, resolver la cola, revisar la etapa).
- **Arnés (hecho, según el diagrama del usuario):** Claude Code, con hooks, subagentes y sesiones encadenadas. Opus para implementación y para el Aprobador; Sonnet para specs, aceptación y revisores.
- **Modo de trabajo (hecho):** varios agentes o sesiones a la vez, cada uno en su carril (worktree y rama propios). Las ramas de ticket se integran en una rama de etapa que el dueño revisa y lleva a `main`.
- **Stack de la aplicación (inferencia):** probablemente TypeScript o JavaScript, por el uso de Stryker y de una carpeta `features/`. Sin confirmar.

## Lo que ya existe

Todo en esta sección es hecho según el diagrama de piezas del usuario, no según el código. Hay que verificarlo contra el repositorio.

### Piezas que ya están en el arnés

| Pieza | Tipo | Qué hace según el diagrama |
| --- | --- | --- |
| Ticket | entrada | Campos `fase`, `area`, `depende`, `toca` (rutas, al menos una) y `estado`. Solo se ejecuta lo aprobado. |
| Fase | enumeración | `specs`, `aceptacion`, `impl`. Decide qué rutas se pueden tocar. |
| Carril | worktree | Un worktree y una rama por ticket (`fase/ÁREA/carril`). Sesiones una tras otra. |
| Builder | agente | Opus para `impl`, Sonnet para `specs` y `aceptacion`. Usa un subagente implementador. Empieza leyendo el relevo y acaba en PR, `[RELEVO]` o `[DECISIÓN]`. |
| Relevo | memoria | `reports/relevo.md`, fuera de git. Guarda hecho y pendiente, paso siguiente, qué leer primero (fichero y líneas) y búsquedas ya hechas. |
| Vigía de contexto | hook | Umbral de 145 k tokens, reaviso cada 20 k. Acepta `[RELEVO]` una vez y después niega las ediciones. No cuenta a los subagentes. |
| Registro de paradas | registro | `.claude/registro-stop.jsonl`, uno para todos los carriles. Guarda sesión, carril, fase, resultado y tokens de contexto. |
| Puerta de CI | código | Valida nombre de rama y rutas de la fase, ejecuta `make check` y mutación con Stryker. |
| Revisor | subagente abstracto | Contexto limpio y solo lectura. Devuelve una lista de hallazgos. |
| revisor-evidencia | subagente | Sonnet. Revisa `features/` y `config/` contra el informe de investigación. |
| revisor-codigo | subagente | Sonnet, con Opus pendiente de probar. Revisa `src/` y `tests/` con las señales de Ousterhout. |
| Brain | memoria | `docs/plan.md`, `docs/areas/*.md`, `docs/deuda-diseno.md` y la sección «Leer primero» del ticket. Versionado en git. |
| main | rama | Solo entra lo revisado por el dueño. Historia lineal por rebase. Rulesets de CI y visto bueno. |
| Dueño | humano | Aprueba tickets, da visto bueno a specs, resuelve la cola, revisa cada etapa y fusiona la etapa en `main`. |

### Piezas que el usuario ya tenía planeadas, sin implementar

| Pieza | Tipo | Diseño original del usuario |
| --- | --- | --- |
| Despachador | script | Código, no agente. `maxCarriles: 3`, `maxRelevos: 4`. Reglas: relevo → sesión nueva; decisión → cola; con-cambios → cola; sin-cambios con PR → hecho. |
| Cola de la mañana | artefacto | Lo que espera al dueño: decisiones pendientes, relevos sin retomar, PR que esperan visto bueno, CI en rojo. |
| Aprobador | agente | Opus, sesión propia con contexto limpio, `maxRondas: 2`. Reúne los informes de los revisores, devuelve hallazgos al Builder y pasa el resto al informe. |
| Rama etapa/N | rama | Sale de `main`, fusión automática con CI, se cierra con `make cerrar-area` y se borra al fusionar. |
| Informe de etapa | artefacto | Diff de `features/`, escenarios de rojo a verde, grafo de módulos antes y después, mutación y deuda, tickets cerrados, hallazgos sin resolver. |

Además, el usuario tenía marcados tres atributos nuevos en piezas existentes: `aprobado` en Ticket, base `etapa/N` en la Puerta de CI y revisión por ticket en Revisor.

## Piezas a implementar: revisión 2

La revisión 2 corrige fallos de secuencia del diseño original: salidas sin destino, hallazgos que entraban sin resolver y estado que se perdía. Todo es propuesta. En el SVG de piezas va en azul y marcado `{rev}`.

### Cambios en piezas existentes o planeadas

| Pieza | Cambio | Motivo |
| --- | --- | --- |
| Despachador | Añadir `timeoutSesion`. Abrir carril solo si el `toca` del ticket no solapa con el de los carriles activos. Regla por defecto: cualquier caso no previsto va a la cola. | La tabla original dejaba casos sin destino y un carril podía quedar colgado toda la noche. |
| Relevo | Archivarlo en `reports/relevos/N.md` en vez de borrarlo. Añadir el SHA del commit y el resultado del último `make check`. | Si la sesión muere tras leerlo, el estado se pierde. Sin archivo no se puede auditar la calidad de los traspasos. |
| Builder | Leer el relevo y archivarlo. Pasar `make check` en verde antes de pedir revisión. | No gastar un revisor en código que no pasa las comprobaciones deterministas. |
| Vigía de contexto | Umbral por modelo en vez de un único valor. Tope propio para el subagente implementador. | Opus y Sonnet no tienen por qué compartir umbral. El contexto más pesado puede estar en el subagente, que hoy no se cuenta. |
| Registro de paradas | Resultado como enumeración cerrada. | La tabla de transiciones necesita un conjunto finito de resultados. |
| Puerta de CI | Rutas permitidas = intersección de las de la fase y las de `ticket.toca`. Fusión por squash: un commit por ticket. | `toca` no se hacía cumplir. Un commit por ticket permite revertir uno solo. |
| Rama etapa/N | Un commit por ticket. Ejecutar CI tras cada fusión. | Dos PR en verde por separado pueden dar rojo juntos. |
| Aprobador | Requiere `make check` en verde. Un hallazgo bloqueante va a la cola. Solo los menores pasan al informe. | Antes, lo no resuelto tras dos rondas entraba en la etapa y los tickets siguientes construían encima. |
| Cola de la mañana | Añadir relevos agotados, CI en rojo de la etapa, hallazgos bloqueantes y carriles sin destino. | Es el destino por defecto de todo lo que no avanza solo. |
| Informe de etapa | Cada ticket como un commit revertible. Hallazgos menores abiertos. | Coherencia con los cambios anteriores. |
| Brain | Escritura solo vía PR y por área. Precedencia: el código manda sobre Brain. | El diagrama no mostraba quién escribe. Tres carriles tocando `docs/plan.md` chocarían. |

### Piezas nuevas

| Pieza | Tipo | Contenido |
| --- | --- | --- |
| Hallazgo | valor | Severidad (bloqueante o menor), dónde (fichero y líneas), revisor que lo emite y estado (abierto o resuelto). La severidad decide entre cola e informe de etapa. |
| Mapa del repo | artefacto | Generado en CI, nunca a mano. Por cada módulo: propósito y puntos de entrada. Reutiliza el grafo de módulos del informe de etapa. Es la primera capa de búsqueda del Builder. |

Las cuatro piezas de la revisión 3 están en «Bucle de medición y mejora».

## Ciclo de vida del ticket

El ticket pasa por ocho estados y la tabla de transiciones es total: toda salida de una sesión tiene destino, y el destino por defecto es la cola. Es la especificación del Despachador. El dibujo está en `ai-factory-estados-ticket-v2.svg`.

### Estados

| Estado | Significado |
| --- | --- |
| pendiente | Creado, sin aprobar. |
| listo | Aprobado, espera carril. |
| en carril | Sesiones del Builder en su worktree. |
| en revisión | Aprobador en sesión propia, ronda 1 o 2. |
| PR abierto | Espera la Puerta de CI. |
| en etapa/N | Integrado en la rama de etapa, sin revisar por el dueño. |
| cola de la mañana | Espera al dueño. Desde aquí nada avanza solo. |
| hecho | En `main`. |

### Transiciones

La columna Origen dice si la regla venía del diseño del usuario (original) o es propuesta de la revisión 2 (rev. 2).

| Nº | De → a | Disparador | Condición | Efecto | Origen |
| --- | --- | --- | --- | --- | --- |
| 1 | pendiente → listo | El dueño aprueba el ticket | Dependencias en hecho | Queda disponible para el Despachador | original |
| 2 | listo → en carril | El Despachador abre carril | Carriles < 3 y `toca` sin solape con carriles activos | Worktree y rama nuevos. Si no se cumple, sigue en listo | rev. 2 |
| 3 | en carril → en carril | La sesión acaba en `[RELEVO]` | Relevos < 4 | Sesión nueva: lee el relevo y lo archiva | original |
| 4a | en carril → cola | La sesión acaba en `[RELEVO]` | Relevos = 4 | Ticket demasiado grande: hay que trocearlo | rev. 2 |
| 4b | en carril → cola | La sesión acaba en `[DECISIÓN]` | Ninguna | Espera la respuesta del dueño | original |
| 4c | en carril → cola | La sesión acaba con-cambios | Cambios sin commit | El worktree se conserva tal cual | original |
| 4d | en carril → cola | La sesión acaba sin-cambios | Sin PR y `make check` en rojo | El Builder paró sin avisar | rev. 2 |
| 4e | en carril → cola | Vence `timeoutSesion` | Sin entrada en el registro de paradas | Sesión muerta | rev. 2 |
| 4f | en carril → cola | Cualquier otro resultado | Ninguna | Regla por defecto: nada queda colgado | rev. 2 |
| 5 | en carril → en revisión | La sesión acaba sin-cambios | Sin PR y `make check` en verde | El Aprobador arranca en sesión propia | rev. 2 |
| 6 | en revisión → en carril | Hay hallazgos | Ronda < 2 | El Builder corrige y vuelve a pasar `make check` | original |
| 7 | en revisión → PR abierto | No quedan hallazgos bloqueantes | Sin hallazgos, o ronda = 2 | Abre PR. Los menores van al informe (`pasarResto`) | rev. 2 |
| 8 | en revisión → cola | Queda algún hallazgo bloqueante | Ronda = 2 | No se abre PR | rev. 2 |
| 9 | PR abierto → en etapa/N | Puerta de CI en verde | Rutas dentro de fase y `ticket.toca`; `make check`; mutación | Squash: un commit por ticket | rev. 2 |
| 10 | PR abierto → cola | Puerta de CI en rojo | Ninguna | El PR queda abierto | original |
| 11 | en etapa/N → cola | CI de la etapa en rojo tras una fusión | Ninguna | Candidato a revertir: el último commit fusionado | rev. 2 |
| 12 | en etapa/N → hecho | El dueño revisa el informe de etapa | CI de la etapa en verde | Rebase de la etapa a `main`. El veredicto va a la ficha | original |
| 13 | cola → listo | El dueño resuelve la entrada de la cola | Ninguna | El ticket se vuelve a despachar | original |

Regla transversal de la revisión 3: en toda transición el Despachador añade una línea a la ficha del ticket, con la versión de fábrica vigente.

## Bucle de medición y mejora: revisión 3

La revisión 3 añade lo que al diseño le faltaba por completo: medir cada ticket y usar esos datos para mejorar la fábrica. Todo es propuesta. En los SVG va en verde y marcado `{r3}`.

### Piezas nuevas

| Pieza | Tipo | Contenido |
| --- | --- | --- |
| Definición de fábrica | config | Todo lo ajustable en un solo sitio y versionado: límites (carriles, relevos, rondas), modelo por fase y por agente, umbral del Vigía por modelo, prompts, skills y hooks. Su versión es el SHA del commit. |
| Ficha de ticket | registro | Una por ticket. La escribe el Despachador en cada transición. Guarda relevos, rondas, tokens, coste, hallazgos por severidad, motivo de entrada en cola (4a a 4f), versión de fábrica y veredicto del dueño. |
| Banco de repetición | script | Repite tickets cerrados desde su commit padre variando modelo, umbral o prompts. El oráculo son los escenarios de aceptación y la mutación, no un LLM. Repite cada tarea varias veces. Salida: coste frente a acierto. |
| Mejorador | agente | Al cerrar cada etapa lee fichas y hallazgos, agrupa fallos repetidos y propone un PR a la definición de fábrica. Nunca toca la Puerta de CI. |

### Cambios en piezas existentes

- **Registro de paradas:** guarda `versionFabrica` en cada entrada.
- **Despachador:** anota la ficha del ticket en cada transición.
- **Informe de etapa:** añade el porcentaje de tickets que llegan a la etapa sin pasar por la cola, y relevos y coste por ticket.
- **Dueño:** aprueba cada PR a la definición de fábrica.

### El bucle, una vez por etapa

1. Se cierran las fichas de la etapa, una por ticket y con su versión de fábrica.
2. El Mejorador agrupa los fallos repetidos.
3. El Mejorador abre un PR a la definición de fábrica.
4. Si hay duda sobre el cambio, el Banco de repetición compara la variante con la configuración actual.
5. El dueño aprueba o descarta el PR.
6. La versión nueva rige los tickets siguientes.

### Ajuste al Mejorador tras leer pstack

La skill `correct` de pstack da un procedimiento mejor que «agrupar fallos repetidos», y conviene adoptarlo:

- Un error cuenta como clase cuando ha ocurrido dos veces.
- Cada clase se corrige en el nivel más alto que funcione, en este orden: arquitectura, tipos, regla de lint cuyo mensaje nombra la solución, test y, lo último, documentación o reglas de agente.
- Cada comprobación nueva debe demostrar que falla con un error real del pasado.
- Se mantiene una tabla que empareja cada regla con lo que la hace cumplir.

Por tanto, el Mejorador debe proponer antes una regla de lint o un cambio de API que un cambio de prompt.

### Formato candidato para la ficha

La skill `show-me-your-work` de pstack usa un registro de decisiones en TSV, solo de añadir, con seis columnas: momento, fase, decisión, motivo, evidencia (un puntero, nunca un párrafo) y resultado. Es un buen punto de partida para la ficha y para el informe de etapa.

## Principios de diseño acordados

Estos once principios explican por qué las piezas son como son. Ante un caso no previsto, decide con ellos.

1. **Determinista antes que LLM.** Lo que pueda ser regla de lint, hook o comprobación de CI no va en prosa ni en un prompt.
2. **Quien genera no valida.** Los tests de aceptación se escriben en otra fase y otro contexto. El revisor recibe tarea y diff, nunca el razonamiento del Builder.
3. **Comprobación barata antes que cara.** `make check` en verde es precondición de cualquier revisor.
4. **Todo bucle tiene límite y toda salida tiene destino.** El destino por defecto es la cola.
5. **El corte principal es la frontera de tarea, con estado verificado.** El relevo por tokens es red de seguridad. Si salta a menudo dentro de un ticket, el ticket es demasiado grande.
6. **Un traspaso es estado comprobable, no narrativa.** SHA, resultado de `make check` y ficheros tocados.
7. **La memoria propone, no dicta.** El código manda sobre Brain. La fábrica solo cambia por PR aprobado por el dueño, y nadie toca la Puerta de CI sin él.
8. **Búsqueda por capas.** Mapa del repo, luego texto plano (`rg` y glob), luego LSP para confirmar símbolos. Sin base vectorial hasta medir fallos de recuperación.
9. **Medir con datos propios.** Señales deterministas (escenarios, mutación) y veredicto del dueño antes que un LLM como juez.
10. **Un commit por ticket.** Para poder revertir uno sin tocar los demás.
11. **Cimientos antes que fábrica.** Automatizar un bucle que produce código malo solo produce más código malo. Cada corrección repetida se convierte en una comprobación.

Los principios 1, 2, 3, 5 y 8 se apoyan en fuentes externas listadas en «Referencias». La evidencia es de fuentes secundarias y de informes de proveedores, no de mediciones propias.

## Orden de implementación recomendado

Son tres fases y cada paso es requisito del siguiente. La fase A va primero porque sin ella no es seguro dejar la fábrica sola. El orden dentro de la fase A es una recomendación nueva de este documento; el de las fases B y C se acordó en la conversación.

### Fase A: control de flujo

1. Tabla de transiciones total en el Despachador, con `timeoutSesion` y regla por defecto hacia la cola.
2. Relevo archivado, con SHA y resultado de `make check`.
3. `make check` en verde como precondición del Aprobador.
4. Hallazgo con severidad; los bloqueantes van a la cola.
5. Puerta de CI con rutas limitadas a fase y `ticket.toca`, y Despachador que evita solapes de `toca`.
6. Un commit por ticket en la rama de etapa y CI tras cada fusión.

### Fase B: medición

7. Definición de fábrica en un solo sitio versionado.
8. `versionFabrica` en el registro de paradas.
9. Ficha de ticket.
10. Métricas en el informe de etapa.

### Fase C: mejora

11. Banco de repetición.
12. Mejorador, con el procedimiento de `correct`.

### En paralelo, sin dependencia de las fases

- **Aislamiento de permisos** antes de cualquier ejecución nocturna: token limitado a este repositorio y contenedor. Un worktree aísla el código, no los permisos.
- **Mapa del repo** generado en CI.
- **Umbral del Vigía por modelo** y tope para el subagente implementador.

## Decisiones abiertas e inferencias sin confirmar

Nada de esta sección está confirmado por el usuario ni por el código. Las cuatro primeras afectan a la fase A y hay que resolverlas antes de empezar.

### Afectan a la fase A

- [ ] **Significado de `con-cambios`.** Se asumió «la sesión acaba con cambios sin commit». Si significa otra cosa, cambia la fila 4c.
- [ ] **Quién abre el PR.** Se asumió que se abre al salir de revisión sin bloqueantes (fila 7). La regla original «sin-cambios con PR → hecho» sugiere que hoy lo abre el Builder antes de la revisión.
- [ ] **CI en rojo sin reintento.** Las filas 10 y 11 mandan directo a la cola. Un reintento automático ahorraría colas por tests inestables, si los hay.
- [ ] **Cuánto delega el Builder en el implementador.** Decide si el tope propio del subagente en el Vigía es necesario.

### Afectan a las fases B y C

- [ ] **Banco opcional u obligatorio.** Se dejó opcional («si hay duda»). Obligatorio en cada PR a la fábrica es más riguroso y más caro en tokens.
- [ ] **Cadencia del Mejorador.** Se puso al cerrar cada etapa. Con pocos tickets por etapa habrá poca muestra; quizá cada dos o tres etapas.
- [ ] **revisor-codigo con Sonnet o con Opus.** Pendiente de medir con el Banco.
- [ ] **Comprobar la tabla por máquina.** La skill `statechart` de pstack permitiría verificar con TLA+ que la tabla es total y sin bloqueos. Opcional; instala Java y TLC.

### Datos que faltan

- [ ] **Stack de la aplicación y si tiene interfaz.** Decide si merece la pena una skill de verificación en ejecución.
- [ ] **Cómo se ejecutan hoy los agentes sin supervisión.** Credenciales, contenedor, red.
- [ ] **Quién escribe hoy en Brain.**

### Nombres y valores

- Los nombres `reports/relevos/N.md`, `reports/fichas/TICKET.json`, `versionFabrica` y `timeoutSesion` son inventados para los diagramas. Se pueden cambiar.
- Los valores 3 carriles, 4 relevos, 2 rondas, 145 k y 20 k son del usuario y no se han tocado.

## Referencias externas

Son los repositorios leídos, las dos charlas que el usuario aportó como transcripción y las fuentes de los principios.

### Repositorios

| Repositorio | Qué es | Estado de la comprobación |
| --- | --- | --- |
| [cursor/plugins, carpeta pstack](https://github.com/cursor/plugins/tree/main/pstack) | Colección de skills de Lauren Tan (@poteto). Licencia MIT. 58 skills y 23 playbooks. | Clonado y leído en parte, commit `3dbd22f` del 13 de noviembre de 2026. No se ejecutó nada. |
| [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example) | Ejemplo ficticio de skill de verificación con mapa de funcionalidades. No trae los scripts del conductor. | Clonado y listado. Sirve como plantilla de estructura. |
| [antithesishq/bombadil](https://github.com/antithesishq/bombadil) | Tests basados en propiedades para interfaces web y de terminal. | No clonado; solo su página. |

pstack trae un adaptador oficial para Claude Code en `harness/pstack/claude-code`. Según su README se instala con `/plugin marketplace add cursor/plugins` y `/plugin install pstack@cursor-plugins`, y sus comandos llevan el prefijo `pstack:`.

### Qué adaptar de pstack y qué no

| Skill o documento | Uso propuesto |
| --- | --- |
| `correct` | Procedimiento del Mejorador. |
| `show-me-your-work` | Formato de la ficha de ticket y del informe de etapa. |
| `create-verification-skill` | Evidencia en ejecución, solo si la aplicación tiene interfaz, CLI o API que conducir. |
| `pause-safely` y `session-pickup` | Contraste con el relevo: commit antes de la nota, y quien retoma no rehace pero verifica lo heredado. |
| Playbook `autopilot-stack` | Mismo modelo que la revisión por etapa: PR verificados que no se fusionan sin el dueño. |
| `statechart` | Comprobación opcional de la tabla de transiciones con TLA+. |
| `poteto-mode` entero | No adoptar: es un enrutador con playbooks propios que competiría con el Despachador. |

### Charlas

- **Zach, fundador de Warp, sobre fábricas de software en la nube.** Aportó las ideas de definir la fábrica en código, puntuar ejecuciones, hacer benchmarks con tareas propias y el bucle de automejora. Es una charla comercial y sus cifras no son verificables.
- **Lauren Tan, sobre confianza en los agentes.** Aportó la pirámide de inversión (código, análisis estático, verificación, prosa, revisión humana) y la regla de convertir cada corrección en una comprobación. Sus cifras son autodeclaradas.

El usuario tiene las dos transcripciones; no hay enlace a los vídeos.

### Fuentes de los principios

- [Context Rot, informe de Chroma](https://research.trychroma.com/context-rot): la fiabilidad cae al crecer la entrada.
- [Harness design for long-running application development, Anthropic](https://anthropic.com/engineering/harness-design-long-running-apps): reinicios de contexto con traspaso estructurado, y evaluador separado del generador.
- [Effective harnesses for long-running agents, Anthropic](https://www.anthropic.com/news/effective-harnesses-for-long-running-agents): el fallo de cortar a mitad de implementación.
- [Why coding agents still use grep](https://yage.ai/share/why-coding-agents-still-use-grep-20260327.html): reparto entre búsqueda de texto y LSP.
- [Why many code agents use agentic search instead of a vector database](https://jacar.es/en/code-agents-without-vector-search/): cuándo compensan los embeddings.

## Prompt de arranque para el chat nuevo

Guarda este documento como Markdown en el repositorio junto a los dos SVG y pega el texto siguiente como primer mensaje. La ruta `docs/ai-factory/` es una sugerencia; cámbiala en el prompt si usas otra.

```text
Voy a implementar la AI Factory de este repositorio. El diseño está en
docs/ai-factory/contexto.md y en los dos SVG de esa carpeta. Léelos enteros
antes de proponer nada.

Antes de escribir código:
1. Contrasta la sección "Lo que ya existe" con el repositorio real y dime
   qué no coincide. El documento se escribió sin ver el código.
2. Resuelve conmigo las decisiones abiertas que afectan a la fase A.
3. Propón la fase A como tickets del propio arnés, uno por cambio, con
   su campo "toca" y sus criterios de aceptación.

Reglas:
- No toques la Puerta de CI ni la definición de fábrica sin mi aprobación.
- Lo que pueda ser regla de lint, hook o comprobación de CI no lo pongas
  en prosa.
- Distingue hechos de inferencias. Si una premisa del documento no encaja
  con el código, dilo antes de seguir.
- Los nombres de ficheros y campos marcados como inventados se pueden
  cambiar; propón los que encajen con las convenciones del repositorio.
```
