# MAST: Criterio de dominio

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

## Mecanismo

Dominio puro: sin paso de mecanismo.

## Interfaces descartadas y por qué

Las dos interfaces que se compararon («diseñarlo dos veces»): cuál se eligió, cuál se descartó y la razón.

Deuda pagada antes del área:

- **`EstadoDominio` (D1, D12).**
  - **Elegida:** una clase con los campos privados y una operación por cada cosa que hacen los casos de uso: `respuestaPendiente`, `guardarRespuesta`, `registrarIntento`, `cerrarDiagnostico`, `ultimoIntentoDeCadaItem`, `pasosRetiradosDe`, y `fase` y `dominados` de solo lectura. Los casos de uso ya no saben cómo se guardan los intentos ni las respuestas pendientes.
  - **Descartada:** un estado inmutable con funciones de transición que devuelven un estado nuevo. Motivo: cada caso de uso tendría que devolver el estado nuevo y `enDominio` guardarlo, con más ceremonia en todos los llamadores. D1 pide ocultar los campos, no cambiar cómo se actualiza el estado.
- **`ruta.ts` y `turnos.ts` (D7).**
  - **Elegida:** dos módulos de dominio pequeños. `ruta.ts` tiene `objetivosPendientes`, que MAST amplía con los objetivos abiertos. `turnos.ts` tiene `intercalarPorTurnos`, que es general y no sabe de ítems.
  - **Descartada:** un único módulo de utilidades para las dos. Motivo: mezcla una regla del dominio, la ruta, con una función general de listas; el nombre no diría qué contiene y acabaría recogiendo todo lo que no tiene sitio.
- **`itemsDelObjetivo` (D11).**
  - **Elegida:** una función junto a la forma del contenido, `itemsDelObjetivo(items, objetivo)`, que sustituye a los cuatro filtros repetidos.
  - **Descartada:** una clase que envuelva el contenido con sus consultas. Motivo: `ContenidoDominio` es la forma del JSON del autor, que el soporte de aceptación construye tal cual; envolverlo obliga a convertirlo en cada lectura.

Ficheros nuevos y cambios de interfaz del área:

- **`src/dominio/fases.ts`.**
  - **Elegida:** dos reglas, `faseTrasDominio` y `faseTrasProblemas`, que solo hacen avanzar la fase. El diagnóstico aplica las dos seguidas, partiendo de novato; la práctica aplica la primera al reevaluar un objetivo y la segunda al evaluar la fase.
  - **Descartada:** una única `siguienteFase(fase, todosDominados, aciertoProblemas)` que aplique las dos. Motivo: las dos transiciones ocurren en momentos distintos. El paso a avanzado/experto solo ocurre al evaluar la fase (MAST-6.2), y con una sola función cada reevaluación de un objetivo tendría que saber el acierto en problemas, o la fase avanzaría antes de tiempo.
- **`src/dominio/criterio-dominio.ts`.**
  - **Elegida:** `evaluarDominio({items, ultimoIntento, umbral, dominadoAntes})`, que decide en un solo sitio si el objetivo está dominado, cuántos ítems faltan y que un objetivo sin acierto medido sigue como estaba. Y `fechasDeRetencion(dominadoEl, semanas)`.
  - **Descartada:** que la aplicación compusiera `aciertoSinAyuda`, `llegaAlUmbral` y la regla de conservar el estado. Motivo: la regla de conservar el estado (un objetivo dominado en el diagnóstico no lo pierde por los ítems que aún no ha visto) quedaría en la aplicación, repetida en cada caso de uso que evalúa. También se descartó una clase con el historial de cada objetivo: el historial ya lo guarda `EstadoDominio`, y la regla no necesita más que el último intento de cada ítem.
- **`recorrerRuta` en `src/dominio/ruta.ts`.**
  - **Elegida:** una función que recorre los objetivos en orden con los dominados de ahora y los que lo estuvieron alguna vez, y devuelve el estado de cada uno y el actual. Los abiertos no se guardan: se deducen.
  - **Descartada:** guardar en el estado el conjunto de objetivos abiertos y añadir uno cada vez que se domina el anterior. Motivo: con O1 perdido, dominar O2 no abriría O3 si la regla mira «el anterior está dominado», y si mira «el anterior se abrió» hay que mantener dos conjuntos a la par. También se descartaron predicados sueltos (`estaAbierto`, `esActual`): dan una interfaz superficial que obliga a cada llamador a recorrer la ruta.
