# language: es
@AYUD @evidencia-2.3 @evidencia-3
Característica: Ayuda adaptativa con retirada progresiva
  Más guía a quien sabe poco y menos a quien sabe mucho (efecto de inversión de la pericia,
  Tetzlaff et al., 2025, sección 2.3). La ayuda son los ejemplos resueltos de cada objetivo: se
  alternan ejemplo y problema y se retiran pasos a medida que sube el rendimiento (tabla de la
  sección 3). El bucle semanal retira ayuda si el acierto sin ayuda es alto y la reintroduce si cae
  (sección 4). El ritmo de un paso por semana y el orden en que se retiran los pasos (primero los
  últimos) son extrapolación del autor.

  El acierto sin ayuda que decide el ajuste es el de MAST: estudiar un ejemplo antes de un problema
  no le quita a ese problema la condición de «sin ayuda», porque mientras responde no ve el ejemplo.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden
    Y que O1 tiene el ejemplo resuelto E1 con los pasos P1, P2 y P3

  @AYUD-1 @evidencia-3 @evidencia-2.2 @extrapolacion
  Regla: Mientras hay ayuda, se alternan ejemplo y problema

    @AYUD-1.1 @evidencia-3 @evidencia-2.2
    Escenario: Una sesión con ayuda completa alterna ejemplo resuelto y problema
      Dado que O1 tiene la ayuda completa
      Cuando la persona practica O1
      Entonces la sesión alterna el ejemplo resuelto E1 con sus 3 pasos y un problema de O1
      Y mientras responde un problema no ve el ejemplo resuelto

    @AYUD-1.2 @evidencia-3 @extrapolacion
    Escenario: Un ejemplo con pasos retirados muestra solo los primeros
      Dado que O1 tiene 1 paso retirado
      Cuando la persona practica O1
      Entonces el ejemplo resuelto E1 muestra los pasos P1 y P2
      Y no muestra el paso P3

    @AYUD-1.3 @evidencia-3 @evidencia-2.3 @extrapolacion
    Escenario: Sin pasos que mostrar, el objetivo se practica sin ejemplos
      Dado que O1 tiene 3 pasos retirados
      Cuando la persona practica O1
      Entonces la sesión solo presenta problemas de O1
      Y no muestra ningún ejemplo resuelto

  @AYUD-2 @evidencia-4 @evidencia-2.3 @extrapolacion
  Regla: La ayuda se ajusta una vez por semana según el acierto sin ayuda

    Antecedentes:
      Dado que el umbral de retirada de ayuda configurado es del 85 %
      Y que cada ajuste configurado retira o devuelve 1 paso

    @AYUD-2.1 @evidencia-4 @extrapolacion
    Esquema del escenario: El bucle semanal retira o devuelve un paso
      Dado que O1 tiene <antes> pasos retirados
      Y que en la última semana la persona acertó <aciertos> de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene <después> pasos retirados
      Y el cambio queda registrado en cambios_ayuda.csv

      Ejemplos:
        | antes | aciertos | después |
        | 0     | 20       | 1       |
        | 1     | 17       | 2       |
        | 2     | 16       | 1       |
        | 1     | 10       | 0       |

    @AYUD-2.2 @extrapolacion
    Escenario: La ayuda completa no puede crecer más
      Dado que O1 tiene 0 pasos retirados
      Y que en la última semana la persona acertó 5 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 0 pasos retirados

    @AYUD-2.3 @extrapolacion
    Escenario: Retirada toda la ayuda, un acierto alto no retira más
      Dado que O1 tiene 3 pasos retirados
      Y que en la última semana la persona acertó 20 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 3 pasos retirados

    @AYUD-2.4 @evidencia-4 @extrapolacion
    Escenario: Una caída del acierto reintroduce la ayuda retirada
      Dado que O1 tiene 3 pasos retirados
      Y que en la última semana la persona acertó 12 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene 2 pasos retirados
      Y la siguiente sesión de O1 vuelve a alternar el ejemplo resuelto E1, con el paso P1, y problemas

    @AYUD-2.5 @extrapolacion
    Escenario: Sin problemas respondidos en la semana, la ayuda no cambia
      Dado que O1 tiene 1 paso retirado
      Y que en la última semana la persona no respondió ningún problema de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 sigue con 1 paso retirado
      Y no se registra ningún cambio en cambios_ayuda.csv

    @AYUD-2.6 @extrapolacion
    Escenario: La ayuda no cambia fuera del bucle semanal
      Dado que O1 tiene 1 paso retirado
      Cuando la persona acierta 20 problemas seguidos de O1 a mitad de semana
      Entonces O1 sigue con 1 paso retirado hasta el siguiente bucle semanal

    @AYUD-2.7 @extrapolacion
    Esquema del escenario: El umbral y el tamaño del ajuste se leen de la configuración
      Dado que se cambia en config/parametros.json «umbral_retirada_ayuda» a <umbral> y «pasos_retirados_por_ajuste» a <pasos>
      Y que O1 tiene 1 paso retirado
      Y que en la última semana la persona acertó 15 de 20 problemas de O1
      Cuando se ejecuta el bucle semanal
      Entonces O1 tiene <después> pasos retirados

      Ejemplos:
        | umbral | pasos | después |
        | 0,75   | 1     | 2       |
        | 0,75   | 2     | 3       |
        | 0,80   | 1     | 0       |

  @AYUD-3 @evidencia-2.2 @evidencia-4 @extrapolacion
  Regla: Por defecto no se piden autoexplicaciones con los ejemplos resueltos
    Barbieri et al. (2023) observaron la interacción negativa en matemáticas. Aplicarla a otros
    dominios es extrapolación (sección 4: «la aplicación a dominios no estudiados»).

    @AYUD-3.1 @evidencia-2.2 @evidencia-4 @extrapolacion
    Escenario: Estudiar un ejemplo resuelto no pide autoexplicación
      Dado que la combinación de ejemplos resueltos y autoexplicación configurada está desactivada
      Cuando la persona estudia el ejemplo resuelto E1
      Entonces la aplicación no le pide que explique ningún paso
      Y no le muestra ninguna instrucción de autoexplicación
