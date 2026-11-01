# PANT: Servidor y pantallas

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

El relevo de una conversación del área no va en este fichero: va en `reports/relevo.md` de su checkout, fuera de git (docs/plan.md §5, «Relevo»).

## Mecanismo

**Aprobado por el dueño el 31-10-2026:** las tres decisiones de §17.8 como se recomiendan, los adaptadores, la forma de probar las pantallas, la interfaz A y las partidas de deuda D21, D9 y D18. Las dos cosas por resolver de «Adaptadores» se deciden en el ticket `pant`.

### Cómo funciona por dentro

**Dónde viven los datos.** En una carpeta fuera de git, `$XDG_DATA_HOME/aprendizaje-experto` (por defecto `~/.local/share/aprendizaje-experto`), o la que diga la variable `DATOS`. Es la «carpeta de datos» del §0: `contenido/`, `material/` y, nuevos, `progreso.json`, `preferencias.json` y `dispositivos.json`. Todo pasa por el puerto `Ficheros`, con rutas relativas a esa carpeta. Está fuera del repositorio para que los worktrees compartan un solo progreso y para que apuntes y documentos con derechos de autor no lleguen a git.

**Las capas.**

- `src/aplicacion/` sigue sin conocer HTTP. Gana tres módulos y `Aplicacion` gana sus casos de uso, que son lo que comprueban los escenarios de `features/pantallas.feature`:
  - `emparejamiento.ts`: `abrirEmparejamiento()` genera una clave de 128 bits (`node:crypto`) y devuelve el texto del QR, `<dirección>/entrar?clave=<clave>`; solo hay una clave viva, y la nueva sustituye a la anterior. `emparejar({ clave })` la compara en tiempo constante, la gasta y devuelve un token de dispositivo de 256 bits (PANT-1.3 a PANT-1.5). `dispositivos.json` guarda solo el hash SHA-256 de cada token, así que un reinicio del servidor no obliga a emparejar otra vez y el fichero no sirve para entrar.
  - `preferencias.ts`: `consultarPreferencias()` y `cambiarPreferencias()`, con `tema` (`automatico`, `claro`, `oscuro`) y `vibracion`. No se llaman `consultarAjustes`, porque ese nombre ya es de MATE-8.5: dice solo si hay una sesión de Claude Code, y su escenario exige que no devuelva nada más. La pantalla Ajustes junta los dos. Sin fichero valen los valores por defecto (PANT-3.1). Un valor no válido en el fichero se ignora y se usa el valor por defecto de ese campo.
  - `persistencia.ts`: guarda y recarga el progreso (abajo).
  - `pantallas.ts`: `abrirPantalla({ dispositivo?, pantalla })` es la puerta. Sin dispositivo emparejado rechaza sin devolver nada del progreso (PANT-1.2). Con él, arma el modelo de la pantalla (datos, no HTML) con los casos de uso que ya existen: `consultarProgreso`, `consultarRepasos`, `presentarItem`, `consultarPreferencias`, `consultarAjustes`… El servidor usa el mismo predicado de emparejamiento antes de cada acción que no pasa por `abrirPantalla`.
- `src/infraestructura/` tiene los adaptadores de los puertos (siguiente apartado).
- `src/interfaz/` es el servidor. `servidor.ts` (la entrada de `knip`) es la raíz de composición: lee `DATOS`, `PUERTO` y, si hace falta, `DIRECCION`; construye las `Dependencias` con los adaptadores; llama a `abrirAplicacion` (abajo, «Persistencia»); y arranca `node:http`. `render/` son funciones puras de «modelo de pantalla → HTML»; `cliente/` es el código del navegador (decisión 2).

**El servidor.**

