# language: es
@MAST @evidencia-2.3 @evidencia-3
Característica: Criterio de dominio
  No se avanza a un objetivo nuevo sin dominar el anterior (mastery learning: «bien establecido;
  aula» en la tabla de la sección 3; Kulik et al., 1990, sección 2.3, marcado con (†) en la
  bibliografía). El dominio se mide con el acierto sin ayuda en pruebas de recuperación, nunca con la
  confianza ni con la autoevaluación (sección 2.5). El umbral del 85 % es de la Fase 1 y es
  extrapolación del autor (sección 4).

  El acierto sin ayuda de un objetivo es la fracción de sus ítems no reservados cuyo último intento
  fue correcto. Los ítems reservados miden la transferencia a casos nuevos y no cuentan (MAST-8).
  Un intento es sin ayuda cuando, mientras la persona responde, no ve ningún ejemplo resuelto ni la
  respuesta, aunque haya estudiado un ejemplo justo antes. Esta definición es decisión del autor.
  Hay una excepción: el intento de exploración de un objetivo nuevo (AYUD-5) no cuenta como intento,
  ni para el acierto ni para saber si el ítem tiene ya un intento. También es decisión del autor.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que cada objetivo tiene 20 ítems
    Y que la persona está en la fase «novato» con O1 como objetivo actual

  @MAST-1 @evidencia-2.3 @evidencia-3 @extrapolacion
  Regla: Un objetivo queda dominado cuando su acierto sin ayuda llega al umbral

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %

    @MAST-1.1 @extrapolacion
    Esquema del escenario: El umbral se alcanza con un acierto igual o mayor
      Dado que la persona ha respondido los 20 ítems de O1
      Y que en su último intento acertó <aciertos> de ellos
      Cuando la aplicación evalúa O1
      Entonces O1 <resultado>

      Ejemplos:
        | aciertos | resultado         |
        | 20       | queda dominado    |
        | 17       | queda dominado    |
        | 16       | no queda dominado |

    @MAST-1.2 @evidencia-2.3 @extrapolacion
    Escenario: Cuenta el último intento de cada ítem, no el primero
      Dado que la persona falló el ítem I1 de O1 en su primer intento
      Y que acertó I1 en su segundo intento
      Y que en su último intento acertó otros 16 ítems de O1
      Cuando la aplicación evalúa O1
      Entonces el acierto sin ayuda de O1 es del 85 %
      Y O1 queda dominado

    @MAST-1.3 @evidencia-2.3
    Escenario: Un objetivo no se evalúa hasta que todos sus ítems no reservados tienen un intento
      Dado que la persona ha acertado 19 ítems de O1
      Y que nunca ha respondido el ítem I20 de O1
      Cuando la aplicación evalúa O1
      Entonces O1 no queda dominado
      Y la aplicación indica que falta responder 1 ítem de O1

    @MAST-1.4 @extrapolacion
    Escenario: El intento de exploración no cuenta como intento del ítem
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con 20 ítems
      Y que la persona acierta el ítem I1 de O4 como intento de exploración
      Cuando la aplicación evalúa O4
      Entonces O4 no queda dominado
      Y la aplicación indica que faltan 20 ítems de O4

    @MAST-1.5 @extrapolacion
    Escenario: El intento posterior a la exploración sí cuenta
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con 20 ítems
      Y que la persona acierta el ítem I1 de O4 como intento de exploración
      Cuando la persona responde de nuevo I1 de O4 y lo acierta
      Entonces ese intento cuenta como el primero de I1
      Y la aplicación indica que faltan 19 ítems de O4

  @MAST-2 @evidencia-2.3 @evidencia-3 @extrapolacion
  Regla: No se avanza sin dominar

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %

    @MAST-2.1 @evidencia-3
    Escenario: El objetivo siguiente se abre al dominar el actual
      Cuando O1 queda dominado
      Entonces O2 pasa a ser el objetivo actual
      Y O3 sigue cerrado

    @MAST-2.2 @evidencia-3
    Escenario: Sin dominio no se abre el objetivo siguiente
      Dado que el acierto sin ayuda de O1 es del 80 %
      Cuando la persona intenta practicar O2
      Entonces la aplicación no se lo permite
      Y O1 sigue siendo el objetivo actual

  @MAST-3 @evidencia-2.5 @evidencia-5
  Regla: La confianza y la autoevaluación no cuentan para el dominio

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %

    @MAST-3.1 @evidencia-2.5 @evidencia-5
    Escenario: Declarar mucha confianza no hace avanzar
      Dado que la persona ha respondido los 20 ítems de O1 con una confianza del 100 % en cada uno
      Y que en su último intento acertó 10 de ellos
      Cuando la aplicación evalúa O1
      Entonces O1 no queda dominado

    @MAST-3.2 @evidencia-2.5
    Escenario: La aplicación no ofrece marcar un objetivo como sabido
      Cuando la persona consulta el objetivo O1
      Entonces no hay ninguna opción para darlo por dominado, saltarlo o declarar que ya lo sabe

  @MAST-4 @evidencia-2.3 @extrapolacion
  Regla: Un objetivo deja de estar dominado si su acierto baja del umbral

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %

    @MAST-4.1 @extrapolacion
    Escenario: Los fallos en los repasos quitan el dominio, pero no la fase
      Dado que O1 está dominado con un acierto sin ayuda del 85 %
      Y que O2 es el objetivo actual
      Cuando la persona falla un repaso de un ítem de O1 que había acertado
      Entonces el acierto sin ayuda de O1 es del 80 %
      Y O1 deja de estar dominado
      Y O1 vuelve a la cola de práctica
      Y O2 sigue abierto y la fase sigue siendo «novato»
      Y el cambio queda registrado en objetivos_dominados.csv

  @MAST-5 @extrapolacion
  Regla: El umbral de dominio se lee de la configuración

    @MAST-5.1 @extrapolacion
    Esquema del escenario: Cambiar el umbral en config/parametros.json cambia el criterio
      Dado que se cambia en config/parametros.json «umbral_dominio» a <umbral>
      Y que la persona ha respondido los 20 ítems de O1
      Y que en su último intento acertó 16 de ellos
      Cuando la aplicación evalúa O1
      Entonces O1 <resultado>

      Ejemplos:
        | umbral | resultado         |
        | 0,70   | queda dominado    |
        | 0,80   | queda dominado    |
        | 0,90   | no queda dominado |

  @MAST-6 @evidencia-4 @extrapolacion
  Regla: La fase cambia según el dominio y no retrocede
    Lo que se intenta antes de la instrucción no mide lo aprendido (AYUD-5): para pasar a la fase
    avanzada solo cuentan los intentos intercalados (MAST-6.2). Por eso un objetivo nuevo con
    problemas en categorías intercalables retrasa el paso a la fase avanzada hasta que sus problemas
    se han intercalado (MAST-6.6). Si no, no se intercalarían nunca, porque la fase avanzada no
    intercala (INTE-1.1). Es decisión del autor.

    La transferencia se mide con los problemas reservados de categorías con grupo (MAST-6.7). Cada
    uno se presenta una sola vez, así que quien falla no puede mejorar su acierto con los mismos:
    la aplicación avisa de que faltan casos nuevos y ofrece pedir más (MATE-2.10, MATE-2.11), y el acierto se
    calcula sobre todos los reservados respondidos, los viejos y los nuevos (MAST-6.12). Que haya
    al menos `minimo_problemas_reservados` (MAST-6.11) es decisión del autor: con el 85 %, hasta 6
    problemas obligan a acertarlos todos.

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %
      Y que el umbral de paso a la fase avanzada configurado es del 85 %
      Y que el umbral de transferencia configurado es del 85 %
      Y que el mínimo de problemas reservados configurado es 5

    @MAST-6.1 @evidencia-4 @extrapolacion
    Escenario: Dominar todos los objetivos lleva a la fase intermedia
      Dado que O1 y O2 están dominados
      Cuando O3 queda dominado
      Entonces la fase pasa de «novato» a «intermedio»
      Y el cambio queda registrado en cambios_fase.csv

    @MAST-6.2 @evidencia-4 @extrapolacion
    Esquema del escenario: El acierto en problemas intercalados sin pista del tipo lleva a la fase avanzada
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó <aciertos> de ellos
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados
      Cuando la aplicación evalúa la fase
      Entonces la fase es «<fase>»

      Ejemplos:
        | aciertos | fase             |
        | 17       | avanzado_experto |
        | 16       | intermedio       |

    @MAST-6.3 @extrapolacion
    Escenario: Perder el dominio de un objetivo no devuelve a una fase anterior
      Dado que la persona está en la fase «intermedio»
      Cuando O2 deja de estar dominado
      Entonces la fase sigue siendo «intermedio»
      Y O2 vuelve a la cola de práctica

    @MAST-6.4 @extrapolacion
    Escenario: El umbral de paso a la fase avanzada se lee de la configuración
      Dado que se cambia en config/parametros.json «umbral_paso_a_avanzado» a 0,75
      Y que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que en su último intento intercalado acertó 16 de ellos
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados
      Cuando la aplicación evalúa la fase
      Entonces la fase es «avanzado_experto»

    @MAST-6.5 @evidencia-4 @evidencia-1
    Escenario: Dominar todos los objetivos no da el nivel experto
      Dado que la persona está en la fase «avanzado_experto»
      Y que O1, O2 y O3 están dominados
      Cuando consulta su nivel
      Entonces no figura como experta
      Y la aplicación indica que el nivel experto lo deciden las evaluaciones externas

    @MAST-6.6 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: Mientras los problemas de un objetivo nuevo no se han intercalado, la fase no avanza
      Dado que la persona está en la fase «intermedio»
      Y que O1, O2 y O3 tienen 20 ítems de tipo «problema» en categorías intercalables
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados
      Y que O4 se aprobó en la revisión del material con problemas en categorías intercalables
      Y que la persona acertó el problema de exploración de O4
      Cuando la aplicación evalúa la fase
      Entonces la fase sigue siendo «intermedio»

    @MAST-6.7 @evidencia-4 @extrapolacion
    Esquema del escenario: La fase avanzada exige además acierto en los problemas reservados
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas, todos respondidos
      Y que la persona acertó <aciertos> de ellos
      Cuando la aplicación evalúa la fase
      Entonces la fase es «<fase>»

      Ejemplos:
        | aciertos | fase             |
        | 9        | avanzado_experto |
        | 8        | intermedio       |

    @MAST-6.8 @extrapolacion
    Escenario: Sin todos los problemas reservados respondidos, la fase no avanza
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas
      Y que la persona acertó 9 de ellos y nunca ha respondido el décimo
      Cuando la aplicación evalúa la fase
      Entonces la fase sigue siendo «intermedio»

    @MAST-6.9 @extrapolacion
    Escenario: Sin ningún problema reservado, la fase no avanza y se avisa
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio no tiene ningún problema reservado en categorías con grupo de parecidas
      Cuando la aplicación evalúa la fase
      Entonces la fase sigue siendo «intermedio»
      Y la aplicación indica que faltan casos nuevos para medir la transferencia
      Y ofrece pedir más problemas reservados

    @MAST-6.10 @extrapolacion
    Escenario: El umbral de transferencia se lee de la configuración
      Dado que se cambia en config/parametros.json «umbral_transferencia» a 0,75
      Y que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 10 problemas reservados en categorías con grupo de parecidas, todos respondidos
      Y que la persona acertó 8 de ellos
      Cuando la aplicación evalúa la fase
      Entonces la fase es «avanzado_experto»

    @MAST-6.11 @extrapolacion
    Escenario: Con menos problemas reservados que el mínimo, la fase no avanza aunque se acierten todos
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 4 problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados
      Cuando la aplicación evalúa la fase
      Entonces la fase sigue siendo «intermedio»
      Y la aplicación indica que faltan casos nuevos para medir la transferencia
      Y ofrece pedir más problemas reservados

    @MAST-6.12 @extrapolacion
    Escenario: Tras fallar la transferencia, los reservados nuevos se suman a los ya respondidos
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene 10 problemas reservados en categorías con grupo de parecidas, todos respondidos
      Y que la persona acertó 8 de ellos
      Y que la aplicación le indicó que faltan casos nuevos para medir la transferencia
      Cuando se aprueban 10 problemas reservados nuevos en categorías con grupo de parecidas
      Y la persona los responde y acierta los 10
      Y la aplicación evalúa la fase
      Entonces la fase es «avanzado_experto», porque acertó 18 de 20 problemas reservados

    @MAST-6.13 @extrapolacion
    Escenario: Si falla la transferencia y no quedan reservados por responder, se avisa y se ofrece pedir más
      Dado que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene 10 problemas reservados en categorías con grupo de parecidas, todos respondidos
      Y que la persona acertó 8 de ellos
      Cuando la aplicación evalúa la fase
      Entonces la fase sigue siendo «intermedio»
      Y la aplicación indica que faltan casos nuevos para medir la transferencia
      Y ofrece pedir más problemas reservados

    @MAST-6.14 @extrapolacion
    Escenario: El mínimo de problemas reservados se lee de la configuración
      Dado que se cambia en config/parametros.json «minimo_problemas_reservados» a 3
      Y que la persona está en la fase «intermedio»
      Y que el dominio tiene 20 ítems de tipo «problema» en categorías intercalables
      Y que cada uno tiene al menos un intento en sesiones intercaladas
      Y que en su último intento intercalado acertó los 20
      Y que el dominio tiene además 3 problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados
      Cuando la aplicación evalúa la fase
      Entonces la fase es «avanzado_experto»

  @MAST-7 @evidencia-4 @extrapolacion
  Regla: La retención se mide en diferido

    Antecedentes:
      Dado que las semanas de retención diferida configuradas son 1 y 4
      Y que el umbral de dominio configurado es del 85 %

    @MAST-7.1 @evidencia-4 @extrapolacion
    Escenario: Al dominar un objetivo se programan sus pruebas de retención
      Cuando O1 queda dominado el 2026-03-02
      Entonces se programa una prueba de retención de O1 para el 2026-03-09
      Y otra para el 2026-03-30

    @MAST-7.2 @evidencia-4 @extrapolacion
    Escenario: Una prueba de retención cuenta como intento sin ayuda
      Dado que O1 está dominado con un acierto sin ayuda del 85 %
      Cuando la persona falla en la prueba de retención un ítem de O1 que había acertado
      Entonces el resultado queda registrado en respuestas.csv con el contexto «retencion»
      Y O1 deja de estar dominado

    @MAST-7.3 @extrapolacion
    Escenario: Las semanas de retención diferida se leen de la configuración
      Dado que se cambia en config/parametros.json «retencion_diferida_semanas» a 2 y 8
      Cuando O1 queda dominado el 2026-03-02
      Entonces se programa una prueba de retención de O1 para el 2026-03-16
      Y otra para el 2026-04-27

    @MAST-7.4 @extrapolacion
    Escenario: Un ítem del borrador no se presenta en una prueba de retención
      Dado que contenido/borradores/ficticio.json tiene, sin aprobar, el objetivo O4, el ejemplo resuelto E9 de O1, la tarea T9 y el ítem I9 de O1
      Y que I9 es de tipo «problema», está marcado para el diagnóstico y es de una categoría intercalable
      Cuando la persona hace una prueba de retención de O1
      Entonces no se le presenta I9

  @MAST-8 @evidencia-2.2 @evidencia-4 @extrapolacion
  Regla: Los casos nuevos se miden con ítems reservados
    La sección 4 pone la transferencia a casos nuevos entre las métricas de la Fase 2, y la sección
    2.2 recuerda que la transferencia de la práctica de recuperación es menor (d = 0,40; fuente
    secundaria). Un ítem reservado (`reservado: true` en el contenido) es un caso que la persona no
    practica: se le presenta una sola vez. Sirve para pasar a la fase avanzada (MAST-6.7) y en las
    pruebas de retención, y nunca para dominar un objetivo. Medir la transferencia con ítems
    reservados, y no con las evaluaciones externas, y repartirlos así es decisión del autor.

    El reparto (MAST-8.3): los problemas reservados de categorías con grupo van a la mezcla
    (INTE-5). Los demás reservados (hechos, y problemas de categorías sin grupo) se reparten a
    partes iguales entre las pruebas de retención de las semanas configuradas, en el orden del
    contenido; si no sale exacto, las primeras pruebas llevan uno más. En la prueba de retención un
    reservado solo se registra: no cambia el dominio ni la fase (MAST-8.4).

    Un reservado se gasta cuando se declara la confianza, que es cuando el intento está completo
    (CALI-1.1, PANT-2): uno que se mostró y se abandonó antes vuelve a presentarse, porque la
    persona no llegó a ver la respuesta ni el feedback (MAST-8.6).

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %
      Y que las semanas de retención diferida configuradas son 1 y 4

    @MAST-8.1 @extrapolacion
    Esquema del escenario: Solo se presentan reservados donde se mide la transferencia
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 se aprobó en la revisión del material con un ítem I5 reservado
      Y que I5 también está marcado para el diagnóstico
      Cuando <momento>
      Entonces I5 no se presenta
      Y I5 se acepta con «reservado» y «diagnostico» a la vez, sin error de formato

      Ejemplos:
        | momento                                         |
        | se prepara el diagnóstico del dominio           |
        | empieza una sesión de práctica de O4            |
        | se prepara un repaso programado de O4           |
        | la persona hace el intento de exploración de O4 |

    @MAST-8.2 @extrapolacion
    Escenario: Un reservado no cuenta para el dominio
      Dado que O1 tiene 20 ítems, 4 de ellos reservados
      Y que la persona ha respondido los 16 ítems no reservados de O1 y acertó 14 en su último intento
      Y que nunca ha respondido ninguno de los 4 reservados
      Cuando la aplicación evalúa O1
      Entonces el acierto sin ayuda de O1 es del 87,5 %
      Y O1 queda dominado
      Y la aplicación no indica que falte responder ningún ítem de O1

    @MAST-8.3 @extrapolacion
    Escenario: Los reservados van a la mezcla o a las pruebas de retención
      Dado que C1 y C2 son de un grupo de parecidas y C5 no tiene grupo
      Y que O1 tiene estos ítems reservados, en este orden:
        | ítem | tipo     | categoría |
        | I14  | problema | C1        |
        | I15  | hecho    | C1        |
        | I16  | problema | C5        |
        | I17  | hecho    | C5        |
        | I18  | hecho    | C2        |
        | I19  | problema | C5        |
      Cuando O1 queda dominado el 2026-03-02
      Entonces I14 entra en la mezcla de las sesiones intercaladas (INTE-5)
      Y la prueba de retención de O1 del 2026-03-09 incluye I15, I16 e I17
      Y la prueba de retención de O1 del 2026-03-30 incluye I18 e I19
      Y ninguna prueba de retención de O1 incluye I14

    @MAST-8.4 @extrapolacion
    Escenario: Fallar un reservado en una prueba de retención no quita el dominio
      Dado que O1 está dominado con un acierto sin ayuda del 85 %
      Y que el ítem I19 de O1 es un reservado de la prueba de retención del 2026-03-30
      Cuando la persona falla I19 en esa prueba de retención
      Entonces el resultado queda registrado en respuestas.csv con el contexto «transferencia»
      Y O1 sigue dominado
      Y el acierto sin ayuda de O1 sigue siendo del 85 %

    @MAST-8.5 @extrapolacion
    Escenario: Un reservado se presenta una sola vez
      Dado que la persona respondió el reservado I15 de O1 en la prueba de retención del 2026-03-09
      Cuando se prepara la prueba de retención de O1 del 2026-03-30
      Entonces la prueba no incluye I15
      Y I15 no se presenta en ninguna sesión de práctica, repaso ni sesión intercalada

    @MAST-8.6 @extrapolacion
    Escenario: Un reservado abandonado sin declarar la confianza no se gasta
      Dado que se le presentó a la persona el reservado I15 de O1 y cerró la aplicación sin declarar su confianza
      Cuando se prepara la siguiente prueba de retención de O1
      Entonces I15 sigue disponible para presentarse
      Y I15 no tiene ningún intento registrado
