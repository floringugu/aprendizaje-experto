# Plan del proyecto: aplicación de aprendizaje de novato a experto

Estado: **etapa 1 terminada.** Todas las decisiones del §14 y las preguntas del §15 están aprobadas (18-10-2026).

Este documento es el plan de ingeniería. No es una fuente pedagógica:

- **Pedagogía.** Todo lo pedagógico sale de `docs/investigacion.md` (en adelante, «el informe»), y solo de ahí.
- **Ingeniería.** `docs/arnes.md` y `docs/arnes-verificacion.md` orientan cómo se construye el proyecto, pero nunca respaldan una decisión pedagógica.

**Está protegido.** Solo lo cambia el dueño, a mano, para que el plan siga siendo el contrato y no se reescriba para encajar con el código. Cuando el dueño aprueba algo nuevo, recibe el texto, lo pega aquí y ejecuta `make sumas`.

---

## 0. Decisiones aprobadas

El dueño aprobó el 18-10-2026 todas las decisiones del §14 y todas las propuestas del §15, tal como se proponían. Esta tabla resume las que afectan a la especificación; el detalle de las técnicas está en el §14.

| Decisión | Qué se aprueba | Dónde se aplica |
|---|---|---|
| Prefijos de los IDs (§14.6) | `DIAG`, `PLAN`, `RECU`, `MAST`, `AYUD`, `INTE`, `CALI`, `TARE`, `BUCL`, `HORA` e `INST`. | `features/` (etapa 2) |
| Umbral para retirar la ayuda (§14.11) | Igual al umbral de dominio (0,85), marcado como extrapolación. | Ya está en `config/parametros.json` |
| Percentil de experto (§14.12) | <ul><li>La aplicación no calcula percentiles.</li><li>Registra con su fecha el resultado de un evaluador externo.</li><li>Exige 2 evaluaciones por encima del mínimo (80), separadas al menos 3 meses.</li></ul> | `TARE` (etapa 2) |
| Retención objetivo de FSRS (§15.1) | La que trae la librería por defecto. Se guarda como parámetro nuevo, con `extrapolacion: true` y la nota «el informe no lo trata». | `config/parametros.json` (etapa 2) |
| Respaldo del criterio de dominio (§15.3) | <ul><li>**Mecanismo:** «no avanzar sin dominar» se etiqueta `@evidencia-2.3`. Lo respalda Kulik et al. (1990) a través de la fuente [49], que es el PDF del propio estudio; el (†) solo indica que su DOI no se verificó.</li><li>**Umbral:** el 85 % se etiqueta `@extrapolacion`.</li></ul> | `MAST` (etapa 2) |
| Estimación del tiempo en el diagnóstico (§15.4) | <ul><li>El diagnóstico no muestra ningún plazo.</li><li>Un escenario negativo lo comprueba.</li></ul> | `DIAG` (etapa 2) |
| Intervalo de repaso (§15.5) | <ul><li>Tabla por horizonte con los datos de Cepeda 2008 (§2.2): 20–40 % para 1 semana y 5–10 % para 1 año.</li><li>Sustituye al rango fijo del 10–20 %.</li><li>Dónde se usa se concreta al escribir `PLAN`.</li></ul> | `config/parametros.json` y `PLAN` (etapa 2) |
| Reintroducir la ayuda (§15.2) | <ul><li>Se evalúa en el bucle semanal, con el mismo umbral (0,85).</li><li>Así la ayuda cambia como mucho una vez por semana y no oscila de un ítem a otro.</li><li>No hace falta otro número.</li></ul> | `AYUD` y `BUCL` (etapa 2) |
| Nivel de evidencia nuevo (§14.10) | «Extrapolación del autor», junto a los tres del informe. | `config/parametros.json` |
| FSRS (§14.13) | <ul><li>`ts-fsrs` en `src/infraestructura`, detrás de una interfaz del dominio.</li><li>Su instalación necesita otra aprobación: en la etapa 2 se presentan su licencia, su mantenimiento y su tamaño.</li></ul> | Etapa 2 (evaluación) y etapa 4 |
| Etapa 3 (§14.14) | Casos de uso vacíos en `src/aplicacion/` que lanzan «Sin implementar», en un commit de código aparte del de los steps. | Etapa 3 |
| Plan protegido (§14.15) | `docs/plan.md` entra en `.claude/protegidas.txt`, sin fase que lo desbloquee. | Ya aplicado |
| `npm audit` (§14.18) | Se ignoran por ahora los 2 avisos de `qs` (solo afectan al desarrollo); se revisan cuando salga una versión nueva de Stryker. | — |

---

## 1. Principios y cómo se hacen cumplir