- **`src/dominio/unidades.ts`.**
  - **Elegida:** constantes técnicas (`MS_POR_SEMANA`), en el único fichero de `src/` donde el lint permite números sueltos.
  - **Descartada:** funciones `sumarSemanas` y `sumarDias`. Motivo: el plan reserva ese fichero para las constantes técnicas, y la única suma de fechas del área ya vive en `fechasDeRetencion`.
- **`EstadoDominio` como registro (`src/aplicacion/estado.ts`).**
  - **Elegida:** el estado guarda los intentos, los cambios de dominio y los cambios de fase, cada uno con su fecha. La fase, los dominados y la fecha desde la que se domina cada objetivo se deducen de esos cambios, que son también lo que se exporta en CSV. `cambiarDominado` y `cambiarFase` solo registran un cambio real.
  - **Descartada:** guardar la fase y los dominados como ahora y, aparte, una lista de filas para el CSV. Motivo: son dos fuentes de la misma verdad que se pueden contradecir, y cada caso de uso que cambia algo tendría que acordarse de escribir la fila.
- **`src/aplicacion/criterio-dominio.ts`.**
  - **Elegida:** `registrarIntentoYReevaluar(entorno, situacion, intento)`, que lee la configuración, registra el intento y reevalúa su objetivo, en ese orden. Así un repaso fallado quita el dominio en el momento, con su fecha (MAST-4.1, MAST-7.2), aunque nadie llame a `evaluarObjetivo`.
  - **Descartada (más superficial):** exportar `leerUmbralYMomento` y `reevaluarObjetivo` y que `declararConfianza` los llamara en orden. Motivo: el orden importa (lo que puede fallar va antes de tocar el estado), y quedaría en manos de cada llamador.
  - **Descartada (radicalmente distinta):** no registrar los cambios y deducirlo todo al consultar, reproduciendo los intentos con el umbral de la configuración. Motivo: cambiar el umbral reescribiría el pasado (MAST-5.1 cambia el umbral a mitad de escenario), y objetivos_dominados.csv debe decir lo que pasó en su momento.
- **`src/aplicacion/repasos.ts`.**
  - **Elegida:** las pruebas de retención se calculan al consultarlas, con `dominadoDesde` y las semanas que diga entonces la configuración.
  - **Descartada:** programarlas en el estado al dominar el objetivo y borrarlas al perderlo. Motivo: más estado que mantener a la par, y un cambio de `retencion_diferida_semanas` no contaría hasta el siguiente dominio, al contrario que el resto de parámetros, que se leen en cada evaluación.
- **`src/aplicacion/csv.ts`.**
  - **Elegida:** una tabla con cada fichero (sus columnas propias y cómo sacar sus filas del registro de un dominio). Las columnas comunes, el formato de las fechas y el orden cronológico van una sola vez en `exportarCsv`.
  - **Descartada:** una función por fichero elegida con un `switch`. Motivo: cada una repetiría la cabecera común, el formato y la ordenación.
- **`src/aplicacion/nivel-experto.ts`.**
  - **Elegida:** `evaluarNivelExperto` responde siempre que no se cumple la definición operativa, con el aviso de que la deciden las evaluaciones externas, hasta que TARE implemente esas evaluaciones.
  - **Descartada:** deducirlo de la fase avanzado/experto. Motivo: contradice MAST-6.5, que dice justo que dominar todos los objetivos no da el nivel experto.
- **`src/dominio/transferencia.ts`.**
  - **Elegida:** un módulo de dominio con todo lo que se decide de un ítem reservado: `esReservado`, `sinReservados`, `reservadosDeRetencion(items, categorias, pruebas)` y `evaluarTransferencia({items, categorias, ultimoIntento, umbral, minimo})`. Esta última devuelve el acierto, si la transferencia está superada y si faltan casos nuevos. La aplicación quita los reservados con `sinReservados` en el diagnóstico, la práctica, los repasos, el dominio y el progreso, y `avisos-de-reservados.ts` usa el mismo `esReservado`.
  - **Descartada:** meter estas funciones en `src/aplicacion/contenido.ts`, junto a `itemsDelObjetivo`. Motivo: ese fichero lo tenía el carril `mate-pasos-tipos-de-src`, y la regla de la transferencia es del dominio, sin nada de la aplicación. También se descartó una sola función que decidiera a la vez la fase, el aviso y el reparto por pruebas: son tres momentos distintos (evaluar la fase, preparar una prueba de retención y responder un ítem), y cada llamador tendría que calcular lo que no le hace falta.
