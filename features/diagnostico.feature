# language: es
@DIAG @evidencia-4 @evidencia-2.3
Característica: Diagnóstico inicial
  Toda persona empieza un dominio con un diagnóstico de su conocimiento previo: una prueba de
  recuperación del núcleo conceptual y tareas representativas simples (sección 4, Fase 0). El
  conocimiento previo predice el nivel final y decide qué instrucción conviene (secciones 1 y 2.3).
  Las «tareas simples» del diagnóstico son ítems de tipo «problema» que se corrigen solos; las tareas
  con rúbrica se evalúan fuera, en TARE.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que cada objetivo tiene 20 ítems de diagnóstico: 10 de tipo «hecho» y 10 de tipo «problema»
    Y que todos los ítems de tipo «problema» son de categorías intercalables

  @DIAG-1 @evidencia-4
  Regla: El diagnóstico es obligatorio y mide con pruebas

    @DIAG-1.1 @evidencia-4
    Escenario: Un dominio nuevo empieza por el diagnóstico
      Dado que la persona no ha empezado el dominio «ficticio»
      Cuando abre el dominio «ficticio»
      Entonces la aplicación le presenta el diagnóstico
      Y no le deja practicar ningún objetivo hasta terminarlo

    @DIAG-1.2 @evidencia-4 @evidencia-2.5 @extrapolacion
    Escenario: El diagnóstico usa solo los ítems marcados como diagnóstico y los corrige solo
      Cuando la persona hace el diagnóstico del dominio «ficticio»
      Entonces se le presentan los 60 ítems de diagnóstico y ningún otro
      Y cada respuesta se corrige comparándola con la respuesta del contenido
      Y el resultado no depende de la confianza que declare
      Y no se le pide que diga cuánto cree que sabe del dominio ni de ningún objetivo

    @DIAG-1.3 @evidencia-4 @evidencia-2.3
    Escenario: Los ítems del diagnóstico se presentan sin ayuda y sin pista del tipo
      Cuando la persona hace el diagnóstico del dominio «ficticio»
      Entonces ningún ítem del diagnóstico va precedido de un ejemplo resuelto
      Y ningún ítem muestra su objetivo ni su categoría

  @DIAG-2 @evidencia-4 @evidencia-2.3 @extrapolacion
  Regla: El diagnóstico da una ruta personalizada
    El acierto en problemas sin pista del tipo se mide, como en MAST-6.2, sobre los ítems de tipo
    «problema» de categorías intercalables; en el diagnóstico, con su único intento. Usar el
    diagnóstico para situar directamente en una fase posterior es decisión del autor.

    Antecedentes:
      Dado que el umbral de dominio configurado es del 85 %
      Y que el umbral de paso a la fase avanzada configurado es del 85 %

    @DIAG-2.1 @evidencia-4 @extrapolacion
    Escenario: Un objetivo superado en el diagnóstico queda dominado y sale de la ruta
      Dado que en el diagnóstico la persona acierta los 20 ítems de O1
      Y acierta 10 de los 20 ítems de O2 y 10 de los 20 ítems de O3
      Cuando termina el diagnóstico
      Entonces O1 queda dominado
      Y su ruta es, en este orden: O2, O3
      Y su fase es «novato»

    @DIAG-2.2 @evidencia-4 @extrapolacion
    Esquema del escenario: El diagnóstico da por dominado un objetivo en el umbral, no por debajo
      Dado que en el diagnóstico la persona acierta <aciertos> de los 20 ítems de O1
      Cuando termina el diagnóstico
      Entonces O1 <resultado>

      Ejemplos:
        | aciertos | resultado         |
        | 17       | queda dominado    |
        | 16       | no queda dominado |

    @DIAG-2.3 @evidencia-4 @extrapolacion
    Escenario: Quien domina todos los objetivos pero no los problemas sin pista empieza en la fase intermedia
      Dado que en el diagnóstico la persona acierta los 30 ítems de tipo «hecho»
      Y acierta 8 de los 10 ítems de tipo «problema» de cada objetivo
      Cuando termina el diagnóstico
      Entonces O1, O2 y O3 quedan dominados, con un 90 % de acierto cada uno
      Y su fase es «intermedio», porque su acierto en problemas sin pista del tipo es del 80 %
      Y su ruta no tiene objetivos pendientes

    @DIAG-2.4 @evidencia-4 @extrapolacion
    Escenario: El diagnóstico puede situar a la persona directamente en la fase avanzada
      Dado que en el diagnóstico la persona acierta los 30 ítems de tipo «hecho»
      Y acierta 9 de los 10 ítems de tipo «problema» de cada objetivo
      Cuando termina el diagnóstico
      Entonces su fase es «avanzado_experto», porque su acierto en problemas sin pista del tipo es del 90 %

    @DIAG-2.5 @evidencia-2.3 @evidencia-3
    Escenario: La ayuda inicial depende del diagnóstico
      Dado que en el diagnóstico la persona domina O1 y no domina O2
      Cuando termina el diagnóstico
      Entonces O1 empieza sin ejemplos resueltos
      Y O2 empieza con la ayuda completa: sus ejemplos resueltos con todos los pasos

  @DIAG-3 @evidencia-4 @evidencia-2.6
  Regla: El diagnóstico no estima el tiempo hasta la pericia

    @DIAG-3.1 @evidencia-4 @evidencia-2.6
    Escenario: El resultado del diagnóstico no da ninguna estimación de tiempo
      Cuando la persona termina el diagnóstico del dominio «ficticio»
      Entonces el resultado muestra su fase y su ruta
      Pero no muestra ninguna estimación de días, semanas, meses, años ni horas hasta la pericia
      Y no muestra ninguna fecha prevista para terminar la ruta
