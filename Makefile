# Comprobaciones del proyecto. El hook Stop (.claude/hooks/exigir-check.ts) ejecuta la de la fase:
#   make check             fase impl (por defecto): todo, en el orden que fija docs/plan.md
#   make check-specs       fase specs (etapa 2): features/ y parámetros válidos
#   make check-aceptacion  fase aceptacion (etapa 3): todos los escenarios fallan en rojo
# Cada paso es un script de package.json. La ejecución se para en el primer paso que falla.

ESTATICOS := tipos lint duplicacion codigo-muerto capas unidad

# Ejecuta los pasos en orden y dice cuál falla.
define ejecutar_pasos
	@for paso in $(1); do \
		printf '\n▶ %s\n' "$$paso"; \
		npm run --silent "$$paso" || { printf '\n✗ Falla el paso «%s».\n' "$$paso"; exit 1; }; \
	done; \
	printf '\n✓ Todo en verde.\n'
endef

.PHONY: check check-specs check-aceptacion mutacion sumas instalar formatear

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

instalar:
	npm ci

formatear:
	npx --no-install prettier --write .
