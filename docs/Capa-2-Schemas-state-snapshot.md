Capa 2 — Esquemas de datos completos

# Capa 2 — Esquemas de datos completos (contrato entre plugins)
# Convenciones de Schemas & Ejemplos
• Nombre de snapshot: snapshot.schema.json.

• Ejemplos viven en packages/schemas/examples/ con sufijos valid/invalid.

# Snapshot.rules.morphs — contrato
• morph_range_pct: 0–100 (def 25).

• clearance_mm_by_material: p.ej. madera 0.20, acetato 0.10, metal 0.05.

• min_thickness_mm_by_material: espesores mínimos por material.

• shape_keys: lista esperada por pieza.

# Lectura de medidas en runtime
• El visor lee socket_*, lug_*, min_thickness_mm desde extras del GLB.

• Etiquetado Y–W es solo para QA humano.

Meta: esta capa define el contrato de datos que consumen y emiten los plugins (Catálogo, Admin, Flow/UI, Visor). Todo ejemplo está actualizado para alinear Naming (Capa 1), Validación/Firma (Capa 3), UI/UX (Capa 4) y Admin (Capa 5).

## 0) Convenciones base
- IDs editoriales con prefijos entre plugins^(prod|pieza|modelo|mat|col|tex|fin|morph|sku):[a-z0-9-]{3,48}$(El slug interno es ^[a-z0-9-]{3,48}$; el prefijo es obligatorio cuando viaja entre plugins.)
- IDs de publicación (no editoriales)Para publicaciones y versiones usamos prefijos reservados fuera del set editorial:snap: (publicación/snapshot) y ver: (versión publicada), p. ej. snap:2025-09-11T10:00:00Z, ver:2025-09-11T10:00:00Z.
- Nota: estos no están sujetos al regex de IDs editoriales anterior por diseño.
- Labels i18n: los textos van por claves estables (label_key). Las traducciones se entregan en bundles por locale. Nunca se muestran IDs al usuario.
- Medidas: en mm. Campos terminan en *_mm.
- Color HEX: #RRGGBB (7 chars, uppercase). El Admin normaliza on-save.
- Slots (alcance de materiales/texturas): base, metal_detail, lens. (Se retira sheath por ahora.)
- Lado: l | r | n. Variante: R | U.
- Versión de esquema en todos los payloads: schema_version: "1.x.y".
- Zero-mensajes: en front no hay chips deshabilitados; las reglas ocultan lo inválido y el front autocorrige.
- Snapshot: cuando se empaqueta el catálogo, se publica un objeto snapshot inmutable.Referencia externa estándar: snapshot_id (igual a snapshot.id).

## 1) Entidades editoriales (Catálogo)
### 1.1 Producto
Se elimina cualquier features.defines_color (esa lógica vive en Textura).

{

"id": "prod:rx-classic",

"label_key": "producto.rx-classic.name",

"piezas": [

"pieza:moldura", "pieza:patilla-izquierda", "pieza:patilla-derecha", "pieza:lente"

],

"schema_version": "1.0.0"

}

### 1.2 Pieza
{ "id": "pieza:moldura", "label_key": "pieza.moldura.name", "order": 1 }

### 1.3 Modelo (con binding al GLB)
{

"id": "modelo:tp-p2-l",

"pieza_id": "pieza:patilla-izquierda",

"label_key": "modelo.tp-p2-l.name",

"side": "l",

"variant": null,

"binding": {

"source": {

"file_name": "TPA_6-3_L.glb",

"object_name": "TPA_6-3_L",

"model_code": "A"

},

"props": {

"lug_width_mm": 3.00,

"lug_height_mm": 6.00,

"socket_width_mm": null,

"socket_height_mm": null,

"tol_w_mm": 0.30,

"tol_h_mm": 0.50

},

"object_name_pattern": "^TPA_\\d+-\\d+_L$"

},

"morph_capabilities": [ ],

"morph_aliases": {

"Old_Width": "morph:socket-w",

"Old_Height": "morph:socket-h"

},

"tags": ["estandar"],

"active": true

}

### 1.4 Material (defaults + seguridad)
Fuente única de holguras es la política de encaje (no en Material). El bloque safety aquí es informativo; el validador exige que coincida con rules.encaje.safety (o se omite en Material).