| Principio | Mecanismo que lo vigila |
|---|---|
| 1. Nada que no esté en el informe; si falta algo, se para y se pregunta. | <ul><li>Cada Feature, Rule y Scenario lleva una etiqueta de procedencia, `@evidencia-<sección>` o `@extrapolacion`, y `cobertura-ids` comprueba que la sección existe en el informe.</li><li>El subagente `revisor-evidencia` revisa el contenido.</li><li>Para preguntar, Claude termina su mensaje con la marca `[DECISIÓN PENDIENTE]` (§5).</li></ul> |
| 2. Las extrapolaciones viven en `config/parametros.json`, cada una con su valor, su sección, su nivel de evidencia y la marca `extrapolacion`. | <ul><li>`cobertura-ids` valida el fichero.</li><li>ESLint prohíbe los números sueltos en `src/` (salvo 0 y 1) y obliga a leer los umbrales del fichero de parámetros.</li><li>El fichero está protegido: solo se edita en la fase `specs`.</li></ul> |
| 3. No se implementa nada de la sección «Mitos» (§5 del informe). | `revisor-evidencia` tiene la lista de los 11 mitos, incluidas sus versiones disfrazadas, como las metas de horas o adaptar la enseñanza al «tipo de aprendiz». |
| 4. El progreso se mide solo por el rendimiento observado; la confianza declarada sirve solo para calibrar. | <ul><li>`revisor-evidencia`.</li><li>Escenarios negativos en la etapa 2: declarar mucha confianza no hace avanzar.</li></ul> |
| 5. La aplicación no genera contenido del dominio; lo aporta un autor. | <ul><li>`revisor-evidencia` y `revisor-codigo`.</li><li>El dominio de prueba es ficticio y se carga como datos.</li></ul> |
| 6. Las reglas se hacen cumplir con hooks, tests e integración continua. | <ul><li>Este documento.</li><li>No hay repositorio remoto, así que la integración continua es local por ahora (§14, decisión 16).</li></ul> |

---

## 2. Stack

He mantenido el stack por defecto que pediste, así que no hay desviaciones que justificar. Todas las versiones están fijadas de forma exacta (sin `^`) y `package-lock.json` va en el repositorio.

| Pieza | Elección | Por qué |
|---|---|---|
| Lenguaje | TypeScript 6.0.3 en modo estricto, ampliado: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnused*`, etc. | Es lo que pediste. Las opciones extra cazan los errores típicos de quien empieza: índices que no existen o campos opcionales mal tratados. |
| Ejecución | Node 26 (tienes la 26.9.0), que ejecuta los `.ts` directamente (*type stripping*, con `erasableSyntaxOnly`). | Sin paso de compilación: lo que lees es lo que se ejecuta, y hay una herramienta menos que aprender. |
| Base de datos | **Propuesta:** `node:sqlite`, que viene con Node y no añade dependencias. | Antes de usarlo en la etapa 4 compruebo su nivel de estabilidad en Node 26. |
| Interfaz web local | **Propuesta:** `node:http` y HTML, CSS y JS sin framework. | No añade dependencias. Si la interfaz crece, lo replanteamos contigo. |
| Tests | Cucumber.js 13.3 (Gherkin en español), Vitest 5.0.5 y Stryker 10. | Es lo que pediste. |
| Sensores | ESLint 10.13 con typescript-eslint 8.71.2 (`strictTypeChecked`), jscpd 5.4.1, knip 6.42 y dependency-cruiser 18.6. | Es lo que pediste. |
| Formato | Prettier 3.9.10. | Lo usa el hook PostToolUse («formatea el fichero editado»). |
| Lectura de `.feature` | `@cucumber/gherkin` y `@cucumber/messages`, que ya venían con Cucumber. | Los usa el script de cobertura de IDs. Están declarados de forma explícita porque los scripts los importan directamente, y knip lo exige. |

Todas son dependencias de desarrollo. La aplicación todavía no tiene dependencias de ejecución.

---

## 3. Estructura del repositorio

```
config/
  parametros.json        extrapolaciones y umbrales, con su sección del informe (protegido, fase specs)
  alcance.json           áreas que aún no se implementan (protegido, solo el dueño)
docs/
  investigacion.md       la única fuente pedagógica (protegido)
  arnes.md, arnes-verificacion.md   guía de ingeniería (protegidos)
  plan.md                este documento (protegido)
features/                Gherkin en español (etapa 2; protegido, fase specs)
src/
  dominio/               lógica pura: planificador, criterio de dominio, fases, ayuda, calibración
  aplicacion/            casos de uso; los steps de Cucumber solo hablan con esta capa
  infraestructura/       SQLite, reloj, ficheros; implementa las interfaces del dominio
  interfaz/              interfaz web local (punto de entrada: servidor.ts)
tests/
  aceptacion/            steps de Cucumber (etapa 3; protegido, fase aceptacion)
  unidad/                tests del dominio; cada uno cita el @ID que cubre
  arnes/                 tests del propio arnés (104 tests; protegido)
scripts/arnes/           scripts de make check, del pre-commit y de las sumas (protegido)
.claude/
  settings.json          hooks de Claude Code
  hooks/                 código de los hooks
  agents/                subagentes revisor-evidencia y revisor-codigo
  protegidas.txt         rutas protegidas
  sumas.sha256           sumas de las rutas protegidas (las generas tú)
