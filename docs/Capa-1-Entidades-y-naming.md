Capa 1 — Identificadores y Naming

# Capa 1 — Identificadores y Naming (versión final, revisada y completa)
# RAÍZ paramétrica — Anchors & Shape Keys canónicas
• Shape Keys canónicas: SK_W_NARROW, SK_W_WIDE, SK_H_LOW, SK_H_HIGH.

• Rango por defecto: ±25% (snapshot.rules.morphs.morph_range_pct).

• Props GLB (extras) obligatorias: socket_w_mm, socket_h_mm, lug_w_mm, lug_h_mm, min_thickness_mm.

• No nombres creativos por modelo: la lista es API estable.

# Etiquetado FR/TP (Y–W) — uso humano
• Sugerido: FR_Y{mm}_W{mm}, TP_Y{mm}_W{mm}_L/R.

• Runtime no parsea estos nombres; el visor lee props desde el GLB.

Dominio adoptado: Pieza (antes “Parte”) y Modelo (antes “Forma”).Principio rector: IDs editoriales estables e inmutables + binding al GLB para localizar el asset real. Si cambia un asset, se sube como nuevo y se publica nueva versión de catálogo; los IDs antiguos no se tocan.

## 0) Objetivo
Garantizar que catálogo, visor, flujo de chips, carrito y analítica hablen exactamente el mismo idioma:

- IDs para máquinas (persistencia y mensajes).
- Labels para humanos (UI y contenido).
- Reglas de construcción y serialización canónica del estado (SKU).

Nota: “IDs” = claves estables y opacas (sin idioma ni propiedades variables).“Labels” = textos resueltos vía i18n.

## 1) Reglas generales de IDs (con prefijos)
- Slug interno (sin prefijo):Regex: ^[a-z0-9-]{3,48}$ (minúsculas, números y guion medio).
- ID completo (entre plugins, con prefijo obligatorio):Regex: ^(prod|pieza|modelo|mat|col|tex|fin|morph|sku):[a-z0-9-]{3,48}$
- Inmutables y únicos por tipo.
- Sin datos variables en el ID (no medidas, fechas, versión ni idioma).
- Nunca se muestran al usuario (la UI usa labels i18n).
- No permitido: espacios, tildes, mayúsculas, _ . / # @ & ni otros símbolos.

Nota de interoperabilidad: internamente puede omitirse el prefijo si el campo ya implica el tipo (p. ej. material_id), pero entre plugins y en payloads compartidos debe viajar con prefijo.

Ejemplos inválidos (para QA):

- Mat:Acetato (mayúsculas + prefijo mal formado)
- pieza:patilla izquierda (espacio)
- modelo:fr_m1 (guion bajo)
- col:azul#1 (símbolo no permitido)

## 2) Prefijos de tipo (obligatorios entre plugins)
| Producto | prod: | prod:rx-classic |
| Pieza | pieza: | pieza:moldura, pieza:patilla-izquierda |
| Modelo | modelo: | modelo:fr-m1, modelo:tp-p2-l, modelo:lens-slim |
| Material | mat: | mat:acetato, mat:pvd-dorado, mat:lens-standard |
| Color | col: | col:negro, col:habano |
| Textura | tex: | tex:tortoise-01, tex:cepillado, tex:lens-clear |
| Acabado | fin: | fin:clearcoat-high, fin:iridescence |
| Morph | morph: | morph:socket-w, morph:corner-radius |
| Estado/SKU* | sku: | sku:8f2c7e… |

* Estado/SKU no es entidad editorial; es un identificador derivado de la serialización del estado (ver §10).Regla: no reutilizar el mismo slug bajo distintos prefijos para significados diferentes (evita colisiones cognitivas en soporte/analytics).

## 3) IDs de publicación (no editoriales)
Además de los prefijos editoriales, existen identificadores operativos no editoriales:

- snap: → publicación/snapshot (p. ej. snap:2025-09-11T10:00:00Z)
- ver: → versión publicada (p. ej. ver:2025-09-11T10:00:00Z)

Estos no están sujetos al regex de IDs editoriales por diseño, no se muestran en UI y se usan en Capa 2–5 para versionado, publicación y verificación.

## 4) Convenciones específicas
- Lado (L/R): nunca en pieza:; se codifica en modelo: con sufijo -l / -r.Ej.: modelo:tp-p2-l, modelo:tp-p2-r.
- Variante R/U (moldura): no va en el ID. Campo del modelo: variant: 'R' | 'U'.
- Familias/series: sufijos semánticos y consistentes: -m1, -p2, -classic, -mini.

Tip editorial: los sufijos aportan agrupación natural sin filtrar por nombre; no codifican propiedades técnicas (medidas, temporada).

## 5) Labels (i18n) — lo que ve el usuario
- Cada entidad define una label_key (clave i18n estable, sin sufijo de idioma).
- Las traducciones se entregan en bundles por locale (p. ej. es, en, it), no en claves con .es.

Ejemplo (bundle es):

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

