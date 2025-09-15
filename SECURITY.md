# Seguridad

- Reporta vulnerabilidades por email o issue privado.
- No publiques claves ni tokens.
- Rotación de claves de firma:
  1) Introduce `sig.vN` manteniendo `vN-1`.
  2) Migra consumidores a `vN`.
  3) Retira `vN-1` y anota en CHANGELOG.
