---
fase: specs
area: CALI
depende: [specs-calibracion-visual]
toca: [features/instrumentacion.feature, features/calibracion.feature]
estado: abierto
---
# Se registra qué pantalla de calibración vio la persona y cuándo, para medir si cambia algo

**Qué:** las pantallas de calibración (CALI-4 a CALI-6) son una extrapolación del autor y ningún estudio prueba que mejoren la calibración. Para saberlo con los datos de la persona hace falta comparar la diferencia entre confianza y acierto semana a semana, antes y después de empezar a verlas. Esa diferencia ya se puede calcular con `respuestas.csv`; lo que falta es registrar en qué bucle se enseñó cada pantalla (silueta o tarjetas, de qué objetivo) y cuándo se abrió cada tarjeta. Especificar ese registro y la medida.

**Hecho cuando:** los escenarios fijan dónde se registra cada pantalla enseñada y cada tarjeta abierta (columnas y formato, como los demás CSV de INST), qué diferencia se compara y entre qué semanas, que el registro no cambia el progreso, y `make check-specs` está en verde.

**Leer primero:** features/instrumentacion.feature (cabeceras fijas de los CSV y exportación); features/calibracion.feature (CALI-4 a CALI-6); docs/tickets/specs-calibracion-visual.md (sección «Por decidir»).

## Por decidir

- Si es un CSV nuevo (hoy hay siete, y la exportación los lista todos) o columnas en uno existente.
- Cuántas semanas de calibración antes de la primera pantalla hacen falta para poder comparar.
- Si la comparación se enseña a la persona o solo se exporta. Si se enseña, los datos mandan (CALI-6).
