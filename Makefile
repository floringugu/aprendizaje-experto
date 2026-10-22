# Comprobaciones del proyecto. El hook Stop (.claude/hooks/exigir-check.ts) ejecuta la de la fase:
#   make check             fase impl (por defecto): todo, en el orden que fija docs/plan.md
#   make check-specs       fase specs (etapa 2): features/ y parámetros válidos
#   make check-aceptacion  fase aceptacion (etapa 3): todos los escenarios fallan en rojo
# Cada paso es un script de package.json. La ejecución se para en el primer paso que falla.
#
# Objetivos solo para el dueño, desde su terminal o las tareas de VS Code (.vscode/tasks.json):
#   make fase F=<fase>     fija la fase de la próxima conversación de Claude Code
#   make sumas             recalcula .claude/sumas.sha256 tras cambiar un fichero protegido
# Y uno de consulta: make bloqueos A=<ÁREA> resume las paradas del hook Stop de un área.

ESTATICOS := tipos lint duplicacion codigo-muerto capas unidad

# Ejecuta los pasos en orden y dice cuál falla.
define ejecutar_pasos
	@for paso in $(1); do \
		printf '\n▶ %s\n' "$$paso"; \
		npm run --silent "$$paso" || { printf '\n✗ Falla el paso «%s».\n' "$$paso"; exit 1; }; \
	done; \
	printf '\n✓ Todo en verde.\n'
endef

.PHONY: check check-specs check-aceptacion mutacion sumas fase bloqueos instalar formatear

check:
	$(call ejecutar_pasos,$(ESTATICOS) aceptacion cobertura-ids integridad)

check-specs:
	$(call ejecutar_pasos,$(ESTATICOS) specs integridad)

check-aceptacion:
	$(call ejecutar_pasos,$(ESTATICOS) specs estado-aceptacion integridad)

# Mutation testing de src/dominio/. No forma parte de make check: es lento.
mutacion:
	npm run --silent mutacion

# Solo el dueño, desde su terminal: recalcula .claude/sumas.sha256.
sumas:
	@node scripts/arnes/actualizar-sumas.ts

# Solo el dueño: guarda la fase en .claude/settings.local.json (fuera de git). Vale para la
# próxima conversación; las que están abiertas siguen en su fase.
fase:
	@node scripts/arnes/fijar-fase.ts $(F)

# Paradas del hook Stop (.claude/registro-stop.jsonl) mientras el área estaba en curso,
# para el archivo del área (docs/areas/<ÁREA>.md).
bloqueos:
	@node scripts/arnes/bloqueos-stop.ts $(A)

instalar:
	npm ci

formatear:
	npx --no-install prettier --write .
