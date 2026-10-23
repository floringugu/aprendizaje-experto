# aprendizaje-experto

- **docs/plan.md:** nunca lo leas entero. Busca primero lo que necesitas (con Grep o con `git grep -n "<texto>" -- docs/plan.md`) y luego lee solo esas líneas con Read, usando offset y limit.
- **Rutas protegidas en Bash:** se pueden leer (`cat`, `grep`, `git diff`), pero lo que un comando cambie en ellas vuelve a como estaba al acabar el comando, y la versión del comando queda en `reports/huellas/`. Para cambiarlas, prepara una propuesta.

## Comandos para el dueño (regla dura)

Cuando el dueño tenga que hacer algo que Claude no puede hacer, dale los comandos exactos en un único bloque `sh`. Esto incluye aplicar una propuesta, actualizar las sumas, elegir la fase, commitear y deshacer.

- El bloque se copia y se pega tal cual: rutas y mensajes de commit ya rellenos, en el orden en que se ejecutan, desde la raíz del repositorio.
- Nunca le pidas que edite un fichero a mano ni le describas un cambio para que lo escriba él. Si el cambio toca una ruta protegida, prepárale una propuesta.

## Propuestas

Una ruta de `.claude/protegidas.txt` sin anotación de fase no se edita en el repositorio. El cambio se propone así (plan §6):

1. Clona el repositorio en el scratchpad, enlaza `node_modules` y haz allí los cambios con Edit o Write.
2. En el clon, pasa las comprobaciones que no dependen de las sumas: `npm run --silent <paso>` para tipos, lint, duplicacion, codigo-muerto, capas, unidad, specs, aceptacion y cobertura-ids.
3. Guarda el parche fuera de git:
   - `git -C <clon> add -A -- . ':!node_modules'`
   - `git -C <clon> diff --cached --binary > reports/propuestas/<AAAA-MM-DD>-<tema>.patch`
4. Para con `[DECISIÓN PENDIENTE]` y dale al dueño estos bloques, con la ruta y el mensaje rellenos:

```sh
# Aplicar: los cambios quedan en «Cambios preparados» de VS Code para revisarlos.
git apply --3way reports/propuestas/<AAAA-MM-DD>-<tema>.patch
```

```sh
# Si le convence. make check va después del commit: integridad compara las sumas con él.
make sumas
git add .claude/sumas.sha256
git commit -m "<tipo>: <mensaje en inglés>"
make check
```

```sh
# Si no le convence, antes del commit.
git apply -R --index reports/propuestas/<AAAA-MM-DD>-<tema>.patch
git restore --source=HEAD --staged --worktree .claude/sumas.sha256
```

Después del commit se deshace con `git revert --no-edit HEAD`. Claude no aplica parches: la guardia bloquea `git apply`, `git am` y `patch`.

## Etapas, áreas y fases

- Cada etapa (2, specs; 3, aceptación) y cada área de la etapa 4 empieza en una conversación nueva de Claude Code en VS Code.
- La fase la elige el dueño antes de abrir la conversación: Ctrl+Shift+P → «Tasks: Run Task» → «Arnés: fase de la próxima conversación», o `make fase F=<fase>` desde su terminal.
- El aviso de SessionStart dice la fase al empezar. Si no es la que pide la tarea, para y dale el comando para cambiarla.
- Al empezar un área, copia `docs/areas/plantilla.md` a `docs/areas/<ÁREA>.md`.
- En MATE, PLAN y las áreas con una pantalla nueva, el paso «Mecanismo» (plan §16) va antes de tocar `src/`: explica el mecanismo en prosa, esboza dos interfaces y para con `[DECISIÓN PENDIENTE]`.
- Al cerrar el área, completa su archivo con la interfaz descartada, la deuda pagada, la puntuación de mutación y la salida de `make bloqueos A=<ÁREA>`.