- Escucha en `::`, que en Linux admite IPv4 e IPv6 a la vez; una IPv4 llega como `::ffff:192.168.…` y el filtro la normaliza. El filtro rechaza lo que no venga de loopback, de una red privada (10/8, 172.16/12, 192.168/16, enlace local) o de `fc00::/7`. Es una función pura sobre la dirección remota. La dirección del QR sale de la primera IPv4 privada de `os.networkInterfaces()`; `DIRECCION` la sustituye si hay VPN o Docker de por medio.
- **Host permitido.** Cada petición tiene que traer en `Host` uno de estos: `localhost`, `127.0.0.1`, `[::1]`, la dirección del QR o la de `DIRECCION`, con el puerto del servidor. Si no, 421 sin datos. Esto para el *DNS rebinding*: una web maliciosa abierta en el navegador del PC que hace que su dominio apunte a 127.0.0.1 manda su propio `Host`, así que no puede leer `/emparejar` ni robar la clave.
- `GET /emparejar` solo responde desde loopback y con `Host` de loopback: es la página del PC con el QR (SVG) y una clave nueva en cada carga. Al arrancar, el servidor escribe en la terminal el enlace `http://localhost:<puerto>/emparejar`.
- `GET /entrar?clave=…` llama a `emparejar`. Si acepta, pone la cookie `dispositivo` (`HttpOnly`, `SameSite=Lax`, un año) y redirige a `/`; si no, 403 con «Esta clave no vale: abre otro QR en el PC». Es `Lax` y no `Strict` porque el enlace lo abre la cámara, desde otra app: Safari en iOS lo cuenta como navegación entre sitios y, con `Strict`, no mandaría la cookie en la redirección. El móvil vería un 403 con la clave ya gastada. Los `POST` ya los protege `Origin`.
- **Ficheros estáticos sin emparejar.** El CSS, las fuentes y el código del cliente se sirven a cualquiera que pase el filtro y el `Host`. No llevan nada del progreso, y la página del QR del PC, que nunca se empareja, los necesita.
- Las páginas y las acciones exigen dispositivo emparejado, y sin él dan el mismo 403, sin datos. Las cabeceras van con `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y una CSP `default-src 'self'`. Un `POST` exige además un `Origin` cuyo host, una vez quitado el esquema (`new URL(origin).host`), sea igual al `Host` de la petición. `Origin` lleva `http://` y `Host` no, así que compararlos tal cual nunca coincidiría.
- Selawik (§17.2) va en git, con su `LICENSE.txt`, en `src/interfaz/publico/fuentes/`, y se sirve desde allí.
- Sigue sin haber HTTPS (§17.5): la clave de un solo uso, el filtro de direcciones y el `Host` permitido son lo único que protege el progreso en la wifi de casa.

**Persistencia del progreso (PANT-2).** `progreso.json` lleva `{ version: 1, dominios: { <dominio>: { intentos, cambiosDominado, cambiosFase, pasosRetirados } } }`, con las fechas en ISO. Es el `registro` de `EstadoDominio` tal cual: la fase y los dominados ya salen de los cambios, así que no hay nada más que guardar. No se guardan las respuestas pendientes ni los ítems en curso, y por eso una respuesta sin confianza no sobrevive (PANT-2.3).

- **Cuándo se guarda.** El estado cambia en más sitios que `declararConfianza` y `terminarDiagnostico`: `evaluarFase` cambia la fase (`criterio-dominio.ts:105`), y `evaluarObjetivo` cambia el dominio y la fase (`:54`, `:63`). Una lista de los casos de uso que guardan se quedaría corta en cuanto llegue otro. Por eso `EstadoPersona` lleva un contador que suben solo los cambios que se guardan: `registrarIntento`, `cambiarDominado`, `cambiarFase` y `cerrarDiagnostico`. Responder o presentar un ítem no lo suben. Un envoltorio puesto en todos los casos de uso guarda el fichero si el contador ha cambiado al terminar. Así se guarda una vez por caso de uso, sea cual sea, y siempre antes de devolver el resultado; en `declararConfianza`, antes del feedback (PANT-2.2).
- **Una persona, un fichero.** `crearAplicacion` sigue siendo lo que es hoy: una persona nueva, en memoria, que no lee ni escribe `progreso.json`. Los escenarios de dos personas (CALI, DIAG-1.2) comparten el doble de `Ficheros` y no deben pisarse. Lo nuevo es `abrirAplicacion(dependencias)`: la misma aplicación, cargada desde `progreso.json` y guardándolo. La usan el servidor y, en los escenarios, la persona 0. Las demás siguen con `crearAplicacion`. Un «reinicio del servidor» es otro `abrirAplicacion` sobre los mismos `Ficheros`.
- **Cómo se escribe.** Cada guardado reescribe el fichero entero: unos cientos de bytes por intento, bien por debajo de un megabyte tras miles. El adaptador de `Ficheros` escribe a un temporal y lo renombra, así que un corte a mitad no deja medio fichero.
- **Si el fichero está mal.** Si existe y no cumple el formato, `abrirAplicacion` rechaza y el servidor no arranca: dice qué fichero revisar y nunca lo pisa con un progreso vacío.

