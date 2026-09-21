import {useCallback,useEffect,useRef,useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Paper} from './model';
import './notes.css';

type Props={paper:Paper;onSave:(value:string,expected:string)=>Promise<void>;workspace?:boolean;notesDir?:string;onCopy?:(value:string)=>void;onDirtyChange?:(dirty:boolean)=>void};
export default function Notes({paper,onSave,workspace=false,notesDir='',onCopy,onDirtyChange}:Props){
 const [text,setText]=useState(paper.notes),[state,setState]=useState('Saved');
 const [mode,setMode]=useState<'edit'|'preview'|'split'>(workspace?'split':'edit');
 const dirty=useRef(false),inFlight=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),latest=useRef(paper.notes),baseline=useRef(paper.notes),saveRef=useRef(onSave),sequence=useRef(0),dirtyRef=useRef(onDirtyChange),editor=useRef<HTMLTextAreaElement>(null),preview=useRef<HTMLDivElement>(null);
 useEffect(()=>{saveRef.current=onSave;dirtyRef.current=onDirtyChange;},[onSave,onDirtyChange]);
 useEffect(()=>{if(!dirty.current&&!inFlight.current){setText(paper.notes);latest.current=paper.notes;baseline.current=paper.notes;}},[paper.notes]);
 const flush=useCallback(function save(){
  if(!dirty.current||inFlight.current)return;
  const version=sequence.current,value=latest.current,expected=baseline.current;inFlight.current=true;
  void saveRef.current(value,expected).then(()=>{
   baseline.current=value;inFlight.current=false;
   if(sequence.current===version){dirty.current=false;dirtyRef.current?.(false);setState('Saved');}else save();
  }).catch(()=>{inFlight.current=false;dirty.current=true;setState('Not saved. Your draft is kept here. Copy it before reloading; the note may have changed elsewhere.');});
 },[]);
 useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(dirty.current||inFlight.current){flush();event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>{window.removeEventListener('beforeunload',guard);clearTimeout(timer.current);flush();};},[flush]);
 const headings=text.split('\n').reduce<{title:string;level:number;offset:number}[]>((items,line,index,lines)=>{const match=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);if(match)items.push({title:match[2],level:match[1].length,offset:lines.slice(0,index).join('\n').length+(index?1:0)});return items;},[]);
 const jump=(index:number)=>{if(mode==='preview'){preview.current?.querySelectorAll('h1,h2,h3,h4,h5,h6')[index]?.scrollIntoView({block:'nearest'});}else{editor.current?.focus();editor.current?.setSelectionRange(headings[index].offset,headings[index].offset);}};
 const content=<section className={`folio-field folio-notes${workspace?' notes-document':''}`}>
  <div className="folio-notes-head"><strong>{workspace?'Reading note.md':'Reading notes'}</strong><div role="group" aria-label="Reading notes display">{(['edit',...(workspace?['split'] as const:[]),'preview'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{flush();setMode(value);}}>{value==='edit'?'Source':value==='split'?'Split':'Preview'}</button>)}</div></div>
  <div className={`notes-panes notes-mode-${mode}`}>
   {mode!=='preview'&&<textarea ref={editor} aria-label="Reading notes" spellCheck placeholder={'# Reading notes\n\n## Key ideas\n\n## Questions\n\n## Useful passages'} value={text} onBlur={flush} onKeyDown={event=>{if((event.metaKey||event.ctrlKey)&&event.key==='s'){event.preventDefault();flush();}}} onChange={event=>{setText(event.target.value);latest.current=event.target.value;dirty.current=true;dirtyRef.current?.(true);sequence.current++;setState('Saving…');clearTimeout(timer.current);timer.current=setTimeout(flush,500);}}/>}
   {mode!=='edit'&&<div ref={preview} className="folio-notes-preview" aria-label="Rendered reading notes">{text.trim()?<ReactMarkdown remarkPlugins={[remarkGfm]} components={{a:({children,...props})=><a {...props} target="_blank" rel="noopener noreferrer">{children}</a>}}>{text}</ReactMarkdown>:<p className="folio-notes-empty">Write in Source to start your reading note. Markdown headings, lists, links, and tables appear here.</p>}</div>}
  </div>
  <small role="status">{state}{workspace?` · ${text.trim()?text.trim().split(/\s+/).length:0} words`:' · Markdown file in your library’s notes folder'}</small>
  {state.startsWith('Not saved')&&<button type="button" onClick={flush}>Retry saving</button>}
 </section>;
 if(!workspace)return content;
 return <div className="notes-workspace"><aside className="notes-vault"><h3>Paper notebook</h3><div className="notes-file-selected"><span aria-hidden="true">▤</span><span>{paper.title}<small>Markdown note</small></span></div><div className="notes-location"><h4>On your computer</h4><p>This note is saved in your library’s notes folder. Open that folder as an Obsidian vault to edit the same files.</p><label>Notes folder<input aria-label="Reader notes folder path" readOnly value={notesDir} onFocus={e=>e.currentTarget.select()}/></label><button type="button" disabled={!notesDir} onClick={()=>onCopy?.(notesDir)}>Copy folder path</button></div></aside>{content}<aside className="notes-outline"><h3>Outline</h3>{headings.length?<nav aria-label="Note outline">{headings.map((heading,index)=><button key={`${index}-${heading.title}`} style={{paddingLeft:8+Math.min(heading.level-1,3)*10}} onClick={()=>jump(index)}>{heading.title}</button>)}</nav>:<p>Add Markdown headings to navigate your note.</p>}<p className="notes-format-hint"># Heading<br/>**Bold** · *Italic*<br/>- List item<br/>- [ ] Task<br/>[Link](url)</p></aside></div>;
}
