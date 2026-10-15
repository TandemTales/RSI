// Anonymous verification: no GitHub token, Authorization header or stored cookies.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.RSI_URL;
if (!base || !base.startsWith('https://')) throw new Error('Set RSI_URL to the public HTTPS game URL.');
const files = ['index.html', 'style.css', 'app.js', 'sim.js', 'icon.svg'];
const results = [];
for (const file of files) {
  const url = new URL(file === 'index.html' ? './' : file, base);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
  assert.equal(response.status, 200, `${file} is anonymously accessible`);
  const actual = Buffer.from(await response.arrayBuffer());
  const expected = await readFile(new URL(`../docs/${file}`, import.meta.url));
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(actual), hash(expected), `${file} matches the reviewed build`);
  results.push({ file, url: String(url), status: response.status, sha256: hash(actual), bytes: actual.length });
  console.log(`PASS anonymous HTTP 200 and SHA256 match: ${file}`);
}
await mkdir('.preview/public', { recursive: true });
await writeFile('.preview/public/asset-report.json', JSON.stringify({ url: base, anonymous: true, results }, null, 2));
