// AP-NFR-SIZE: every source file must be at most 300 lines.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const LIMIT = 300;
const ROOTS = ['.', 'src', 'test', 'scripts'];
const EXTS = new Set(['.js', '.mjs', '.html', '.css']);

let failed = 0;
for (const dir of ROOTS) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (!statSync(path).isFile() || !EXTS.has(extname(name))) continue;
    const lines = readFileSync(path, 'utf8').split('\n').length;
    const ok = lines <= LIMIT;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${String(lines).padStart(4)}  ${path}`);
  }
}
process.exit(failed ? 1 : 0);