Cuando llegue `PLAN`, sus tarjetas FSRS (`tarjeta: unknown`) entran en el mismo fichero, como JSON con las fechas en texto; que `ts-fsrs` las reconstruya así se comprueba al implementar PANT-2.1 (el repaso de I1 para el 2026-03-09).

### Decisiones que pide §17.8

1. **QR. Recomiendo la dependencia `uqr` 0.1.3, con la versión fijada exacta.** Licencia MIT, sin dependencias, 27,5 kB sin minificar y 7,8 kB con gzip, ESM con tipos, de Anthony Fu y el equipo de unjs, última versión de abril de 2026. Se usa solo en `src/interfaz/qr.ts`, que da la matriz de módulos: la página del PC la dibuja como SVG. Está en `dependencies` y no en `devDependencies`, porque `src/` no puede usar estas últimas. Sin ella, el QR sería un codificador propio (byte, versiones 1 a 6, Reed-Solomon, máscaras): unas 200 líneas que además no podríamos comprobar, porque en el repositorio no hay un decodificador de QR.
   - *Descartado, código propio:* lo de arriba.
   - *Descartados, `qrcode` y `qrcode-generator`:* `qrcode` arrastra `pngjs`, `yargs` y `dijkstrajs`, y `qrcode-generator` pesa 556 kB sin minificar. Para un QR de unos 80 caracteres, ninguno da más.
2. **Código del navegador. Recomiendo TypeScript en `src/interfaz/cliente/`, que el servidor sirve quitándole los tipos con `module.stripTypeScriptTypes` de Node.** Es el mismo lenguaje y el mismo lint que el resto, sin paso de compilación, y `erasableSyntaxOnly` ya garantiza que los tipos se pueden quitar sin más. Los `import './x.ts'` valen tal cual en el navegador. Para que también lo miren `knip`, las reglas de capas y Stryker, hay que tocar:
   - `src/interfaz/cliente/tsconfig.json` propio, con la biblioteca `dom`, y `tsconfig.json` lo excluye; el script `tipos` de `package.json` pasa los dos;
   - `knip.json`: `src/interfaz/cliente/principal.ts` como entrada, porque solo la nombra el HTML;
   - `.dependency-cruiser.cjs`: la regla `cliente-aislado`, que deja al cliente importar solo del cliente y no a `node:` ni a otras capas;
   - `eslint.config.js`: hoy prohíbe los números sueltos en `src/`, salvo en `src/dominio/unidades.ts`, y el cliente no puede importar el dominio. Las constantes de §17.3 y §17.4 (10 px, 0,55, 100 ms, 0,998, 0,8, 0,3 s, 0,35 s, 15 ms) van en `src/interfaz/cliente/constantes.ts`, con la misma excepción que `unidades.ts`. Salen del plan y no del informe, así que no van a `config/parametros.json`, que además el navegador no puede leer;
   - `stryker.config.json`: hoy solo muta `src/dominio` y `src/aplicacion`. Se añade `src/interfaz`, salvo `servidor.ts`, que solo compone, y `principal.ts`, que solo une el DOM;
   - lo que lleva lógica (la proyección del gesto de la hoja, §17.3; la elección de tema) va en funciones puras sin DOM, que prueba Vitest; el pegamento con el DOM es mínimo.
   - *Riesgo:* `stripTypeScriptTypes` es experimental en Node 26.9 y saca un aviso al arrancar. Una prueba del servidor pide el módulo y comprueba que sale JavaScript, así que un cambio de la API la rompería en `make check`.
   - *Descartado, JavaScript con JSDoc:* otro lenguaje, con `.js` que ESLint y `knip` hoy no miran, y tipos más flojos.
   - *Descartado, compilar con `tsc` o `esbuild`:* un paso de construcción y una carpeta `dist/` que no existen hoy.
