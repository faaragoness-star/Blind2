# Capa 4 — UI/UX, Orquestación, Accesibilidad y Métricas (revisada y super completa)
# Host de la mini‑app (Shortcode)
Usar únicamente [g3d_viewer] en la página. Nada de scripts embebidos.

# Contrato de morphs en runtime (visor)
• Detectar SK canónicas, leer props mm al cargar.

• kW/kH derivados del delta W/H según morph_range_pct; aplicar WIDE/NARROW y HIGH/LOW.

• Telemetría: viewer.change → delta.morphs {kW,kH}, shape_keys_applied.

## 0) Principios de diseño
- Zero-mensajes: sin banners ni errores visibles; el sistema filtra y autocorrige en silencio.
- Determinismo: misma entrada ⇒ mismo estado/visual ⇒ mismo sku_hash.
- Velocidad primero: TTI/LCP < 2.5 s (4G real); primer frame tras chip < 200 ms.
- Accesibilidad (WCAG 2.2 AA): teclado completo, foco visible, contraste ≥ 4.5:1, prefers-reduced-motion respetado.
- Consistencia: Resumen ≡ chips ≡ visor 3D (misma selección, mismas plantillas i18n).
- Estabilidad de serialización: cualquier A/B (p. ej. cambiar orden visual Color↔Textura) no altera la serialización canónica (pieza→mat→modelo→col→tex→fin) ni el sku_hash.

## 1) Estructura de pantalla (Visual Front)
### 1.1 Layouts
Desktop (≥1024px)

- Izquierda: Visor 3D (área 1:1).
- Derecha: Flujo de chips (scroll independiente).

Mobile (<1024px)

- Visor 3D arriba.
- Pasos en acordeón debajo.

Header: título (i18n), precio opcional, botón Compartir.Footer fijo: CTA “Añadir al carrito” + Resumen (una línea, i18n).

### 1.2 Orden de pasos (fijo por defecto)
Pieza → Material → Modelo → Color → Textura → AcabadoSe muestran solo pasos activos para la pieza seleccionada. Color se oculta si la Textura activa defines_color = true.Excepción A/B (opt-in): si una textura es tintable, puede invertirse Color ↔ Textura solo en el experimento; la serialización canónica no cambia.

## 2) Componentes de UI (definición funcional)
### 2.1 Stepper de pasos — Tabs con ARIA correcto
- Roles: contenedor role="tablist" (+ aria-orientation="horizontal"), cada paso role="tab", cada panel role="tabpanel".
- Atributos de tabs:
  - Tab activo: aria-selected="true", tabindex="0".
  - Tabs inactivos: aria-selected="false", tabindex="-1".
  - Cada tab: id="tab-{step}", aria-controls="panel-{step}".
  - Cada panel: id="panel-{step}", aria-labelledby="tab-{step}", aria-busy="false".
- Roving tabindex: solo el tab enfocable tiene tabindex="0".
- Teclado:
  - Flechas mueven el foco por tabs.
  - Home/End saltan al primero/último.
  - Enter/Espacio activa el tab.
  - Atajos 1–6 para saltar a pasos (aria-keyshortcuts).
- Estados: activo / colapsado / oculto.
- Carga: cuando un panel resuelve assets, aria-busy="true"; al completar, false.
- Ocultación real: pasos ocultos usan hidden/inert (o aria-hidden="true" + tabindex="-1") para sacarlos del orden de tabulación.

### 2.2 Chips (selección por paso)
- Patrón ARIA: contenedor role="radiogroup"; cada chip role="radio", aria-checked, roving tabindex.
- Hit-area: ≥ 44 px alto; padding generoso.
- Estados: seleccionado / disponible / oculto (no hay “deshabilitados”).
- Desbordamiento: carrusel horizontal + botón “Ver todo” (modal grilla con virtualización).
- Representación:
  - Material: texto.
  - Modelo: miniatura 3/4 o icono.
  - Color: swatch con borde de alto contraste.
  - Textura: mosaico 2×2 o mini-render.
  - Acabado: texto + micro-icono (brillo/iridiscente).
- Accesible: outline de foco 2 px; contraste ≥ 3:1 en elementos no textuales.
- Teclado: ←/→ recorren items; Home/End; Enter/Espacio selecciona; Esc cierra modales; , / . chip previo/siguiente del carrusel.
- Post-autocorrección (Zero-mensajes): mantener foco en el chip que inició el cambio y anunciar el nuevo Resumen (live region).

### 2.3 Visor 3D
- Gestos: arrastrar (rotar), rueda/pellizco (zoom), doble toque (reset).
- Teclado (equivalentes accesibles):
  - ←/→ yaw, ↑/↓ pitch, +/- zoom, R reset; con Shift = pasos finos.
