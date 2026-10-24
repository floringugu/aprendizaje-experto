# language: es
@TARE @evidencia-4 @evidencia-1
Característica: Tareas representativas y evaluación externa
  La pericia es un rendimiento superior y reproducible en tareas representativas del dominio, no un
  título (sección 1). En la Fase 3 se practica con tareas representativas cada vez más difíciles y
  feedback de expertos (sección 4; práctica deliberada, sección 2.2). El nivel experto lo decide la
  definición operativa de la sección 4: tareas evaluadas a ciegas, en o por encima del percentil
  80–90 de profesionales acreditados, en dos evaluaciones separadas al menos 3 meses y con casos no
  vistos. Esos umbrales son una convención propuesta, no un estándar validado.

  La aplicación no mide la dificultad de las tareas: las presenta en el orden del contenido, que el
  autor escribe de menos a más difícil. Que ese orden sea el de dificultad creciente es lectura del
  autor de la «práctica con tareas representativas cada vez más difíciles» de la sección 4.

  La aplicación no puntúa las tareas ni calcula percentiles: registra lo que da el evaluador externo.
  El informe habla de una «batería» de tareas; que cada evaluación sea de una sola tarea es decisión
  del autor.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con las tareas T1, T2, T3 y T4, en ese orden
    Y que la rúbrica de T1 tiene el criterio «Planteamiento» con estos niveles:
      | nivel | descriptor                           |
      | 0     | no identifica qué pide el problema   |
      | 1     | lo identifica, pero elige mal datos  |
      | 2     | lo identifica y elige bien los datos |

  @TARE-1 @evidencia-4 @evidencia-2.2
  Regla: En la fase avanzada se practica con tareas representativas

    @TARE-1.1 @evidencia-4 @extrapolacion
    Escenario: Las tareas se presentan en el orden del contenido, de menos a más difícil, con su rúbrica
      Dado que la persona está en la fase «avanzado_experto»
      Cuando pide una tarea de práctica
      Entonces se le presenta T1 con su enunciado y su rúbrica
      Y T1 queda marcada como practicada

    @TARE-1.2 @evidencia-4 @evidencia-2.5
    Escenario: La aplicación no puntúa las tareas ni pide autoevaluarlas
      Dado que la persona ha hecho la tarea T1
      Entonces la aplicación no le asigna ninguna puntuación
      Y no le pide que puntúe su propio trabajo

    @TARE-1.3 @evidencia-4 @evidencia-2.2
    Escenario: El feedback del evaluador se muestra por criterio, con lo que significa cada nivel
      Dado que el evaluador ha puntuado T1 con un «1» en «Planteamiento»
      Cuando la persona consulta la evaluación de T1
      Entonces ve en el criterio «Planteamiento» el nivel «1», con el descriptor «lo identifica, pero elige mal datos»
      Y ve el descriptor del nivel más alto, «lo identifica y elige bien los datos»

    @TARE-1.4 @evidencia-4 @extrapolacion
    Escenario: Tras practicar las primeras tareas, la siguiente es la que sigue en el orden
      Dado que la persona está en la fase «avanzado_experto»
      Y que ha practicado T1 y T2
      Cuando pide una tarea de práctica
      Entonces se le presenta T3 con su enunciado y su rúbrica

    @TARE-1.5 @evidencia-4 @extrapolacion
    Escenario: Una tarea parte de un texto profesional y su enunciado lo nombra
      Dado que T3 parte del texto profesional «informe-2025.pdf»
      Cuando la persona pide la tarea T3
      Entonces se le presenta el texto profesional «informe-2025.pdf»
      Y el enunciado de T3 nombra «informe-2025.pdf»

  @TARE-2 @evidencia-4 @extrapolacion
  Regla: Se registran evaluaciones externas fechadas

    @TARE-2.1 @evidencia-4 @extrapolacion
    Escenario: Una evaluación externa completa se registra
      Cuando la persona registra una evaluación externa de T2 con estos datos:
        | fecha      | percentil | a ciegas | Planteamiento |
        | 2026-01-15 | 85        | sí       | 2             |
      Entonces la evaluación queda guardada
      Y queda registrada en evaluaciones_externas.csv

    @TARE-2.2 @extrapolacion
    Esquema del escenario: Una evaluación con datos que faltan o no válidos se rechaza
      Cuando la persona registra una evaluación externa de T2 con <problema>
      Entonces la aplicación la rechaza e indica qué dato falta o no es válido

      Ejemplos:
        | problema                                                   |
        | la fecha vacía                                             |
        | una fecha futura                                           |
        | el percentil 101                                           |
        | el percentil -1                                            |
        | el nivel «3» en «Planteamiento», que no está en la rúbrica |
        | sin indicar si fue a ciegas                                |

  @TARE-3 @evidencia-4 @extrapolacion
  Regla: El nivel experto lo deciden las evaluaciones externas válidas

    Antecedentes:
      Dado que el percentil mínimo configurado es 80
      Y que el número de evaluaciones requeridas configurado es 2
      Y que la separación mínima configurada entre evaluaciones es de 3 meses
      Y que la persona practicó T1 en la aplicación el 2026-01-10

    @TARE-3.1 @evidencia-4 @extrapolacion
    Escenario: Dos evaluaciones válidas separadas 3 meses dan el nivel experto
      Dado estas evaluaciones externas, a ciegas y de tareas no practicadas:
        | fecha      | tarea | percentil |
        | 2026-01-15 | T2    | 80        |
        | 2026-04-15 | T3    | 92        |
      Cuando la aplicación evalúa el nivel experto
      Entonces la aplicación indica que el rendimiento en el dominio «ficticio» cumple la definición operativa de nivel experto
      Y aclara que esa definición es una convención propuesta, no un estándar validado

    @TARE-3.2 @evidencia-4 @extrapolacion
    Esquema del escenario: Una evaluación que no cumple un criterio no cuenta
      Dado una evaluación externa válida de T2 del 2026-01-15 con el percentil 90
      Y otra evaluación externa de <tarea> del <fecha> con el percentil <percentil>, <a ciegas>
      Cuando la aplicación evalúa el nivel experto
      Entonces la persona no alcanza el nivel experto

      Ejemplos:
        | tarea | fecha      | percentil | a ciegas                           |
        | T3    | 2026-04-15 | 79        | evaluada a ciegas                  |
        | T3    | 2026-04-14 | 90        | evaluada a ciegas                  |
        | T3    | 2026-04-15 | 90        | evaluada sin ocultar quién la hizo |
        | T1    | 2026-04-15 | 90        | evaluada a ciegas                  |

    @TARE-3.3 @evidencia-4
    Escenario: Una tarea practicada en la aplicación no cuenta como caso nuevo
      Dado que T1 se evalúa a ciegas el 2026-04-15 con el percentil 95
      Cuando la aplicación evalúa el nivel experto
      Entonces esa evaluación no cuenta para el nivel experto, porque T1 no es un caso nuevo

    @TARE-3.4 @evidencia-4 @evidencia-2.6
    Escenario: El nivel experto no depende de las horas ni del tiempo de uso
      Dado que la persona ha registrado 20000 horas de práctica focalizada
      Y que no tiene ninguna evaluación externa
      Cuando la aplicación evalúa el nivel experto
      Entonces la persona no alcanza el nivel experto

    @TARE-3.5 @extrapolacion
    Escenario: El percentil mínimo se lee de la configuración
      Dado que se cambia en config/parametros.json «percentil_experto» a 90
      Y estas evaluaciones externas, a ciegas y de tareas no practicadas:
        | fecha      | tarea | percentil |
        | 2026-01-15 | T2    | 85        |
        | 2026-04-15 | T3    | 92        |
      Cuando la aplicación evalúa el nivel experto
      Entonces la persona no alcanza el nivel experto