3. **Ajustes. Recomiendo `preferencias.json` en la carpeta de datos, por el puerto `Ficheros`.** Sirve a la persona y no al dispositivo, y es lo que pide PANT-3.2: el servidor conserva el tema y la vibración. Las páginas se sirven con `<html data-tema="…">`, y en `automatico` el CSS sigue a `prefers-color-scheme`. Aquí irán también los ajustes de las áreas que vengan.
   - *Descartado, `localStorage` del móvil:* se pierde al borrar los datos del navegador o cambiar de móvil, y el escenario habla del reinicio del servidor.
   - *Descartado, dentro de `progreso.json`:* un ajuste no es progreso, y un progreso que no carga no debe arrastrar al tema.

### Adaptadores (`src/infraestructura/`)

Los puertos de MATE (decisión 4 de su «Mecanismo») que dejó para esta área, más el reloj:

- `ficheros-en-disco.ts`: `Ficheros` sobre la carpeta de datos. Resuelve cada ruta y **rechaza las que salgan de la carpeta** (`..`, absolutas, enlaces simbólicos), crea las carpetas que falten y escribe a un temporal y renombra. Es una de las dos defensas pendientes de `mate-mesa-y-dominio`.
- `reloj-del-sistema.ts` y `temporizador-del-sistema.ts` (`setTimeout`).
- `libreoffice-en-pc.ts`: `soffice --headless --convert-to pdf`; `instalado()` lanza `soffice --version`.
- `web-con-fetch.ts`: solo `http` y `https`, con plazo, tamaño máximo y redirecciones limitadas.
- `claude-code-en-pc.ts`: `ClaudeCode` con `claude auth login` y `claude auth status --json`, y el `RedactorIa` con `claude -p` en las condiciones de MATE (solo `Read`, `--json-schema`, `--no-session-persistence`).
- Los parámetros salen de `config/parametros.json`, que se lee en cada llamada.
- **La otra defensa:** un solo lector de lo aprobado. `Dependencias` pierde `leerContenido` y el contenido se lee con `Ficheros`, como ya hace la revisión del material.

Quedan dos cosas por resolver en el ticket que lo implemente:

- **Qué dominios hay.** `Hoy` necesita listarlos y `Ficheros` no sabe listar carpetas. Propongo añadir `listar(carpeta)` al puerto.
- **Qué devuelve `leerIa` sin sesión de Claude Code.** No tengo propuesta cerrada. MATE-2.4 solo rechaza con `sin_ia` cuando `leerIa()` da `undefined` (`docs/areas/MATE.md`, punto 4), y `leerIa` es síncrono mientras que `claudeCode.estado()` no lo es. Si devolviera siempre el redactor de Claude Code, nunca saldría el aviso de MATE-2.4, y la falta de sesión llegaría como un error de `redactar` que hoy nadie recoge. Las salidas que veo son guardar en memoria si hay sesión (al arrancar y tras cada inicio de sesión) para que `leerIa` lo lea sin esperar, o que `redactarBorrador` traduzca el fallo de `redactar` a un rechazo. Se decide en `pant`, leyendo antes `redactarBorrador`.

**Quién toca qué.**