{

"id": "mat:acetato",

"label_key": "material.acetato.name",

"default_color_id": "col:negro",

"default_texture_id": "tex:acetato-base",

"safety": {

"min_thickness_mm": 2.20,

"min_corner_radius_mm": 0.40

}

}

Se añade a entidades: mat:metal (usado en matrices/defaults más abajo) y mat:madera, mat:lens-standard.

### 1.5 Color (paleta y tintado)
{

"id": "col:negro",

"label_key": "color.negro.name",

"hex": "#000000",

"source": "palette",

"tint_rules": {

"tintable": true,

"allowed_texturas": [],

"blend": "multiply"

}

}

Se añaden a entidades (cerrar ejemplos):col:gris-oscuro → #333333 · col:dorado → #D4AF37 · col:habano → #7B5A3A

### 1.6 Textura (embebida o generada)
Textura embebida (define color):

{

"id": "tex:wood-oak-01",

"label_key": "textura.wood-oak-01.name",

"defines_color": true,

"slot": "base",

"source": "embedded",

"appearance": {

"color_mode": "fixed",

"pbr": { "metallic": 0.0, "roughness": 0.7 }

},

"binding": {

"embedded": {

"glb_material": "MAT_WOOD_OAK",

"maps": {

"baseColor": "glb://MAT_WOOD_OAK#BaseColor",

"normal": "glb://MAT_WOOD_OAK#Normal",

"roughness": "glb://MAT_WOOD_OAK#Roughness"

}

},

"generated": null

}

}

Ejemplo de textura generada y tintable:

{

"id": "tex:metal-brushed-std",

"label_key": "textura.metal-brushed-std.name",

"defines_color": false,

"slot": "base",

"source": "generated",

"appearance": { "color_mode": "tintable", "pbr": { "metallic": 1.0, "roughness": 0.35 } },

"binding": {

"generated": {

"generator_type": "brushed_metal",

"params": { "grain_scale": 0.5, "anisotropy": 0.8, "normal_intensity": 0.4 }

}

}

}

Enum generator_type permitido (contrato):["solid_translucent","brushed_metal","wood"] (extensible vía minor)

Fuente única de “tintabilidad”: appearance.color_mode. (Se elimina binding.generated.tintable.)

Se añade a entidades (cerrar matrices):tex:wood-walnut-raw (embedded, defines_color: true, slot: "base").tex:acetato-base (generated, tintable) ya existe.

### 1.7 Acabado
{ "id": "fin:clearcoat-high", "label_key": "acabado.clearcoat-high.name" }

### 1.8 Morph (catálogo de nombres)
{

"id": "morph:socket-w",

"type": "geometrico",

"analytics_key": "socket-w"

}

## 2) Reglas editoriales (filtrado y defaults)
Regla troncal: Material → limita Modelo / Color / Textura (por Pieza).En front solo se listan opciones permitidas (sin deshabilitados).

### 2.1 Matriz Material → Modelos (por Pieza)
{

"pieza:moldura": {

"mat:acetato": { "modelos": ["modelo:fr-m1", "modelo:fr-m2"] },

"mat:metal": { "modelos": ["modelo:fr-m1"] }

},

"pieza:patilla-izquierda": {

"mat:acetato": { "modelos": ["modelo:tp-p2-l", "modelo:tp-p3-l"] },

"mat:metal": { "modelos": ["modelo:tp-m1-l"] }

},

"pieza:patilla-derecha": {

"mat:acetato": { "modelos": ["modelo:tp-p2-r", "modelo:tp-p3-r"] },

"mat:metal": { "modelos": ["modelo:tp-m1-r"] }

},

"pieza:lente": {

"mat:lens-standard": { "modelos": ["modelo:lens-slim"] }

}

}

### 2.2 Matriz Material → Colores
{

"mat:acetato": { "colores": ["col:negro", "col:habano", "col:dorado"] },

"mat:metal": { "colores": ["col:gris-oscuro", "col:dorado"] },

"mat:madera": { "colores": [] },

"mat:lens-standard": { "colores": [] }

}

