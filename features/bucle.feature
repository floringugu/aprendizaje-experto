# language: es
@BUCL @evidencia-4 @evidencia-2.5
Característica: Bucle semanal de retroalimentación
  Cada semana: medir con pruebas, no con autoevaluación; comparar la confianza con el acierto;
  ajustar la ayuda; reprogramar los repasos; y revisar el plan con intenciones de implementación y
  proteger el sueño (sección 4). El entrenamiento en aprendizaje autorregulado está bien establecido
  (sección 2.5), pero la periodicidad semanal es extrapolación del autor.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que la periodicidad del bucle configurada es de 7 días

  @BUCL-1 @evidencia-4 @extrapolacion
  Regla: El bucle se ejecuta en la primera sesión tras la periodicidad

    @BUCL-1.1 @evidencia-4 @extrapolacion
    Esquema del escenario: El bucle se ejecuta cuando han pasado los días de la periodicidad
      Dado que el último bucle semanal se ejecutó el 2026-03-02
      Cuando la persona abre una sesión el <fecha>
      Entonces el bucle semanal <resultado>

      Ejemplos:
        | fecha      | resultado          |
        | 2026-03-08 | no se ejecuta      |
        | 2026-03-09 | se ejecuta una vez |

    @BUCL-1.2 @extrapolacion
    Escenario: Los días sin uso no acumulan bucles atrasados
      Dado que el último bucle semanal se ejecutó el 2026-03-02
      Cuando la persona abre una sesión el 2026-04-01
      Entonces se ejecuta un solo bucle semanal
      Y el siguiente bucle no se ejecuta antes del 2026-04-08

    @BUCL-1.3 @extrapolacion
    Escenario: La cuenta empieza al terminar el diagnóstico
      Dado que la persona terminó el diagnóstico el 2026-03-02 y nunca ha ejecutado el bucle
      Cuando la persona abre una sesión el 2026-03-09
      Entonces el bucle semanal se ejecuta

    @BUCL-1.4 @extrapolacion
    Escenario: La periodicidad se lee de la configuración
      Dado que se cambia en config/parametros.json «periodicidad_bucle_dias» a 3
      Y que el último bucle semanal se ejecutó el 2026-03-02
      Cuando la persona abre una sesión el 2026-03-05
      Entonces el bucle semanal se ejecuta una vez

  @BUCL-2 @evidencia-4
  Regla: El bucle sigue los cinco pasos en orden

    @BUCL-2.1 @evidencia-4
    Escenario: Los cinco pasos se presentan en el orden del informe
      Cuando se ejecuta el bucle semanal
      Entonces la persona ve, en este orden, los pasos:
        | paso | contenido                                                              |
        | 1    | resultados de las pruebas de la semana: acierto sin ayuda por objetivo |
        | 2    | calibración: confianza media frente a acierto                          |
        | 3    | ajuste de la ayuda de cada objetivo                                    |
        | 4    | repasos reprogramados hasta el siguiente bucle                         |
        | 5    | revisión del plan: intención de implementación y sueño                 |

    @BUCL-2.2 @evidencia-4 @evidencia-2.5
    Escenario: El primer paso mide con pruebas, no con autoevaluación
      Dado que en la última semana la persona acertó 18 de 20 intentos sin ayuda de O1
      Cuando se ejecuta el bucle semanal
      Entonces el paso 1 muestra un acierto sin ayuda del 90 % en O1
      Y no le pregunta a la persona cómo cree que va

    @BUCL-2.3 @evidencia-4
    Escenario: El cuarto paso reprograma los repasos con el algoritmo configurado
      Dado que el algoritmo de repetición espaciada configurado es FSRS
      Cuando se ejecuta el bucle semanal
      Entonces las fechas de repaso pendientes se recalculan con FSRS y la configuración actual
      Y el paso 4 muestra cuántos repasos tocan en los próximos 7 días, los de la periodicidad configurada

    @BUCL-2.4 @evidencia-4 @extrapolacion
    Escenario: El paso 1 no cuenta el intento de exploración
      Dado que la persona está en la fase «intermedio» con O1, O2 y O3 dominados
      Y que O4 se aprobó en la revisión del material, sin dominarlo ni practicarlo, con problemas
      Y que en la última semana la persona falló el problema de exploración de O4
      Y que después acertó 3 de 4 intentos sin ayuda de O4
      Cuando se ejecuta el bucle semanal
      Entonces el paso 1 muestra un acierto sin ayuda del 75 % en O4

    @BUCL-2.5 @evidencia-2.5 @extrapolacion
    Escenario: Las pantallas de calibración no salen fuera del bucle semanal
      Dado que la persona tiene datos para la silueta de O1 (CALI-4) y las tarjetas de O1 por enseñar (CALI-5)
      Cuando abre una sesión de práctica antes de que toque el bucle semanal
      Entonces no ve ninguna silueta ni ninguna tarjeta de calibración

    @BUCL-2.6 @evidencia-2.5 @extrapolacion
    Escenario: Dentro del bucle, el paso 2 muestra una sola pantalla de calibración
      Dado que la persona tiene datos para la silueta de O1 (CALI-4) y las tarjetas de O1 por enseñar (CALI-5)
      Cuando se ejecuta el bucle semanal
      Entonces el paso 2 muestra la confianza media, el acierto y la diferencia (CALI-2.1)
      Y las tarjetas de O1 y ninguna silueta (CALI-6.1)
      Y los pasos 1, 3, 4 y 5 no muestran ninguna silueta ni ninguna tarjeta

  @BUCL-3 @evidencia-4 @evidencia-2.4 @evidencia-2.1 @extrapolacion
  Regla: El quinto paso revisa el plan con intenciones de implementación y protege el sueño
    Las intenciones de implementación están «bien establecidas en conducta general» (tabla de la
    sección 3; Gollwitzer y Sheeran, 2006, marcado con (†) en la bibliografía). Hacerlas obligatorias
    para terminar el bucle es decisión del autor.

    @BUCL-3.1 @evidencia-2.4 @extrapolacion
    Escenario: La persona escribe una intención de implementación
      Dado que la persona no tiene ninguna intención de implementación
      Cuando llega al paso 5 del bucle semanal
      Entonces se le pide una intención con la forma «si X, entonces Y»
      Y no puede terminar el bucle sin escribirla

    @BUCL-3.2 @evidencia-2.4
    Escenario: La persona puede confirmar la intención de la semana anterior
      Dado que la intención de la semana anterior es «si son las 7:00 y estoy en la mesa, empiezo con 10 preguntas de recuperación»
      Cuando llega al paso 5 del bucle semanal
      Entonces puede confirmarla sin cambios o escribir otra

    @BUCL-3.3 @evidencia-2.1
    Escenario: El quinto paso recuerda proteger el sueño
      Cuando llega al paso 5 del bucle semanal
      Entonces ve el recordatorio de no recortar sueño para estudiar

    @BUCL-3.4 @evidencia-2.4 @extrapolacion
    Escenario: La intención de implementación no afecta al progreso
      Dado que la persona cambia su intención de implementación en el paso 5
      Cuando termina el bucle semanal
      Entonces sus objetivos dominados, su fase, sus pasos retirados y sus fechas de repaso no cambian por ello