- **`pant-pasos`** (fase aceptacion). Cambiar `Dependencias` (los campos nuevos, `listar`, quitar `leerContenido`) y añadir los casos de uso nuevos de `Aplicacion` obliga a tocar `tests/aceptacion/soporte/mundo.ts`, que es de esa fase. Lo hace `pant-pasos`, como hizo MATE: añade las firmas con `sinImplementar` y adapta todo lo que usa `leerContenido`. A su `toca` hay que añadirle:
  - `src/aplicacion/dependencias.ts`, `src/aplicacion/aplicacion.ts` y `src/aplicacion/estado.ts` (`enDominio` lee `leerContenido`);
  - `tests/unidad/ver-fuente.test.ts` y `tests/unidad/formato-contenido-piezas.ts`, que construyen `Dependencias` con `leerContenido`;
  - `tests/aceptacion/soporte/contenido.ts`, que ya está en `tests/aceptacion/soporte/`.
- **`pant`** (fase impl). A su `toca` hay que añadirle:
  - `src/` y `tests/unidad/` enteros: los módulos nuevos de `src/aplicacion/`, `src/infraestructura/` y los ficheros que tocan D21, D9 y D18 (también `src/dominio/`);
  - la configuración de la decisión 2: `tsconfig.json`, `knip.json`, `.dependency-cruiser.cjs`, `eslint.config.js` y `stryker.config.json`.

  Ya tiene `package.json` y `package-lock.json` (por `uqr`), así que su PR espera al visto bueno del dueño.

Si el Mecanismo se aprueba, los dos `toca` se cambian en el mismo PR que este fichero.

### Cómo se prueban las pantallas

1. **Escenarios, en la aplicación.** PANT-1 a PANT-3 pasan por los casos de uso nuevos, con los pasos compartidos de las demás áreas (`Dado el dominio de prueba…`, responder y declarar confianza…). Los escenarios `@PANT` marcan el `Mundo` como `persistente` (un `Before` de `pasos/pantallas.ts`), y entonces la persona 0 se crea con `abrirAplicacion`; un «reinicio del servidor» (`Mundo.reiniciarServidor`) es otro `abrirAplicacion` sobre el mismo doble de `Ficheros`, y los pasos de PANT-2 que lo piden no abren la aplicación hasta que hace falta. Las demás personas, y los escenarios de otras áreas, siguen con `crearAplicacion`, en memoria, así que no comparten progreso. El móvil que se empareja antes del reinicio guarda su token en `EscenarioPantallas` (`soporte/escenario-pantallas.ts`) y lo presenta después, como lo haría su cookie. `PeticionPantalla.dispositivo` es opcional: una petición sin él es la de un dispositivo sin emparejar (PANT-1). Los Dados de PANT-2 crean con `asegurarItem` y `asegurarItemsPorObjetivo` los ítems que el contenido de prueba no trae. El repaso de I1 de PANT-2.1 lo da el planificador (PLAN), todavía sin implementar: hasta entonces ese escenario falla en ese paso, y no en el reinicio. Así se reutilizan los pasos de las otras áreas y el reloj sigue siendo el de prueba.
2. **Unitarias, en `tests/unidad/interfaz/`, sin dependencias nuevas:**
   - las funciones `render/`, que son puras: el texto de cada pantalla, que `Sesión de práctica` no pone la respuesta antes de responder (§17.7) y que ninguna lleva elogios, plazos ni fechas de fin;
   - el servidor real de `node:http` en un puerto libre, con `fetch`: cookie `Lax`, 303, 403 sin datos, `/emparejar` solo desde loopback, el filtro de direcciones (también una IPv4 que llega como `::ffff:…`), el 421 con un `Host` que no está permitido, `Origin`, cabeceras, ficheros estáticos sin emparejar y el módulo del cliente sin tipos;
   - la accesibilidad que se puede medir (§17.1): el contraste de las variables CSS de cada tema calculado con la fórmula de WCAG (4,5:1), la zona táctil de 44 px y la presencia de las consultas `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast`;
   - la lógica pura del cliente (el gesto de la hoja con sus constantes de §17.3).
