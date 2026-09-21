import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import {createFolioServer} from '../server/index.mjs';
import {createRefhavenTools} from '../plugins/refhaven/scripts/refhaven-tools.mjs';

const paper={id:'paper-one',title:'A study of methylation',authors:'Example, Ada',year:'2024',journal:'Example Journal',doi:'10.1234/example',pmid:'12345678',collection:'Unfiled',tags:'',status:'To read',notes:'PRIVATE NOTE NEVER RETURN',highlights:[],starred:false,cslAuthors:[{family:'Example',given:'Ada'}]};
async function fixture(t){
 const dir=await mkdtemp(path.join(tmpdir(),'refhaven-mcp-'));
 await writeFile(path.join(dir,'library.json'),JSON.stringify({version:1,revision:0,papers:[paper],collections:['Unfiled']}));
 const lookups=[];
 const server=await createFolioServer({dataDir:dir,identifierLookup:async identifier=>{lookups.push(identifier);if(identifier==='doi:10.1234/new')return {title:'A new reference',authors:'Author, Bea',cslAuthors:[{family:'Author',given:'Bea'}],year:'2025',journal:'Research',doi:'10.1234/new'};throw Error('private upstream token secret');}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});});
 const baseUrl=`http://127.0.0.1:${server.address().port}`,exportDir=path.join(dir,'exports');
 return {tools:createRefhavenTools({baseUrl,exportDir}),dir,baseUrl,exportDir,lookups};
}
test('MCP searches only citation metadata, prefers saved sources, and formats with the existing engine',async t=>{
 const {tools,lookups,dir}=await fixture(t);
 const search=await tools.call('refhaven_search_library',{query:'methylation'});
 assert.equal(search.total,1);assert.equal(search.references[0].citationIdentifier,'folio:paper-one');assert.ok(!JSON.stringify(search).includes('PRIVATE'));
 assert.equal((await tools.call('refhaven_search_library',{query:'PRIVATE NOTE'})).total,0);
 const result=await tools.call('refhaven_format_bibliography',{references:['10.1234/example','PMID:12345678','10.1234/new'],style:'nature'});
 assert.equal(result.bibliography.length,2);assert.equal(result.unresolved.length,0);assert.match(result.bibliography.join(' '),/Example|methylation/);assert.deepEqual(lookups,['doi:10.1234/new']);
 assert.deepEqual(result.sources.map(s=>s.source),['saved library','saved library','Crossref']);
 const library=JSON.parse(await readFile(path.join(dir,'library.json'),'utf8'));assert.equal(library.papers.length,1);assert.equal(library.papers[0].notes,paper.notes);
 assert.ok((await tools.call('refhaven_list_styles')).styles.some(s=>s.id==='apa'));
});
test('MCP exports usable DOCX, BibTeX and RIS, deduplicates aliases, never overwrites',async t=>{
 const {tools,exportDir}=await fixture(t);
 const args={references:['doi:10.1234/example','PMID:12345678'],style:'apa'};
 const word=await tools.call('refhaven_export_references',{...args,format:'docx',filename:'refs.docx'});
 const zip=await JSZip.loadAsync(await readFile(word.path));const xml=await zip.file('word/document.xml').async('string');assert.match(xml,/A study of methylation/);
 const bib=await tools.call('refhaven_export_references',{...args,format:'bibtex',filename:'refs.bib'});const b=await readFile(bib.path,'utf8');assert.equal((b.match(/@article/g)||[]).length,1);assert.match(b,/Example, Ada/);
 const ris=await tools.call('refhaven_export_references',{...args,format:'ris',filename:'refs.ris'});const r=await readFile(ris.path,'utf8');assert.match(r,/TY  - JOUR/);assert.match(r,/DO  - 10.1234\/example/);
 await assert.rejects(tools.call('refhaven_export_references',{...args,format:'docx',filename:'refs.docx'}),/already exists/);
 assert.equal((await readdir(exportDir)).length,3);
});
test('Unresolved metadata stays explicit and blocks export; invalid paths create no files',async t=>{
 const {tools,exportDir}=await fixture(t);
 const args={references:['10.1234/example','10.1234/missing'],style:'apa'};
 const result=await tools.call('refhaven_format_bibliography',args);assert.equal(result.unresolved.length,1);assert.equal(result.bibliography.length,1);assert.ok(!JSON.stringify(result).includes('secret'));
 await assert.rejects(tools.call('refhaven_export_references',{...args,format:'docx'}),/no file was written/);
 for(const filename of ['../oops.docx','/tmp/oops.docx','..\\oops.docx','refs.bib','bad\n.docx'])await assert.rejects(tools.call('refhaven_export_references',{references:['10.1234/example'],format:'docx',filename}),/simple filename/);
 await assert.rejects(readdir(exportDir),{code:'ENOENT'});
 await assert.rejects(tools.call('refhaven_format_bibliography',{references:['10.1234/example'],style:'not-installed'}),/not installed/);
 await assert.rejects(tools.call('refhaven_lookup_reference',{identifier:'doi:10.1234/a; PMID:12345678'}),/valid|safely/);
});
test('Loopback credentials never follow redirects or connect to a remote URL',async()=>{
 for(const baseUrl of ['https://example.com','http://127.0.0.1.evil.test','http://user:pass@localhost:47821','http://127.0.0.1:47821/api','http://127.0.0.1:47821/?x=1'])assert.throws(()=>createRefhavenTools({baseUrl}),/local|Remote/);
 let seen;
 const tools=createRefhavenTools({fetchImpl:async(url,options)=>{seen=options;return new Response('',{status:302,headers:{location:'https://example.com'}});}});
 await assert.rejects(tools.call('refhaven_status'),/could not read/);assert.equal(seen.redirect,'error');assert.equal(seen.headers.Authorization,undefined);
});
test('Credential refresh handles an app restart and export refuses a symlink target',async t=>{
 const {baseUrl,dir}=await fixture(t);let sessions=0,revoked=false;
 const fetchImpl=async(url,opts)=>{if(url.pathname==='/api/session')sessions++;if(url.pathname==='/api/citations/styles'&&!revoked){revoked=true;return new Response('',{status:401});}return fetch(url,opts);};
 const exportDir=path.join(dir,'link');await symlink(dir,exportDir,'dir');
 const tools=createRefhavenTools({baseUrl,exportDir,fetchImpl});assert.ok((await tools.call('refhaven_list_styles')).styles.length);assert.equal(sessions,2);
 await assert.rejects(tools.call('refhaven_export_references',{references:['folio:paper-one'],format:'ris',filename:'refs.ris'}),/symbolic link/);
 await assert.rejects(readFile(path.join(dir,'refs.ris')),{code:'ENOENT'});
});
