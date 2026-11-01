# language: es
@RECU @evidencia-2.2 @evidencia-3
Característica: Práctica de recuperación con feedback correctivo
  Recordar sin mirar es la técnica más sólida del informe (sección 2.2). El feedback correctivo eleva
  su efecto (de g = 0,374 a g = 0,537) y también ayuda que la práctica tenga el formato de la prueba
  final. El feedback informa sobre la tarea: el rico en información sobre la tarea funciona mucho
  mejor que los elogios o las notas (Wisniewski et al., 2020, sección 2.2; tabla de la sección 3), y
  el que desplaza la atención hacia la persona puede empeorar el rendimiento (Kluger y DeNisi, 1996,
  marcado con (†) en la bibliografía).

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que O1 tiene el ítem I1 con las opciones «a», «b» y «c», la correcta «b» y el feedback «Porque b cumple la regla R1.»
    Y que O1 tiene el ítem I2 con las respuestas aceptadas «regla de tres» y «proporción»

  @RECU-1 @evidencia-2.2 @evidencia-3
  Regla: Se recuerda antes de ver la respuesta
    Hay una sola excepción: la mitad releída del experimento de releer frente a recuperar (CALI-13).

    @RECU-1.1 @evidencia-2.2 @evidencia-3
    Escenario: El ítem se presenta sin la respuesta
      Cuando se le presenta I1 a la persona
      Entonces ve el enunciado y las opciones «a», «b» y «c»
      Pero no ve cuál es la correcta ni el feedback hasta haber respondido

    @RECU-1.2 @evidencia-2.5
    Escenario: No se puede dar un ítem por sabido sin responderlo
      Cuando se le presenta I1 a la persona
      Entonces no hay ninguna opción para ver la respuesta sin responder ni para marcarlo como sabido

  @RECU-2 @evidencia-2.2 @evidencia-3
  Regla: Después de cada respuesta hay feedback correctivo sobre la tarea

    @RECU-2.1 @evidencia-2.2 @evidencia-3
    Esquema del escenario: El feedback aparece tanto si acierta como si falla
      Cuando la persona responde «<respuesta>» a I1 y declara su confianza
      Entonces ve que su respuesta es <corrección>
      Y ve que la respuesta correcta es «b»
      Y ve el feedback «Porque b cumple la regla R1.»

      Ejemplos:
        | respuesta | corrección |
        | b         | correcta   |
        | a         | incorrecta |

    @RECU-2.2 @evidencia-2.2 @evidencia-3
    Escenario: El feedback no habla de la persona
      Cuando la persona responde a I1 y declara su confianza
      Entonces el feedback solo contiene si la respuesta es correcta, la respuesta correcta y la explicación del contenido
      Y no contiene elogios, reproches, notas ni mensajes sobre la persona

  @RECU-3 @evidencia-2.5 @extrapolacion
  Regla: La corrección es automática

    @RECU-3.1 @extrapolacion
    Esquema del escenario: Una respuesta escrita se compara sin distinguir mayúsculas ni espacios sobrantes
      Cuando la persona escribe «<respuesta>» como respuesta a I2
      Entonces la respuesta es <corrección>

      Ejemplos:
        | respuesta       | corrección |
        | regla de tres   | correcta   |
        | Regla  de  Tres | correcta   |
        | PROPORCIÓN      | correcta   |
        | regla de cuatro | incorrecta |

    @RECU-3.2 @extrapolacion
    Escenario: Los espacios al principio y al final de una respuesta escrita no cuentan
      Cuando la persona escribe «proporción» con dos espacios delante y uno detrás como respuesta a I2
      Entonces la respuesta es correcta

    @RECU-3.3 @evidencia-2.5
    Escenario: La persona nunca corrige sus propias respuestas
      Cuando la persona responde a I2
      Entonces la aplicación no le pregunta si cree que ha acertado

  @RECU-4 @evidencia-2.2 @extrapolacion
  Regla: La práctica tiene el formato de las pruebas de la aplicación
    El informe habla del formato de la evaluación final. Tomar como tal las pruebas de retención de
    la aplicación es decisión del autor: el formato de las evaluaciones externas no lo controla.

    @RECU-4.1 @evidencia-2.2 @extrapolacion
    Escenario: Un ítem tiene el mismo formato en la práctica, en los repasos y en las pruebas de retención
      Cuando a la persona se le presenta I1 en una sesión de práctica, en un repaso y en una prueba de retención
      Entonces las tres veces lo responde eligiendo entre las opciones «a», «b» y «c»
