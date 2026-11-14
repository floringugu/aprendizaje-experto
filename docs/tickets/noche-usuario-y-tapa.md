---
fase: impl
area: PLAN
depende: [noche-lote]
toca: [scripts/arnes/despachador.ts, scripts/arnes/comun/despachador.ts, scripts/arnes/comun/bateria.ts, tests/arnes/, scripts/noche/, Makefile, CLAUDE.md, docs/plan.md]
estado: abierto
---
# La noche corre sola: con otro usuario de Linux, con la tapa cerrada y con un temporizador

**Qué:** paso 4 de la noche desatendida (plan §6, «Noche desatendida»): el Despachador deja de lanzarlo el dueño. Corre con otro usuario de Linux, con su clon y solo el token de `floringugu757-lgtm`; lo arranca un temporizador de systemd a las 00:30; el portátil no se suspende al cerrar la tapa mientras trabaja, y con batería deja de abrir tickets bajo el 30 % y para al 15 %. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** el dueño instala el usuario, el bloqueo de la tapa y el temporizador con un bloque `sh` (lleva `sudo`); una noche real arranca sola a las 00:30 con la tapa cerrada, trabaja, y a la mañana siguiente `make manana` muestra lo hecho; los umbrales de batería son una función pura con tests; con la tapa cerrada y sin Despachador, el portátil se suspende como siempre; el plan §6 y §11 dicen lo construido, y `make check` da verde.

**Leer primero:** `docs/plan.md` §6, «Noche desatendida», y §11, «Tu cuenta de administrador sigue en el llavero de `gh`» (búscalos con Grep); los tickets `noche-despachador` y `noche-lote`; `/home/florin/aprendizaje-experto/reports/humo/tapa.sh` y los resúmenes `tapa-*.txt` de esa carpeta (fuera de git).

## Decisiones ya tomadas (13-11-2026; no se reabren)

- La noche corre con otro usuario de Linux, con su propio clon y solo el token de `floringugu757-lgtm`: la cuenta de administrador del dueño no está en su llavero. Comparte la suscripción de Claude del dueño. Las sesiones van en `bypassPermissions`, con los hooks como guardia.
- Ventana de 00:30 a 07:00, sin ticket nuevo después de las 06:00, con un temporizador de systemd.
- Límite de uso: si el reinicio cae dentro de la ventana, espera; si no, termina la noche.
- Portátil (KDE Plasma, batería de 43,8 Wh): la tapa cerrada no suspende mientras el Despachador trabaja, con o sin cargador. Con batería no abre ticket bajo el 30 %, y al 15 % para la sesión y deja suspender. El bloqueo de la tapa necesita una regla o un servicio del sistema, que instala el dueño con `sudo`.
- `aprobado` sigue siendo una lista que solo escribe el dueño: el usuario de la noche la lee, no la escribe.

## Lo medido en la prueba de humo (14-11-2026)

- Con `LidAction=0` en PowerDevil, la tapa cerrada no suspende, ni con cargador ni con batería: 5 pasadas completas de mutación de unos 145 s en cada prueba, igual que con la tapa abierta.
- **Quitar el bloqueo con la tapa todavía cerrada suspende en el acto.** A las 13:57:37 el guion restauró `LidAction` al acabar, con la tapa cerrada, y el portátil estuvo suspendido 15 minutos, hasta que se abrió (diario: `The system will suspend now!`). El bloqueo tiene que durar toda la noche, no ponerse y quitarse por ticket, y al final de la ventana se quita a propósito: si la tapa sigue cerrada, que suspenda.
- PowerDevil tiene el bloqueo `handle-lid-switch` de logind y decide él: cambiar `HandleLidSwitch` en logind no basta. En la prueba se cambió con `kwriteconfig6 --file powerdevilrc --group <AC|Battery|LowBattery> --group SuspendAndShutdown --key LidAction 0` y `reparseConfiguration` por D-Bus, que es del usuario con sesión gráfica. Hay que resolver cómo lo hace el usuario de la noche, que no tiene sesión de Plasma; `systemd-inhibit --what=handle-lid-switch` no se ha probado con PowerDevil delante.
- Consumo con batería y tapa cerrada: 5,3 W en reposo; con la mutación en bucle, 4,10 Wh en 688 s, que son 21,5 W (la media de `power_now` da 17,9 W y se queda corta; máxima, 23,4 W). Del 100 % al 30 % hay unos 31 Wh: 1 h 25 min de mutación continua, que es el peor caso. Una ventana de 6 h 30 min no cabe en la batería ni en reposo (34 Wh): sin cargador, la noche acaba por el umbral.
- Temperatura del procesador con la tapa cerrada: 57 °C de media en carga; máxima de 89 °C con cargador y 64 °C con batería (límite, 100 °C); 45 °C en reposo.
- Dónde se lee: `/sys/class/power_supply/BAT0/` (`capacity`, `energy_now`, `power_now`, que vale 0 con cargador), `/sys/class/power_supply/ADP0/online`, `/proc/acpi/button/lid/LID0/state` y `/sys/class/hwmon/hwmon5/temp1_input`.
