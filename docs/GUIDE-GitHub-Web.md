# GitHub — Configuración rápida (100% web)

## 1) Etiquetas (labels)
1. Sube `.github/labels.yml` y `.github/workflows/sync-labels.yml` al repo (Add file → Upload files).
2. Ve a **Actions** y ejecuta el workflow **Repo · Sync labels** (Run workflow).
3. Verás las etiquetas `P0/P1/P2`, `Capa:*`, `Tipo:*` creadas.

## 2) Plantillas de issues
- Sube la carpeta `.github/ISSUE_TEMPLATE/` al repo. Al crear un issue, verás formularios de Bug/Feature/Task.

## 3) Auto-etiquetado de PRs
- Sube `.github/labeler.yml` y `.github/workflows/pr-labeler.yml`.  
- Al abrir un PR, se asignarán etiquetas por rutas (apps/wp-plugin/**, packages/schemas/**, etc.).

## 4) Project y backlog (importar CSV)
1. Crea un **Project** (Projects → New project).
2. Añade un campo **Priority** (Single select) con valores `P0, P1, P2` (opcional).
3. En el Project → **… → Import CSV**. Sube `issues-import.csv`.  
   - Mapea columnas: *Title → Title*, *Body → Body*, *Labels → Labels*.
4. Abre los issues importados y asigna `Priority` si creaste ese campo.

¡Listo! Ya tendrás backlog, labels y plantillas profesionales sin usar línea de comandos.