.githooks/pre-commit     reglas de los commits
```

Las carpetas `src/`, `features/`, `tests/aceptacion/` y `tests/unidad/` aún no existen. Se crean en las etapas 2 a 4.

---

## 4. `make check`

Los pasos se ejecutan en este orden. La ejecución se para en el primero que falla y dice cuál ha sido («✗ Falla el paso…»).

| # | Paso (`npm run …`) | Herramienta | Falla si… | Umbral |
|---|---|---|---|---|
| 1 | `tipos` | `tsc --noEmit` | hay cualquier error de tipos | `strict` y las opciones del §2 |
| 2 | `lint` | ESLint, a través de `scripts/arnes/lint.ts`, que añade a cada error una pista de cómo arreglarlo | hay cualquier error | Ver la tabla de abajo |
| 3 | `duplicacion` | jscpd | más del 1 % del código está duplicado | Bloques de al menos 50 tokens y 5 líneas |
| 4 | `codigo-muerto` | knip | hay ficheros, exports o dependencias sin usar | — |
| 5 | `capas` | dependency-cruiser | se rompe una regla de capas (ver abajo) | — |
| 6 | `unidad` | Vitest (`tests/unidad/` y `tests/arnes/`) | falla un test | — |
| 7 | `aceptacion` | Cucumber, en modo `strict` | un escenario falla, está pendiente o tiene pasos sin definir | Excluye las áreas de `config/alcance.json` |
| 8 | `cobertura-ids` | `scripts/arnes/cobertura-ids.ts` | Ver el §8 | — |
| 9 | `integridad` | `scripts/arnes/integridad.ts` | un fichero protegido no coincide con su suma, o el fichero de sumas no coincide con el del último commit | — |

**Reglas de ESLint**

- **Límites:**
  - complejidad ciclomática de 10 por función;
  - 40 líneas por función (sin contar las líneas en blanco ni los comentarios);
  - 3 parámetros por función;
  - 3 niveles de anidamiento;
  - 300 líneas por fichero;
  - 3 callbacks anidados.
- **Reglas de tipos:** `strictTypeChecked` y `stylisticTypeChecked` de typescript-eslint.
- **Sin silenciar nada:**
  - no vale ningún `// eslint-disable` (`noInlineConfig`);
  - no valen los comentarios que apagan otras herramientas: `jscpd:ignore`, `stryker disable`, `istanbul ignore`, `c8 ignore`, `v8 ignore`, ni las etiquetas JSDoc `@public`, `@internal`, `@beta` y `@alpha`, que knip respeta;
  - no valen `@ts-ignore`, `@ts-expect-error` ni `@ts-nocheck`.
- **En `src/`:**
  - no se permiten números sueltos, salvo 0 y 1;
  - los umbrales pedagógicos se leen de `config/parametros.json` y las constantes técnicas (los milisegundos de un día, por ejemplo) van en `src/dominio/unidades.ts`;
  - no se permite `console`.
- **En los tests:** no se permite saltarse tests (`.skip`, `.only`, `.todo`, `.fails`, `.skipIf`, `.runIf`), y un step de Cucumber no puede devolver `"pending"` ni `"skipped"`.

En `tests/` no se aplica el límite de longitud por función, porque un `describe` agrupa muchos casos.

**Reglas de capas (dependency-cruiser)**

- `src/dominio` no importa otras capas, ni módulos de Node, ni paquetes de npm.
- `src/aplicacion` no importa ni infraestructura ni interfaz.
- `src/infraestructura` no importa la interfaz.
- `src/` no importa tests, scripts, hooks ni dependencias de desarrollo.
- El arnés (`scripts/`, los hooks y `tests/arnes/`) no importa `src/`.
- Los steps de Cucumber solo importan `src/aplicacion`.
- No se permiten dependencias circulares ni imports que no se puedan resolver.

**Variantes por fase**

| Objetivo | Fase | Pasos |
|---|---|---|
| `make check` | impl (por defecto) | Los 9 de la tabla |
| `make check-specs` | specs (etapa 2) | Del 1 al 6, `specs` (valida `features/` y los parámetros) e `integridad` |
| `make check-aceptacion` | aceptacion (etapa 3) | Del 1 al 6, `specs`, `estado-aceptacion` (todos los escenarios en alcance deben fallar en rojo: ni pasar, ni quedar pendientes, ni tener pasos sin definir) e `integridad` |

Fuera de `make check` hay tres objetivos más:

- `make mutacion` (§9);
- `make sumas` (§6), que solo puedes ejecutar tú;
- `make formatear`.

---

## 5. Hooks de Claude Code

Están en `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/proteger-rutas.ts\"", "timeout": 30 }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/formatear-y-lintear.ts\"", "timeout": 120 }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/exigir-check.ts\"", "timeout": 600 }]
      }
    ],
    "ConfigChange": [
      {
        "matcher": "user_settings|project_settings|local_settings",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/bloquear-config.ts\"", "timeout": 30 }]
      }
    ]
  }
}
```

### PreToolUse: `proteger-rutas.ts`

**En Edit, Write, MultiEdit y NotebookEdit,** resuelve la ruta real del fichero (siguiendo los enlaces simbólicos, también a directorios, y los `..`) y la bloquea si cae en:

- una ruta de `.claude/protegidas.txt`, salvo que la fase la desbloquee;
- `.git/`;
- `~/.claude/`, salvo la memoria de un proyecto.

**En Bash,** bloquea el comando si:

