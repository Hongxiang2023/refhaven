import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';
import {connectorFiles} from '../server/connector-install.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'extension/manifest.json'),'utf8'));
const zip=new JSZip();
for(const file of connectorFiles)zip.file(file,await readFile(path.join(root,'extension',file)),{date:new Date('2020-01-01T00:00:00Z')});
const output=path.join(root,'release',`Refhaven-Connector-${manifest.version}.zip`);
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
console.log(output);