Nota: si una textura tintable está activa para un material, esta matriz debe tener ≥1 color permitido.Para el caso Lente estándar se usa textura fija (ver tex:lens-clear abajo), por eso la paleta queda vacía aquí.

### 2.3 Matriz Material → Texturas
{

"mat:madera": { "texturas": ["tex:wood-oak-01", "tex:wood-walnut-raw"] },

"mat:acetato": { "texturas": ["tex:acetato-base"] },

"mat:metal": { "texturas": ["tex:metal-brushed-std"] },

"mat:lens-standard": { "texturas": ["tex:lens-clear"] }

}

### 2.4 Defaults por Material (globales)
{

"by_material": {

"mat:acetato": { "color": "col:negro", "textura": "tex:acetato-base" },

"mat:metal": { "color": "col:gris-oscuro", "textura": "tex:metal-brushed-std" },

"mat:madera": { "color": null, "textura": "tex:wood-oak-01" },

"mat:lens-standard": { "color": null, "textura": "tex:lens-clear" }

}

}

Prioridad de defaults en front: último usado válido → default del material → primer válido.Si tex.defines_color = true, el paso Color se oculta/sincroniza mientras esa textura esté activa.

## 3) Encaje y morphs (datos de control)
### 3.1 Política de encaje (producto o pieza)
Fuente única de holguras: clearance_por_material_mm (mapa).Enum explícito: target ∈ {"lug","socket"}.

{

"encaje_policy": {

"driver": "moldura",

"target": "lug",

"clearance_por_material_mm": {

"mat:madera": 0.20,

"mat:acetato": 0.10,

"mat:metal": 0.05

},

"max_k": 1.0,

"on_out_of_range": "ocultar_opcion",

"safety": {

"min_thickness_mm": {

"mat:madera": 2.80,

"mat:acetato": 2.20,

"mat:metal": 1.20

},

"min_corner_radius_mm": {

"mat:madera": 0.60,

"mat:acetato": 0.40,

"mat:metal": 0.30

}

}

}

}

Guía de uso del target:

- driver:"moldura", target:"lug" → la moldura se adapta al lug (patilla). (Caso más común)
- driver:"patilla", target:"socket" → la patilla se adapta al socket (moldura).
- driver:"mixto" → par avanzado pieza↔pieza (futuro).

### 3.2 Morphs por Modelo (capabilities)
{

"morph_capabilities": [

{ "id": "morph:socket-w", "range_norm": [-1, 1], "maps_to": ["SK_W_Wide", "SK_W_Narrow"] },

{ "id": "morph:socket-h", "range_norm": [-1, 1], "maps_to": ["SK_H_High", "SK_H_Low"] }

]

}

En patillas suele ir vacío. Más adelante podrás añadir morphs a otras piezas sin cambiar el contrato.

### 3.3 Determinismo (SKU reproducible)
- Los morphs no viajan en el SKU: se derivan siempre de snapshot + encaje_policy + props de los modelos + selección.
- Dado el mismo snapshot_id, la misma selección produce los mismos k.

(Opción avanzada): modo de firma que incluya un apéndice de morphs normalizados.

