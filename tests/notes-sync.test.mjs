import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createFolioServer} from '../server/index.mjs';

test('app and external Markdown edits sync without overwriting stale notes',async t=>{
 const dataDir=await mkdtemp(path.join(tmpdir(),'refhaven-notes-api-'));
 const server=await createFolioServer({dataDir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(dataDir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 const {token,notesDir}=await(await fetch(base+'/api/session')).json();assert.equal(notesDir,path.join(dataDir,'notes'));
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 const request=(url,method='GET',body)=>fetch(base+url,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
 const captured=await(await request('/api/capture','POST',{title:'An article',lookup:false})).json();
 let library=await(await request('/api/library')).json();
 const updated=library.papers.map(p=>p.id===captured.paper.id?{...p,notes:'## Question\nWhat follows?'}:p);
 assert.equal((await request('/api/library','PUT',{papers:updated,revision:library.revision})).status,200);
 const [name]=await readdir(notesDir);assert.equal(await readFile(path.join(notesDir,name),'utf8'),'## Question\nWhat follows?');
 library=await(await request('/api/library')).json();
 await writeFile(path.join(notesDir,name),'Changed in Obsidian');
 assert.equal((await request('/api/library','PUT',{papers:updated,revision:library.revision})).status,409);
 const refreshed=await(await request('/api/library')).json();assert.equal(refreshed.papers[0].notes,'Changed in Obsidian');assert.ok(refreshed.revision>library.revision);
 const backup=gunzipSync(Buffer.from(await(await request('/api/backup')).arrayBuffer()));
 assert.ok(backup.includes(Buffer.from(`notes/${name}`)));
 assert.ok(backup.includes(Buffer.from('Changed in Obsidian')));
});