- Toolbar mínima: Reset, Screenshot, Info (tooltip corto).
- Cámara (determinismo): pose inicial (posición, target, fov) fijada; clamp de distancia y ángulos ⇒ miniaturas consistentes.
- LOD: texturas 1K → 2K on-demand; materiales compilados al entrar.
- Fallback: imagen estática si el dispositivo no soporta 3D (1:1, mismo fondo/iluminación).
- Rendimiento: mantener último frame válido durante cargas; transiciones cross-fade o fade-through cortas.

### 2.4 Resumen (una línea)
- Plantilla i18n editable:{{pieza}} · {{material}} — {{color}}{{#if textura}} · {{textura}}{{/if}}{{#if acabado}} · {{acabado}}{{/if}}
- Live region aria-live="polite" (actualiza sin molestar lectores).

### 2.5 CTA “Añadir al carrito”
- Siempre habilitada (Zero-mensajes). Si la verificación falla, el front autocorrige y reintenta en silencio.
- En la llamada a /validate-sign se envía idempotency_key y, en éxito, se asocia el request_id retornado (trazabilidad).

### 2.6 Screenshot (carrito/compartir)
- JPG 1024×1024, fondo neutro, marca de agua opcional.
- Cache por sku_hash (TTL por defecto 90 días, configurable).
- Misma cámara/iluminación que la pose inicial del visor.

## 3) Orquestación del flujo (sin tecnicismos)
### 3.1 Estado (cliente)
{

"producto_id": "prod:…",

"pieza_activa": "pieza:moldura",

"piezas": [

{ "pieza":"pieza:moldura", "mat":"mat:…", "modelo":"modelo:…", "col":"col:…", "tex":"tex:…", "fin":"fin:…" },

{ "pieza":"pieza:patilla-izquierda", "mat":"mat:…", "modelo":"modelo:…" },

{ "pieza":"pieza:patilla-derecha", "mat":"mat:…", "modelo":"modelo:…" },

{ "pieza":"pieza:lente", "mat":"mat:lens-standard", "modelo":"modelo:lens-slim" }

],

"morphs": { "morph:socket-w": 0.18, "morph:socket-h": -0.06 },

"last_used_valid": { "col":"col:negro", "tex":"tex:acetato-base", "fin":"fin:clearcoat-high" }

}

### 3.2 Motor de filtrado + autocorrección (Zero-mensajes)
En cada cambio:

- allowed = computeAllowed(snapshot.rules, estado) considerando:
  - Matrices Material→Modelos/Colores/Texturas por Pieza.
  - Encaje (mm + clearance_por_material_mm + max_k + target = lug|socket).
  - Safety (espesores/radios por material).
  - Regla de Texturas: si defines_color = true, Color se omite/sincroniza.
- Para cada paso posterior, si la selección no está en allowed, autoselección:Último válido → Default del material → Primer válido (orden editorial).
- Aplicar al visor (transiciones cortas).
- Nunca mostrar opciones no válidas; nunca chips deshabilitados.

### 3.3 Undo/Redo
- Cobertura: solo selección de chips (no cámara).
- Buffer: 20 acciones por sesión; agrupar autocorrecciones en una entrada.
- Persistencia: sessionStorage.
- Atajos: Ctrl/Cmd+Z y Ctrl/Cmd+Shift+Z.

### 3.4 Add to Cart (validar+firmar en silencio)
- Serialización canónica: pieza → mat → modelo → col → tex → fin.
- Llamar a /validate-sign (Capa 3) con idempotency_key (UUID v4).
- Si ok:false: autocorrección con la misma política y reintento único usando la misma idempotency_key.
- Si persiste, reabrir configurador con estado ajustado (sin mensajes).
- En éxito, registrar en telemetría ui.add_to_cart.success con sku_hash y request_id retornado.

## 4) Micro-interacciones y estados de carga
- Cambio de chip: highlight/fade 150–200 ms.
- Material/Textura: cross-fade 200–300 ms.
- Modelo: fade-through 300–400 ms manteniendo cámara.
- Loading: skeletons en visor/chips; sin spinners bloqueantes.
- Motion: respetar prefers-reduced-motion (reducir animaciones).

Skeletons accesibles: contenedor con role="status" + aria-live="polite" + aria-label="Cargando opciones…". Emite una sola actualización (sin spam).

## 5) Accesibilidad (WCAG 2.2 AA)
- Contraste: ≥ 4.5:1 texto/íconos; swatches con borde de contraste.
- Foco visible: chips/toolbar con outline 2 px.
- Teclado:
  - Tab/Shift+Tab → navegar bloques/chips.
  - Flechas → moverse entre chips; Enter/Espacio → seleccionar.
  - 1–6 → pasos (aria-keyshortcuts); ,/. → chip previo/siguiente; Home/End inicio/fin.
  - Visor 3D: ←/→/↑/↓, +/-, R, Shift (pasos finos).
- Roles/ARIA:
  - Stepper role="tablist"; step role="tab"; panel role="tabpanel" (usar aria-selected, no aria-current).
  - Resumen aria-live="polite".
  - Toolbar visor role="toolbar", botones con aria-label.
  - Paneles con aria-busy durante cargas; ocultos con hidden/inert.
- Alternativa: imagen estática si 3D no disponible (mismo Resumen y CTA).
- Evitar mareos: sin flashes; animaciones discretas y opcionales.
- Modales: aria-modal="true", foco inicial y focus-trap; cierre con Esc.

## 6) Rendimiento y assets
### 6.1 Presupuestos
- TTI/LCP < 2.5 s (4G real).
- Cambio de chip → < 200 ms al primer frame válido.
- GLB por pieza: ≤ 2–3 MB con Draco; QA sin compresión.
- Texturas: preview 256–512 px; producto 1024–2048 px on-demand.

### 6.2 Carga diferida y prefetch
- Cargar solo Pieza/Modelo/Material activos.
- Prefetch del camino probable: defaults del material y siguiente modelo cercano.
- Cache por sku_hash y snapshot_id (invalidar con nueva versión).
- Draco/Meshopt: decoders listos al entrar (precalentamiento).
- Timeouts: si un asset no llega, mantener último frame y ocultar esa opción de los permitidos; reportar ui.error {code:"E_TIMEOUT"} (sin UI).

### 6.3 Optimización de red/DOM (extra)
- Listas largas: content-visibility:auto y virtualización en “Ver todo”.
- Preconnect/DNS-prefetch al CDN de GLB/texturas.
- fetchpriority="high" para el primer GLB y primera textura.

## 7) i18n de UI (sin mostrar IDs)
- Labels por label_key (chip/resumen/email); bundles por locale.
- Plantillas por mercado para Resumen/SEO/email.
- Fallback: idioma actual → base → nombre seguro (ID sin prefijo capitalizado).
- Nunca mostrar IDs crudos ni variantes label_ui_short/full.

Formato local: precio/números/fechas con Intl.NumberFormat / Intl.DateTimeFormat usando el locale activo; el texto siempre via label_key.

## 8) Telemetría y A/B (sin PII)
### 8.1 Eventos (canónicos ui.*)
- ui.ready
- ui.step_view { step }
- ui.select.{step} { id }
- ui.autocorrect.{step} { from_id, to_id, reason_key } con reason_key ∈ {"rule_violation","encaje","safety","texture_defines_color","asset_missing","timeout"}
- ui.undo / ui.redo
- ui.snapshot
- ui.add_to_cart.click
- ui.add_to_cart.success { sku_hash, request_id }
- ui.apply_latency { ms } (render del visor por cambio)

Latencias — nombres estables:

- En ui.applied usa latency_ms.
- En métricas agregadas (ui.metrics o heartbeats) usa apply_latency_ms.

Errores (alineado con Capa 3): registrar code estándar (p. ej. E_TEXTURE_DEFINES_COLOR) + reason_key en snake_case. El usuario no ve el error.

### 8.2 Dimensiones
producto_id, pieza_id, material_id, modelo_id, color_id, textura_id, acabado_id, texture_source (embedded|generated), device (m|d), locale, ab_variant, snapshot_id.

### 8.3 KPI
- Tiempo a primera configuración completa.
- % autocorrecciones por paso (calidad de matrices).
- Éxito Add to cart / sesión.
- Latencia media de aplicación en visor (por tipo de textura).

### 8.4 A/B sugeridos
- Orden Color ↔ Textura cuando la textura es tintable.
- Carrusel de chips vs grilla expandible.
- Mini-vistas rápidas del visor (frontal / 3⁄4 / perfil).

Invariante: los A/B no cambian la serialización canónica ni el sku_hash.

## 9) Estados límite y resiliencia (sin mensajes)
- Sin datos (snapshot no cargado): skeleton + reintento automático.
- Asset ausente: mantener último frame; ocultar opción en permitidos.
- Timeout: reintento único con backoff (p. ej., 300 → 600 ms); ui.error {code:"E_TIMEOUT"}.
- Verify expirado en checkout: reconstruir estado con snapshot vigente y volver al configurador ya ajustado.

## 10) Diseño visual (tokens base)
- Tipografía: títulos 20–24 px semibold; chips 14–16 px medium; UI base 14–16 px.
- Espaciado: grid 8 px; chips gap 8–12 px.
- Radios: 12–16 px (chips y tarjetas).
- Sombra: y=2–4, blur 8–16.
- Temas: Light/Dark; contrastes AA.
- Estados: hover/focus/pressed definidos y coherentes.

## 11) Contratos de datos de UI (conceptuales)
### 11.1 Config de paso
{

"id": "step:material",

"title_key": "ui.step.material",

"visible": true,

"items": [

{ "id": "mat:acetato", "label_key": "material.acetato.name" },

{ "id": "mat:metal", "label_key": "material.metal.name" }

],

"selection": "mat:acetato"

}

### 11.2 Evento de selección (front → visor)
{ "type": "set_textura", "pieza_id": "pieza:moldura", "textura_id": "tex:acetato-base" }

### 11.3 Evento de visor (visor → front)
Namespace correcto: ui.*

{ "event": "ui.applied", "pieza_id": "pieza:moldura", "changed": ["tex"], "latency_ms": 72 }

## 12) QA / Pruebas (lista mínima)
- Flujo completo móvil y desktop.
- Autocorrección al cambiar Material que invalida Color/Textura.
- Textura define color: Color se oculta y se restaura al volver a tintable.
- Undo/Redo con autocorrecciones agrupadas.
- Add to cart con /validate-sign y reintento silencioso (misma idempotency_key).
- Snapshot (imagen) consistente (misma cámara/iluminación).
- Accesibilidad: teclado, foco, lectores, reduced-motion.
- Rendimiento: TTI/LCP; apply_latency < 200 ms.
- Correlación: presencia de request_id en ui.add_to_cart.success.

## 13) Checklists de implementación
Front (PDP)

- Stepper (tabs) ARIA correcto (aria-selected; aria-controls/aria-labelledby; roving tabindex).
- Chips solo válidos (sin deshabilitados) con role="radiogroup"/"radio".
- computeAllowed integra matrices + encaje + safety.
- Auto-selección: último válido → default material → primer válido.
- Zero-mensajes en Add to cart (revalidación silenciosa).
- Undo/Redo (20 pasos, agrupación).
- Accesibilidad y atajos OK.
- Snapshot JPG 1024×1024 a demanda (TTL 90 d).
- Telemetría: eventos y KPI (8.x).
- Intl para formato local (precio/números/fechas).

Visor

- Gestos, toolbar mínima, reset.
- Cross-fade/fade-through en cambios.
- Draco/Meshopt listos; fallback sin compresión.
- Prefetch del camino probable; mantener último frame si falla.

Contenido/i18n

- Labels por label_key en bundles por idioma.
- Plantillas de resumen por mercado.
- Nunca mostrar IDs crudos.

## 14) Pseudocódigo de orquestación (referencia)
onChange(step, value):

state.selection[step] = value

for each nextStep in steps.after(step):

allowed[nextStep] = computeAllowed(snapshot.rules, state)

if state.selection[nextStep] not in allowed[nextStep]:

state.selection[nextStep] = pickAuto(

lastUsedValid[nextStep],

defaultsByMaterial[nextStep],

first(allowed[nextStep])

)

renderChips(allowed, state.selection)

applyToViewer(diff(state.previous, state.selection))

pushHistoryGroupIfUserInitiated()

announceSummary() // aria-live=polite

computeAllowed(state):

return intersect(

matricesByPieceAndMaterial(state),

fitPolicy(clearance_por_material_mm, max_k, target),

safetyLimitsByMaterial(),

textureRules(defines_color)

)

Validación/compra (silenciosa):

addToCart():

key = getOrCreateIdempotencyKey() // UUID v4

payload = canonicalSerialize(state) // pieza→mat→modelo→col→tex→fin

resp = POST /validate-sign (payload, key)

if !resp.ok:

autocorrect(state)

resp2 = POST /validate-sign (canonicalSerialize(state), key)

if !resp2.ok: reopenConfigurator(state) else trackSuccess(resp2)

else:

trackSuccess(resp)

trackSuccess(resp):

emit("ui.add_to_cart.success", { sku_hash: resp.sku_hash, request_id: resp.request_id })

## 15) Mapeo de errores (UI ↔ Capa 3)
- Siempre registrar errores con code estándar (p. ej. E_TEXTURE_DEFINES_COLOR) + reason_key (snake_case) para dashboards.
- El front mantiene Zero-Mensajes: autocorrige y reintenta (sin UI intrusiva).

## 16) Notas finales
- Se reemplaza aria-current por aria-selected en tabs; se añaden aria-controls/aria-labelledby, roving tabindex y aria-busy en paneles.
- reason_key unificado (snake_case) y conjunto alineado con Capa 3 (incluye "timeout").
- Caso Lente: por defecto no tintable (paleta vacía) salvo que el catálogo defina lo contrario.
- Screenshot TTL 90 días por sku_hash (configurable).
- A/B controlado: posible Color ↔ Textura solo en test aprobados; no afecta serialización ni sku_hash.
- Correlación extremo a extremo: idempotency_key en solicitud y request_id en éxito facilitan traza con logs del Admin/Back.
- Optimización de listas: content-visibility:auto, virtualización, preconnect y fetchpriority en assets críticos.
