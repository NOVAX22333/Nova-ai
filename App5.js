/* ---- Code Lab ---- */
T.lab='Code Lab';
let lab=null,labTimer=null;
const labOut=(s,rep)=>{const o=$('#cl-o');o.textContent=rep?s:o.textContent+s;if(o.textContent.length>20000)o.textContent=o.textContent.slice(-20000)};
function labStop(){if(labTimer){clearTimeout(labTimer);labTimer=null}if(lab){lab.remove();lab=null}}
function labRun(){
 const code=$('#cl-c').value,lang=$('#cl-l').value;
 if(!code.trim())return note('Write some code first.');
 labStop();labOut(lang==='py'?'Starting Python… the first run can take a while.\n':'',true);
 const js=JSON.stringify(code).replace(/</g,'\\u003c');
 const head='<script>const post=(t,x)=>parent.postMessage({lab:1,t:t,x:x},"*");<\/script>';
 const body=lang==='py'
  ?'<script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"><\/script><script>(async()=>{try{const py=await loadPyodide();py.setStdout({batched:s=>post("out",s+"\\n")});py.setStderr({batched:s=>post("out",s+"\\n")});post("ready","");await py.runPythonAsync('+js+');post("done","")}catch(e){post("err",String(e.message||e))}})()<\/script>'
  :'<script>const L=(...a)=>post("out",a.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" ")+"\\n");console.log=L;console.error=L;console.warn=L;try{(0,eval)('+js+');post("done","")}catch(e){post("err",String(e))}<\/script>';
 const f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts');f.style.display='none';
 f.srcdoc='<!doctype html><html><body>'+head+body+'</body></html>';
 lab=f;document.body.appendChild(f);
 labTimer=setTimeout(()=>{labOut('\n⏱ Stopped after 30 seconds.\n');labStop()},30000)}
window.addEventListener('message',e=>{const d=e.data;if(!d||!d.lab||!lab||e.source!==lab.contentWindow)return;
 if(d.t==='ready')labOut('',true);
 if(d.t==='out')labOut(d.x);
 if(d.t==='err'){labOut('\n❌ '+d.x+'\n');labStop()}
 if(d.t==='done'){labOut('\n✔ Finished\n');labStop()}});
$('#cl-run').onclick=labRun;
$('#cl-stop').onclick=()=>{labStop();labOut('\n■ Stopped.\n')};
$('#cl-l').onchange=()=>{const c=$('#cl-c');if(!c.value.trim()||/^(print\("Hello, world!"\)|console\.log\("Hello, world!"\);?)$/.test(c.value.trim()))c.value=$('#cl-l').value==='py'?'print("Hello, world!")':'console.log("Hello, world!");'};

const FENCE='\x60\x60\x60';
async function labAI(kind){if(!await needPro())return;
 const code=$('#cl-c').value.trim();if(!code)return note('Write some code first.');
 const lang=$('#cl-l').value==='py'?'Python':'JavaScript',out=$('#cl-o').textContent.slice(-3000),a=$('#cl-a');
 const ask={
  x:'Explain this '+lang+' code line by line in simple terms, then say what it prints.',
  f:'Find and fix every bug or error in this '+lang+' code. Show the corrected full code in a code block, then list what was wrong.',
  r:'Review this '+lang+' code like a senior developer: correctness, readability, efficiency and edge cases. Give a short list of improvements and a better version.',
  t:'Write clear tests for this '+lang+' code (use simple assert statements), including edge cases, and explain what each test checks.'
 }[kind];
 a.hidden=false;a.textContent='Thinking…';
 try{a.innerHTML=fmt(await apiAsk(ask+'\n\nCODE:\n'+FENCE+'\n'+code.slice(0,8000)+'\n'+FENCE+'\n\nLAST OUTPUT OR ERROR:\n'+(out||'(none)'),[],null,false,0,true));mathIn(a)}
 catch(e){a.hidden=true;note(e.message)}}
$('#cl-x').onclick=()=>labAI('x');$('#cl-f').onclick=()=>labAI('f');
$('#cl-r').onclick=()=>labAI('r');$('#cl-t').onclick=()=>labAI('t');
