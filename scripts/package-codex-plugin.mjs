import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plugin = path.join(root, 'plugins/refhaven');
const dist = path.join(plugin, 'dist');
await fs.mkdir(dist, { recursive: true });
const result = await build({
  absWorkingDir: root, entryPoints: ['plugins/refhaven/scripts/mcp-server.mjs'],
  outfile: path.join(dist, 'server.mjs'), bundle: true, platform: 'node',
  target: 'node22', format: 'esm', metafile: true, legalComments: 'external',
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
});
const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules/')) continue;
  let dir = path.dirname(path.resolve(root, input));
  while (dir !== root && dir !== path.dirname(dir)) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
      if (pkg.name && pkg.version) { packages.set(dir, pkg); break; }
    } catch {}
    dir = path.dirname(dir);
  }
}
let notices = '# Bundled third-party dependencies\n';
for (const [dir, pkg] of [...packages].sort((a, b) => a[1].name.localeCompare(b[1].name))) {
  notices += `\n## ${pkg.name} ${pkg.version}\nLicense: ${pkg.license ?? 'See included notice'}\n`;
  for (const file of await fs.readdir(dir)) {
    if (/^(license|copying|notice)(\.|$)/i.test(file)) {
      const stat = await fs.stat(path.join(dir, file));
      if (stat.isFile()) notices += `\n${await fs.readFile(path.join(dir, file), 'utf8')}\n`;
    }
  }
}
await fs.writeFile(path.join(dist, 'THIRD-PARTY-NOTICES.txt'), notices);
const zip = new JSZip();
async function addDirectory(dir, prefix) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const location = path.join(dir, entry.name);
    const name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await addDirectory(location, name);
    else if (entry.isFile()) zip.file(name, await fs.readFile(location));
  }
}
for (const name of ['.codex-plugin', 'skills', 'dist']) await addDirectory(path.join(plugin, name), `refhaven/${name}`);
zip.file('refhaven/.mcp.json', await fs.readFile(path.join(plugin, '.mcp.json')));
zip.file('refhaven/README.md', await fs.readFile(path.join(root, 'docs/codex-plugin.md')));
zip.file('refhaven/LICENSE', await fs.readFile(path.join(root, 'LICENSE')));
const manifest = JSON.parse(await fs.readFile(path.join(plugin, '.codex-plugin/plugin.json'), 'utf8'));
const output = path.join(root, `release/Refhaven-Codex-plugin-${manifest.version}.zip`);
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`Built ${output} (${packages.size} bundled dependency notices)`);