- **`faseTrasProblemas` con un objeto (`src/dominio/fases.ts`).**
  - **Elegida:** `faseTrasProblemas(fase, {aciertoProblemas, umbralPasoAAvanzado, transferenciaSuperada})`. La transferencia llega ya decidida por `evaluarTransferencia`, y la regla de paso solo combina las dos métricas (MAST-6.7).
  - **Descartada:** cuatro parámetros sueltos. Motivo: un acierto, un umbral y un booleano seguidos se pueden cambiar de orden en la llamada sin que el compilador lo note.

## Deuda pagada

D1, D7, D11 y D12, en el commit `refactor: hide domain state behind operations and move route helpers out of the diagnostic`.

## Mutación

- **Puntuación:** 98,30 % (173 mutantes eliminados, 3 supervivientes). La primera pasada dio 97,73 %: en `ruta.ts:46`, el mutante que devolvía `{}` en vez de `{ estados }` sobrevivía porque el test «@MAST-6.1 con todos dominados no hay objetivo actual» solo miraba que faltase `actual`. Ahora también comprueba que los tres objetivos están dominados.
- **Supervivientes aceptados:** los tres equivalentes que ya aceptó RECU, ahora en otras líneas porque los ficheros han crecido: `correccion.ts:32` (`toLowerCase()` por `toUpperCase()`), `acierto.ts:50` (`acierto !== undefined && …` por `true && …`) y `diagnostico.ts:59` (`item.categoria !== undefined && …` por `true && …`). Los motivos están en `docs/areas/RECU.md`.

## Bloqueos del hook Stop

```text
MAST: 27 paradas del hook Stop en 5 conversaciones, desde 2026-10-22T23:38:54.780Z.
  - Bloqueos: 4 (aceptacion 4).
  - Por el entorno: 0.
  - Con el freno (3.º bloqueo seguido o más): 0.
  - Paradas con [DECISIÓN PENDIENTE]: 21.
```

Los cuatro bloqueos son de aceptación: los escenarios de MAST siguieron en rojo mientras se preparaba el refactor de la deuda y el dominio, antes de llegar a la aplicación. Ninguno llegó al freno.

## Transferencia y exploración

