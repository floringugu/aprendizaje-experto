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
    Escenario: Se pueden exportar los ocho CSV
      Cuando la persona abre la exportación
      Entonces puede descargar respuestas.csv, cambios_ayuda.csv, objetivos_dominados.csv, cambios_fase.csv, evaluaciones_externas.csv, horas.csv, autoexplicaciones.csv y experimentos.csv