## 4) Snapshot publicado (lo que consume el front/visor)
{

"snapshot": {

"id": "snap:2025-09-11T10:00:00Z",

"schema_version": "1.0.0",

"producto_id": "prod:rx-classic",

"published_at": "2025-09-11T10:00:00Z",

"i18n_locales": ["es","en","it","fr"],

"sku_policy": { "include_morphs_in_sku": false, "morph_precision_decimals": 2 },

"entities": {

"piezas": {

"pieza:moldura": { "id": "pieza:moldura", "label_key": "pieza.moldura.name", "order": 1 },

"pieza:patilla-izquierda": { "id": "pieza:patilla-izquierda", "label_key": "pieza.patilla-izquierda.name", "order": 2 },

"pieza:patilla-derecha": { "id": "pieza:patilla-derecha", "label_key": "pieza.patilla-derecha.name", "order": 3 },

"pieza:lente": { "id": "pieza:lente", "label_key": "pieza.lente.name", "order": 4 }

},

"modelos": {

"modelo:fr-m1": {

"id": "modelo:fr-m1",

"pieza_id": "pieza:moldura",

"label_key": "modelo.fr-m1.name",

"side": "n",

"variant": "R",

"binding": {

"source": { "file_name": "FRA_12-6_R.glb", "object_name": "FRA_12-6_R" },

"props": { "socket_width_mm": 3.0, "socket_height_mm": 6.0, "tol_w_mm": 0.3, "tol_h_mm": 0.5 }

},

"morph_capabilities": [

{ "id": "morph:socket-w", "range_norm": [-1, 1] },

{ "id": "morph:socket-h", "range_norm": [-1, 1] }

],

"active": true

},

"modelo:tp-p2-l": {

"id": "modelo:tp-p2-l",

"pieza_id": "pieza:patilla-izquierda",

"label_key": "modelo.tp-p2-l.name",

"side": "l",

"binding": {

"source": { "file_name": "TPA_6-3_L.glb", "object_name": "TPA_6-3_L" },

"props": { "lug_width_mm": 3.0, "lug_height_mm": 6.0, "tol_w_mm": 0.3, "tol_h_mm": 0.5 }

},

"morph_capabilities": [],

"active": true

},

"modelo:tp-p2-r": {

"id": "modelo:tp-p2-r",

"pieza_id": "pieza:patilla-derecha",

"label_key": "modelo.tp-p2-r.name",

"side": "r",

"binding": {

"source": { "file_name": "TPA_6-3_R.glb", "object_name": "TPA_6-3_R" },

"props": { "lug_width_mm": 3.0, "lug_height_mm": 6.0, "tol_w_mm": 0.3, "tol_h_mm": 0.5 }

},

"morph_capabilities": [],

"active": true

},

"modelo:lens-slim": {

"id": "modelo:lens-slim",

"pieza_id": "pieza:lente",

"label_key": "modelo.lens-slim.name",

"side": "n",

"binding": {

"source": { "file_name": "LNS_Slim.glb", "object_name": "LNS_Slim" },

"props": { "tol_w_mm": 0.1, "tol_h_mm": 0.1 }

},

"morph_capabilities": [],

"active": true

}

},

"materiales": {

"mat:acetato": {

"id": "mat:acetato",

"label_key": "material.acetato.name",

"default_color_id": "col:negro",

"default_texture_id": "tex:acetato-base",

"safety": { "min_thickness_mm": 2.20, "min_corner_radius_mm": 0.40 }

},

"mat:metal": {

"id": "mat:metal",

"label_key": "material.metal.name",

"default_color_id": "col:gris-oscuro",

"default_texture_id": "tex:metal-brushed-std",

"safety": { "min_thickness_mm": 1.20, "min_corner_radius_mm": 0.30 }

},

"mat:madera": {

"id": "mat:madera",

"label_key": "material.madera.name",

"default_color_id": null,

"default_texture_id": "tex:wood-oak-01",

"safety": { "min_thickness_mm": 2.80, "min_corner_radius_mm": 0.60 }

},

"mat:lens-standard": {

"id": "mat:lens-standard",

"label_key": "material.lens-standard.name",

"default_color_id": null,

"default_texture_id": "tex:lens-clear",

"safety": { "min_thickness_mm": 1.00, "min_corner_radius_mm": 0.30 }

}

},

"colores": {

"col:negro": {

"id": "col:negro",

"label_key": "color.negro.name",

"hex": "#000000",

"source": "palette",

"tint_rules": { "tintable": true, "allowed_texturas": [], "blend": "multiply" }

},

"col:gris-oscuro": {

"id": "col:gris-oscuro",

"label_key": "color.gris-oscuro.name",

"hex": "#333333",

"source": "palette",

"tint_rules": { "tintable": true, "allowed_texturas": [], "blend": "multiply" }

},

"col:dorado": {

"id": "col:dorado",

"label_key": "color.dorado.name",

"hex": "#D4AF37",

"source": "palette",

"tint_rules": { "tintable": true, "allowed_texturas": [], "blend": "multiply" }

},

"col:habano": {

"id": "col:habano",

"label_key": "color.habano.name",

"hex": "#7B5A3A",

"source": "palette",

"tint_rules": { "tintable": true, "allowed_texturas": [], "blend": "multiply" }

}

},

"texturas": {

"tex:wood-oak-01": {

"id": "tex:wood-oak-01",

"label_key": "textura.wood-oak-01.name",

"defines_color": true,

"slot": "base",

"source": "embedded",

"appearance": { "color_mode": "fixed", "pbr": { "metallic": 0.0, "roughness": 0.7 } },

"binding": { "embedded": { "glb_material": "MAT_WOOD_OAK" } }

},

"tex:wood-walnut-raw": {

"id": "tex:wood-walnut-raw",

"label_key": "textura.wood-walnut-raw.name",

"defines_color": true,

"slot": "base",

"source": "embedded",

"appearance": { "color_mode": "fixed", "pbr": { "metallic": 0.0, "roughness": 0.65 } },

"binding": { "embedded": { "glb_material": "MAT_WOOD_WALNUT" } }

},

"tex:acetato-base": {

"id": "tex:acetato-base",

"label_key": "textura.acetato-base.name",

"defines_color": false,

"slot": "base",

"source": "generated",

"appearance": { "color_mode": "tintable", "pbr": { "metallic": 0.0, "roughness": 0.4 } },

"binding": { "generated": { "generator_type": "solid_translucent", "params": { "transmission": 0.4, "roughness": 0.4 } } }

},

"tex:metal-brushed-std": {

"id": "tex:metal-brushed-std",

"label_key": "textura.metal-brushed-std.name",

"defines_color": false,

"slot": "base",

"source": "generated",

"appearance": { "color_mode": "tintable", "pbr": { "metallic": 1.0, "roughness": 0.35 } },

"binding": { "generated": { "generator_type": "brushed_metal", "params": { "grain_scale": 0.5, "anisotropy": 0.8, "normal_intensity": 0.4 } } }

},

"tex:lens-clear": {

"id": "tex:lens-clear",

"label_key": "textura.lens-clear.name",

"defines_color": false,

"slot": "lens",

"source": "generated",

"appearance": { "color_mode": "fixed", "pbr": { "metallic": 0.0, "roughness": 0.05 } },

"binding": { "generated": { "generator_type": "solid_translucent", "params": { "transmission": 0.95, "ior": 1.50, "absorption": 0.02 } } }

}

},

"acabados": {

"fin:clearcoat-high": { "id": "fin:clearcoat-high", "label_key": "acabado.clearcoat-high.name" }

}

},

"rules": {

"material_to_modelos": { /* ver 2.1 */ },

"material_to_colores": { /* ver 2.2 */ },

"material_to_texturas": { /* ver 2.3 */ },

"defaults": { /* ver 2.4 */ },

"encaje": {

"driver": "moldura",

"target": "lug",

"clearance_por_material_mm": { "mat:madera": 0.20, "mat:acetato": 0.10, "mat:metal": 0.05 },

"max_k": 1.0,

"on_out_of_range": "ocultar_opcion",

"safety": {

"min_thickness_mm": { "mat:madera": 2.80, "mat:acetato": 2.20, "mat:metal": 1.20 },

"min_corner_radius_mm": { "mat:madera": 0.60, "mat:acetato": 0.40, "mat:metal": 0.30 }

}

},

"morph_rules": {

"normalizado": { "min": -1.0, "max": 1.0, "equivale_a": "±25% del valor base" }

}

}

}

}

