import {homedir} from 'node:os';
import path from 'node:path';
import {mkdir,open,lstat,realpath} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {normalizeCitationIdentifier,paperCitationIdentifiers,parseCitationMarkers} from '../../../server/citation-identifiers.mjs';
import {citationDoi,referenceUrl} from '../../../server/reference-links.mjs';

const schema=properties=>({type:'object',properties,additionalProperties:false});
const reference={type:'string',minLength:1,maxLength:2048};
const selection={references:{type:'array',items:reference,minItems:1,maxItems:50},style:{type:'string',minLength:1,maxLength:200}};
const annotations=(readOnlyHint,openWorldHint)=>({readOnlyHint,openWorldHint,destructiveHint:false,idempotentHint:readOnlyHint});
export const toolDefinitions=[
 {name:'refhaven_status',description:'Check whether the local Refhaven desktop app is open and available. Does not return library records or credentials.',inputSchema:schema({}),annotations:annotations(true,false)},
 {name:'refhaven_search_library',description:'Search saved Refhaven reference titles, authors, journals and identifiers. Returns up to 50 matching citation records, never PDF content, notes or highlights. Use when the user wants references from their connected library.',inputSchema:{...schema({query:{type:'string',minLength:1,maxLength:200},limit:{type:'integer',minimum:1,maximum:50}}),required:['query']},annotations:annotations(true,false)},
 {name:'refhaven_lookup_reference',description:'Resolve one DOI, PMID or arXiv identifier using Refhaven. Prefers saved metadata; otherwise sends the identifier to Crossref, PubMed or arXiv. Does not search topics, invent sources, save papers, or verify whether a paper supports a claim.',inputSchema:{...schema({identifier:reference}),required:['identifier']},annotations:annotations(true,true)},
 {name:'refhaven_list_styles',description:'List the citation styles already available in the local Refhaven app. Use the returned style ID for formatting; does not install styles.',inputSchema:schema({}),annotations:annotations(true,false)},
 {name:'refhaven_format_bibliography',description:'Format a bibliography from 1–50 DOI, PMID, arXiv or folio:paper-id references using an installed CSL style. Prefers saved records; missing identifiers are looked up publicly. Returns sources, warnings and unresolved identifiers. No library edits.',inputSchema:{...schema(selection),required:['references']},annotations:annotations(true,true)},
 {name:'refhaven_export_references',description:'Create a new Word bibliography, BibTeX or RIS file for selected references in the configured Refhaven export folder (default Downloads/Refhaven). Only use when the user requests a file. Never overwrites existing files or edits the library. May look up missing identifiers publicly.',inputSchema:{...schema({...selection,format:{type:'string',enum:['docx','bibtex','ris']},filename:{type:'string',minLength:1,maxLength:120}}),required:['references','format']},annotations:annotations(false,true)}
];
const fail=message=>Object.assign(new Error(message),{safeMessage:message});
const fields=['id','title','authors','year','journal','doi','pmid','arxivId','cslType','publisher','publisherPlace','eventTitle','volume','issue','pages','journalAbbreviation','sourceUrl','cslAuthors','dateParts'];
function metadata(p){return Object.fromEntries(fields.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));}
function identifier(value){
 if(typeof value!=='string'||!value.trim()||value.length>2048)throw fail('Use a DOI, PMID, arXiv identifier, or a folio:paper-id returned by library search.');
 const input=value.trim(),explicit=/^(doi|pmid|arxiv|folio):\s*(.+)$/i.exec(input);
 const type=explicit?explicit[1].toLowerCase():/^[1-9]\d{0,8}$/.test(input)?'pmid':/^(?:10\.|https?:\/\/(?:dx\.)?doi\.org\/)/i.test(input)?'doi':'arxiv';
 const normalized=normalizeCitationIdentifier(type,explicit?explicit[2]:input);
 if(!normalized)throw fail('Use a valid DOI, PMID, arXiv identifier, or folio:paper-id. Topic searches are not supported by identifier lookup.');
 const key=`${type}:${normalized}`;
 // Each identifier must round-trip as exactly one citation marker. This keeps
 // punctuation inside DOI suffixes from injecting an additional reference.
 const markers=parseCitationMarkers(`(${key})`);
 if(markers.length!==1||markers[0].identifiers.length!==1||markers[0].identifiers[0].key!==key)throw fail('This identifier cannot be represented safely as a citation marker.');
 return {type,key};
}
function bibtex(p,index){
 const esc=value=>String(value||'').replace(/[\r\n]+/g,' ').replace(/[\\{}%&#_$^~]/g,c=>({'\\':'\\textbackslash{}','^':'\\textasciicircum{}','~':'\\textasciitilde{}'}[c]||'\\'+c));
 const author=p.cslAuthors?.length?p.cslAuthors.map(a=>a.literal?`{${esc(a.literal)}}`:[esc(a.family),esc(a.given)].filter(Boolean).join(', ')).join(' and '):String(p.authors||'').split(';').map(a=>esc(a.trim())).filter(Boolean).join(' and ');
 const type=p.cslType==='paper-conference'?'inproceedings':p.cslType==='article'?'misc':p.cslType==='book'?'book':p.cslType==='chapter'?'incollection':'article';
 const entries={title:esc(p.title),author,year:esc(p.year),[type==='inproceedings'?'booktitle':'journal']:esc(p.journal),volume:esc(p.volume),number:esc(p.issue),pages:esc(p.pages),publisher:esc(p.publisher),doi:esc(citationDoi(p)),url:esc(referenceUrl(p,{allowPubMed:true}))};
 return `@${type}{refhaven${index+1},\n${Object.entries(entries).filter(([,v])=>v).map(([k,v])=>`  ${k} = {${v}}`).join(',\n')}\n}`;
}
function ris(p){
 const type=({'paper-conference':'CPAPER',book:'BOOK',chapter:'CHAP',article:'GEN'})[p.cslType]||'JOUR';
 const authors=p.cslAuthors?.length?p.cslAuthors.map(a=>a.literal||[a.family,a.given].filter(Boolean).join(', ')):String(p.authors||'').split(';').map(a=>a.trim()).filter(Boolean);
 return [['TY',type],['TI',p.title],...authors.map(a=>['AU',a]),['PY',p.year],['JO',p.journal],['VL',p.volume],['IS',p.issue],['SP',p.pages],['DO',citationDoi(p)],['UR',referenceUrl(p,{allowPubMed:true})],['N1',p.pmid?`PMID: ${p.pmid}`:'']].filter(([,v])=>v).map(([k,v])=>`${k}  - ${String(v).replace(/[\r\n]+/g,' ')}`).join('\n')+'\nER  -';
}
export function createRefhavenTools({baseUrl=process.env.REFHAVEN_URL||'http://127.0.0.1:47821',exportDir=process.env.REFHAVEN_EXPORT_DIR||path.join(homedir(),'Downloads','Refhaven'),fetchImpl=fetch}={}){
 let base;try{base=new URL(baseUrl);}catch{throw fail('REFHAVEN_URL must be a local Refhaven address.');}
 if(base.protocol!=='http:'||!['127.0.0.1','localhost'].includes(base.hostname)||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw fail('REFHAVEN_URL must be http://127.0.0.1:PORT or http://localhost:PORT. Remote connections are not supported.');
 if(!path.isAbsolute(exportDir))throw fail('REFHAVEN_EXPORT_DIR must be an absolute folder path.');
 let token;
 async function request(route,{method='GET',body,binary=false,signal,session=false,retry=true}={}){
  if(!session&&!token)await connect(signal);
  let response;
  try{response=await fetchImpl(new URL(route,base),{method,redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(30000),...(signal?[signal]:[])]),headers:{...(session?{}:{Authorization:`Bearer ${token}`}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
  catch{throw fail(signal?.aborted?'Refhaven request cancelled or timed out.':'Could not reach the local Refhaven service. Open Refhaven and try again.');}
  if(response.redirected||(response.url&&new URL(response.url).origin!==base.origin))throw fail('Refhaven returned an unexpected redirect. The request was stopped.');
  if(response.status===401&&!session&&retry){token=undefined;await connect(signal);return request(route,{method,body,binary,signal,retry:false});}
  if(!response.ok)throw fail(response.status===503?'Refhaven is busy moving or verifying its library. Try again after it reopens.':route.includes('/lookup')?'The identifier could not be resolved. Check it and try again; no reference was invented.':route.includes('/citations/')?'Refhaven could not format these references. Check the installed style and reference metadata.':'Refhaven could not read its local library. Open the app and check its status.');
  const reader=response.body?.getReader();if(!reader)throw fail('Refhaven returned an empty response.');
  const chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32*1024*1024)throw fail('Refhaven response is too large. Use a smaller reference selection.');chunks.push(Buffer.from(value));}}catch(e){throw e.safeMessage?e:fail('Refhaven response was interrupted. Try again.');}finally{await reader.cancel().catch(()=>{});}
  const bytes=Buffer.concat(chunks);if(binary)return bytes;
  try{return JSON.parse(bytes.toString('utf8'));}catch{throw fail('Refhaven returned an invalid response.');}
 }
 async function connect(signal){const value=await request('/api/session',{session:true,signal});if(typeof value.token!=='string'||value.token.length<20)throw fail('The local service did not return a valid Refhaven session.');token=value.token;}
 async function library(signal){const value=await request('/api/library',{signal});if(!Array.isArray(value.papers))throw fail('Refhaven returned an invalid library.');return value.papers;}
 async function resolve(values,signal){
  if(!Array.isArray(values)||values.length<1||values.length>50)throw fail('Choose between 1 and 50 references.');
  const keys=[...new Map(values.map(v=>{const id=identifier(v);return [id.key,id];})).values()];
  const saved=await library(signal),papers=[],sources=[],unresolved=[];
  for(const id of keys){
   signal?.throwIfAborted();
   let paper=saved.find(p=>paperCitationIdentifiers(p).some(i=>i.key===id.key)),source='saved library';
   if(!paper&&id.type!=='folio'){
    try{paper=await request('/api/citations/lookup?identifier='+encodeURIComponent(id.key),{signal});source=id.type==='doi'?'Crossref':id.type==='pmid'?'PubMed':'arXiv';}
    catch(e){if(signal?.aborted)throw e;unresolved.push({identifier:id.key,message:e.safeMessage||'Lookup failed.'});continue;}
   }
   if(!paper?.title||!paperCitationIdentifiers(paper).some(i=>i.key===id.key)){unresolved.push({identifier:id.key,message:'No matching citation record was found.'});continue;}
   if(!papers.some(existing=>paperCitationIdentifiers(existing).some(a=>paperCitationIdentifiers(paper).some(b=>a.key===b.key))))papers.push(metadata(paper));sources.push({identifier:id.key,source,reference:metadata(paper)});
  }
  return {papers,sources,unresolved};
 }
 async function format(args,signal){
  const style=args.style||'apa';const styles=await request('/api/citations/styles',{signal});
  if(!Array.isArray(styles)||!styles.some(s=>s.id===style))throw fail('That citation style is not installed. Call refhaven_list_styles and use one of its IDs.');
  const result=await resolve(args.references,signal);
  const text=result.sources.map(s=>`(${s.identifier})`).join('\n');
  const preview=text?await request('/api/citations/preview',{method:'POST',body:{text,papers:result.papers,style},signal}):{bibliography:[],unresolved:[],warnings:[]};
  return {...result,style,text,preview};
 }
 async function writeExport(bytes,filename){
  await mkdir(exportDir,{recursive:true,mode:0o700});
  if(!(await lstat(exportDir)).isDirectory()||(await lstat(exportDir)).isSymbolicLink())throw fail('The export folder must be a regular directory, not a symbolic link.');
  const destination=path.join(await realpath(exportDir),filename);
  let file;try{file=await open(destination,'wx',0o600);await file.writeFile(bytes);await file.sync();}
  catch(e){if(e.code==='EEXIST')throw fail('An export with that filename already exists. Choose a new filename; existing files are never overwritten.');throw fail('Could not write the export. Check the export folder permissions and available disk space.');}
  finally{await file?.close();}
  return {path:destination,bytes:bytes.length,filename};
 }
 return {async call(name,args={},signal){
  signal=AbortSignal.any([AbortSignal.timeout(90000),...(signal?[signal]:[])]);
  if(name==='refhaven_status'){await connect(signal);return {available:true,app:'Refhaven',connection:'local',libraryAccess:'Citation metadata only; PDF text, notes and highlights are not exposed.',exportDirectory:exportDir};}
  if(name==='refhaven_list_styles')return {styles:await request('/api/citations/styles',{signal})};
  if(name==='refhaven_search_library'){
   if(typeof args.query!=='string'||!args.query.trim()||args.query.length>200||args.limit!==undefined&&(!Number.isInteger(args.limit)||args.limit<1||args.limit>50))throw fail('Enter a nonempty search query and a limit between 1 and 50.');
   const words=args.query.trim().toLocaleLowerCase().split(/\s+/),records=await library(signal);
   const matches=records.filter(p=>{const text=['title','authors','journal','year','doi','pmid','arxivId'].map(k=>p[k]||'').join(' ').toLocaleLowerCase();return words.every(w=>text.includes(w));});
   return {total:matches.length,references:matches.slice(0,args.limit||10).map(p=>({...metadata(p),citationIdentifier:`folio:${p.id}`}))};
  }
  if(name==='refhaven_lookup_reference'){const result=await resolve([args.identifier],signal);return {references:result.sources,unresolved:result.unresolved};}
  if(name==='refhaven_format_bibliography'||name==='refhaven_export_references'){
   let filename;
   if(name==='refhaven_export_references'){
    const ext={docx:'.docx',bibtex:'.bib',ris:'.ris'}[args.format];if(!ext)throw fail('Choose docx, bibtex or ris for export.');
    filename=args.filename||`refhaven-references-${randomUUID()}${ext}`;
    if(typeof filename!=='string'||filename.length>120||!filename.endsWith(ext)||!filename.slice(0,-ext.length)||filename.startsWith('.')||/[\\/:\x00-\x1f<>"|?*]/.test(filename)||filename.trim()!==filename)throw fail('Use a simple filename with the matching .docx, .bib or .ris extension and no folder path.');
   }
   const result=await format(args,signal);
   const unresolved=[...result.unresolved,...(result.preview.unresolved||[]).map(identifier=>({identifier,message:'Citation could not be formatted.'}))];
   const output={style:result.style,bibliography:result.preview.bibliography,warnings:result.preview.warnings,unresolved,sources:result.sources};
   if(name==='refhaven_format_bibliography')return output;
   if(unresolved.length)throw fail('Some references could not be resolved. Use refhaven_format_bibliography to inspect them; no file was written.');
   const bytes=args.format==='docx'?await request('/api/citations/word',{method:'POST',body:{text:result.text,papers:result.papers,style:result.style},binary:true,signal}):Buffer.from(result.papers.map(args.format==='bibtex'?bibtex:ris).join('\n\n')+'\n');
   signal.throwIfAborted();
   return {...await writeExport(bytes,filename),format:args.format,...output};
  }
  throw fail('Unknown Refhaven tool.');
 }};
}
