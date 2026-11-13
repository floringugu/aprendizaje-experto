---
fase: specs
area: RECU
depende: []
toca: [features/recuperacion.feature, features/calibracion.feature, features/instrumentacion.feature]
estado: abierto
---
# Al responder un ítem, la persona puede escribir por qué eligió esa respuesta, y queda registrado

**Qué:** hoy de cada intento se guarda la respuesta, el acierto y la confianza (calibracion.feature, CALI-1), pero no el razonamiento: de un fallo no se sabe si fue un despiste, una idea equivocada o una adivinanza. Especificar un campo de texto libre junto a la respuesta de un ítem, donde la persona escribe con sus palabras por qué responde eso, y que se registre con el intento. No se corrige ni cuenta para el dominio, la ayuda, la fase ni la calibración.

**Hecho cuando:** los escenarios fijan en qué ítems aparece el campo, en qué momento respecto a la respuesta, la confianza y el feedback, si puede quedar en blanco, que no cambia el progreso y en qué CSV y con qué columnas se registra; y `make check-specs` está en verde.

**Leer primero:** features/calibracion.feature («La confianza se declara en cada ítem, antes del feedback», línea 29); features/recuperacion.feature («Se recuerda antes de ver la respuesta», línea 17; «Un ítem fallado vuelve en la misma sesión hasta acertarlo», línea 255); features/ayuda.feature (AYUD-6, línea 318: la autoexplicación tras la instrucción); features/instrumentacion.feature («Cada tipo de evento tiene su CSV con columnas fijas», línea 24); docs/investigacion-ia-generativa.md §2.4 (diagnóstico de errores).

## De dónde sale la idea

De LearnHarness (github.com/amosblomqvist/learnharness, AGPL-3.0), visto el 13-11-2026. Cada pregunta lleva, además de la respuesta y la confianza, un campo `thinking` donde la persona explica su razonamiento, y el agente lo usa para decidir qué enseñar después. Se toma la idea, no el código.

## No es la autoexplicación de AYUD-6

| | AYUD-6 (ya especificada) | Este ticket |
|---|---|---|
| Sobre qué | La instrucción de un objetivo | La respuesta a un ítem |
| Cuándo | Una vez, al practicar el objetivo por primera vez | En cada intento donde aparezca el campo |
| Fases | Intermedia y avanzada | Por decidir |
| Dónde se registra | autoexplicaciones.csv | Por decidir |

## Para qué sirve el dato

- **A la persona.** Al ver el feedback, compara lo que pensó con la explicación correcta.
- **A specs-concepciones-erroneas.** El texto de los fallos enseña qué ideas equivocadas aparecen de verdad, para redactar o corregir el catálogo.
- **A specs-tutor-socratico.** El canal de preguntas recibiría el razonamiento de la persona además de su respuesta.

## Límites que salen de la evidencia

- **No es un diagnóstico automático.** `docs/investigacion-ia-generativa.md` §2.4 da nivel «muy bajo» al análisis de errores con LLM: detectan mal el primer paso erróneo. El campo se registra y se enseña; ninguna IA decide con él qué se practica.
- **Nunca con un ejemplo resuelto.** Barbieri et al. (informe, §2.2) vieron que añadir autoexplicación a los ejemplos resueltos redujo su beneficio (AYUD-3).
- **Sin respaldo directo.** El informe da a la autoexplicación el nivel «Prometedor», en material conceptual y en la fase intermedia; no trata el razonamiento escrito durante la recuperación. Los escenarios irían con `@extrapolacion`.

## Por decidir

- **Opcional u obligatorio.** AYUD-6 lo hizo obligatorio con el argumento de que, si fuera opcional, casi nadie escribiría. Aquí se repite en cada ítem, y obligatorio alargaría mucho la sesión (propuesta: opcional).
- **El momento.** Antes de declarar la confianza, después, o tras el feedback y solo en los fallos. Escribir antes del feedback recoge lo que la persona pensaba de verdad; después, ya ha visto la respuesta.
- **En qué ítems.** En todos, solo en los problemas (no en los hechos), o solo desde la fase intermedia, como AYUD-6.
- **Los reintentos.** Si el reintento de RECU-6 lo pide; la confianza no se pide ahí (CALI-1).
- **El CSV.** Una columna nueva en el CSV de intentos o un fichero propio, como autoexplicaciones.csv.