Nota: otros payloads que referencian esta publicación lo harán con snapshot_id (idéntico a snapshot.id).

## 5) Estado de configuración (cliente) y SKU
### 5.1 Estado (runtime)
{

"schema_version": "1.0.0",

"producto_id": "prod:rx-classic",

"piezas": [

{ "pieza": "pieza:moldura", "mat": "mat:acetato", "modelo": "modelo:fr-m1", "col": "col:negro", "tex": "tex:acetato-base", "fin": "fin:clearcoat-high" },

{ "pieza": "pieza:patilla-izquierda", "mat": "mat:acetato", "modelo": "modelo:tp-p2-l" },

{ "pieza": "pieza:patilla-derecha", "mat": "mat:acetato", "modelo": "modelo:tp-p2-r" },

{ "pieza": "pieza:lente", "mat": "mat:lens-standard", "modelo": "modelo:lens-slim" }

],

"morphs": {

"morph:socket-w": 0.18,

"morph:socket-h": -0.06

}

}

### 5.2 Serialización canónica → sku_hash
- Orden de piezas por order editorial (moldura → patilla-L → patilla-R → lente → …).
- Claves en cada bloque: pieza → mat → modelo → col → tex → fin (solo las que existan).
- Por defecto, los morphs NO viajan (internos para encaje; no alteran precio).
- Misma serialización ⇒ mismo sku_hash.

