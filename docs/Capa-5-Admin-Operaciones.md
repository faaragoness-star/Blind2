# Capa 5 — Admin & Operaciones (revisada, cerrada y super completa)
# Despliegue a WordPress (viewer & bridge)
• Copiar apps/viewer/ → /wp-content/uploads/g3d/viewer/

• Copiar apps/viewer/bridge/g3d-bridge.js → /wp-content/uploads/g3d/g3d-bridge.js

• Shortcode en la página: [g3d_viewer]

# Plugin único (MVP v1)
Usar apps/wp-plugin/g3d-endpoints-unified.php. Desactivar otros plugins /g3d/*.

# QA bloqueante — RAÍZ paramétrica/morphs
• GLB con SK canónicas; sin Draco en mallas con morphs (usar Meshopt).

• Props obligatorias presentes; coherencia con snapshot.rules.morphs.*

## 0) Objetivo
Permitir que el equipo editorial suba GLB uno a uno, defina Material/Color/Textura/Acabado, reglas y encaje, previsualice con Zero-mensajes y publique snapshots inmutables con control de versiones, auditoría y calidad asegurada.

## 1) Roles y permisos (RBAC)
| Editor | Crear/editar en Borrador, cargar GLB (uno a uno), gestionar i18n local | Publicar, cambiar claves de firma, borrar versiones |
| QA/Revisor | Ejecutar Validador, marcar Listo para publicar, aprobar cambios | Editar reglas, publicar |
| Publicador | Crear Snapshot, Publicar/Rollback, activar rotación de firma | Editar catálogo |
| Admin | Configurar firma (sig.vN), caducidades, orígenes permitidos (CORS), backups, SSO/2FA | — |

Recomendación: “dos pares de ojos” (mínimo un revisor ≠ editor para publicar).Multi-marca/colecciones: RBAC por colección (scope en roles, vistas y exportaciones).

## 2) Estados y flujo de trabajo editorial
Borrador → En revisión → Aprobado QA → Staging → Publicado

- Borrador: edición libre; IDs y referencias validadas on-save (suaves).
- En revisión: Validador duro (bloqueantes); se piden correcciones.
- Aprobado QA: congelado parcial (solo campos de presentación).
- Staging: snapshot de ensayo (idéntico a prod) para E2E.
- Publicado: genera snapshot.id inmutable y crea Versión de catálogo (§7).

Trazabilidad: toda transición registra quién/cuándo/qué y el diff por campo.

## 3) Módulos del Admin (pantallas)
### 3.1 Modelos (GLB)
- Ingesta uno a uno (controlada): calcula hash, tamaño, flags Draco/Meshopt.
- Auto-análisis: source.file_name/object_name, model_code, side/variant, props mm/tolerancias, materiales/texturas embebidas.
- Campos: modelo_id, pieza_id, label_key, binding (source/props/pattern), morph_capabilities, morph_aliases, active.

### 3.2 Materiales
- Defaults: default_color_id, default_texture_id.
- Seguridad: min_thickness_mm, min_corner_radius_mm. (No hay clearance aquí; vive en encaje_policy, §6/§16).

### 3.3 Colores
- hex #RRGGBB (mayúsculas) — normalizado on-save.
- source: palette|embedded|generated, tint_rules (p. ej. blend:"multiply").

### 3.4 Texturas
- Embebida: glb_material, maps (base/normal/roughness), defines_color.
- Generada: generator_type (enum solid_translucent | brushed_metal | wood …), params, appearance.pbr,y fuente única de tintado: appearance.color_mode = fixed | tintable (no duplicar tintable en binding).
- Slot: base | metal_detail | lens (ver C1; sheath retirado).

### 3.5 Acabados
- Lista discreta con label_key (i18n; claves estables, bundles por locale).

### 3.6 Reglas (por Pieza)
- Matrices: Material→Modelos, Material→Colores, Material→Texturas.
- Encaje: driver, target ∈ {"lug","socket"}, clearance_por_material_mm, max_k, safety (límites por material).
- Out-of-range: on_out_of_range: "ocultar_opcion" (default, visible en UI Admin).(Front = Zero-mensajes: no chips deshabilitados ni banners.)

### 3.7 i18n
- Hasta 18 idiomas; estado por cadena: missing | needs_review | ok.
- Import/Export CSV/JSON de textos (presentación).
- Namespaces ES: producto.*, pieza.*, modelo.*, material.*, color.*, textura.*, acabado.*, ui.*.

### 3.8 Previsualización
- Sandbox con snapshot de trabajo; Zero-mensajes activo; prueba rápida de encaje extremos.

### 3.9 Publicación
- Ejecuta Validador; muestra diff vs último publicado; genera Snapshot; publicación inmediata o programada.

### 3.10 Versiones & Auditoría
- Lista de snapshots; Rollback; registro de cambios por entidad/campo (quién/cuándo/qué).

### 3.11 Configuración
- Firma (sig.vN), caducidad, orígenes permitidos (CORS) para /validate-sign y /verify, backups, SSO/2FA.
- TTL screenshots (cache por sku_hash): 90 días (alineado C3/C4).
- Rate limits (por IP/origen) y presets por entorno (staging/prod).

## 4) Pipeline de activos (GLB)
### 4.1 Ingesta (uno a uno)
- Subir GLB → calcular hash, tamaño, flags Draco/Meshopt.
- Extraer nodos, materiales, imágenes embebidas, props (lug_* / socket_* / tol_*), side/variant, model_code.
- Generar miniaturas (frontal / 3⁄4 / perfil) y medidas visibles para QA.

### 4.2 Reglas de nombre/props (orientativas, no bloqueantes)
- Patilla: ^TP[A-Z]?_\d+-\d+_(L|R)$ ; Moldura: ^FR[A-Z]?_\d+-\d+_(R|U)$.
- Props mm obligatorias por pieza; tolerancias recomendadas.

### 4.3 Validaciones GLB
- Bloqueantes: GLB corrupto; falta object_name; faltan props mínimas; textura embebida declarada sin glb_material.
- Aviso: peso > presupuesto; mapas gigantes; sin miniaturas; falta ancla opcional.

### 4.4 CDN & versiones
- Subir a CDN (ruta versionada por hash); nunca sobrescribir ficheros publicados.

## 5) Validadores (bloqueantes vs avisos)
### 5.1 Bloqueantes (impiden publicar)
- IDs inválidos (regex/prefijo) o referencias rotas.
- pieza.order duplicado o faltante.
- Modelo sin binding válido (ni source.object_name/pattern).
- Props mínimas ausentes según Pieza.
- Matrices sin ≥1 opción por material/pieza activa.
- Defaults que no pertenecen a matrices.
- Textura embebida sin glb_material o generada sin generator_type.
- encaje_policy sin clearance_por_material_mm / max_k / safety / target.
- i18n base faltante (idioma principal).
- HEX Color no cumple ^#[0-9A-F]{6}$.
- Namespaces i18n incoherentes (deben ser ES, p. ej., textura.*, acabado.*, producto.*).

### 5.2 Avisos (publica, pero recomienda)
- GLB > 3 MB o demasiados drawcalls.
- Strings i18n incompletos (missing/needs_review).
- Sin miniaturas generadas.
- Encaje con margen anómalo (alto/bajo) vs histórico.

## 6) Previsualización / QA
- Stress test de encaje: tres patillas (min/media/max) y comprobar k-range.
- Zero-mensajes: verificar que nunca aparecen chips deshabilitados ni huecos sin opciones.
- Snapshot comparativo: antes/después de cambio en textura generada (misma cámara/iluminación).
- Textura define color: comprobar que Color se oculta y se restaura al volver a tintable.
- Latencia visor: apply_latency < 200 ms consistente en gama media.

## 7) Versionado y publicación
### 7.1 Snapshot (inmutable)
{

"snapshot": {

"id": "snap:2025-09-11T10:00:00Z",

"schema_version": "1.0.0",

"producto_id": "prod:rx-classic",

"published_at": "2025-09-11T10:00:00Z",

"i18n_locales": ["es","en","it"],

"entities": { /* … */ },

