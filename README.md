
![CI · Schemas](https://github.com/faaragoness-star/Blind2/actions/workflows/ci-schemas.yml/badge.svg)
![CI · E2E](https://github.com/faaragoness-star/Blind2/actions/workflows/ci-e2e.yml/badge.svg)
![CI · PHP](https://github.com/faaragoness-star/Blind2/actions/workflows/ci-php.yml/badge.svg)
![CI · Assets](https://github.com/faaragoness-star/Blind2/actions/workflows/ci-assets.yml/badge.svg)

# BLIND — Monorepo

Monorepo inicial para el proyecto **BLIND** (configurador 3D + WordPress)..
Incluye esqueleto de **plugin**, **viewer/bridge**, **schemas**, **fixtures**, **scripts** y **CI** listos para empezar.

> ⚠️ Este repo es una **plantilla**; ajusta rutas, claves y detalles antes de desplegar.

## Estructura

```
apps/
  wp-plugin/                # Plugin WP unificado (endpoints + shortcode + admin mínimo)
  viewer/                   # Viewer + bridge (se publica en uploads/g3d/**)
docs/
  CONTRATOS-README.md       # Punto de entrada para Capas 0–5 (pendiente de importar de ODT)
packages/
  schemas/                  # snapshot.schema.json + fixtures valid/invalid
scripts/
  e2e/                      # Tests E2E (sku_hash, firma)
  build-viewer.mjs          # Build/copia del viewer
  verify-snapshot.mjs       # Validador AJV del snapshot
tools/
  assets-lint/              # Linter ligero de GLB/KTX2 (presupuestos básicos)
.github/workflows/          # CI (schemas, php, e2e, assets)
```

## Scripts útiles

- `npm run test:schemas` → Valida `packages/schemas/snapshot.schema.json` contra fixtures.
- `npm run test:e2e` → Recompute `sku_hash` y verifica firmas de ejemplo.
- `node scripts/build-viewer.mjs` → Copia el viewer a `apps/viewer/dist` (placeholder).
- `node tools/assets-lint/lint.mjs assets/` → Revisa tamaños básicos.

## Requisitos locales

- Node 18+ (o 20 LTS recomendado)
- PHP 8.1+ para lint del plugin (opcional localmente)
- (Opcional) PowerShell para `scripts/deploy-wp.ps1`

## Despliegue (staging)

1) **Compila/Copia** el viewer: `node scripts/build-viewer.mjs`  
2) **Copia a WordPress** con `scripts/deploy-wp.ps1` (ajusta rutas).  
3) **Activa** el plugin en WP y añade el shortcode `[g3d_viewer]` en una página de producto.

---

MIT License © BLIND
Esto es una linea de prueba que se puede borrar
