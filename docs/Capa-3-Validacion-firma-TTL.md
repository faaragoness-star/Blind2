Capa 3 — Validación, Firma, Caducidad y Errores (modo Zero-Mensajes)

# Capa 3 — Validación, Firma, Caducidad y Errores (modo Zero-Mensajes)
Compatibilidad: alineada con Capa 1 (Identificadores y Naming) y Capa 2 (Esquemas completos).Política UX: Zero-Mensajes en el front — el usuario no ve errores; el sistema filtra y corrige en silencio.

## 0) Objetivo
- Validar cualquier estado contra un snapshot publicado e inmutable.
- Emitir un SKU reproducible (hash determinista) y una firma con caducidad.
- Definir APIs, códigos de error y severidades para logs/Admin, manteniendo Zero-Mensajes en el front.

## 1) Conceptos base
- Snapshot publicado: { id: snapshot_id, schema_version, … } (ver Capa 2). El snapshot es la fuente de verdad.
- Estado de usuario: state = { piezas: [...], morphs: {...} }.
- SKU canónico: serialización ordenada por pieza y por claves (pieza → mat → modelo → col → tex → fin).
- Firma: sello criptográfico sobre sku_hash + metadatos (snapshot, expiración, etc.).
- Zero-Mensajes: ante inconsistencias, el front recalcula permitidos, autoselecciona y revalida, sin banners.

## 2) API
### 2.1 POST /validate-sign (validación + firma)
Request

{

"schema_version": "1.0.0",

"snapshot_id": "snap:2025-09-11T10:00:00Z",

"producto_id": "prod:rx-classic",

"state": {

"piezas": [

{ "pieza":"pieza:moldura","mat":"mat:acetato","modelo":"modelo:fr-m1","col":"col:negro","tex":"tex:acetato-base","fin":"fin:clearcoat-high" },

{ "pieza":"pieza:patilla-izquierda","mat":"mat:acetato","modelo":"modelo:tp-p2-l" },

{ "pieza":"pieza:patilla-derecha","mat":"mat:acetato","modelo":"modelo:tp-p2-r" },

{ "pieza":"pieza:lente","mat":"mat:lens-standard","modelo":"modelo:lens-slim" }

],

"morphs": { "morph:socket-w": 0.18, "morph:socket-h": -0.06 }

},

"locale": "es",

"include_price": true,

"include_stock": true,

"include_photo": false,

"ab_variant": "A",

"idempotency_key": "c7b9c4b8-..."

}

Validaciones servidor

- schema_version soportada; snapshot_id existe y está publicado.
- IDs (pieza/mat/modelo/col/tex/fin) existen en el snapshot.
- Reglas editoriales (Capa 2):
  - Matriz Material → Modelos/Colores/Texturas por Pieza.
  - Si tex.defines_color === true ⇒ ignorar col entrante (no error; ver código informativo abajo).
  - Si appearance.color_mode === "tintable" ⇒ el Material debe tener ≥1 color permitido.
- Encaje: con binding.props (mm), encaje_policy.clearance_por_material_mm, encaje_policy.max_k y encaje_policy.target ∈ {"lug","socket"}. Si no encaja ⇒ rechazar.
- Safety por material: límites mínimos (min_thickness_mm, min_corner_radius_mm).
- Color HEX (si viaja): ^#[0-9A-F]{6}$ (el Admin ya normaliza; aquí solo se rechaza si es inválido).
- Precio/Stock (opc.): coherentes con reglas de negocio; pueden depender de sku_hash y snapshot_id.
- Foto (opc. si include_photo): generar o reutilizar por sku_hash (TTL por defecto: 90 días).

Response (éxito)

{

"ok": true,

"sku_hash": "c0d1f1...ef",

"sku_signature": "sig.v1.qK3...==",

"expires_at": "2025-10-11T10:00:00Z",

"snapshot_id": "snap:2025-09-11T10:00:00Z",

"human_summary": "Montura · Acetato — Negro · Acetato base · Clearcoat alto | Patillas P2",

"price": { "currency": "EUR", "amount": 179.00 },

"stock": { "status": "in_stock" },

"photo_url": null,

"request_id": "r-91f0..."

}

Response (error) – para lógica/logs (front mantiene Zero-Mensajes)

{ "ok": false, "code": "E_ENCAJE_FAILED", "reason_key": "fit_out_of_tolerance", "detail": "lug/socket fuera de tolerancia", "request_id": "r-91f0..." }

Comportamiento del front: ante ok:false, autocorrige (último válido → default del material → primer válido) y reintenta 1 vez. Si persiste (p. ej., encaje imposible), reabre el configurador con estado ya ajustado (sin banners).

### 2.2 POST /verify (carrito/checkout)
Request

{ "sku_hash": "c0d1f1...ef", "sku_signature": "sig.v1.qK3...==", "snapshot_id": "snap:2025-09-11T10:00:00Z" }

Response

{ "ok": true }

ó