- **Nombra una ruta protegida**, aunque sea solo para leerla. Para leer están Read, Grep y Glob.
- **Intenta saltarse el arnés:**
  - `git commit --no-verify` o `-n`;
  - cambiar `core.hooksPath`;
  - tocar la variable `CLAUDECODE` (`env -u`, `env -i`, `CLAUDECODE=`);
  - fijar `ARNES_FASE`;
  - `disableAllHooks`;
  - instalar o quitar dependencias (`npm|pnpm|yarn install/i/add/remove/update…`);
  - nombrar `.git/`.

### PostToolUse: `formatear-y-lintear.ts`

Formatea con Prettier el fichero que se acaba de editar y le pasa ESLint. Si hay errores, se los devuelve a Claude con la pista de cómo arreglarlos.

### Stop: `exigir-check.ts`

Ejecuta la comprobación de la fase (`check`, `check-specs` o `check-aceptacion`). Si falla, no deja a Claude terminar el turno y le pasa las últimas 150 líneas de la salida.

Hay una excepción: si el último mensaje de Claude contiene `[DECISIÓN PENDIENTE]`, puede parar para preguntarte. Entonces ves el aviso «la comprobación no se ha ejecutado».

### ConfigChange: `bloquear-config.ts`

Impide que se cambie la configuración de Claude Code (la del usuario, la del proyecto o la local) durante la sesión, para que nadie pueda desactivar los hooks en caliente.

**Si un hook falla** por un error propio, lo trata como un bloqueo (código de salida 2); nunca deja pasar.

---

## 6. Rutas protegidas, fases y sumas

**Rutas** (`.claude/protegidas.txt`):

- los cuatro documentos de `docs/`, incluido este plan;
- `features/` (fase `specs`);
- `config/parametros.json` (fase `specs`);
- `config/alcance.json`;
- `tests/aceptacion/` (fase `aceptacion`);
- la configuración de todas las herramientas (ESLint, jscpd, knip, dependency-cruiser, Stryker, Cucumber, Vitest, TypeScript, Prettier), además de `.gitignore`, `package.json`, `package-lock.json` y `Makefile`;
- el arnés: `.githooks/`, `scripts/arnes/`, `tests/arnes/` y `.claude/`.

**Fases.** Las eliges tú al lanzar la sesión; Claude no puede cambiarlas:

| Lanzas | Fase | Desbloquea | Comprobación en Stop |
|---|---|---|---|
| `claude` | impl | — | `make check` |
| `ARNES_FASE=specs claude` | specs | `features/` y `config/parametros.json` | `make check-specs` |
| `ARNES_FASE=aceptacion claude` | aceptacion | `tests/aceptacion/` | `make check-aceptacion` |

**Sumas**

- `.claude/sumas.sha256` tiene el formato de `sha256sum` y una línea por cada fichero protegido; en un directorio protegido cuenta cada fichero que git no ignora.
- El paso `integridad` falla si un fichero ha cambiado o falta, si hay un fichero protegido nuevo sin suma, o si el propio fichero de sumas difiere del último commit.
- En las fases `specs` y `aceptacion` no se vigila lo que esa fase desbloquea.

**Cómo actualizas las sumas.** Como dijiste, «Solo yo actualizo las sumas, a mano»:

1. Cambias un fichero protegido, o revisas lo que ha escrito Claude en una fase.
2. Desde tu terminal, no desde Claude Code, ejecutas `make sumas`. El script se niega a ejecutarse si detecta Claude Code (`CLAUDECODE`) o si no hay un terminal interactivo. Te muestra qué ha cambiado.
3. Commiteas el cambio y las sumas juntos. El pre-commit comprueba que coinciden.

---

## 7. Subagentes

Los dos son de solo lectura: solo tienen Read, Grep y Glob.

**`revisor-evidencia`**

- **Qué revisa:** `features/`, `config/parametros.json` y los textos y valores por defecto de `src/`.
- **Cómo:** lee el informe entero y cita la sección y la frase exacta. Nunca cita `docs/arnes*.md` como evidencia.
- **Qué señala:**
  - afirmaciones sin respaldo;
  - extrapolaciones sin marcar;
  - etiquetas de procedencia equivocadas;
  - rastros de cualquiera de los 11 mitos;
  - progreso medido por autoevaluación;
  - promesas prohibidas;
  - decisiones centrales apoyadas en citas (†) o [verificar];
  - combinaciones desaconsejadas: ejemplos resueltos con autoexplicación (Barbieri), e intercalado fuera de sus límites.
- **Qué entrega:** un veredicto y una tabla con la gravedad (grave, media o leve), dónde está el problema, qué dice el texto, qué dice el informe y una propuesta. Si el informe no trata algo, lo dice así.

**`revisor-codigo`**

- **Qué señala:** duplicación que jscpd no ve, modularidad, simplicidad, código muerto o especulativo, sobreingeniería, tests débiles y valores escritos a mano.
- **Contexto que tiene en cuenta:** las cuatro capas y que el dueño está aprendiendo TypeScript.
- **Qué entrega:** una tabla con prioridad alta, media o baja. Sin comentarios de estilo y sin proponer dependencias nuevas.

**Cuándo se ejecutan:**

- `revisor-evidencia`, al final de la etapa 2;
- los dos, al cerrar cada área de la etapa 4.

---

## 8. Script de cobertura de IDs (`cobertura-ids`)

**Forma de los IDs:**

