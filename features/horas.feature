# language: es
@HORA @evidencia-4 @evidencia-2.6
Característica: Registro de horas de práctica focalizada
  El informe propone registrar las horas de práctica focalizada, no las horas totales (sección 4,
  instrumentos). La regla de las 10.000 horas es falsa como umbral (secciones 2.2 y 2.6; mito 2 de la
  sección 5): las horas se registran, pero no son una meta ni una medida del progreso.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que hoy es 2026-03-10

  @HORA-1 @evidencia-4 @extrapolacion
  Regla: La persona registra a mano sus minutos de práctica focalizada

    @HORA-1.1 @evidencia-4
    Escenario: Se registra una sesión de práctica focalizada hecha fuera de la aplicación
      Cuando la persona registra 45 minutos de práctica focalizada el 2026-03-09
      Entonces el registro queda guardado con la fecha 2026-03-09 y 45 minutos
      Y queda registrado en horas.csv

    @HORA-1.2 @extrapolacion
    Esquema del escenario: Solo se aceptan minutos y fechas posibles
      Cuando la persona registra <minutos> minutos de práctica focalizada el <fecha>
      Entonces el registro <resultado>

      Ejemplos:
        | minutos | fecha      | resultado  |
        | 1       | 2026-03-10 | se guarda  |
        | 1440    | 2026-03-10 | se guarda  |
        | 0       | 2026-03-10 | se rechaza |
        | -5      | 2026-03-10 | se rechaza |
        | 1441    | 2026-03-10 | se rechaza |
        | 30      | 2026-03-11 | se rechaza |

    @HORA-1.3 @evidencia-4
    Escenario: La aplicación no cuenta sola el tiempo de uso como horas de práctica
      Dado que la persona ha tenido la aplicación abierta 3 horas sin registrar minutos
      Cuando consulta su registro de horas
      Entonces el registro no tiene ninguna entrada

  @HORA-2 @evidencia-2.6 @evidencia-5
  Regla: Las horas no son una meta

    @HORA-2.1 @evidencia-2.6 @evidencia-5
    Escenario: La aplicación no propone metas de horas
      Cuando la persona consulta su registro de horas
      Entonces ve sus registros con fecha y minutos
      Pero no hay ninguna opción para fijar una meta de horas
      Y no ve cuántas horas le faltan para ninguna cifra ni ninguna mención a las 10.000 horas

  @HORA-3 @evidencia-2.2 @evidencia-2.6 @evidencia-5
  Regla: Las horas no miden el progreso

    @HORA-3.1 @evidencia-2.2 @evidencia-2.6 @evidencia-5
    Esquema del escenario: Registrar más horas no cambia el progreso
      Dado que la persona está en la fase «novato» con O1 sin dominar
      Cuando registra <horas> horas de práctica focalizada
      Entonces O1 sigue sin dominar
      Y la fase sigue siendo «novato»
      Y los pasos retirados de O1 no cambian

      Ejemplos:
        | horas |
        | 1     |
        | 10000 |