Los pasos de MAST-1.4, 1.5, 6.2, 6.4, 6.7 a 6.14 y 8.1 a 8.6 son del ticket `mast-pasos-transferencia`, y MAST-7.4 del ticket `mast-pasos-borrador`. Los implementa el ticket `mast-transferencia`, y pasan los 19. El campo `reservado?: boolean` de `ItemContenido` es el de MATE («### Reservados (etapa 3)» de `docs/areas/MATE.md`, ticket `mate-reservados`). Con este ticket pasan también INTE-2.1, 2.2, 3.1 y 6.1, que solo piden la sesión intercalada mínima.

**Implementación:**

- **Fase (`evaluarFase`):** el acierto en problemas intercalados no cuenta los reservados. La transferencia se mide con el último intento de cada problema reservado de categorías con grupo, de todos los objetivos (`evaluarTransferencia`, con `umbral_transferencia` y `minimo_problemas_reservados`). El aviso de que faltan casos nuevos, con la oferta de pedir más, solo sale si la fase resultante es la intermedia.
- **Respuestas (`respuestas.ts`):** el intento de un reservado se registra con el contexto `transferencia`, se haya presentado donde se haya presentado (MAST-8.4). Se gasta al declarar la confianza, no al presentarlo (MAST-8.6). Un reservado se rechaza en el diagnóstico, aunque tenga `diagnostico: true`, y también si ya tiene intento (MAST-8.5).
- **Exploración (`estado.ts`):** `ultimoIntentoDeCadaItem()` sin contexto deja fuera el contexto `exploracion` (MAST-1.4, 1.5). Con contexto, solo cuenta ese.
- **Sesiones (`practica.ts`):** `iniciarSesion` reparte por tipo.
  - `practica` sin `grupo`: la de siempre, sin reservados.
  - `practica` con `grupo`: `sesionIntercalada`, con los problemas de las categorías del grupo y sus reservados sin gastar.
  - `repaso`: los ítems no reservados ya respondidos, del objetivo si se pide uno.
  - `retencion`: la prueba en curso de un objetivo dominado (`pruebaDeRetencionEnCurso`), con sus ítems no reservados y los reservados que `reservadosDeRetencion` da a esa prueba y aún no se han respondido. Solo lee el contenido aprobado: nada del borrador (MAST-7.4).
  - Una sesión intercalada sin problemas, un repaso sin ítems respondidos y una retención sin prueba en curso, o de un objetivo sin dominar, se rechazan con un motivo, no con un error.
  - El reservado no se rechaza en `practica` ni en `repaso`: las sesiones no lo incluyen, y basta con eso.
- **Casos que los escenarios no fijan:**
  - Si dos fechas de retención coinciden, `pruebaDeRetencionEnCurso` da la primera.
  - Con 0 reservados y `minimo_problemas_reservados` a 0, `evaluarTransferencia` da `faltanCasosNuevos`: sin ningún acierto medido no se llega al umbral, así que la fase no avanza.

**Lo que queda para otras áreas y tickets:**

- **INTE:** en `sesionIntercalada`, el orden por turnos, la fase de intercalado (`fase_intercalado`) y cuándo entra un reservado en la mezcla (INTE-5.1). Hoy van los problemas del grupo en el orden del contenido.
- **PLAN:** en `sesionDeRepaso`, qué ítems tocan cada día. Hoy van todos los ya respondidos.
- **Prepreguntas (tickets `mast-pasos-prepreguntas` y `mast-prepreguntas`):** MAST-1.6 y 1.7 (las prepreguntas de la fase intermedia, AYUD-8) siguen sin pasos y no son de este ticket. Impiden cerrar MAST: `make cerrar-area A=MAST` los da sin definir.
- **Aceptación (ticket `mast-pasos-fase-avanzada`):** `llegarAFase(…, 'avanzado_experto')` (`tests/aceptacion/soporte/acciones.ts`) solo acierta los problemas intercalables. Sin reservados, la transferencia ya no se supera y la persona se queda en la fase intermedia sin que el paso falle. Hoy no rompe ningún escenario: los que lo usan, en TARE y AYUD, fallan antes o después por pasos sin definir o sin implementar. Se comparó la ejecución de todas las features en `e197c55` y en el carril: 147 frente a 175 escenarios en verde, ninguno pasa de verde a rojo y los que fallan lo hacen en el mismo paso y con el mismo error.
- **Deuda, para `mast-cierre`:** `docs/deuda-diseno.md` no se tocó en este ticket porque lo tiene en su `toca` el carril abierto `mate-cierre`. Al cerrar MAST hay que pasar esto a la tabla:
  - **D20 crece:** `problemasIntercalables` tiene dos consumidores más, `src/dominio/transferencia.ts`, que además saca de su firma los tipos del ítem y de la categoría, y `sesionIntercalada` de `src/aplicacion/practica.ts`. Ya son cinco.
  - **D21 crece:** el ternario que omite un opcional sin valor aparece también en `evaluarFase` (`src/aplicacion/criterio-dominio.ts`, dos veces, en lugar del que había) y en `evaluarTransferencia` (`src/dominio/transferencia.ts`, con su porqué).
  - **D8 crece:** hay frases de rechazo nuevas en `src/aplicacion/practica.ts` (sesión intercalada, repaso y retención) y en `motivoParaNoResponder` de `src/aplicacion/respuestas.ts`.
  - **D13 se paga en parte:** `intercalada` ya no es fija, porque la sesión intercalada la pone a `true`. Quedan `ItemPresentado.objetivo` y `categoria` y `instruccionesAutoexplicacion: []`.
  - **Nueva, pequeña:** «un ítem es reservado solo con `reservado: true`» está dos veces, en `esReservado` (`src/dominio/transferencia.ts`) y en `src/aplicacion/revision.ts:157`, de MATE, que no lo usa. Propuesta: que `revision.ts` use `esReservado`.
  - Las líneas de D8, D9, D19 y D20 en `src/aplicacion/criterio-dominio.ts` y `practica.ts` se han movido.

**Interfaz que pidieron los pasos (etapa 3):**

- `EvaluacionFase` gana tres campos opcionales (declarados por intersección en `tests/aceptacion/pasos/transferencia.ts`):
  - `aciertoProblemasReservados?: number`: acierto sobre todos los problemas reservados respondidos, los viejos y los nuevos (MAST-6.12). Si el dominio tiene reservados y la fase llega a `avanzado_experto`, la evaluación lo da: así se ve que el paso a la fase avanzada mide la transferencia (MAST-6.2, 6.4, 6.10 y 6.14).
  - `faltanCasosNuevos?: boolean`: faltan problemas reservados, por pocos o porque se gastaron todos sin llegar al umbral (MAST-6.9, 6.11, 6.13).
  - `ofrecePedirMasReservados?: boolean`: se ofrece pedir más reservados (MATE-2.10).
- `ContextoRespuesta` gana `'exploracion'` (AYUD-5, INST-1.3): la respuesta al intento de exploración se da con ese contexto (`tests/aceptacion/pasos/exploracion.ts`). Una respuesta con ese contexto no cuenta como intento del ítem: no baja `itemsSinIntento` (MAST-1.4, 1.5) ni entra en el acierto de los problemas intercalados (MAST-6.6).

- `ContextoRespuesta` gana `'prepregunta'` (AYUD-8): la respuesta a una prepregunta se da con ese contexto (`tests/aceptacion/pasos/prepreguntas.ts`). Una respuesta con ese contexto no cuenta como intento del ítem: no baja `itemsSinIntento` (MAST-1.6), y el intento posterior sí cuenta como el primero (MAST-1.7). Es el mismo tratamiento que `'exploracion'` en `ultimoIntentoDeCadaItem()`.

**Decisiones de los pasos (etapa 3):**

- **MAST-1.6 y 1.7** (ticket `mast-pasos-prepreguntas`) no tenían pasos y `make cerrar-area A=MAST` los daba sin definir. Están en `escenarios_en_rojo` hasta que lo implemente la etapa 4. O4 se aprueba con 20 ítems de tipo «hecho» con opciones, H1 a H20 (`agregarHechosConOpciones`), que no chocan con los I1 a I60 del contenido de partida. Los pasos «responde de nuevo», «cuenta como el primero» y «faltan {int} ítems» son los de `exploracion.ts`. Hoy fallan porque una prepregunta cuenta como intento: H1, H2 y H3 bajan `itemsSinIntento` de 20 a 17 (MAST-1.6), y H1 ya cuenta antes de responderlo de nuevo (MAST-1.7).
- **El intento de exploración (MAST-8.1)** es la primera sesión de práctica del objetivo: AYUD-5 aún no tiene pasos ni código.
- **MAST-1.4 y 1.5:** I1 es de O1 en el contenido de partida; se le da otro `id` (`liberarId`) y O4 se aprueba con un I1 de tipo «problema» y 19 ítems más. Que el segundo intento «cuenta como el primero» se comprueba antes de responder: `itemsSinIntento` de O4 aún es 20.
- **MAST-6.6** ya estaba en verde antes de este ticket, porque los problemas de O4 no tienen ningún intento intercalado y la fase no se evalúa. No estuvo en `escenarios_en_rojo`.
- **MAST-6.2 y 6.4** ya pasaban, pero la spec les añadió reservados: la aplicación de entonces los contaba como problemas normales, y 6.2 (fila 16) llegaba a la fase avanzada. Estuvieron en `escenarios_en_rojo` hasta este ticket.
- **MAST-8.1** usa un I5 `problema` de C1 en O4 (se libera el `id` I5 de O1) más 2 hechos de relleno. El repaso responde antes todos los ítems de O4, el reservado en `intercalado`.
- **MAST-8.4** marca también I18 como reservado y repone ítems hasta 20 no reservados, para que el 85 % siga siendo 17 de 20. O1 se domina el 2026-03-02.
- **MAST-8.6** modela «cerró la aplicación» con `presentarItem` y `responderItem` sin `declararConfianza`. «La siguiente prueba» es la del 2026-03-09, la que quedó sin completar, y «no tiene ningún intento registrado» es que respuestas.csv no tiene ninguna fila del ítem.
- **MAST-7.4** llegó de MATE-6.1 (ticket `mate-sesiones-a-plan-inte`): una prueba de retención no presenta el ítem I9 del borrador. Fallaba porque `iniciarSesion` daba «Sin implementar» para el tipo `retencion`, hasta que lo implementó `mast-transferencia`. Sus pasos son los de MATE-6.1 (los comparten también PLAN-4.1 e INTE-6.1), y los antecedentes de este fichero dan 20 ítems por objetivo (I1 a I60): el I9 y el I20 (`PARECIDO_A_I9`) de esos pasos ya existen como ítems aprobados de O1 y la prueba los presentaría. El «Dado» que añade el borrador llama a `liberarId('I9')` y `liberarId('I20')` (como MAST-1.4); si el contenido aprobado no tiene esos ids, no hace nada, así que MATE-6.1 no cambia. Con eso MAST-7.4 fallaba en el «Cuando» con «Sin implementar», no en un «Dado».