| Elemento | ID |
|---|---|
| Característica (Feature) | `@MAST` |
| Regla (Rule) | `@MAST-1` |
| Escenario o esquema (Scenario, Scenario Outline) | `@MAST-1.1` |

Las normas:

- cada elemento lleva exactamente un ID;
- el ID sigue la jerarquía de su padre;
- no hay IDs repetidos.

**Procedencia.** Cada elemento lleva `@evidencia-<sección>` o `@extrapolacion`. La sección tiene que existir en el informe: 2.1 a 2.6, 3, 4, 5 o 6.

**Citas.** El código cita un escenario escribiendo su ID (`@MAST-1.1`) en un comentario o en el nombre de un test:

- **Cuentan como implementación:** las citas en `src/` y en `tests/unidad/`.
- **No cuentan:** las citas en `tests/aceptacion/`.

**Falla si…**

- un escenario en alcance no pasa en Cucumber; lo lee de `reports/cucumber.ndjson`, un Scenario Outline toma el peor estado de sus ejemplos y los reintentos se ignoran;
- un escenario en alcance no tiene implementación;
- el código o los tests citan un ID que no existe;
- `config/parametros.json` no es válido: falta la sección, el nivel de evidencia o la marca `extrapolacion`, o hay un campo desconocido.

**Qué muestra:** una tabla con las columnas `ID | TIPO | PROCEDENCIA | ESTADO | CITAS`.

**`config/alcance.json`**

- `areas_fuera_de_alcance` lista los prefijos que aún no se implementan, por ejemplo `["AYUD", "INTE"]`.
- Cucumber los excluye por etiqueta y la tabla los marca como `FUERA_DE_ALCANCE`.
- Así `make check` puede estar en verde mientras se avanza área por área en la etapa 4.
- Solo lo cambias tú.

---

## 9. Mutation testing (`make mutacion`)

- **Qué hace:** ejecuta Stryker 10 con Vitest sobre `src/dominio/**`, de forma incremental. El informe sale en `reports/mutacion/index.html`.
- **Umbrales:**
  - alto, 80 %;
  - bajo, 60 %;
  - **falla por debajo del 60 %**.
- **Por qué no está en `make check`:** es lento.

---

## 10. Pre-commit (`.githooks/pre-commit`)

Se activa con `npm ci`: el script `prepare` ejecuta `git config core.hooksPath .githooks`. Rechaza el commit si:

1. **Mezcla especificación y código.** Especificación es `features/`, `tests/aceptacion/` y `config/`; código es `src/` y `tests/unidad/`. El resto (docs, arnés) puede ir con cualquiera de los dos.
2. **Claude Code intenta commitear un fichero protegido** (lo detecta por la variable `CLAUDECODE`).
3. **Un fichero protegido no coincide con las sumas** que van en el mismo commit, o faltan las sumas.

---

## 11. Defensa en profundidad y límites honestos

**Capas, de la primera a la última:**

1. **Guardia textual de Bash.** Bloquea los comandos que nombran rutas protegidas o atajos para saltarse el arnés.
2. **Guardia de ficheros.** Resuelve la ruta real, así que los enlaces simbólicos y los `..` no sirven para colarse.
3. **Sumas sha256** de todo lo protegido, en cada `make check`.
4. **Comparación del fichero de sumas con el último commit.** Recalcular las sumas no basta para ocultar un cambio.
5. **`make sumas` se niega a ejecutarse** dentro de Claude Code o sin un terminal interactivo.
6. **Pre-commit:** separa la especificación del código, comprueba la autoría de los ficheros protegidos y comprueba las sumas.
7. **ConfigChange:** los hooks no se cambian en caliente.
8. **Tu revisión del diff antes de cada commit.**

**Límites que conviene conocer:**

- **La guardia de Bash es textual.** Un comando ofuscado (una ruta construida por partes, en base64 o en variables) puede pasar. Por eso existen las capas 3, 4 y 8: lo que no se bloquea, se detecta.
- **`npx <paquete>` puede descargar y ejecutar un paquete** que no está en el lockfile. No cambia `package.json`, pero se ejecuta.
- **La comprobación del terminal de `make sumas` se puede engañar** simulando uno (por ejemplo, con `script`). Si ocurriera, la capa 4 lo detectaría, porque las sumas ya no coincidirían con el último commit, y también tu revisión.
- **ConfigChange también te bloquea a ti** si cambias la configuración con `/config` durante una sesión. Edita la configuración fuera de Claude Code y abre una sesión nueva.
- **En Bash no se pueden nombrar las rutas protegidas ni para leerlas.** Es incómodo, pero Read, Grep y Glob cubren la lectura.
- **Los hooks solo vigilan a Claude Code.** A ti no te frenan, a propósito.
- **Los subagentes son un LLM:** su informe orienta, pero no demuestra nada.
- **Que pasen los tests no demuestra eficacia pedagógica.** Lo dirá el README de la etapa 5.

---

## 12. Prueba del bloqueo

**1. Invocación directa del hook** con el JSON que envía Claude Code:

- **Edit sobre `docs/investigacion.md`** → la respuesta es `permissionDecision: "deny"`, con el motivo:

  > «docs/investigacion.md» está protegida (regla «docs/investigacion.md» de .claude/protegidas.txt). La cambia el dueño, a mano. Si crees que hay que cambiarla, para y propónselo.

