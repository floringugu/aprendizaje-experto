# language: es
@INTE @evidencia-2.2 @evidencia-3 @evidencia-4
Característica: Intercalado de categorías parecidas
  Mezclar tipos de problema ayuda cuando hay que discriminar entre categorías parecidas, y perjudica
  con palabras (g = −0,39; Brunmair y Richter, 2019, sección 2.2). Se usa en la fase intermedia,
  después de un aprendizaje inicial por bloques (tabla de la sección 3; Fase 2 de la sección 4). Que
  sea solo la fase intermedia es parte de la secuencia de fases, que es extrapolación (sección 4).

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
        | fase             | resultado                                                 |
        | novato           | presenta los ítems por bloques, todos del objetivo actual |
        | intermedio       | intercala problemas de categorías parecidas               |
        | avanzado_experto | no intercala                                              |

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
