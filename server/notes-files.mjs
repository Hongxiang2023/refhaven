import {createHash,randomUUID} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat,mkdir,open,readdir,rename,rm} from 'node:fs/promises';
import path from 'node:path';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const key=id=>createHash('sha256').update(id).digest('hex').slice(0,24);
const filename=paper=>{
 const title=paper.title.normalize('NFKC').replace(/[^\p{L}\p{N} ._-]+/gu,' ').replace(/\s+/g,' ').trim();
 let slug='';for(const character of title){if(Buffer.byteLength(slug+character)>62)break;slug+=character;}
 return `${slug.replace(/[. ]+$/,'')||'Paper'}--${key(paper.id)}.md`;
};

export async function createNotesFiles(dataDir){
 const dir=path.join(dataDir,'notes');await mkdir(dir,{recursive:true,mode:0o700});
 async function find(paper){
  const suffix=`--${key(paper.id)}.md`;
  const matches=(await readdir(dir)).filter(name=>name.endsWith(suffix));
  if(matches.length>1)throw fail(409,`Multiple Markdown notes match “${paper.title}”. Keep one file for this paper in the notes folder.`);
  return path.join(dir,matches[0]||filename(paper));
 }
 async function read(file){
  let handle;try{const entry=await lstat(file);if(!entry.isFile()||entry.isSymbolicLink())throw fail(409,'Markdown note must be a regular file, not a symbolic link.');handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));const info=await handle.stat();if(!info.isFile()||info.size>8*1024*1024)throw fail(409,'Markdown note is not a regular file under 8 MB.');return await handle.readFile('utf8');}
  catch(error){if(error.code==='ENOENT')return null;if(error.code==='ELOOP')throw fail(409,'Markdown note cannot be a symbolic link.');throw error;}
  finally{await handle?.close();}
 }
 async function atomic(file,content){
  const temp=path.join(dir,`.${randomUUID()}.tmp`);
  try{const handle=await open(temp,'wx',0o600);try{await handle.writeFile(content);await handle.sync();}finally{await handle.close();}await rename(temp,file);}
  finally{await rm(temp,{force:true});}
 }
 return {
  dir,
  async sync(papers){
   let changed=false;const result=[];
   for(const paper of papers){
    const file=await find(paper),content=await read(file);
    if(content===null){await atomic(file,paper.notes);result.push(paper);continue;}
    if(content!==paper.notes){changed=true;result.push({...paper,notes:content});}else result.push(paper);
   }
   return changed?result:null;
  },
  async writeChanges(previous,next){
   const old=new Map(previous.map(p=>[p.id,p]));
   for(const paper of next){
    const before=old.get(paper.id),expected=before?.notes||'';
    const file=await find(paper),actual=await read(file);
    if(paper.notes===expected){if(!before&&actual===null)await atomic(file,paper.notes);continue;}
    if(actual!==null&&actual!==expected)throw fail(409,'This Markdown note changed in another editor. Reload it before saving your draft.');
    if(actual===null&&expected)throw fail(409,'This Markdown note was moved or removed. Restore it before saving.');
    await atomic(file,paper.notes);
   }
  }
 };
}
