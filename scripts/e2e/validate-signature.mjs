import { createHmac, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function canonicalize(state){
  // Serialización simple: pieza→material→modelo→color→textura→acabado
  const order = ['frame','temple','lentes'];
  const keyOrder = ['id','material','modelo','color','textura','acabado'];
  const piezas = [...state.piezas].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  const lines = piezas.map(p => keyOrder.map(k => (p[k] ?? '')).join('|'));
  return lines.join('||');
}

// Demo local usando fixtures
const state = JSON.parse(readFileSync('packages/schemas/examples/valid/state.example.json','utf8'));
const sku = canonicalize(state);
const sku_hash = createHash('sha256').update(sku).digest('hex');

// Firmar con clave DEV (no usar en producción)
const ttl = 3600;
const expires_at = Math.floor(Date.now()/1000) + ttl;
const sigKey = 'dev-key';
const data = sku_hash + '|' + expires_at;
const signature = 'sig.v1.' + createHmac('sha256', sigKey).update(data).digest('base64');

console.log({ sku, sku_hash, signature, expires_at: new Date(expires_at*1000).toISOString() });

// Verificación
const [_,__ , raw] = signature.split('.');
const ok = createHmac('sha256', sigKey).update(data).digest('base64') === raw;
if (!ok){ console.error('❌ Firma inválida'); process.exit(1); }
console.log('✅ Firma válida con clave DEV');
