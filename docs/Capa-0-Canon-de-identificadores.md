# Capa 0 — Visión & Alcance (v1.1)
# Telemetría (resumen ejecutivo)
# Roadmap — Siguiente sprint (8 issues priorizados)
Objetivo del sprint: cerrar el ‘camino feliz’ wizard → visor → modal → pedido, y establecer CI mínimo.

# P0 — Imprescindibles
# 1) Modal de Checkout WooCommerce (accesible + fallback)
• Modal centrado (role=dialog, aria-modal, trampa de foco); Esc/click-fuera cierran y devuelven foco.

• CTA de fallback visible al checkout clásico y funcional.

• El wizard no muestra precios; el total solo aparece en el modal.

• Telemetría: ui.checkout.open|close|submit|error con request_id.

# 2) validate-sign en Add-to-Cart + idempotencia
• Add-to-Cart llama /validate-sign y añade línea con sku_hash+signature.

• Reintentos con idempotency_key no duplican línea.

• fx_version_mismatch u otros recuperables: autocorrección (Zero‑Mensajes) o aviso no bloqueante.

# 3) Protocolo del visor v1 (iframe) + change→cart
• Comandos: bootstrap, setModel, setMaterial, setColor, setTexture; Eventos: viewer:ready, ack, change, viewer:error.

• viewer:ready < 2.5 s (4G buena); cada cmd responde ack con request_id.

• change emite { sku_hash, state } y el host sincroniza estado (sin precios).

• viewer:error mapea a reason_key y telemetría.

# P1 — Must del MVP
# 4) Editor de Pricing (mínimo viable)
• Admin fija price_base_cents a FR, TP(par) y LN; ajustes por material/texture.

• Publicar crea price_version; bloquea si falta base en modelo activo.

• validate-sign devuelve el mismo total mientras no cambie price_version.

# 5) USD visual en modal (selector ON) + FX fijo
• Selector EUR/USD visible solo en el modal; pedido siempre en EUR.

• Admin edita fx.table.USD; cambios requieren revalidación antes de pagar.

# 6) Publicación de Snapshots (Admin)
• Subir/publicar a uploads/g3d/snapshots/{YYYY}/{MM}/… con published_by/at.

• Retención vigente + 20; botón prune; viewer carga con ?snapshot={id}.

# P2 — Calidad / DevEx
# 7) CI E2E con fixtures
• Job e2e recomputa sku_hash y valida firma/fixtures; valida schemas.

• Falla PR si no coincide o schema inválido; adjunta reporte de artefacto.

# 8) Linter de assets (pipeline de arte) en CI
• CLI rompe build si GLB>1.2 MB o escena>4 MB, si faltan mips KTX2 o tris exceden presupuesto.

• Reporte por pieza (FR/TP/LN) y consejos de corrección.

# Dependencias y notas
• P0 depende de protocolo visor v1 y /validate-sign.

• P1 usa Editor de Pricing y política FX.

• P2 se apoya en fixtures E2E y pipeline de arte.

• Telemetría normalizada: viewer.* y ui.checkout.* con request_id, snapshot_id, price_version, sku_hash (si aplica).

• Eventos clave: `viewer.ready|ack|change|error`, `ui.checkout.open|close|submit|error`.

• Campos comunes: `request_id`, `session_id`, `snapshot_id`, `price_version`, `sku_hash`.

• Privacidad: sin PII; muestreo 100% en eventos críticos; retención 90/30 días.

Documento rector: visión, alcance, KPIs, pilares de marca, riesgos y dependencias para C1–C5.

# Resumen ejecutivo
Configurador 3D de gafas con checkout modal WooCommerce, pricing editable, USD visual (FX versionado), y Zero‑Mensajes.

# Alcance v1.0 — Qué entra
• Catálogo abierto (FR/TP/LN).

• Madera activa con texturas; Color oculto.

• Wizard sin precios; total en modal.

• USD visual con selector en modal.

# Fuera de alcance
• Tintado de lentes.

• Acabados avanzados.

• Multi‑moneda real de pedido (base EUR).

# KPIs clave
• viewer:ready < 2.5 s (4G buena)

• Cambio material/color < 150 ms en caché

• LCP ≤ 2.5s desktop / 3.5s móvil

• GLB≤1.2 MB pieza; escena≤4 MB

# Gaps cerrados (resumen)
• Schemas renombrados a `*.schema.json` y ejemplos movidos al repo.

• CI simplificado: AJV para schemas + lint PHP del plugin.

• Bridge y viewer: rutas finales en uploads (`/g3d/g3d-bridge.js`, `/g3d/viewer/**`).

• Unificación de plugin (MVP v1) y shortcode único `[g3d_viewer]`.
