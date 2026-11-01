---
fase: specs
area: AYUD
depende: []
toca: [features/ayuda.feature, features/dominio.feature, features/calibracion.feature, config/parametros.json, config/peticion-ia.md]
estado: abierto
---
# En la fase intermedia, un objetivo nuevo empieza con unas prepreguntas de opción múltiple

**Qué:** especificar prepreguntas en la fase intermedia: unas pocas preguntas cortas de opción múltiple sobre un objetivo nuevo, antes de su instrucción, aunque se fallen casi todas. No cuentan para el dominio. Decisión del dueño (01-11-2026): solo en intermedio, porque en novato AYUD prohíbe presentar problemas antes de la instrucción.

**Hecho cuando:** los escenarios fijan cuántas prepreguntas hay, de dónde salen, cómo se combinan con el intento de exploración (AYUD-5), que no cuentan para el dominio ni para el paso de fase, y si entran en la calibración; y `make check-specs` está en verde.

**Leer primero:** features/ayuda.feature (regla «En las fases intermedia y avanzada, un objetivo nuevo empieza con un intento de exploración», AYUD-5, y «En la fase novato no hay intento de exploración»); features/dominio.feature («El intento de exploración no cuenta como intento del ítem»); features/calibracion.feature (CALI-2.3).

## Evidencia

Soderstrom y Bjork (2023, Educational Psychology Review): en un curso universitario real, prepreguntas de opción múltiple breves y de bajo riesgo antes de algunas clases mejoraron en el examen final tanto el material preguntado como el relacionado no preguntado. Límites: un solo curso, mecanismos inferidos en parte por autoinforme, y los autores piden más investigación. Extrapolación del autor: pasarlo de clases a objetivos de una app y limitarlo a la fase intermedia.

## Solapamiento con AYUD-5 (resolver antes de especificar)

La fase intermedia ya tiene algo parecido: el intento de exploración, un problema antes de la instrucción que no cuenta para el dominio. Son mecanismos distintos (prepregunta: opción múltiple corta, a menudo sobre hechos; exploración: problema, fracaso productivo), pero los dos van antes de la instrucción del mismo objetivo. Decidir si:

- se suman (prepreguntas, después exploración, después instrucción), con el riesgo de alargar mucho el inicio de cada objetivo;
- las prepreguntas sustituyen a la exploración en objetivos sin problemas (solo hechos);
- o la exploración ya cubre este efecto y el ticket se descarta.

Nota: el estudio de Soderstrom y Bjork se hizo con estudiantes nuevos en el tema, es decir, en una situación más parecida a la fase novato que a la intermedia. Limitarlo a intermedio es prudente, pero se aleja de donde está la evidencia.

## Por decidir

- Número de prepreguntas por objetivo, en `config/parametros.json`.
- Si son ítems propios marcados como prepregunta o ítems normales del objetivo (y entonces, si su primer intento cuenta después).
- Si declaran confianza (CALI-1) y entran en la calibración, como no entra la exploración (CALI-2.3).