"rules": { /* … */ }

}

}

Referencia externa estándar: snapshot_id = snapshot.id.

### 7.2 Versión de catálogo
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

### 7.3 Publicación programada
- Fecha/hora en Europe/Rome; bloqueo de edición durante la ventana.
- Rollback: activar snapshot anterior sin borrar el nuevo (ambos quedan en histórico).

## 8) Import/Export
- Modelos GLB: uno a uno (decisión consciente por calidad).
- i18n: CSV/JSON por idioma (solo presentación).
- Matrices & defaults: JSON import/export con validador.
- Backup completo: exporta snapshot + activos referenciados (manifiesto).

### 8.1 Esquema CSV i18n (recomendado)
locale,key,value,status,notes

es,producto.rx-classic.name,RX Classic,ok,

es,pieza.moldura.name,Montura,ok,

es,textura.acetato-base.name,Acetato base,ok,

en,producto.rx-classic.name,RX Classic,needs_review,Check tone

en,pieza.moldura.name,Frame,ok,

en,textura.acetato-base.name,Acetate base,needs_review,Double-check tone

status ∈ {missing, needs_review, ok}. Claves en ES (e.g., textura.*, acabado.*, producto.*).

## 9) Integraciones (e-commerce & pricing)
- Validación/Firma: endpoints /validate-sign y /verify (ver C3).
- Precio/Stock (opc. en validate):
  - Precio base + ajustes por mat/tex/fin.
  - Stock por componente o por SKU.
