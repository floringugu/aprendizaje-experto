# language: es
@MAST @evidencia-2.3 @evidencia-3
Característica: Criterio de dominio
  No se avanza a un objetivo nuevo sin dominar el anterior (mastery learning: «bien establecido;
  aula» en la tabla de la sección 3; Kulik et al., 1990, sección 2.3, marcado con (†) en la
  bibliografía). El dominio se mide con el acierto sin ayuda en pruebas de recuperación, nunca con la
  confianza ni con la autoevaluación (sección 2.5). El umbral del 85 % es de la Fase 1 y es
  extrapolación del autor (sección 4).

  El acierto sin ayuda de un objetivo es la fracción de sus ítems cuyo último intento fue correcto.
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
    Escenario: Un objetivo no se evalúa hasta que todos sus ítems tienen un intento
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

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %
      Y que el umbral de paso a la fase avanzada configurado es del 85 %

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
      Cuando la aplicación evalúa la fase
      Entonces la fase es «avanzado_experto»

    @MAST-6.5 @evidencia-4 @evidencia-1
    Escenario: Dominar todos los objetivos no da el nivel experto
      Dado que la persona está en la fase «avanzado_experto»
      Y que O1, O2 y O3 están dominados
      Cuando consulta su nivel
      Entonces no figura como experta
      Y la aplicación indica que el nivel experto lo deciden las evaluaciones externas

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
