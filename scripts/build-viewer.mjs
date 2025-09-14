import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';
function ensureDir(p){ try{ mkdirSync(p, { recursive:true }); }catch{} }

// Placeholder: copia el index.html "tal cual" a dist (ajusta a tu bundler real)
ensureDir('apps/viewer/dist');
copyFileSync('apps/viewer/index.html', 'apps/viewer/dist/index.html');
console.log('Viewer copiado a apps/viewer/dist (placeholder)');