{ "ok": false, "code": "E_SIGN_EXPIRED" }

Notas

- Carrito/Pedido solo aceptan con ok:true.
- Si falla, el front reconstituye desde snapshot vigente y reabre el configurador (silencioso).
- Otros posibles errores: E_SIGN_INVALID, E_SIGN_SNAPSHOT_MISMATCH, E_PRICE_OUT_OF_DATE, E_STOCK_UNAVAILABLE.

## 3) SKU, firma y caducidad
### 3.1 sku_hash (determinista)
- Hash de la serialización canónica de state.piezas (sin morphs por defecto).
- Claves permitidas y orden en cada bloque: pieza → mat → modelo → col → tex → fin.
- Orden de piezas por pieza.order editorial del snapshot (ej.: moldura → patilla-L → patilla-R → lente).
- Algoritmo: SHA-256 del JSON canónico sin espacios y con claves ordenadas; null omitido; arrays en el orden editorial.

Ejemplo de string canónico (conceptual):

[{"pieza":"pieza:moldura","mat":"mat:acetato","modelo":"modelo:fr-m1","col":"col:negro","tex":"tex:acetato-base","fin":"fin:clearcoat-high"},

{"pieza":"pieza:patilla-izquierda","mat":"mat:acetato","modelo":"modelo:tp-p2-l"},

{"pieza":"pieza:patilla-derecha","mat":"mat:acetato","modelo":"modelo:tp-p2-r"},

{"pieza":"pieza:lente","mat":"mat:lens-standard","modelo":"modelo:lens-slim"}]

Determinismo sin morphs (por defecto)Los morphs se derivan siempre de: snapshot + encaje_policy.clearance_por_material_mm + max_k + binding.props (mm) + selección.Dado el mismo snapshot_id, la misma selección produce los mismos valores ⇒ SKU reproducible sin enviar morphs.

Modo opcional (negocio/QA)Si se requiere fijar morphs: sign_options.include_morphs = true ⇒ se añade apéndice ordenado (por id ascendente) con valores redondeados (p. ej., 3 decimales), y entra tanto en sku_hash como en la firma.

### 3.2 sku_signature (firma con expiración)
- Cubre: sku_hash, snapshot_id, issued_at, expires_at, locale, ab_variant.
- Caducidad recomendada: 30 días (configurable por producto/campaña).
- Versión: prefijo sig.vN en la firma; convivencia vN + vN-1 durante rotaciones.
- Algoritmo recomendado: firma asimétrica moderna (p. ej., Ed25519).
- Claves en bóveda, rotación programada, acceso mínimo necesario.

### 3.3 Precio y stock (opcionales)
- Precio: base + ajustes por mat/tex/fin (si procede).
- Stock: por componentes o por SKU (según negocio).
- Cambios posteriores: E_PRICE_OUT_OF_DATE / E_STOCK_UNAVAILABLE en /verify ⇒ el front reobtiene en silencio.

### 3.4 Snapshot de imagen (opcional)
- Generar bajo demanda o en validación si include_photo = true.
- Reutilizar por sku_hash (TTL por defecto: 90 días).
- Ángulos/iluminaciones consistentes para carrito/listas.

## 4) Zero-Mensajes — comportamiento del front
Regla general: el front nunca muestra errores.

- Al aplicar un cambio: allowed = computeAllowed(snapshot.rules, state)
  - Matrices Material → Modelos/Colores/Texturas por Pieza.
  - Encaje con clearance_por_material_mm, max_k, target (lug|socket).
  - Safety (espesores, radios mínimos).
  - Textura define color: si tex.defines_color === true, el paso Color se omite (o se sincroniza a null).
- Para cada paso posterior, si la selección actual no está en allowed, el front autoselecciona:último válido → default del material → primer válido (orden editorial).
- Add to cart: llamar /validate-sign. Si ok:false: autocorrección + reintento único.
- Assets: si falla un asset, mantener último frame válido; opciones imposibles no se listan.

## 5) Códigos de error estándar
Para logs/Admin y decisiones de lógica. En front rige Zero-Mensajes.

