# Mantenimiento

## PRs
- Requiere 1 aprobación. Estrategia: **Squash**.
- Checks requeridos: `validate`, `e2e`, `php-lint`, `assets`.

## Branches
- `main` protegida. Borra ramas tras merge.
- Para hotfix: `hotfix/*` → PR a `main`.

## Releases
1) *Draft a new release* → tag `vX.Y.Z` apuntando a `main`.
2) Adjunta artefactos si aplica (snapshots, etc.).

## Contacto CODEOWNERS
- Propietario principal: @faaragoness-star
