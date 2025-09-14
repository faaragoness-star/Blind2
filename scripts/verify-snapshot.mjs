import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ajv = new Ajv({ allErrors:true, allowUnionTypes:true });
addFormats(ajv);
const schema = JSON.parse(readFileSync('packages/schemas/snapshot.schema.json','utf8'));
const validate = ajv.compile(schema);

const dir = 'packages/schemas/examples/valid';
const files = readdirSync(dir).filter(f=>f.endsWith('.json') && f.includes('snapshot'));
let ok = true;

for (const f of files){
  const data = JSON.parse(readFileSync(resolve(dir,f),'utf8'));
  const valid = validate(data);
  if (!valid){
    console.error(`❌ ${f}`, validate.errors);
    ok = false;
  } else {
    console.log(`✅ ${f}`);
  }
}
if (!ok) process.exit(1);