(Si negocio exige incluirlos): se añaden como apéndice ordenado (por id ascendente) con 2–3 decimales. Este modo debe reflejarse en sku_policy del snapshot.

## 6) Acciones y eventos (front ↔ visor)
### 6.1 Acciones (front → visor)
{ "type": "set_material", "pieza_id": "pieza:moldura", "material_id": "mat:acetato" }

{ "type": "set_modelo", "pieza_id": "pieza:patilla-izquierda", "modelo_id": "modelo:tp-p2-l" }

{ "type": "set_color", "pieza_id": "pieza:moldura", "color_id": "col:negro" }

{ "type": "set_textura", "pieza_id": "pieza:moldura", "textura_id": "tex:acetato-base" }

{ "type": "set_acabado", "pieza_id": "pieza:moldura", "acabado_id": "fin:clearcoat-high" }

{ "type": "set_morph", "morph_id": "morph:socket-w", "value": 0.18 }

{ "type": "undo" }

{ "type": "redo" }

{ "type": "snapshot_request", "angles": [30, 45, 90] }

### 6.2 Eventos (visor → front / analytics)
Unificación con Capa 4 (telemetría canónica en inglés + namespace ui.*)Eventos previos en español (ej. flujo_listo, seleccion_aplicada_{paso}) se mapean a los canónicos ui.* para dashboards estables.

{ "event": "ui.ready" }

{ "event": "ui.applied", "pieza_id": "pieza:moldura", "changed": ["mat","modelo","col","tex","fin"], "latency_ms": 72 }

{ "event": "ui.metrics", "fps": 58, "apply_latency_ms": 72 }

{ "event": "ui.snapshot_ready", "url": "https://cdn/sku/8f2c7e.jpg" }

{ "event": "ui.error", "code": "E_TEXTURE_DEFINES_COLOR", "reason_key": "texture_defines_color", "detail": "color ignorado por textura que define color" }

Códigos estándar (para lógica/logs; en front rige Zero-mensajes):E_INVALID_ID, E_RULE_VIOLATION, E_TEXTURE_DEFINES_COLOR, E_ASSET_MISSING, E_MORPH_RANGE, E_TIMEOUT, E_UNSUPPORTED_FEATURE.

reason_key acompaña a code para facilitar dashboards y búsquedas legibles; el valor es estable y en snake_case.

## 7) i18n (paquete de textos)
{

"locale": "es",

"strings": {

"producto.rx-classic.name": "RX Classic",

"pieza.moldura.name": "Montura",

"pieza.patilla-izquierda.name": "Patilla izquierda",

"pieza.patilla-derecha.name": "Patilla derecha",

"pieza.lente.name": "Lente",

"modelo.fr-m1.name": "FR M1",

"modelo.tp-p2-l.name": "TP P2 L",

"modelo.tp-p2-r.name": "TP P2 R",

"modelo.lens-slim.name": "Lente Slim",

"material.acetato.name": "Acetato",

"material.metal.name": "Metal",

"material.madera.name": "Madera",

"material.lens-standard.name": "Lente estándar",

"color.negro.name": "Negro",

"color.gris-oscuro.name": "Gris oscuro",

"color.dorado.name": "Dorado",

"color.habano.name": "Habano",

"textura.acetato-base.name": "Acetato base",

"textura.metal-brushed-std.name": "Metal cepillado",

"textura.wood-oak-01.name": "Roble 01",

"textura.wood-walnut-raw.name": "Nogal crudo",

"textura.lens-clear.name": "Lente transparente",

"acabado.clearcoat-high.name": "Clearcoat alto"

}

}

