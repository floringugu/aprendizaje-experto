# language: es
@INTE @evidencia-2.2 @evidencia-3 @evidencia-4
Característica: Intercalado de categorías parecidas
  Mezclar tipos de problema ayuda cuando hay que discriminar entre categorías parecidas, y perjudica
  con palabras (g = −0,39; Brunmair y Richter, 2019, sección 2.2). Se usa en la fase intermedia,
  después de un aprendizaje inicial por bloques (tabla de la sección 3; Fase 2 de la sección 4). Que
  sea solo la fase intermedia es parte de la secuencia de fases, que es extrapolación (sección 4).

  Solo se intercalan problemas de objetivos dominados: un objetivo nuevo se aprende por bloques, y
  entra en la mezcla cuando se domina (INTE-4). El informe pide ese aprendizaje inicial por bloques
  antes de intercalar (tabla de la sección 3; Fase 1 de la sección 4), pero no dice cuándo entra un objetivo en la mezcla: eso
  es extrapolación del autor.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con estas categorías:
      | categoría | grupo de parecidas |
      | C1        | G1                 |
      | C2        | G1                 |
      | C3        | G2                 |
      | C4        | G2                 |
      | C5        |                    |
    Y que cada categoría tiene ítems de tipo «problema» y de tipo «hecho»

  @INTE-1 @evidencia-3 @evidencia-4 @extrapolacion
  Regla: Solo se intercala en la fase intermedia

    Antecedentes:
      Dado que la fase de intercalado configurada es «intermedio»

    @INTE-1.1 @evidencia-3 @evidencia-4 @extrapolacion
    Esquema del escenario: La fase decide si las sesiones se intercalan
      Dado que la persona está en la fase «<fase>»
      Cuando empieza una sesión de práctica
      Entonces la sesión <resultado>

      Ejemplos:
        | fase             | resultado                                                          |
        | novato           | presenta los ítems por bloques, todos del objetivo actual          |
        | intermedio       | intercala problemas de categorías parecidas de objetivos dominados |
        | avanzado_experto | no intercala                                                       |

    @INTE-1.2 @extrapolacion
    Escenario: La fase de intercalado se lee de la configuración
      Dado que se cambia en config/parametros.json «fase_intercalado» a «avanzado_experto»
      Y que la persona está en la fase «intermedio»
      Cuando empieza una sesión de práctica
      Entonces la sesión no intercala

  @INTE-2 @evidencia-2.2 @evidencia-3 @extrapolacion
  Regla: Solo se intercalan problemas de categorías del mismo grupo de parecidas

    Antecedentes:
      Dado que la fase de intercalado configurada es «intermedio»
      Y que la persona está en la fase «intermedio»

    @INTE-2.1 @evidencia-2.2 @evidencia-3
    Escenario: Una sesión intercalada mezcla solo un grupo de parecidas
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión mezcla problemas de C1 y de C2
      Y no incluye ningún ítem de C3, C4 ni C5

    @INTE-2.2 @evidencia-2.2 @evidencia-3
    Escenario: Una categoría sin grupo de parecidas no se intercala
      Cuando la persona practica la categoría C5
      Entonces sus problemas se presentan por bloques, sin mezclar con otras categorías

    @INTE-2.3 @evidencia-2.2 @extrapolacion
    Escenario: Los hechos no se intercalan
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión no incluye ningún ítem de tipo «hecho»

  @INTE-3 @evidencia-4
  Regla: Un problema intercalado no da pista de su tipo

    Antecedentes:
      Dado que la fase de intercalado configurada es «intermedio»
      Y que la persona está en la fase «intermedio»

    @INTE-3.1 @evidencia-4
    Escenario: En una sesión intercalada no se muestra la categoría ni el objetivo
      Cuando se le presenta un problema en una sesión intercalada
      Entonces no ve el nombre de su categoría ni el de su objetivo
      Y el intento queda registrado en respuestas.csv con el contexto «intercalado»

  @INTE-4 @evidencia-3 @evidencia-4 @extrapolacion
  Regla: Un objetivo nuevo se practica por bloques hasta dominarlo

    Antecedentes:
      Dado que la fase de intercalado configurada es «intermedio»
      Y que la persona está en la fase «intermedio» con O1 y O2 dominados
      Y que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con problemas de C1 y de C2

    @INTE-4.1 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: Una sesión intercalada no incluye problemas del objetivo nuevo
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión no incluye ningún problema de O4

    @INTE-4.2 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: El objetivo nuevo se practica por bloques
      Cuando la persona practica O4
      Entonces sus problemas se presentan por bloques, sin mezclar con otras categorías

    @INTE-4.3 @evidencia-3 @evidencia-4 @extrapolacion
    Escenario: Al dominar el objetivo nuevo, entra en la mezcla
      Dado que O4 queda dominado
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión mezcla problemas de C1 y de C2, incluidos los de O4

  @INTE-5 @evidencia-4 @extrapolacion
  Regla: Los problemas reservados entran en la mezcla tras los demás del grupo y una sola vez
    La sección 4 pone la transferencia a casos nuevos entre las métricas de la Fase 2. Los problemas
    reservados de categorías intercalables (MAST-8) se presentan en las sesiones intercaladas, sin
    pista del tipo, como el resto de la Fase 2. Entran cuando la persona ya ha practicado la
    discriminación con todos los problemas del grupo, y una sola vez, porque después ya no son casos
    nuevos. Que se midan en la mezcla y no en una prueba aparte, y cuándo entran, es decisión del
    autor.

    Antecedentes:
      Dado que la fase de intercalado configurada es «intermedio»
      Y que la persona está en la fase «intermedio» con O1 y O2 dominados
      Y que el ítem I15 de O1 es un problema reservado de la categoría C1

    @INTE-5.1 @extrapolacion
    Escenario: Mientras queden problemas del grupo sin intento intercalado, el reservado no entra
      Dado que un problema no reservado de C2 aún no tiene ningún intento intercalado
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión no incluye I15

    @INTE-5.2 @evidencia-4 @extrapolacion
    Escenario: Cuando todos los problemas del grupo tienen un intento intercalado, el reservado entra sin marca
      Dado que todos los problemas no reservados de C1 y de C2 tienen un intento intercalado
      Cuando empieza una sesión intercalada del grupo G1
      Entonces la sesión incluye I15
      Y I15 se presenta como los demás problemas, sin nada que lo distinga como reservado

    @INTE-5.3 @extrapolacion
    Escenario: Un problema reservado ya respondido no vuelve a la mezcla
      Dado que todos los problemas no reservados de C1 y de C2 tienen un intento intercalado
      Y que la persona ya respondió I15 en una sesión intercalada
      Cuando empieza otra sesión intercalada del grupo G1
      Entonces la sesión no incluye I15

    @INTE-5.4 @extrapolacion
    Escenario: La respuesta a un problema reservado se registra como transferencia
      Dado que todos los problemas no reservados de C1 y de C2 tienen un intento intercalado
      Cuando la persona responde I15 en una sesión intercalada
      Entonces el intento queda registrado en respuestas.csv con el contexto «transferencia»
