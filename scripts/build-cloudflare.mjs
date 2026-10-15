import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
// Deploy only public files. Repository metadata, prototypes and docs stay private.
if (path.relative(root, output) !== 'dist') throw new Error('Invalid build output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const directories = ['assets', 'blog', 'en', 'uz', '.well-known'];
const files = ['favicon.ico', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml', '_headers', '_redirects'];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) files.push(entry.name);
}
for (const entry of [...directories, ...files]) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
await writeFile(path.join(output, 'health'), 'OK\n');
console.log(`Cloudflare assets built in ${output}`);