3. **Los adaptadores**, con carpetas temporales y, para `soffice` y `claude`, un ejecutable de pega en el `PATH`. Al cerrar el área se prueban además a mano con el LibreOffice y el Claude Code reales.
4. **A mano, al cerrar el área:** las pantallas Hoy, Sesión de práctica y Ajustes en claro y en oscuro, con el navegador de Playwright, comparadas con la maqueta aprobada del §17. No se automatiza: pediría jsdom o Playwright como dependencia nueva.
5. `revisor-evidencia` revisa los textos de la interfaz (§17.7).

### Dos interfaces para el módulo central

La puerta entre el servidor y la aplicación:

- **A. La puerta está en la aplicación (la elegida).** `Aplicacion` gana `abrirEmparejamiento`, `emparejar`, `abrirPantalla`, `consultarPreferencias` y `cambiarPreferencias`, y aparece `abrirAplicacion`; y el servidor se queda en traducir HTTP a esas llamadas y un modelo de pantalla a HTML. *Pros:* los escenarios llegan a todo (solo pueden importar `src/aplicacion`) y reutilizan los pasos de las demás áreas; el reloj y los ficheros se controlan; la seguridad se prueba sin red. *Contras:* el emparejamiento, que parece cosa del transporte, vive en la capa de aplicación, y el predicado se usa en dos sitios (la puerta y las acciones del servidor).
- **B. La puerta está en el servidor.** El emparejamiento, los ajustes y el guardado viven en `src/interfaz/` como un middleware, y la aplicación solo gana un puerto para volcar y cargar el estado. Los escenarios arrancarían `servidor.ts` como un proceso aparte, con una carpeta de datos temporal, y hablarían HTTP. *Pros:* el reinicio es de verdad, un proceso muerto y otro nuevo, y todo se prueba por la misma entrada que usa el móvil. *Contras:* los pasos no pueden importar `src/interfaz` (regla `aceptacion-contra-la-capa-de-aplicacion`) ni reutilizar los pasos de las otras áreas, que hablan con `Aplicacion`; el reloj de prueba no cruza el proceso, así que «un repaso programado para el 2026-03-09» no se podría montar; y cada escenario pagaría el arranque de un servidor.

### Partidas de deuda que se pagan con PANT

El dueño eligió las tres propuestas el 31-10-2026. Se pagan en el ticket `pant`, antes del área y en un cambio que solo refactoriza. Las tres caen dentro de `src/` y `tests/unidad/`, así que no piden tocar los pasos de aceptación:

- **D21** (ternario de los campos opcionales, repetido cinco veces): la recarga de `progreso.json` y de `preferencias.json` lo escribiría otras tantas veces con `exactOptionalPropertyTypes`. Va primero.
- **D9** (la regla del diagnóstico comprobada en cada caso de uso, y frases de rechazo en `estado.ts`): voy a tocar `estado.ts` para la persistencia, y `abrirPantalla` es otro sitio que tendría que acordarse de la regla. Ojo: D9 dice que «va con D8»; aquí se paga sin D8, y la función devuelve el motivo en español como hoy.
- **D18** (`acciones` como `string`): los modelos de pantalla las muestran como botones, y `render/` se apoya en un tipo.

No propongo D5, D15 ni D4: cambian la firma de algo que usa `mundo.ts` o los pasos, que en la fase impl no se tocan. Tampoco D8 ni D22 (grandes, y las pantallas funcionan con los textos de hoy). Que no se paguen con PANT no las borra: siguen en `docs/deuda-diseno.md` para otra área. Si prefieres otras, o ninguna, hace falta una línea que diga por qué.

## Interfaces descartadas y por qué

- **Elegida:** la puerta en la aplicación (A de «Dos interfaces»), con el emparejamiento, los ajustes y el guardado como casos de uso.
- **Descartada:** la puerta en el servidor (B). Motivo: los escenarios no pueden importar `src/interfaz`, no reutilizan los pasos de las otras áreas y no controlan el reloj. Se completa al cerrar el área con lo que enseñe la implementación.

## Deuda pagada

Se completa al cerrar el área.

## Mutación

Se completa al cerrar el área.

## Bloqueos de los hooks

Se completa al cerrar el área.