- Webhooks: al Publicar, notificar a sistemas externos (cache bust/CDN purge, recalcular feeds).

Trazabilidad:

- En validate-sign usar idempotency_key (UUID v4).
- Respuesta devuelve request_id para correlación con logs y telemetría (C4).

## 10) Firma y caducidad (operación)
- Firma sig.vN activa; caducidad por defecto 30 días (editable por producto/campaña).
- Rotación: crear vN+1, convivir (N y N+1), retirar N.
- Orígenes permitidos: CORS y lista blanca de dominios para endpoints; TLS obligatorio.
- Idempotencia: idempotency_key en POST (/validate-sign).
- Algoritmo recomendado: Ed25519; claves en bóveda, acceso mínimo.

## 11) Auditoría y logs
- Cada save/publish/rollback: quién, cuándo, entidad, diff de campos.
- Logs del Validador (errores/avisos) y de llamadas a /validate-sign // /verify (agregados, sin PII).
- Panel Calidad de catálogo:
  - % autocorrecciones por paso, encajes al límite, latencias del visor por textura (embedded|generated).
  - Errores estándar (E_*) con reason_key (snake_case).
- Retención de logs: 90 días (alineada con backups).
- Correlación: enlazar request_id (C3/C4) en eventos ui.add_to_cart.success.

## 12) Rendimiento y QA operacional
- Presupuestos: GLB ≤ 2–3 MB (Draco); texturas preview 256–512 px, producto 1024–2048 px.
- Matriz de dispositivos: iOS/Android gama media, desktop con/sin dGPU.
- Regresión visual: set de golden shots por producto (misma cámara/iluminación).
- Screenshots (cache CDN): por sku_hash, TTL 90 días (alineado con C3/C4).

## 13) Seguridad
- SSO/2FA para Admin; RBAC estricto por colección (multimarca).
- Rate limiting y idempotency_key en endpoints públicos.
- Gestión de secretos (claves de firma) con rotación y acceso mínimo.
- TLS en todo el flujo; CSP y cabeceras endurecidas en Admin.
- Privacidad: sin PII en payloads de /validate-sign//verify; analytics con consentimiento heredado.

## 14) Backups & DR
- Backup diario del catálogo editorial + snapshots + claves (en bóveda).
- Retención: 90 días.
- Restauración: botón “Restaurar snapshot” por fecha; reconstruye bindings a activos por hash.
- Prueba de DR trimestral (restore en staging y smoke tests).

## 15) Checklists operativas
### Antes de publicar
- IDs y referencias correctas (regex/prefijos).
- Modelos con props mm/tolerancias completas.
- Texturas: embebidas con glb_material; generadas con generator_type/params y appearance.pbr (+ color_mode).
- Matrices (Modelos/Colores/Texturas) con ≥1 opción por material/pieza.
- Defaults correctos (y dentro de matrices).
- Encaje (driver, target {lug|socket}, clearance_por_material_mm, max_k, safety) OK.
- i18n base lista (sin missing críticos; namespaces ES incluyendo producto.*).
- QA en sandbox: sin chips deshabilitados; encaje extremos OK.

### Después de publicar
- Cache/CDN invalidada.
- Monitor de /validate-sign (errores agregados).
- Latencias del visor dentro de límites.

## 16) Plantillas (copy-paste)
### Modelo (GLB)
{

"id":"modelo:___",

"pieza_id":"pieza:___",

"label_key":"modelo.___.name",

"side":"l|r|n",

"variant":"R|U|null",

"binding":{

"source":{"file_name":"___","object_name":"___","model_code":"A|B|_"},

"props":{"lug_width_mm":null,"lug_height_mm":null,"socket_width_mm":null,"socket_height_mm":null,"tol_w_mm":null,"tol_h_mm":null},

"object_name_pattern":"^(...)$"

},

"morph_capabilities":[ /* opcional (moldura) */ ],

"morph_aliases":{ /* opcional compatibilidad */ },

"active":true

}

