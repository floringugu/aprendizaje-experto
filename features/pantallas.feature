# language: es
@PANT @extrapolacion
Característica: Servidor y pantallas
  La aplicación corre como un servidor en el PC y la persona entra desde el móvil por la wifi de
  casa (plan §17). Esta área es el servidor, el emparejamiento por QR, la persistencia del estado y
  los ajustes. Las pantallas de cada área (diagnóstico, práctica, dominio, material y plan) cumplen
  las reglas de esas áreas; cada área nueva añade las suyas. Todo lo de aquí es decisión del autor:
  el informe no dice nada de la interfaz ni de dónde se guarda el progreso.

  Antecedentes:
    Dado el dominio de prueba «ficticio» con los objetivos O1, O2 y O3, en ese orden

  @PANT-1 @extrapolacion
  Regla: Sin emparejar no se entra, y la clave del QR es de un solo uso
    El servidor no usa HTTPS: el emparejamiento solo evita que otro dispositivo de la wifi de casa
    vea o cambie el progreso (plan §17.5).

    Antecedentes:
      Dado que el servidor está en marcha y el PC muestra un QR con una clave de un solo uso

    @PANT-1.1 @extrapolacion
    Escenario: El QR lleva la dirección del servidor y la clave
      Cuando se lee el texto del QR
      Entonces el texto es la dirección del servidor con la clave de un solo uso

    @PANT-1.2 @extrapolacion
    Esquema del escenario: Un dispositivo sin emparejar no ve ninguna pantalla
      Cuando un dispositivo sin emparejar pide la pantalla «<pantalla>»
      Entonces el servidor no se la muestra
      Y la respuesta no contiene ningún dato del progreso

      Ejemplos:
        | pantalla           |
        | Hoy                |
        | Sesión de práctica |
        | Ajustes            |

    @PANT-1.3 @extrapolacion
    Escenario: La clave del QR empareja el dispositivo
      Cuando un móvil entra con la clave del QR
      Entonces el móvil queda emparejado
      Y puede pedir la pantalla «Hoy» sin repetir la clave

    @PANT-1.4 @extrapolacion
    Escenario: Una clave que no es la del QR no empareja
      Cuando un móvil entra con una clave que no es la del QR
      Entonces el móvil no queda emparejado
      Y no ve ninguna pantalla

    @PANT-1.5 @extrapolacion
    Escenario: La clave no se puede usar dos veces
      Dado que un móvil se emparejó con la clave del QR
      Cuando otro dispositivo entra con esa misma clave
      Entonces el otro dispositivo no queda emparejado
      Y no ve ninguna pantalla

  @PANT-2 @extrapolacion
  Regla: El progreso sobrevive a un reinicio del servidor
    Los intentos se guardan al declarar la confianza, que es cuando el intento está completo (CALI-1.1) y antes de que la persona vea el feedback.

    @PANT-2.1 @extrapolacion
    Escenario: Tras un reinicio siguen los intentos, el dominio, la fase y los repasos
      Dado que la persona respondió 20 ítems de O1 y declaró su confianza en cada uno
      Y que O1, O2 y O3 están dominados y la fase es «intermedio»
      Y que hay un repaso de I1 de O1 programado para el 2026-03-09
      Cuando se reinicia el servidor
      Y la persona abre la pantalla «Hoy»
      Entonces O1 tiene 20 intentos registrados
      Y O1, O2 y O3 siguen dominados y la fase sigue siendo «intermedio»
      Y el repaso de I1 de O1 sigue programado para el 2026-03-09

    @PANT-2.2 @extrapolacion
    Escenario: El intento se guarda al declarar la confianza, antes del feedback
      Dado que la persona responde I1 de O1 y declara su confianza
      Cuando se reinicia el servidor sin que la persona haya visto el feedback de I1
      Entonces O1 tiene 1 intento registrado
      Y es el intento de I1

    @PANT-2.3 @extrapolacion
    Escenario: Una respuesta sin confianza declarada no se guarda
      Dado que la persona responde I1 de O1 sin declarar su confianza
      Cuando se reinicia el servidor
      Entonces O1 no tiene ningún intento registrado
      Y I1 sigue sin intento

  @PANT-3 @extrapolacion
  Regla: Los ajustes tienen valores por defecto y se conservan
    El tema es automático (sigue al sistema) y la vibración está encendida por defecto (plan §17.1
    y §17.4).

    @PANT-3.1 @extrapolacion
    Escenario: Sin cambiar nada, el tema es automático y la vibración está encendida
      Dado que la persona nunca ha cambiado sus ajustes
      Cuando abre la pantalla «Ajustes»
      Entonces el tema es «automático»
      Y la vibración está encendida

    @PANT-3.2 @extrapolacion
    Escenario: El tema y la vibración se conservan tras un reinicio
      Dado que la persona cambia el tema a «oscuro» y apaga la vibración
      Cuando se reinicia el servidor
      Y la persona abre la pantalla «Ajustes»
      Entonces el tema es «oscuro»
      Y la vibración está apagada