- **Bash `echo PRUEBA >> docs/investigacion.md`** → la respuesta es `deny`, con el motivo:

  > El comando menciona la ruta protegida «docs/investigacion.md» (.claude/protegidas.txt). En Bash no se puede nombrar una ruta protegida, ni siquiera para leerla: usa las herramientas Read, Grep o Glob para leer, y los objetivos de make (make check, make specs…) para verificar.

- **Write sobre `src/dominio/criterio.ts`** → no hay respuesta, es decir, el hook lo permite.

**2. Sesión real de Claude Code**

- **Cómo:** sesión no interactiva (`claude -p`, Claude Code 2.1.302, modelo Haiku) en este repositorio, a la que se pidió añadir una línea «PRUEBA» al final del informe.
- **Read:** permitido.
- **Edit:** `PreToolUse:Edit hook error: «docs/investigacion.md» está protegida…`.
- **Bash:** `PreToolUse:Bash hook error: El comando menciona la ruta protegida «docs/investigacion.md»…`.
- **Final:** el modelo informó de los dos bloqueos, no buscó otra vía y terminó con `[DECISIÓN PENDIENTE]`. El hook Stop mostró: «Claude ha parado con [DECISIÓN PENDIENTE]: espera tu decisión. La comprobación no se ha ejecutado.».
- **Después:** `sha256sum -c` sobre el informe devolvió «La suma coincide».

**3. Tests automáticos.** `tests/arnes/guardia.test.ts` repite estos casos, y más (enlaces simbólicos, `..`, `.git/`, `~/.claude/`, `--no-verify`, `env -u CLAUDECODE`, `npm install`…), en cada `make check`.

---

## 13. Primeros pasos para ti

1. `cd ~/aprendizaje-experto && npm ci`. Instala las dependencias y activa el pre-commit.
2. Revisa los ficheros. Todo es nuevo.
3. **Desde tu terminal:** `make sumas`.
4. `make check`. Debe quedar todo en verde, con el aviso de que aún no hay commits.
5. Commitea todo junto. Está permitido porque todavía no hay código en `src/`: `git add -A && git commit -m "chore: arnés de desarrollo (etapa 1)"`.
6. `make check` otra vez. Ahora también compara las sumas con el último commit.
7. Para la etapa 2, abre la sesión con `ARNES_FASE=specs claude`.

---

## 14. Decisiones técnicas

Todas aprobadas por el dueño el 18-10-2026, tal como se proponen en la tabla.