### Material
{

"id":"mat:___",

"label_key":"material.___.name",

"default_color_id":"col:___|null",

"default_texture_id":"tex:___",

"safety":{"min_thickness_mm":2.20,"min_corner_radius_mm":0.40}

}

### Color
{

"id":"col:___",

"label_key":"color.___.name",

"hex":"#RRGGBB",

"source":"palette",

"tint_rules":{"tintable":true,"allowed_texturas":[],"blend":"multiply"}

}

### Textura (embebida)
{

"id":"tex:___",

"label_key":"textura.___.name",

"defines_color":true,

"slot":"base",

"source":"embedded",

"appearance":{"color_mode":"fixed","pbr":{"metallic":0.0,"roughness":0.65}},

"binding":{"embedded":{"glb_material":"MAT___","maps":{"baseColor":"glb://MAT___#BaseColor"}}}

}

### Textura (generada)
{

"id":"tex:___",

"label_key":"textura.___.name",

"defines_color":false,

"slot":"base",

"source":"generated",

"appearance":{"color_mode":"tintable","pbr":{"metallic":1.0,"roughness":0.35}},

"binding":{"generated":{"generator_type":"solid_translucent","params":{"transmission":0.4,"roughness":0.4}}}

}

### Reglas por Pieza
{

"pieza:moldura":{

"material_to_modelos":{"mat:acetato":{"modelos":["modelo:fr-m1"]},"mat:metal":{"modelos":["modelo:fr-m1"]}},

"material_to_colores":{"mat:acetato":{"colores":["col:negro"]},"mat:metal":{"colores":["col:gris-oscuro"]},"mat:madera":{"colores":[]}},

"material_to_texturas":{"mat:madera":{"texturas":["tex:wood-oak-01"]},"mat:acetato":{"texturas":["tex:acetato-base"]}}

}

}

### Encaje (producto)
{

"encaje_policy":{

"driver":"moldura",

"target":"lug",

"clearance_por_material_mm":{"mat:madera":0.20,"mat:acetato":0.10,"mat:metal":0.05},

"max_k":1.0,

"on_out_of_range":"ocultar_opcion",

"safety":{

"min_thickness_mm":{"mat:madera":2.80,"mat:acetato":2.20,"mat:metal":1.20},

"min_corner_radius_mm":{"mat:madera":0.60,"mat:acetato":0.40,"mat:metal":0.30}

}

}

}

### Snapshot (publicado)
{

"snapshot":{

"id":"snap:YYYY-MM-DDThh:mm:ssZ",

"schema_version":"1.0.0",

"producto_id":"prod:___",

"published_at":"YYYY-MM-DDThh:mm:ssZ",

"i18n_locales":["es","en","it"],

"entities":{ /* … */ },

"rules":{ /* … */ }

}

}

### Versión de catálogo
{

"catalog_version":{

"id":"ver:YYYY-MM-DDThh:mm:ssZ",

"schema_version":"1.0.0",

"snapshot_id":"snap:YYYY-MM-DDThh:mm:ssZ",

"notes":"Colección ___ · v1",

"published_by":"editor@tu-sitio",

"published_at":"YYYY-MM-DDThh:mm:ssZ"

}

}

## 17) Roadmap preparado
- Nuevas piezas (más allá de moldura/patillas/lente) sin tocar el contrato.
- Morphs en otras piezas (activar morph_capabilities por Modelo).
- Meshopt adicional a Draco; múltiples LODs por dispositivo.
- A/B de orden Color ↔ Textura y layouts de chips.
- Comparador visual (golden shots) en Admin.
- Colecciones/multimarca con RBAC por colección.

## 18) Glosario (rápido)
- Pieza: componente del producto (moldura, patilla-izq, patilla-der, lente).
- Modelo: objeto GLB concreto asociado a una Pieza, con binding.
- Binding: cómo localizar el objeto real (nombre, props, patrón).
- Embebida/Generada: origen de Textura (foto en GLB vs material sintético).
- Snapshot: catálogo publicado e inmutable.
- Zero-mensajes: UX sin errores visibles; todo por filtrado + autocorrección + revalidación silenciosa.