"material.lens-standard.name": "Lente estándar",

"color.negro.name": "Negro",

"textura.acetato-base.name": "Acetato base",

"textura.lens-clear.name": "Lente transparente",

"acabado.clearcoat-high.name": "Clearcoat alto"

}

}

Plantillas (Capa UI) construyen el resumen:{{pieza}} · {{material}} — {{color}}{{#if textura}} · {{textura}}{{/if}}{{#if acabado}} · {{acabado}}{{/if}}

Fallbacks seguros (para no mostrar IDs):idioma actual → idioma base → nombre seguro generado (ID sin prefijo, capitalizado).

Racionalización: se eliminan los antiguos label_ui_short/full para evitar duplicidad; solo label_key.

Namespaces i18n reservados:producto.*, pieza.*, modelo.*, material.*, color.*, textura.*, acabado.* (y ui.* reservado para mensajes de interfaz, no para entidades).

## 6) Campos mínimos por entidad (nivel naming/presentación)
- Producto: id (ej. prod:rx-classic), label_key.
- Pieza: id (ej. pieza:moldura), label_key (ej. pieza.moldura.name).
- Modelo: id (ej. modelo:fr-m1), pieza_id, label_key, (opc.) variant ('R'|'U'), (opc.) side ('l'|'r'|'n').
- Material: id, label_key, default_color_id (ej. col:negro o null), default_texture_id (ej. tex:acetato-base o null).
- Color: id, label_key, hex (7 chars, # + RRGGBB en mayúsculas; no usar #RRGGBBAA).
- El Admin normaliza a mayúsculas on-save y el validador bloquea si no cumple ^#[0-9A-F]{6}$.
- Textura: id, label_key, defines_color (bool), slot (base | metal_detail | lens).
- Acabado: id, label_key.
- Morph (naming): id (ej. morph:socket-w), type (geometrico | correctivo), (opc.) analytics_key.

Nota: los campos técnicos extensivos (compatibilidades, límites, políticas) no se codifican en Capa 1; viven en capas superiores.

## 7) Medidas (nombres reservados, siempre en mm)
- Moldura (socket): socket_width_mm, socket_height_mm
- Patilla (lug): lug_width_mm, lug_height_mm
- Tolerancias: tol_w_mm, tol_h_mm

Las medidas son propiedades; no se codifican en IDs.Clearance pertenece a la política de encaje de capas superiores, no a Naming.

## 8) Binding al GLB (enlazar modelo: con el objeto real)
Se guarda en la ficha del Modelo para resolver el asset con máxima robustez:

Referencias al origen

- binding.source.file_name (archivo GLB)
- binding.source.object_name o binding.object_name_pattern (regex oficial)
- binding.source.model_code (A/B/… si aplica)

Señales de desambiguación

- variant ('R'|'U'), side ('l'|'r') cuando aplique.

Custom properties (verdad técnica)

- socket_*_mm (moldura), lug_*_mm (patilla), tol_*_mm si existen.

Regla de resolución

- Preferente por propiedades (mm, variant, side, model_code).
- Fallback por nombre usando el patrón oficial, p. ej.:
  - Moldura: ^FRA_\d+-\d+_(R|U)$
  - Patilla: ^TPA_\d+-\d+_(L|R)$

Nota de pipeline: mantener ejes y escala coherentes con el export (Z↑, metros→mm normalizados en props). El binding no corrige assets; solo los localiza.

## 9) Slots (alcance de materiales/texturas)
Valores fijos (como valores de campo, no en IDs):

- base, metal_detail, lens.

sheath se retira por ahora para reducir ruido. Si en el futuro se necesita, se reintroducirá con su documentación UI/QA.Implicación UI: el slot gobierna dónde se aplica la textura/material en el shader/mesh (capas superiores definen cómo).

## 10) Morphs — tipología y nombres (solo Naming)
Tipos:

- geometrico (POSITION): cambia la malla (ej. morph:socket-w, morph:socket-h).
- correctivo (NORMAL/TANGENT): corrige iluminación (ej. morph:corner-radius).

IDs canónicos sugeridos:

- morph:socket-w, morph:socket-h, morph:corner-radius, morph:fillet-blending.

Rango, clearances y reglas de seguridad se fijan en capas superiores (no en Naming).Compatibilidad: si existen morph_aliases legacy, se declaran fuera de Capa 1 (documentar en Catálogo/Compat).

## 11) Serialización canónica del Estado / SKU
El estado se serializa como lista ordenada de bloques por pieza.

Orden de claves en cada bloque:pieza → mat → modelo → col → tex → fin

Reglas:

- Incluir solo las claves que existan en esa pieza.
- Orden de piezas fijo (editorial), p. ej.:pieza:moldura → pieza:patilla-izquierda → pieza:patilla-derecha → pieza:lente (y futuras).
- Sin espacios ni claves extra.
- Mismo contenido y mismo orden ⇒ mismo SKU.

Morphs y SKU: por defecto no viajan en el SKU.Son derivables de: snapshot + encaje_policy + props de modelos + selección ⇒ deterministas.(Opcional avanzado: modo de firma que incluya un apéndice de morphs normalizados).

Ejemplo:

[

{ "pieza":"pieza:moldura","mat":"mat:acetato","modelo":"modelo:fr-m1","col":"col:negro","tex":"tex:acetato-base","fin":"fin:clearcoat-high" },

{ "pieza":"pieza:patilla-izquierda","mat":"mat:acetato","modelo":"modelo:tp-p2-l" },

{ "pieza":"pieza:patilla-derecha","mat":"mat:acetato","modelo":"modelo:tp-p2-r" },

{ "pieza":"pieza:lente","mat":"mat:lens-standard","modelo":"modelo:lens-slim" }

]

Nota: sku: como prefijo puede usarse para el identificador resultante (sku:<hash>), pero no define una entidad de catálogo.

## 12) Versionado y compatibilidad
- Todo payload entre plugins incluye schema_version (SemVer, p. ej., 1.0.0).
- Cambios incompatibles ⇒ major.
- Si se usan feature flags, que no dupliquen lógicas de otras capas (p. ej., no poner defines_color en Producto: esa lógica vive en Textura).

Sugerencia de control: mantener un CHANGELOG por capa con Added/Changed/Deprecated/Removed/Fixed/Security.

## 13) Palabras reservadas (no usar como ID)
default, all, none, true, false, null, na, r, u, l.

Motivo: colisionan con valores especiales, banderas o sufijos funcionales (lado/variante).

## 14) Deprecación y reemplazo
Para retirar una entidad:

- deprecated: true
- superseded_by: "<id-nuevo>"

Mantener publicada mientras existan SKUs vigentes que la referencien (histórico/pedidos).

Buena práctica: anunciar la deprecación en Admin con fecha objetivo y sugerencia de reemplazo para editores.

## 15) Buenas prácticas de naming
- Corto y claro: pvd-dorado, fr-m1, tp-p2-l.
- Consistente: sufijos uniformes (-high/-low, -m1/-m2).
- No dupliques significado entre ID y label (el label ya es humano).
- No metas medidas ni temporada en el ID (van en propiedades/labels si hace falta).

Anti-patrones (evitar):

- modelo:fr-m1-145mm-2025 (medidas/fechas en ID)
- mat:rose-gold-EN (idioma en ID)
- pieza:temple-left (mezcla de idiomas y término antiguo)

## 16) Migración de términos (si vienes de Part/Form)
- part:frame → pieza:moldura
- part:temple-left/right → pieza:patilla-izquierda/derecha
- form:fr-m1 → modelo:fr-m1
- form:tp-p2-l/r → modelo:tp-p2-l/r

En SKU/eventos: part → pieza, form → modelo.

QA sugerido: script de validación que detecte estos alias legacy y bloquee nuevas altas con términos antiguos.

## 17) Checklist de conformidad (rápida)
- IDs completos cumplen ^(prod|pieza|modelo|mat|col|tex|fin|morph|sku):[a-z0-9-]{3,48}$.
- Lado solo en modelo (-l/-r), no en pieza:.
- Labels i18n: solo label_key; traducciones en bundles por locale (sin sufijos .es en la clave).
- HEX siempre #RRGGBB en mayúsculas.
- Medidas solo en campos *_mm; clearance en encaje (no en Naming).
- Binding al GLB guardado (binding.source, binding.props, patrón de nombre oficial).
- SKU serializado con claves pieza/mat/modelo/col/tex/fin y orden de piezas fijo.
- schema_version presente en todos los payloads compartidos.
- Palabras reservadas no usadas como IDs.
- No sustituir assets publicados: si cambian, nuevo asset + nueva versión.
- Namespaces i18n para entidades presentes (producto.*, pieza.*, modelo.*, material.*, color.*, textura.*, acabado.*).

## Apéndice A — Reglas de linting recomendadas (opcional, no funcional)
- Rechazar IDs con longitud <3 o >48.
- Rechazar IDs con caracteres no permitidos.
- En color.hex, forzar uppercase y validar ^#[0-9A-F]{6}$.
- En label_key, validar patrón <namespace>.<slug>.name con namespace ∈ {producto,pieza,modelo,material,color,textura,acabado}.
- Preflight de unicidad (por prefijo) en el catálogo antes de publicar.

## Apéndice B — Ejemplo de “binding” robusto (modelo, canónico)
{

"id": "modelo:tp-p2-l",

"pieza_id": "pieza:patilla-izquierda",

"label_key": "modelo.tp-p2-l.name",

"side": "l",

"variant": "U",

"binding": {

"source": {

"file_name": "TP_P2_pack.glb",

"object_name_pattern": "^TPA_\\d+-\\d+_L$",

"model_code": "TPA"

},

"props": {

"lug_width_mm": 5.2,

"lug_height_mm": 3.8,

"tol_w_mm": 0.2,

"tol_h_mm": 0.2

}

},

"schema_version": "1.0.0"

}