Front usa plantillas para componer el resumen:{{pieza}} · {{material}} — {{color}}{{#if textura}} · {{textura}}{{/if}}{{#if acabado}} · {{acabado}}{{/if}}Fallback: idioma actual → idioma base → nombre seguro (id sin prefijo, capitalizado).No se usan label_ui_short/full (evitamos duplicidad).

## 8) Validador editorial (previo a publicar)
Estructura e IDs

- IDs únicos; regex y prefijos correctos.
- pieza.order consistente y sin huecos.

Binding de Modelos

- source.object_name o object_name_pattern presentes.
- Props mínimas según pieza (moldura: socket_*_mm; patilla: lug_*_mm).
- (Opc.) anclas/nodos si tu pipeline los usa.

Reglas y defaults

- Cada Material tiene ≥1 Modelo permitido en cada Pieza activa.
- Si Color/Textura están activos, cada Material tiene ≥1 Color / ≥1 Textura.
- Defaults por Material existen y están permitidos en sus matrices.

Texturas y Colores

- tex.source="embedded" ⇒ binding.embedded.glb_material válido.
- tex.source="generated" ⇒ generator_type (enum) + params definidos.
- Si appearance.color_mode === "tintable" ⇒ hay ≥1 Color permitido para ese Material.
- Si tex.defines_color = true ⇒ el front oculta Color cuando corresponde.

Seguridad/encaje

- encaje_policy presente; única fuente de holguras: clearance_por_material_mm + max_k.
- Límites min_thickness_mm y min_corner_radius_mm por material presentes.
- Consistencia: si material.safety existe, debe coincidir con rules.encaje.safety (o warning/bloqueo según política).

Publicación

- Bloquea si hay errores; avisos no bloquean.

## 9) Versionado de catálogo (publicación)
{

"catalog_version": {

"id": "ver:2025-09-11T10:00:00Z",

"schema_version": "1.0.0",

"snapshot_id": "snap:2025-09-11T10:00:00Z",

"notes": "Colección RX · v1",

"published_by": "editor@tu-sitio",

"published_at": "2025-09-11T10:00:00Z"

}

}

Front/Visor consumen siempre una versión publicada e inmutable.

## 10) Analytics (mínimo útil, sin PII)
Canónico (alineado con Capa 4): eventos ui.*. Puedes seguir produciendo alias en español para compatibilidad, pero los dashboards deben basarse en ui.*.

- Eventos (canónicos): ui.ready, ui.applied, ui.metrics, ui.undo, ui.redo, ui.snapshot_ready, ui.add_to_cart.click.(Alias heredados: flujo_listo, seleccion_aplicada_{paso}, snapshot_generada, add_to_cart_click)
- Dimensiones: producto_id, pieza_id, material_id, modelo_id, color_id, textura_id, acabado_id, variante_ab, device, locale, texture_source (embedded|generated), tint_applied (bool).
- Métricas sugeridas: Embudo por paso, top selecciones, latencias medianas, % embedded vs generated.

## 11) Checklists rápidas
Catálogo

- Prefijos correctos y regex IDs.
- i18n completo (solo label_key + bundles por locale).
- Binding al GLB (source + props).
- Matrices Material→Modelos/Colores/Texturas coherentes.
- Defaults por material válidos.
- Encaje: clearance_por_material_mm, max_k, límites de seguridad.

Snapshot

- schema_version + snapshot.id (y snapshot_id como referencia externa).
- Entidades completas y referenciadas.
- Reglas + defaults + encaje correctos.
- Orden de piezas consistente.

Front/Visor

- Solo opciones válidas (sin deshabilitados).
- Serialización canónica → sku_hash estable.
- defines_color oculta Color cuando corresponde.
- Snapshot JPG generado correctamente al solicitarlo.

## 12) Notas finales (decisiones consolidadas)
- Pieza/Modelo como dominio oficial.
- Binding al GLB (nombre y props) para localizar el asset sin depender del ID.
- Texturas embebidas (pueden definir color) y texturas generadas tintables (usan paleta), con tintabilidad centralizada en appearance.color_mode.
- Encaje parametrizado por material con holguras en encaje_policy; morphs opcionales y preparados para más piezas.
- SKU con discretos (pieza/mat/modelo/col/tex/fin), sin morphs por defecto (deterministas vía snapshot + encaje).
- Telemetría unificada a ui.* (con mapeo de alias en español si hace falta).
- Publicación con snap: y ver: para objetos no editoriales.
