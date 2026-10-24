# aprendizaje-experto

- **Markdown largos:** los `.md` de más de 200 líneas (`docs/plan.md`, `docs/investigacion.md`, `docs/arnes.md`, `docs/arnes-verificacion.md`) nunca se leen enteros, tampoco con `cat`. Busca primero lo que necesitas (con Grep o con `git grep -n "<texto>" -- <fichero>`) y luego lee solo esas líneas con Read, usando offset y limit. Si intentas leer uno entero, el hook te devuelve su índice de secciones.
- **Rutas protegidas en Bash:** se pueden leer (`cat`, `grep`, `git diff`), pero lo que un comando cambie en ellas vuelve a como estaba al acabar el comando, y la versión del comando queda en `reports/huellas/`. Para cambiarlas, prepara una propuesta.

## Comandos para el dueño (regla dura)

Cuando el dueño tenga que hacer algo que Claude no puede hacer, dale los comandos exactos en un único bloque `sh`. Esto incluye aplicar una propuesta, elegir la fase, commitear y deshacer.

- El bloque se copia y se pega tal cual: rutas y mensajes de commit ya rellenos, en el orden en que se ejecutan, desde la raíz del repositorio.
- Nunca le pidas que edite un fichero a mano ni le describas un cambio para que lo escriba él. Si el cambio toca una ruta protegida, prepárale una propuesta.

## Propuestas

Una ruta de `.claude/protegidas.txt` sin anotación de fase no se edita en el repositorio. El cambio se propone así (plan §6):

1. Clona el repositorio en el scratchpad, enlaza `node_modules` y haz allí los cambios con Edit o Write.
2. En el clon, pasa las comprobaciones que no dependen del commit (todas salvo `integridad`): `npm run --silent <paso>` para tipos, lint, duplicacion, codigo-muerto, capas, unidad, specs, aceptacion y cobertura-ids.
3. Guarda el parche fuera de git:
   - `git -C <clon> add -A -- . ':!node_modules'`
   - `git -C <clon> diff --cached --binary > reports/propuestas/<AAAA-MM-DD>-<tema>.patch`
4. Para con `[DECISIÓN PENDIENTE]` y dale al dueño estos bloques, con la ruta y el mensaje rellenos:

```sh
# Aplicar: los cambios quedan en «Cambios preparados» de VS Code para revisarlos.
git apply --3way reports/propuestas/<AAAA-MM-DD>-<tema>.patch
```

```sh
# Si le convence. El parche ya está preparado, así que el commit es solo suyo. make check va después: integridad compara con él.
git commit -m "<tipo>: <mensaje en inglés>"
make check
```

```sh
# Si no le convence, antes del commit.
git apply -R --index reports/propuestas/<AAAA-MM-DD>-<tema>.patch
```

Después del commit se deshace con `git revert --no-edit HEAD`. Claude no aplica parches: la guardia bloquea `git apply`, `git am` y `patch`.

## Etapas, áreas y fases

- Cada etapa (2, specs; 3, aceptación) y cada área de la etapa 4 empieza en una conversación nueva de Claude Code en VS Code.
- La fase la elige el dueño antes de abrir la conversación: Ctrl+Shift+P → «Tasks: Run Task» → «Arnés: fase de la próxima conversación», o `make fase F=<fase>` desde su terminal.
- El aviso de SessionStart dice la fase al empezar. Si no es la que pide la tarea, para y dale el comando para cambiarla.
- Al empezar un área, copia `docs/areas/plantilla.md` a `docs/areas/<ÁREA>.md`.
- En MATE, PLAN y las áreas con una pantalla nueva, el paso «Mecanismo» (plan §16) va antes de tocar `src/`: explica el mecanismo en prosa, esboza dos interfaces y para con `[DECISIÓN PENDIENTE]`.
- En la fase impl, escribe tú los comentarios de interfaz y las firmas, y encarga los cuerpos y los tests unitarios al subagente `implementador`, con las líneas `Tarea: <ÁREA>-<n>` y `Ficheros: <rutas>` en el prompt (plan §7). El modelo lo elige el hook. Un encargo cada vez: espera a que termine antes de tocar sus ficheros. Lo que devuelva en rojo después de Sonnet, y los arreglos de una o dos líneas, los haces tú.
- Al cerrar el área, completa su archivo con la interfaz descartada, la deuda pagada, la puntuación de mutación y la salida de `make bloqueos A=<ÁREA>`.
