import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {installConnector,connectorFiles} from '../server/connector-install.mjs';

test('connector stays at one path while app bundle contents are updated',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'refhaven-connector-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const sourceA=path.join(root,'app-a'),sourceB=path.join(root,'app-b');
 const {mkdir}=await import('node:fs/promises');
 await mkdir(sourceA);await mkdir(sourceB);
 for(const file of connectorFiles){
  await mkdir(path.dirname(path.join(sourceA,file)),{recursive:true});
  await mkdir(path.dirname(path.join(sourceB,file)),{recursive:true});
  await writeFile(path.join(sourceA,file),file==='popup.js'?'old':file);
  await writeFile(path.join(sourceB,file),file==='popup.js'?'new':file);
 }
 const local=path.join(root,'profile');
 const first=await installConnector(sourceA,local);
 await writeFile(path.join(first,'user-note.txt'),'keep');
 const second=await installConnector(sourceB,local);
 assert.equal(second,first);
 assert.equal(await readFile(path.join(second,'popup.js'),'utf8'),'new');
 assert.equal(await readFile(path.join(second,'user-note.txt'),'utf8'),'keep');
});
