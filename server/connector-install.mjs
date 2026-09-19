import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const connectorFiles=['manifest.json','popup.html','popup.css','popup.js','extract.js','pdf.js','icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png'];

// Chrome keeps an unpacked extension tied to its folder path. Keep that path
// outside the replaceable app bundle and refresh only the bundled code there.
export async function installConnector(sourceDir,localDataDir){
 const targetDir=path.join(localDataDir,'connector-extension');
 await mkdir(targetDir,{recursive:true,mode:0o700});
 for(const file of connectorFiles){
  const source=await readFile(path.join(sourceDir,file));
  const target=path.join(targetDir,file);
  await mkdir(path.dirname(target),{recursive:true,mode:0o700});
  try{if((await readFile(target)).equals(source))continue;}catch(error){if(error.code!=='ENOENT')throw error;}
  const temporary=target+'.'+randomUUID()+'.tmp';
  try{await writeFile(temporary,source,{flag:'wx',mode:0o600});await rename(temporary,target);}
  finally{await rm(temporary,{force:true});}
 }
 return targetDir;
}
