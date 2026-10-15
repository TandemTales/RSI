import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'docs');
await mkdir(output, { recursive: true });
const files = ['index.html', 'style.css', 'app.js', 'sim.js', 'icon.svg', '.nojekyll'];
for (const file of files) await copyFile(path.join(root, file), path.join(output, file));
console.log(`Static Pages bundle: docs/ (${files.length} files, no runtime dependencies)`);
