import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createNotesFiles} from '../server/notes-files.mjs';

test('Markdown notes keep a stable per-paper file and import external edits',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'refhaven-notes-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const store=await createNotesFiles(root),paper={id:'paper-1',title:'A study / revised?',notes:'First note'};
 assert.equal(await store.sync([paper]),null);
 const [name]=await readdir(store.dir);assert.match(name,/^A study revised--[a-f0-9]{24}\.md$/);
 assert.equal(await readFile(path.join(store.dir,name),'utf8'),'First note');
 await writeFile(path.join(store.dir,name),'Edited in Obsidian');
 assert.equal((await store.sync([paper]))[0].notes,'Edited in Obsidian');
 await assert.rejects(store.writeChanges([paper],[{...paper,notes:'App draft'}]),{status:409});
 await store.writeChanges([{...paper,notes:'Edited in Obsidian'}],[{...paper,title:'Renamed in app',notes:'App draft'}]);
 assert.equal((await readdir(store.dir))[0],name);
 assert.equal(await readFile(path.join(store.dir,name),'utf8'),'App draft');
});

test('Markdown note files refuse symbolic links',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'refhaven-notes-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const store=await createNotesFiles(root),paper={id:'paper-2',title:'Unsafe note',notes:'Original'};
 await store.sync([paper]);const [name]=await readdir(store.dir);
 await rm(path.join(store.dir,name));await symlink(path.join(root,'outside'),path.join(store.dir,name));
 await assert.rejects(store.sync([paper]),{status:409});
});
