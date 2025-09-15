# Contribuir

Gracias por contribuir. Este repo usa **PRs** y **checks de CI** obligatorios.

## Flujo
1. Crea rama desde `main` (ej. `feat/...` o `fix/...`).
2. Abre PR a `main`. Pasa los checks requeridos: `validate`, `e2e`, `php-lint`, `assets`.
3. Revisión (1 aprobación). Merge recomendado: **Squash & merge**.

## Estilo
- Commits claros. Sugerencia: *Conventional Commits* (`feat: ...`, `fix: ...`).

## Áreas (labels)
- `Capa:WP-Plugin` — plugin WP
- `Capa:Viewer` — visor 3D / bridge
- `Capa:Schemas` — JSON Schemas / fixtures
- `Capa:Assets` — GLB/KTX2 / linter
- `Capa:Docs` — documentación
- `Capa:CI` — Workflows

## Seguridad
- No subas credenciales. Usa **GitHub Secrets**.
- Cambios de firma: rota a `sig.vN`, mantén `vN-1` en paralelo un tiempo.
