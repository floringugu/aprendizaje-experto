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

## Transferencia y exploración (etapa 3)

Los pasos de MAST-1.4, 1.5, 6.2, 6.4, 6.7 a 6.14 y 8.1 a 8.6 (ticket `mast-pasos-transferencia`) usan una interfaz que aún no existe. La implementa el ticket `mast-transferencia`; el campo `reservado?: boolean` de `ItemContenido` es el de MATE («### Reservados (etapa 3)» de `docs/areas/MATE.md`, ticket `mate-reservados`).

**Interfaz que piden los pasos:**

- `EvaluacionFase` gana tres campos opcionales (declarados por intersección en `tests/aceptacion/pasos/transferencia.ts`):
  - `aciertoProblemasReservados?: number`: acierto sobre todos los problemas reservados respondidos, los viejos y los nuevos (MAST-6.12). Si el dominio tiene reservados y la fase llega a `avanzado_experto`, la evaluación lo da: así se ve que el paso a la fase avanzada mide la transferencia (MAST-6.2, 6.4, 6.10 y 6.14).
  - `faltanCasosNuevos?: boolean`: faltan problemas reservados, por pocos o porque se gastaron todos sin llegar al umbral (MAST-6.9, 6.11, 6.13).
  - `ofrecePedirMasReservados?: boolean`: se ofrece pedir más reservados (MATE-2.10).
- `ContextoRespuesta` gana `'exploracion'` (AYUD-5, INST-1.3): la respuesta al intento de exploración se da con ese contexto (`tests/aceptacion/pasos/exploracion.ts`). Una respuesta con ese contexto no cuenta como intento del ítem: no baja `itemsSinIntento` (MAST-1.4, 1.5) ni entra en el acierto de los problemas intercalados (MAST-6.6).

**Decisiones de los pasos:**

- **El intento de exploración (MAST-8.1)** es la primera sesión de práctica del objetivo: AYUD-5 aún no tiene pasos ni código.
- **MAST-1.4 y 1.5:** I1 es de O1 en el contenido de partida; se le da otro `id` (`liberarId`) y O4 se aprueba con un I1 de tipo «problema» y 19 ítems más. Que el segundo intento «cuenta como el primero» se comprueba antes de responder: `itemsSinIntento` de O4 aún es 20.
- **MAST-6.6** queda en verde con la aplicación de hoy, porque los problemas de O4 no tienen ningún intento intercalado y la fase no se evalúa. No está en `escenarios_en_rojo`.
- **MAST-6.2 y 6.4** ya pasaban, pero la spec les añadió reservados: hoy la aplicación los cuenta como problemas normales y 6.2 (fila 16) llega a la fase avanzada. Están en `escenarios_en_rojo`.
- **MAST-8.1** usa un I5 `problema` de C1 en O4 (se libera el `id` I5 de O1) más 2 hechos de relleno. El repaso responde antes todos los ítems de O4, el reservado en `intercalado`.
- **MAST-8.4** marca también I18 como reservado y repone ítems hasta 20 no reservados, para que el 85 % siga siendo 17 de 20. O1 se domina el 2026-03-02.
- **MAST-8.6** modela «cerró la aplicación» con `presentarItem` y `responderItem` sin `declararConfianza`. «La siguiente prueba» es la del 2026-03-09, la que quedó sin completar, y «no tiene ningún intento registrado» es que respuestas.csv no tiene ninguna fila del ítem.