| E_INVALID_ID | ID no existe en snapshot | Recargar snapshot; reconstituir estado | Revisar publicación / referencias |
| E_SCHEMA_VERSION | Esquema no soportado | Reload duro | Sincronizar versiones |
| E_RULE_VIOLATION | Material no permite Modelo/Color/Textura | Re-pick válido según matriz | Completar matrices/defaults |
| E_TEXTURE_DEFINES_COLOR | Textura fija color (informativo) | Ignorar col y revalidar | OK (esperado); severidad info |
| E_ENCAJE_FAILED | Lug/Socket fuera de tolerancia | Cambiar modelo/material automáticamente | Revisar medidas/clearance |
| E_MORPH_RANGE | abs(k) > max_k o fuera de range_norm | Limitar/ajustar y revalidar | Ajustar max_k/rangos |
| E_SAFETY_LIMIT | Viola espesor/radio mínimo | Excluir combo; re-pick | Ajustar límites o reglas |
| E_ASSET_MISSING | Recurso GLB/tex ausente | Mantener último frame; ocultar opción | Revisar repo/CDN pipeline |
| E_SIGN_INVALID | Firma manipulada | Revalidación completa | Rotar claves si procede |
| E_SIGN_EXPIRED | Firma caducada | Revalidación silenciosa | Ajustar caducidad |
| E_SIGN_SNAPSHOT_MISMATCH | snapshot_id no coincide con firma | Reconstruir con snapshot vigente | Revisar publicación/verificación |
| E_PRICE_OUT_OF_DATE | Precio cambió | Reobtener precio | Publicación de precios |
| E_STOCK_UNAVAILABLE | Sin stock | Ofrecer variante válida automáticamente | Reposición / reglas |
| E_LINK_EXPIRED | Token de enlace vencido | Reconstruir desde snapshot vigente | Ajustar TTL |
| E_TIMEOUT | Timeout | Reintento único | Monitorizar latencias |
| E_RATE_LIMIT | Límite de uso | Backoff 2–5 s | Ajustar límites |
| E_UNSUPPORTED_FEATURE | Snapshot usa algo no soportado por el visor | Fallback visual | Roadmap visor |
| E_INTERNAL | Error genérico | Reintento único | Logs y alerta |

Unificación: el caso “textura define color” siempre usa E_TEXTURE_DEFINES_COLOR (info), no E_RULE_VIOLATION.reason_key: snake_case estable para analítica/búsqueda (p. ej., texture_defines_color, fit_out_of_tolerance).

## 6) Seguridad y operación
- TLS obligatorio.
- CORS con lista blanca de orígenes para /validate-sign y /verify.
- Rate limiting e idempotency_key en POST.
- Auditoría: quién validó/firmó/verificó, con qué snapshot_id, resultado, latencias.
- Privacidad: sin PII en payloads; analytics solo con consentimiento heredado.
- Resiliencia: fallback de imagen/asset; GLB sin compresión para QA si Draco/Meshopt fallan.
- Gestión de claves: bóveda, rotación programada; acceso mínimo necesario.
- Logging: incluir request_id; ofuscar datos sensibles en logs públicos.

## 7) Compatibilidad y versionado
- schema_version (SemVer) en todos los payloads; cambios incompatibles ⇒ major.
- Firma con versión (sig.vN) y ventana de convivencia (vN + vN-1).
- Snapshot drift: si el SKU usa un snapshot_id antiguo, /verify puede fallar; el front rehace estado con snapshot vigente en silencio.

## 8) Checklists
Back/Admin

- Publica snapshot_id único e inmutable.
- Clave activa de firma sig.vN + plan de rotación.
- Caducidad por defecto: 30 días.
- Auditoría y rate-limit activos.
- Staging probado con catálogo real.

Front

- computeAllowed = matrices + encaje (clearance_por_material_mm, max_k, target) + safety.
- Autoselección: último válido → default material → primer válido.
- Add-to-cart ⇒ /validate-sign + reintento único con autocorrección.
- Cero mensajes; sin chips deshabilitados.
- Mantener último frame si falla un asset; opciones imposibles no se listan.

Carrito/Checkout

- Siempre /verify antes de confirmar.
- Si falla, reconstruir con snapshot vigente y volver al configurador (sin banners).
- (Opc.) Reconfirmar price/stock en verify.

## 9) Ejemplos compactos
Ciclo típico

- Usuario configura (chips siempre válidos).
- Add to cart → /validate-sign → ok:true → añadir (sku_hash, sku_signature).
- Checkout → /verify (ok:true) → cobrar.
- Si en 2) ok:false (p. ej., E_ENCAJE_FAILED): front autoselecciona otra opción válida y reintenta; si persiste, reabre configurador con estado ajustado.

Payload hacia e-commerce (add-to-cart)

{

"sku_hash": "c0d1f1...ef",

"sku_signature": "sig.v1.qK3...==",

"qty": 1,

"display": {

"summary": "Montura · Acetato — Negro · Acetato base · Clearcoat alto | Patillas P2",

"photo_url": "https://cdn/sku/c0d1f1.jpg"

}

}

## 10) Notas finales (decisiones consolidadas)
- snapshot_id es el identificador externo estandarizado; coincide con snapshot.id del paquete publicado.
- Morphs: por defecto no en el SKU; determinismo garantizado vía snapshot + encaje. Modo avanzado para incluirlos en firma si negocio lo exige (controlado por sku_policy del snapshot).
- Caso lente: mat:lens-standard + tex:lens-clear ⇒ textura fija (no tintable) y paleta vacía; si en el futuro se quiere teñir lentes, pasar la textura a tintable y definir paleta en la matriz de colores del material.
- Error mapping unificado: E_TEXTURE_DEFINES_COLOR (info) + reason_key en snake_case para analítica/búsqueda; no usar E_RULE_VIOLATION para este caso.
