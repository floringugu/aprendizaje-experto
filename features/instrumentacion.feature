# language: es
@INST @evidencia-4 @extrapolacion
Característica: Instrumentación y exportación CSV
  El informe propone como instrumentos bancos de preguntas con registro de acierto y latencia,
  escalas de confianza por ítem, rúbricas con jueces ciegos y registros de horas focalizadas (sección
  4). La aplicación registra cada evento y lo exporta en un CSV por tipo de evento, con columnas
  fijas. La forma de los ficheros es decisión del autor.

  Los CSV usan coma como separador, una fila de cabecera, UTF-8, fechas ISO 8601 y punto decimal.
  Un texto libre, como el de una autoexplicación, que contenga comas o saltos de línea sale entre
  comillas dobles (INST-1.6).

  Las pantallas de calibración (CALI-4 a CALI-6) son extrapolación del autor y ningún estudio prueba
  que mejoren la calibración. Para medirlo con los datos de la persona, la aplicación registra qué
  pantalla enseñó y cuándo, y cuándo abrió cada tarjeta (INST-1.10 a INST-1.15), y la diferencia entre
  confianza y acierto de cada semana se puede comparar antes y después de la primera pantalla
  (INST-3). La comparación solo se exporta: la aplicación no se la enseña a la persona. El registro
  no cambia el progreso (INST-4).

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden

  @INST-1 @evidencia-4 @extrapolacion
  Regla: Cada tipo de evento tiene su CSV con columnas fijas

    @INST-1.1 @evidencia-4 @extrapolacion
    Esquema del escenario: Cada CSV tiene su cabecera fija
      Cuando la persona exporta <fichero>
      Entonces su cabecera es «<columnas>»

      Ejemplos:
        | fichero                   | columnas                                                                                         |
        | respuestas.csv            | fecha,dominio,contexto,item,objetivo,correcta,latencia_ms,tras_ejemplo,pasos_retirados,confianza |
        | cambios_ayuda.csv         | fecha,dominio,objetivo,pasos_retirados_antes,pasos_retirados_despues,acierto_semana              |
        | objetivos_dominados.csv   | fecha,dominio,objetivo,dominado,acierto                                                          |
        | cambios_fase.csv          | fecha,dominio,fase_anterior,fase_nueva                                                           |
        | evaluaciones_externas.csv | fecha,dominio,tarea,percentil,a_ciegas,practicada,criterio,nivel                                 |
        | horas.csv                 | fecha,dominio,minutos                                                                            |
        | autoexplicaciones.csv     | fecha,dominio,objetivo,texto                                                                     |
        | experimentos.csv          | fecha,dominio,objetivo,item,mitad,estudio_ms                                                     |
        | pantallas_calibracion.csv | fecha,dominio,objetivo,pantalla,grupo,items,aciertos                                             |
        | tarjetas_abiertas.csv     | fecha,dominio,objetivo,item,estado                                                               |

    @INST-1.2 @evidencia-4
    Escenario: Cada respuesta registra acierto, latencia y confianza
      Dado que el 2026-03-02 a las 10:00:00 se le presenta a la persona el ítem I1 de O1 en una sesión de práctica
      Y que O1 tiene 1 paso retirado y la sesión le mostró antes un ejemplo resuelto
      Cuando la persona responde correctamente 4,2 segundos después y declara una confianza del 70 %
      Entonces respuestas.csv tiene la fila «2026-03-02T10:00:04.200,ficticio,practica,I1,O1,true,4200,true,1,70»

    @INST-1.3 @extrapolacion
    Esquema del escenario: El contexto distingue de dónde sale cada respuesta
      Cuando la persona responde un ítem <dónde>
      Entonces su fila en respuestas.csv tiene el contexto «<contexto>»

      Ejemplos:
        | dónde                                                  | contexto            |
        | en el diagnóstico                                      | diagnostico         |
        | en una sesión de práctica                              | practica            |
        | en un repaso programado                                | repaso              |
        | no reservado en una sesión intercalada                 | intercalado         |
        | en una prueba de retención                             | retencion           |
        | en un intento de exploración                           | exploracion         |
        | reservado de tipo «problema» en una sesión intercalada | transferencia       |
        | reservado en una prueba de retención                   | transferencia       |
        | en el estudio de la mitad recuperada de un experimento | experimento_estudio |
        | en la prueba de un experimento                         | experimento_prueba  |

    @INST-1.4 @evidencia-4 @extrapolacion
    Escenario: Una evaluación externa ocupa una fila por criterio de la rúbrica
      Dado que la rúbrica de T2 tiene los criterios «Planteamiento» y «Resultado»
      Cuando la persona registra una evaluación externa de T2 del 2026-01-15, a ciegas, con el percentil 85, un «2» en «Planteamiento» y un «1» en «Resultado»
      Entonces evaluaciones_externas.csv tiene estas filas:
        | fecha      | dominio  | tarea | percentil | a_ciegas | practicada | criterio      | nivel |
        | 2026-01-15 | ficticio | T2    | 85        | true     | false      | Planteamiento | 2     |
        | 2026-01-15 | ficticio | T2    | 85        | true     | false      | Resultado     | 1     |

    @INST-1.5 @extrapolacion
    Escenario: Cada autoexplicación ocupa una fila
      Dado que el 2026-03-02 a las 10:00:00 la persona explica en O1 «Porque hace falta A.»
      Cuando exporta autoexplicaciones.csv
      Entonces tiene la fila «2026-03-02T10:00:00,ficticio,O1,Porque hace falta A.»

    @INST-1.6 @extrapolacion
    Esquema del escenario: Un texto con comas o saltos de línea sale entre comillas dobles
      Dado que la persona explica en O1 un texto con <rasgo>
      Cuando exporta autoexplicaciones.csv
      Entonces el texto sale entre comillas dobles
      Y el fichero tiene una sola fila de datos

      Ejemplos:
        | rasgo             |
        | una coma          |
        | un salto de línea |

    @INST-1.7 @extrapolacion
    Escenario: Las respuestas de un experimento se registran como cualquier otra
      Dado que el 2026-03-09 a las 10:00:00 se le presenta a la persona el ítem I1 de O2 en la prueba de un experimento
      Y que O2 tiene 0 pasos retirados
      Cuando la persona responde correctamente 6,5 segundos después y declara una confianza del 60 %
      Entonces respuestas.csv tiene la fila «2026-03-09T10:00:06.500,ficticio,experimento_prueba,I1,O2,true,6500,false,0,60»

    @INST-1.8 @extrapolacion
    Escenario: Un ítem de la mitad releída no genera ninguna fila en respuestas.csv
      Dado que I1 está en la mitad releída de un experimento en curso e I2, en la recuperada
      Cuando la persona estudia una pasada del experimento y exporta respuestas.csv
      Entonces tiene una fila de I2 con el contexto «experimento_estudio»
      Y no tiene ninguna fila de I1

    @INST-1.9 @extrapolacion
    Escenario: Cada ítem de un experimento ocupa una fila al terminar el estudio
      Dado que el estudio de un experimento en O2 terminó el 2026-03-02 a las 10:30:00
      Y que I1 está en la mitad releída y se vio 18,4 segundos en total
      Y que I2 está en la mitad recuperada y se estudió 21 segundos en total
      Cuando la persona exporta experimentos.csv
      Entonces tiene estas filas:
        | fecha               | dominio  | objetivo | item | mitad     | estudio_ms |
        | 2026-03-02T10:30:00 | ficticio | O2       | I1   | releer    | 18400      |
        | 2026-03-02T10:30:00 | ficticio | O2       | I2   | recuperar | 21000      |

    @INST-1.10 @extrapolacion
    Escenario: Cada silueta enseñada ocupa una fila y las que no tienen datos suficientes no
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 5
      Y que en O1 la persona respondió 10 ítems no reservados y acertó 6
      Y que respondió 6 ítems reservados de O1 y acertó 3
      Y que en O2 respondió 2 ítems no reservados
      Cuando el 2026-03-30 a las 10:00:00 se ejecuta el bucle semanal
      Y la persona exporta pantallas_calibracion.csv
      Entonces tiene estas filas:
        | fecha               | dominio  | objetivo | pantalla | grupo       | items | aciertos |
        | 2026-03-30T10:00:00 | ficticio | O1       | silueta  | practicados | 10    | 6        |
        | 2026-03-30T10:00:00 | ficticio | O1       | silueta  | reservados  | 6     | 3        |
      Y no tiene ninguna fila de O2

    @INST-1.11 @extrapolacion
    Escenario: Las tarjetas enseñadas ocupan una fila y el bucle no registra además la silueta
      Dado que el mínimo de ítems de las pantallas de calibración configurado es 5
      Y que las semanas de retención diferida configuradas son 1 y 4
      Y que la persona hizo desde el último bucle la prueba de retención de O1 de la semana 4
      Y que esa prueba incluye 12 ítems con una confianza de al menos el 80 % en su último intento anterior
      Y que la persona acertó 6 de los 12
      Y que O1 tiene datos suficientes para su silueta
      Cuando el 2026-03-30 a las 10:00:00 se ejecuta el bucle semanal
      Y la persona exporta pantallas_calibracion.csv
      Entonces tiene la fila «2026-03-30T10:00:00,ficticio,O1,tarjetas,practicados,12,6»
      Y no tiene ninguna fila con la pantalla «silueta»

    @INST-1.12 @extrapolacion
    Esquema del escenario: Cada tarjeta abierta ocupa una fila con su estado y no es un intento
      Dado que el ítem I1 de O1 tiene una tarjeta «<tarjeta>»
      Cuando el 2026-03-30 a las 10:05:00 la persona abre la tarjeta de I1
      Y exporta tarjetas_abiertas.csv
      Entonces tiene la fila «2026-03-30T10:05:00,ficticio,O1,I1,<estado>»
      Y respuestas.csv no gana ninguna fila

      Ejemplos:
        | tarjeta              | estado       |
        | sigue en pie         | sigue_en_pie |
        | fallada en la prueba | fallada      |

    @INST-1.13 @extrapolacion
    Escenario: Abrir la misma tarjeta dos veces ocupa dos filas
      Dado que el ítem I1 de O1 tiene una tarjeta «fallada en la prueba»
      Cuando la persona abre la tarjeta de I1 el 2026-03-30 a las 10:05:00 y otra vez a las 10:07:00
      Y exporta tarjetas_abiertas.csv
      Entonces tiene dos filas de I1, una con la fecha 2026-03-30T10:05:00 y otra con la 2026-03-30T10:07:00

    @INST-1.14 @extrapolacion
    Escenario: Abrir una tarjeta del resultado de un experimento no se registra en tarjetas_abiertas.csv
      Dado que el ítem I1 de O2 tiene una tarjeta «fallada en la prueba» en el resultado de un experimento
      Cuando la persona abre la tarjeta de I1
      Y exporta tarjetas_abiertas.csv
      Entonces el fichero tiene solo la fila de cabecera

    @INST-1.15 @extrapolacion
    Escenario: Sin ningún bucle ejecutado los dos CSV de calibración solo tienen la cabecera
      Dado que la persona no ha ejecutado ningún bucle semanal
      Cuando exporta pantallas_calibracion.csv y tarjetas_abiertas.csv
      Entonces los dos ficheros tienen solo la fila de cabecera

  @INST-2 @extrapolacion
  Regla: La exportación es completa y ordenada

    @INST-2.1 @extrapolacion
    Escenario: Un CSV sin eventos se exporta solo con la cabecera
      Dado que la persona no ha registrado ninguna hora
      Cuando exporta horas.csv
      Entonces el fichero tiene solo la fila de cabecera

    @INST-2.2 @extrapolacion
    Escenario: Las filas salen en orden cronológico y de todos los dominios
      Dado que la persona respondió un ítem del dominio «ficticio» el 2026-03-03
      Y respondió un ítem del dominio «ficticio_b» el 2026-03-02
      Cuando exporta respuestas.csv
      Entonces la primera fila de datos es la del 2026-03-02, del dominio «ficticio_b»
      Y la segunda es la del 2026-03-03, del dominio «ficticio»

    @INST-2.3 @extrapolacion
    Escenario: Se pueden exportar los diez CSV
      Cuando la persona abre la exportación
      Entonces puede descargar respuestas.csv, cambios_ayuda.csv, objetivos_dominados.csv, cambios_fase.csv, evaluaciones_externas.csv, horas.csv, autoexplicaciones.csv, experimentos.csv, pantallas_calibracion.csv y tarjetas_abiertas.csv

  @INST-3 @evidencia-2.5 @extrapolacion
  Regla: La diferencia entre confianza y acierto se compara por semanas, antes y después de la primera pantalla
    La aplicación no calcula ni enseña esta comparación: la persona la saca de la exportación
    (respuestas.csv y pantallas_calibracion.csv). Cada semana es la que cierra un bucle semanal,
    como en CALI-2.1, y su diferencia es la de CALI-2: confianza media menos acierto, en puntos, con
    las filas de respuestas.csv de esa semana salvo las de exploración y las de los experimentos
    (CALI-2.3, CALI-12.2). El corte es de cada dominio: la primera fila de pantallas_calibracion.csv
    de ese dominio. La semana que cierra el bucle que enseñó esa primera pantalla cuenta como
    «antes», porque la persona aún no la había visto durante ella; las siguientes, como «después».
    Se compara la diferencia media con signo (de qué lado se desvía) y la distancia media sin signo
    (cuánto se desvía), cada semana con el mismo peso. Hace falta al menos una semana con respuestas
    antes y otra después. La sección 2.5 avisa de que parte del desajuste puede ser regresión a la
    media, y no hay grupo de control: la comparación es descriptiva y no prueba que las pantallas
    cambien nada. Todo esto es decisión del autor.

    Antecedentes:
      Dado que la periodicidad del bucle configurada es de 7 días

    @INST-3.1 @extrapolacion
    Escenario: La diferencia de cada semana sale de respuestas.csv con las reglas de CALI-2
      Dado que respuestas.csv tiene estas filas entre el bucle del 2026-03-09 y el del 2026-03-16:
        | contexto           | confianza | correcta |
        | practica           | 90        | true     |
        | repaso             | 80        | false    |
        | transferencia      | 70        | true     |
        | retencion          | 60        | false    |
        | exploracion        | 95        | false    |
        | experimento_prueba | 90        | false    |
      Cuando se calcula la diferencia de la semana del bucle del 2026-03-16
      Entonces es de +25 puntos, con una confianza media del 75 % y un acierto del 50 %

    @INST-3.2 @extrapolacion
    Escenario: La semana del bucle que enseña la primera pantalla cuenta como «antes»
      Dado que los bucles semanales se ejecutaron el 2026-03-09, el 2026-03-16 y el 2026-03-23
      Y que la primera fila de pantallas_calibracion.csv del dominio «ficticio» es del bucle del 2026-03-16
      Cuando se separan las semanas del dominio «ficticio»
      Entonces las semanas «antes» son las que cerraron los bucles del 2026-03-09 y del 2026-03-16
      Y la semana «después» es la que cerró el bucle del 2026-03-23

    @INST-3.3 @extrapolacion
    Escenario: El corte es de cada dominio y sin pantallas no hay semanas «después»
      Dado que los bucles semanales se ejecutaron el 2026-03-09, el 2026-03-16 y el 2026-03-23 en los dominios «ficticio» y «ficticio_b»
      Y que pantallas_calibracion.csv solo tiene filas del dominio «ficticio»
      Cuando se separan las semanas de cada dominio
      Entonces el dominio «ficticio_b» tiene todas sus semanas «antes» y ninguna «después»
      Y no hay comparación para «ficticio_b»

    @INST-3.4 @extrapolacion
    Esquema del escenario: Para comparar hace falta al menos una semana con respuestas antes y otra después
      Dado que el dominio «ficticio» tiene <antes> semanas «antes» con respuestas y <después> «después» con respuestas
      Cuando se compara la diferencia entre confianza y acierto
      Entonces <resultado>

      Ejemplos:
        | antes | después | resultado                   |
        | 0     | 2       | no hay con qué comparar     |
        | 2     | 0       | no hay con qué comparar     |
        | 1     | 1       | se comparan las dos semanas |

    @INST-3.5 @extrapolacion
    Escenario: Una semana sin respuestas no cuenta
      Dado que las semanas «antes» del dominio «ficticio» son dos y solo una tiene respuestas
      Y que hay una semana «después» con respuestas
      Cuando se compara la diferencia entre confianza y acierto
      Entonces la media de las semanas «antes» es la de la semana con respuestas

    @INST-3.6 @extrapolacion
    Escenario: Se compara la diferencia media con signo y la distancia media sin signo
      Dado que las semanas «antes» tienen diferencias de +30 y +20 puntos
      Y que las semanas «después» tienen diferencias de +10 y -20 puntos
      Cuando se compara la diferencia entre confianza y acierto
      Entonces la diferencia media pasa de +25 a -5 puntos
      Y la distancia media pasa de 25 a 15 puntos

    @INST-3.7 @extrapolacion
    Escenario: La comparación no se enseña a la persona
      Dado que el dominio «ficticio» tiene dos semanas «antes» y dos «después» con diferencias distintas
      Cuando se ejecuta el bucle semanal
      Entonces ningún paso del bucle compara las semanas anteriores y posteriores a la primera pantalla
      Y la comparación solo se puede sacar de respuestas.csv y pantallas_calibracion.csv

  @INST-4 @extrapolacion
  Regla: El registro de las pantallas y las tarjetas no cambia el progreso ni las demás exportaciones
    Enseñar una pantalla y abrir una tarjeta solo añaden filas a pantallas_calibracion.csv y a
    tarjetas_abiertas.csv. No son intentos, y ni la confianza ni las pantallas afectan al progreso
    (CALI-3, CALI-5.6). Es decisión del autor.

    @INST-4.1 @extrapolacion
    Escenario: Dos personas con los mismos intentos solo difieren en los dos CSV de calibración
      Dado dos personas con los mismos intentos y aciertos en el dominio «ficticio»
      Pero una vio las pantallas de calibración y abrió todas sus tarjetas y la otra no las vio
      Cuando la aplicación evalúa a las dos
      Entonces las dos tienen los mismos objetivos dominados y la misma fase
      Y los mismos pasos retirados en cada objetivo
      Y las mismas fechas de repaso
      Y sus respuestas.csv, cambios_ayuda.csv, objetivos_dominados.csv y cambios_fase.csv tienen las mismas filas
      Pero pantallas_calibracion.csv y tarjetas_abiertas.csv tienen filas distintas