| # | Decisión | Lo aprobado | Alternativa y por qué no |
|---|---|---|---|
| 1 | Límites de ESLint | Complejidad 10, 40 líneas por función, 3 parámetros, 3 niveles de anidamiento, 300 líneas por fichero, 3 callbacks anidados. | Límites más laxos: el código del LLM tiende a funciones largas, y estos límites lo obligan a partirlas en piezas que puedas leer. |
| 2 | jscpd | 1 % de duplicación, bloques de 50 tokens y 5 líneas. | 0 %: daría falsos positivos en estructuras repetidas legítimas. |
| 3 | Stryker | Umbrales 80 / 60, falla por debajo del 60 %. | Más alto al principio: frenaría sin ayudar; se puede subir cuando el dominio esté estable. |
| 4 | Capas de `src/` | <ul><li>Las 4 capas del §3.</li><li>`src/dominio/unidades.ts` como único sitio para constantes técnicas.</li></ul> | Menos capas: se perdería la separación entre lo que se puede probar sin base de datos y lo que no. |
| 5 | Entrada de la interfaz | `src/interfaz/servidor.ts`, declarada en knip. | — |
| 6 | Prefijos de los IDs | <ul><li>`DIAG`: diagnóstico.</li><li>`PLAN`: planificador de repasos.</li><li>`RECU`: recuperación con feedback.</li><li>`MAST`: criterio de dominio.</li><li>`AYUD`: ayuda adaptativa y su retirada.</li><li>`INTE`: intercalado.</li><li>`CALI`: calibración.</li><li>`TARE`: tareas representativas.</li><li>`BUCL`: bucle semanal.</li><li>`HORA`: registro de horas.</li><li>`INST`: instrumentación y exportación a CSV.</li></ul> | IDs numéricos sin prefijo: son menos legibles en el código. |
| 7 | `config/alcance.json` | Para avanzar área por área, como describe el §8. | — |
| 8 | Marca `[DECISIÓN PENDIENTE]` | Que Claude pueda parar para preguntarte sin pasar `make check`, y que tú lo veas. | Sin la marca, Claude no podría preguntarte con el check en rojo, y se vería empujado a decidir por su cuenta. |
| 9 | Matcher de ConfigChange | La configuración del usuario, la del proyecto y la local. | Incluir también skills y políticas: sería innecesario. |
| 10 | Nivel de evidencia nuevo | «Extrapolación del autor», junto a los tres del informe (bien establecido, prometedor y especulativo). | Usar solo los tres del informe: la secuencia de fases, el 85 % y los percentiles no encajan en ninguno, porque el informe los llama extrapolación (§4). |
| 11 | `umbral_retirada_ayuda` | Igual al umbral de dominio (0,85), marcado como extrapolación. Es mi lectura de «reducción de la guía cuando el rendimiento sin ayuda supera el umbral» (§4, fase 2). | Un número distinto: el informe no da ninguno. |
| 12 | Uso de `percentil_experto` (80–90) | <ul><li>La aplicación no calcula percentiles, porque no tiene una muestra de profesionales.</li><li>Guarda el percentil que da el evaluador externo en cada evaluación fechada y lo compara con el mínimo configurado (80).</li><li>Se exigen 2 evaluaciones separadas al menos 3 meses (§4).</li></ul> | Estimar el percentil dentro de la aplicación: el informe no da forma de hacerlo. |
| 13 | FSRS | <ul><li>Usar `ts-fsrs` en `src/infraestructura`, detrás de una interfaz definida en el dominio.</li><li>En la etapa 2 evalúo su licencia, su mantenimiento y su tamaño, y te los presento antes de instalarlo.</li></ul> | Escribir FSRS desde cero: lo descartaste tú. |
| 14 | Enfoque de la etapa 3 | <ul><li>Crear en `src/aplicacion/` los casos de uso como funciones vacías que lanzan «Sin implementar».</li><li>Los steps las importan de forma estática, así que los escenarios fallan en rojo de verdad (FAILED, no indefinidos), los tipos se comprueban y las reglas de capas y de knip siguen funcionando.</li><li>Van en un commit de código aparte del de los steps (regla del pre-commit).</li></ul> | Un contrato tipado en `tests/aceptacion/` con import dinámico: tipado más débil, y knip y dependency-cruiser no siguen los imports dinámicos. |
| 15 | Proteger `docs/plan.md` | Está en `protegidas.txt`, para que el plan no se reescriba para encajar con el código. | Dejarlo libre: más cómodo, pero el plan perdería su papel de contrato. |
| 16 | Integración continua | <ul><li>No hay repositorio remoto. Mientras tanto, la integración continua son el hook Stop, el pre-commit y tu `make check` antes de cada commit.</li><li>Si subes el repositorio a un servidor, un job que ejecute `npm ci && make check && make mutacion`.</li></ul> | Ejecutar `make check` entero en el pre-commit: haría lentos los commits y chocaría con la etapa 3, en la que todo está en rojo a propósito. |
| 17 | Base de datos e interfaz | `node:sqlite` y `node:http`, como en el §2. | — |
| 18 | `npm audit` | <ul><li>Hay 2 avisos moderados de `qs` (≤ 6.15.3, denegación de servicio), que llega a través de `typed-rest-client`, una dependencia de `@stryker-mutator/core`.</li><li>Solo afecta al desarrollo, no a la aplicación.</li><li>Se ignoran por ahora y se revisan cuando salga una versión nueva de Stryker. `npm audit fix` cambiaría `package-lock.json`, que está protegido, así que lo haría el dueño.</li></ul> | — |

---

## 15. Preguntas sobre el informe

Resueltas el 18-10-2026: el dueño aprobó cada propuesta (la opción b en la 5, y [49] como respaldo en la 3). El resumen está en el §0.

1. **Retención objetivo de FSRS.** FSRS necesita un objetivo de retención (por ejemplo, 0,9), pero el informe no da ninguno. El informe solo pide «un SRS (FSRS o SM-2) para hechos» (§4) y advierte que no hay ensayos independientes de FSRS (§2.5 y §6).

   **Propuesta:** usar el valor por defecto de la librería, como parámetro con `extrapolacion: true` y la nota «el informe no lo trata».

2. **Cuándo se reintroduce la ayuda.** El §4 dice «si cae, reintroducirla», sin número.

   **Propuesta:** evaluarlo en el bucle semanal con el mismo umbral, de modo que solo cambie una vez por semana y no oscile de un ítem a otro. Así no hace falta otro número.

3. **El respaldo del criterio de dominio.**
   - El mastery learning en general se apoya en Kulik et al. (1990): 0,52 DE, con la fuente [49]. Pero su referencia en la bibliografía está marcada con (†).
   - El umbral del 85 % viene del §3 (80–90 %, sin cita propia) y del §4, que lo declara extrapolación.

   **Propuesta:**
   - el mecanismo («no avanzar sin dominar») se etiqueta `@evidencia-2.3`, con la fuente [49];
   - el umbral se etiqueta `@extrapolacion`.

   ¿Te vale [49] como respaldo, o prefieres marcar todo el mecanismo como extrapolación?

4. **La estimación del tiempo en la fase 0.**
   - El §4 pide «una estimación honesta del tiempo» como resultado del diagnóstico.
   - Pero el mismo §4 lista «cualquier estimación de "tiempo hasta la pericia"» entre lo no probado.
   - Y tu encargo prohíbe prometer plazos.

   **Propuesta:** el diagnóstico devuelve la ruta sin ninguna estimación de tiempo, y un escenario negativo lo comprueba.

