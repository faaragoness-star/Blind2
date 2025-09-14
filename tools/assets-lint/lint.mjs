import { statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const dir = process.argv[2] || 'assets';
const MAX_GLB_MB = 3.0;
const MAX_SCENE_MB = 8.0;

let sceneBytes = 0;
let ok = true;

function walk(p){
  for (const name of readdirSync(p, { withFileTypes:true })){
    const full = join(p, name.name);
    if (name.isDirectory()) walk(full);
    else {
      const ext = extname(name.name).toLowerCase();
      const size = statSync(full).size;
      sceneBytes += size;
      if (ext === '.glb' && size > MAX_GLB_MB * 1024*1024){
        console.error(`❌ ${full} supera ${MAX_GLB_MB}MB (${(size/1024/1024).toFixed(2)}MB)`);
        ok = false;
      }
      if (ext === '.png') {
        console.warn(`⚠️ ${full} es PNG — se recomienda KTX2`);
      }
    }
  }
}
try { walk(dir); } catch(e){
  console.warn(`Directorio ${dir} no encontrado (ok para plantilla)`);
}

if (sceneBytes > MAX_SCENE_MB * 1024*1024){
  console.error(`❌ Escena supera ${MAX_SCENE_MB}MB (${(sceneBytes/1024/1024).toFixed(2)}MB)`);
  ok = false;
}

if (!ok) process.exit(1);
console.log('✅ Linter de assets OK (plantilla)');
