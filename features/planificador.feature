# language: es
@PLAN @evidencia-2.2 @evidencia-4
Característica: Planificación de repasos espaciados
  Los repasos se distribuyen en el tiempo (práctica espaciada, Cepeda et al., 2008, sección 2.2). Los
  ítems de tipo «hecho» los programa un algoritmo de repetición espaciada, FSRS o, como alternativa,
  SM-2 (sección 4). La sección 2.5 no verificó ensayos que comparen los dos. Los ítems de tipo
  «problema» se repasan cada «fracción × horizonte», con la fracción de Cepeda et al. (2008) para el
  horizonte de retención que elige la persona.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que O1 tiene el ítem H1 de tipo «hecho» y el ítem Q1 de tipo «problema»

  @PLAN-1 @evidencia-4 @evidencia-2.5 @extrapolacion
  Regla: FSRS programa los hechos según la corrección observada

    Antecedentes:
      Dado que el algoritmo de repetición espaciada configurado es FSRS
      Y que la retención objetivo de FSRS configurada es del 90 %

    @PLAN-1.1 @evidencia-4 @extrapolacion
    Esquema del escenario: La corrección decide la calificación que recibe FSRS
      Cuando la persona responde H1 y la respuesta es <corrección>
      Entonces FSRS recibe la calificación «<calificación>»
      Y el siguiente repaso de H1 es el que calcula FSRS para esa calificación con una retención del 90 %

      Ejemplos:
        | corrección | calificación |
        | correcta   | Good         |
        | incorrecta | Again        |

    @PLAN-1.2 @evidencia-2.5
    Escenario: La persona no califica la dificultad de sus repasos
      Cuando la persona responde H1
      Entonces la aplicación no le pide que califique el repaso como difícil, bien o fácil
      Y FSRS nunca recibe las calificaciones «Hard» ni «Easy»

    @PLAN-1.3 @extrapolacion
    Escenario: La retención objetivo de FSRS se lee de la configuración
      Dado que se cambia en config/parametros.json «retencion_objetivo_fsrs» a 0,80
      Cuando la persona acierta H1
      Entonces el siguiente repaso de H1 es el que calcula FSRS con una retención del 80 %

    @PLAN-1.4 @evidencia-2.5 @evidencia-4
    Escenario: La confianza declarada no cambia el siguiente repaso
      Dado que la persona acierta H1 con una confianza del 100 %
      Y que otra vez, en el mismo estado, acierta H1 con una confianza del 0 %
      Entonces las dos veces el siguiente repaso de H1 cae en la misma fecha

  @PLAN-2 @evidencia-4 @evidencia-2.5 @extrapolacion
  Regla: SM-2 es la alternativa configurable a FSRS

    Antecedentes:
      Dado que el algoritmo de repetición espaciada configurado es SM-2

    @PLAN-2.1 @evidencia-4 @extrapolacion
    Escenario: Con SM-2 los primeros aciertos dan intervalos de 1 y 6 días
      Cuando la persona acierta H1 por primera vez el 2026-03-02
      Entonces el siguiente repaso de H1 es el 2026-03-03
      Y si lo acierta el 2026-03-03, el siguiente repaso es el 2026-03-09

    @PLAN-2.2 @evidencia-4 @extrapolacion
    Escenario: Con SM-2 un fallo reinicia el intervalo
      Dado que H1 tiene un intervalo de repaso de 6 días
      Cuando la persona falla H1 el 2026-03-09
      Entonces el siguiente repaso de H1 es el 2026-03-10

  @PLAN-3 @evidencia-2.2 @extrapolacion
  Regla: Los problemas se repasan cada «fracción × horizonte»

    Antecedentes:
      Dado que la fracción configurada para el horizonte de 1 semana es del 30 %
      Y que la fracción configurada para el horizonte de 1 año es del 7,5 % con un horizonte de 365 días

    @PLAN-3.1 @evidencia-2.2 @extrapolacion
    Esquema del escenario: El intervalo de un problema depende del horizonte elegido
      Dado que la persona ha elegido el horizonte de retención de <horizonte>
      Cuando la persona responde Q1 el 2026-02-02 a las 10:00
      Entonces el siguiente repaso de Q1 es el <siguiente>

      Ejemplos:
        | horizonte | siguiente              |
        | 1 semana  | 2026-02-04 a las 12:24 |
        | 1 año     | 2026-03-01 a las 19:00 |

    @PLAN-3.2 @evidencia-2.2 @extrapolacion
    Escenario: Solo se puede elegir entre los dos horizontes para los que el informe da fracción
      Cuando la persona elige su horizonte de retención
      Entonces las únicas opciones son «1 semana» y «1 año»

    @PLAN-3.3 @evidencia-2.2 @extrapolacion
    Escenario: Los problemas no los programa el algoritmo de repetición espaciada
      Dado que la persona ha elegido el horizonte de retención de 1 semana
      Cuando la persona responde Q1
      Entonces el siguiente repaso de Q1 no depende de FSRS ni de SM-2
      Y es el mismo tanto si acierta como si falla

  @PLAN-4 @extrapolacion
  Regla: Un ítem del borrador no se repasa
    Los repasos del día son una sesión como las demás: leen solo contenido/<dominio>.json (MATE-6). Lo
    que redacta la IA no llega a la persona sin pasar por su aprobación. Es decisión del autor: el
    informe no revisó la IA generativa como tutor (sección 6) y no trata de dónde sale el contenido.

    @PLAN-4.1 @extrapolacion
    Escenario: Un ítem del borrador no se presenta en los repasos del día
      Dado que contenido/borradores/ficticio.json tiene, sin aprobar, el objetivo O4, el ejemplo resuelto E9 de O1, la tarea T9 y el ítem I9 de O1
      Y que I9 es de tipo «problema», está marcado para el diagnóstico y es de una categoría intercalable
      Cuando la persona hace los repasos del día
      Entonces no se le presenta I9