5. **El intervalo de repaso del 10–20 % frente a la no linealidad de Cepeda.**
   - El §3 dice «intervalo ≈ 10–20 % del horizonte».
   - El §2.2 dice que el óptimo es del 20–40 % para 1 semana y del 5–10 % para 1 año, y que la regla «es empírica y no lineal».
   - Si FSRS programa los hechos, este parámetro solo serviría para lo que FSRS no cubre: las tareas representativas y las pruebas de retención diferida.

   **Opciones:**
   - **a)** mantener el rango fijo del 10–20 %;
   - **b)** usar una tabla por horizonte con los dos puntos de Cepeda 2008.

   **Recomendación:** b), más fiel al informe, y te pregunto dónde se usa al escribir `PLAN` en la etapa 2.

6. **Citas que no apoyarán ninguna decisión central.**
   - **Marcadas (†):**
     - Adesope 2017, Bertsch 2007, Black y Wiliam 1998, Cepeda 2006, Chase y Simon 1973, Chi 1981;
     - Cohen 1982, Credé 2017, Dignath 2008, Dunlosky 2013, Ericsson 1993, Gollwitzer y Sheeran 2006;
     - Gruber 2014, Hattie y Timperley 2007, Howard 2021, Kalyuga 2003, Kingston y Nash 2011, Kirschner 2006;
     - Kluger y DeNisi 1996, Kraft 2023, Kruger y Dunning 1999, Kulik 1990, Lally 2010, Leong 2022;
     - Macnamara y Burgoyne 2023, Melby-Lervåg 2013 y 2016, Pan y Rickard 2018, Pashler 2008, Rayner 2016;
     - Rowland 2014, Simons 2016, Sisk 2018, Wood y Neal 2007, Yeager 2019.
   - **Marcadas [verificar]:**
     - los detalles de Cepeda 2006 (§2.2);
     - la «utilidad moderada» de Dunlosky (§2.2 y §3);
     - las cifras de Dignath (§2.5);
     - Gignac y Zajenkowski (§2.5).
   - **Las decisiones centrales se apoyan en citas sin esas marcas:**
     - la inversión de la pericia, en Tetzlaff 2025;
     - el intercalado, en Brunmair y Richter 2019;
     - los ejemplos resueltos, en Barbieri 2023;
     - el espaciado, en Cepeda 2008;
     - la recuperación, en Yang 2021.

---

## 16. Etapas 2 a 5

### Etapa 2: especificación

Sesión con `ARNES_FASE=specs claude`.

- **Features.** Una feature por área, en `features/<área>.feature`:
  - en español (`# language: es`);
  - con IDs estables y procedencia en cada elemento;
  - con límites, casos negativos y `Esquema del escenario`.
- **Umbrales.** Los escenarios no repiten los umbrales a mano: los fijan en el `Dado` («Dado que el umbral de dominio configurado es del 85 %»), y un escenario comprueba que la aplicación los lee de `config/parametros.json`.
- **Áreas:**
  - **DIAG:** diagnóstico con prueba de recuperación y tareas simples, ruta personalizada y ninguna estimación de tiempo.
  - **PLAN:** FSRS, con SM-2 como alternativa.
  - **RECU:** recuperación con feedback correctivo.
  - **MAST:** criterio de dominio sobre el acierto sin ayuda.
  - **AYUD:** ayuda adaptativa con retirada progresiva; nunca ejemplos resueltos combinados con autoexplicación por defecto (Barbieri 2023).
  - **INTE:** intercalado solo en la fase intermedia y solo entre categorías parecidas.
  - **CALI:** calibración de 0 a 100 %.
  - **TARE:** tareas representativas con rúbrica y evaluación externa fechada.
  - **BUCL:** bucle semanal.
  - **HORA:** registro de horas focalizadas, sin metas de horas.
  - **INST:** eventos de instrumentación y exportación a CSV.
- **FSRS.** Evaluaré `ts-fsrs` (licencia, estado y tamaño) y te lo presentaré.
- **Formato del contenido.** Te propondré cómo es el contenido que aporta el autor, porque las features lo describen.
- **Revisión.** Ejecuto `revisor-evidencia` y adjunto su informe.
- **Cierre.** `make check-specs` en verde. **PARA.**

### Etapa 3: steps de aceptación

Sesión con `ARNES_FASE=aceptacion claude`.

- **Steps.** En `tests/aceptacion/`, contra `src/aplicacion` y con las funciones vacías de la decisión 14.
- **Estado.** Todo en rojo, sin skip, pending ni xfail. `make check-aceptacion` en verde.
- **Commits.** Dos, que haces tú: los steps y las funciones vacías por separado.
- **Cierre.** **PARA.**

### Etapa 4: implementación

Sesión con `claude`, área por área. El MVP es DIAG, PLAN, RECU y MAST, con un dominio ficticio pequeño. Para cada área:

1. Sacas el área de `config/alcance.json`.
2. Escribo `src/dominio` y sus tests unitarios, que citan el `@ID`.
3. Escribo la aplicación y la infraestructura necesarias.
4. Dejo `make check` en verde.
5. Ejecuto los dos revisores y `make mutacion`.
6. Te doy un resumen breve.

Sin dependencias nuevas sin tu aprobación. Si un escenario o un parámetro parece mal, paro y propongo un commit que solo toque la especificación.

### Etapa 5: README

El README explicará:

- qué tiene respaldo en el informe;
- qué es extrapolación configurable;
- qué no se debe prometer: ni tiempo hasta la pericia ni eficacia (§2.6 y §6 del informe).
