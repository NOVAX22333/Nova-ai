const API='https://nova-ai-backend-rho.vercel.app/api/chat';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ls={g:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let users=ls.g('nv_users',{}),me=ls.g('nv_me',null),chats=[],saved=[],chat=null,busy=false,signup=false,att={img:null,txt:null,name:''};
if(me&&!users[me])me=null;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const fmt=t=>esc(t).replace(/\x60{3}(?:\w*\n)?([\s\S]*?)\x60{3}/g,'<pre>$1</pre>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const note=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400)};
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const key=()=>me||'guest';
const load=()=>{chats=ls.g('nv_c_'+key(),[]);saved=ls.g('nv_s_'+key(),[])};
const store=()=>{ls.s('nv_c_'+key(),chats.map(c=>({...c,msgs:c.msgs.map(({img,...m})=>m)})));ls.s('nv_s_'+key(),saved)};
document.documentElement.dataset.theme=ls.g('nv_th','light');
const P=[['📝 Summarise text','Summarise this text:\n\n'],['💻 Write code','Write code in Python for: '],['🐞 Fix my code','Find and fix the bug in this code:\n\n'],['🧮 Solve a problem','Solve this step by step: '],['📅 WASSCE study plan','Create a WASSCE study plan for: '],['✉️ Official letter','Draft a formal official letter about: ']];

/* ---- login ---- */
function openAuth(m){$('#am').textContent=m||'Log in to continue.';$('#auth').hidden=false}
function mode(s){signup=s;$('#at').textContent=s?'Create account':'Log in';$('#nm').hidden=!s;$('#go').textContent=s?'Sign Up':'Log in';$('#sw').textContent=s?'Already have an account?':"Don't have an account?";$('#tg').textContent=s?'Log in':'Sign Up';$('#err').textContent=''}
$('#tg').onclick=()=>mode(!signup);
$('#ax').onclick=()=>{$('#auth').hidden=true};
$('#li').onclick=()=>{mode(false);openAuth('Log in to save your chats and use Nova.')};
$('#go').onclick=async()=>{
 const e=$('#email').value.trim().toLowerCase(),p=$('#pw').value,n=$('#name').value.trim(),er=m=>{$('#err').textContent=m};
 if(!/^\S+@\S+\.\S+$/.test(e))return er('Enter a valid email address.');
 if(p.length<6)return er('Password must be at least 6 characters.');
 if(!window.crypto||!crypto.subtle)return er('Open this site with https:// to log in.');
 const h=await sha(p);
 if(signup){
  if(!n)return er('Enter your name.');
  if(users[e])return er('This email already has an account. Log in instead.');
  users[e]={name:n,role:'Student',h};ls.s('nv_users',users);
 }else if(!users[e]||users[e].h!==h)return er('Wrong email or password.');
 me=e;ls.s('nv_me',me);$('#pw').value='';$('#auth').hidden=true;
 load();$('#sn').value=users[me].name;$('#sr').value=users[me].role;paint();
 if($('#inp').value.trim()||att.img||att.txt)send();
};
function paint(){const h=new Date().getHours();
 if(me){const u=users[me];$('#mn').textContent=u.name;$('#mr').textContent=u.role;$('#li').hidden=true;
  $('#hi').textContent=(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+', '+u.name.split(' ')[0]+' 👋'}
 else{$('#mn').textContent='Guest';$('#mr').textContent='Not logged in';$('#li').hidden=false;$('#hi').textContent='Welcome to Nova AI 👋'}}

/* ---- navigation ---- */
const T={home:'Home',chat:'New Chat',history:'Chat History',saved:'Saved Items',tools:'Tools',settings:'Settings'};
function show(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));$$('.nav').forEach(x=>x.classList.toggle('on',x.dataset.v===v));$('#ttl').textContent=T[v];$('#side').classList.remove('open');if(v==='history')renderHist();if(v==='saved')renderSaved();if(v==='chat')$('#inp').focus()}
$$('.nav').forEach(b=>b.onclick=()=>{if(b.id==='newc')newChat();show(b.dataset.v)});
$('#burger').onclick=()=>$('#side').classList.toggle('open');
$('#startc').onclick=()=>{newChat();show('chat')};
$('#up').onclick=()=>note('Pro plans are coming soon.');

/* ---- attachments ---- */
function shrink(f){return new Promise((ok,bad)=>{const r=new FileReader();r.onerror=()=>bad(new Error('Could not read the image.'));r.onload=()=>{const i=new Image();i.onerror=()=>bad(new Error('That is not a valid image.'));i.onload=()=>{const k=Math.min(1,1024/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',0.8))};i.src=r.result};r.readAsDataURL(f)})}
function pv(){const p=$('#pv'),on=att.img||att.txt;p.hidden=!on;p.innerHTML='';if(!on)return;
 const s=document.createElement('span');s.textContent=(att.img?'🖼️ ':'📎 ')+att.name;const b=document.createElement('button');b.textContent='Remove';
 b.onclick=()=>{att={img:null,txt:null,name:''};pv()};p.append(s,b)}
$('#bi').onclick=()=>{$('#ii').value='';$('#ii').click()};
$('#bf').onclick=()=>{$('#fi').value='';$('#fi').click()};
$('#ii').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{att={img:await shrink(f),txt:null,name:f.name};pv()}catch(x){note(x.message)}};
$('#fi').onchange=e=>{const f=e.target.files[0];if(!f)return;
 if(f.size>200000)return note('File too large. Use a text or code file under 200 KB.');
 const r=new FileReader();r.onload=()=>{att={img:null,txt:String(r.result).slice(0,20000),name:f.name};pv()};r.onerror=()=>note('Could not read that file.');r.readAsText(f)};

/* ---- chat ---- */
function newChat(){chat={id:Date.now(),title:'New chat',msgs:[]};renderMsgs()}
function renderMsgs(){const box=$('#msgs');box.innerHTML='';
 if(!chat.msgs.length){const e=document.createElement('div');e.className='empty';e.innerHTML='<h2>Nova AI</h2>Your coding and study assistant. Ask me anything.<div class="chips e"></div>';
  P.slice(0,4).forEach(p=>{const b=document.createElement('button');b.className='chip';b.textContent=p[0];b.onclick=()=>{$('#inp').value=p[1];$('#inp').focus()};e.lastChild.appendChild(b)});box.appendChild(e);return}
 chat.msgs.forEach(m=>{const d=document.createElement('div');d.className='m '+m.r;
  d.innerHTML='<div class="av">'+(m.r==='user'?'U':'N')+'</div><div class="bd">'+fmt(m.t)+(m.r==='assistant'?'<button class="sv cp">Copy</button><button class="sv sa">🔖 Save</button>':'')+'</div>';
  if(m.img){const i=new Image();i.src=m.img;d.querySelector('.bd').prepend(i)}
  const c=d.querySelector('.cp');
  if(c){c.onclick=async()=>{try{await navigator.clipboard.writeText(m.t);note('Copied')}catch(e){note('Could not copy')}};
   d.querySelector('.sa').onclick=()=>{saved.unshift({id:Date.now(),t:m.t});store();note('Saved')}}
  box.appendChild(d)});
 box.scrollTop=box.scrollHeight}
async function send(){
 const inp=$('#inp'),text=inp.value.trim();
 if(busy||(!text&&!att.img&&!att.txt))return;
 if(!me)return openAuth('Log in to send your message.');
 busy=true;
 const a=att,msg=(text||'Please look at the attachment.')+(a.txt?'\n\n[File: '+a.name+']\n'+a.txt:'');
 const history=chat.msgs.slice(-20).map(m=>({role:m.r,content:m.t}));
 inp.value='';att={img:null,txt:null,name:''};pv();
 chat.msgs.push({r:'user',t:(text||'(attachment)')+(a.name?'\n📎 '+a.name:''),img:a.img});
 if(chat.msgs.length===1){chat.title=(text||a.name||'Attachment').slice(0,40);chats.unshift(chat)}
 renderMsgs();
 const w=document.createElement('div');w.className='m';w.innerHTML='<div class="av">N</div><div class="bd">Thinking…</div>';$('#msgs').appendChild(w);$('#msgs').scrollTop=1e9;
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),60000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history,image:a.img}),signal:ctl.signal});
  if(!r.ok){let m='Server error '+r.status+'. Try again.';try{const j=await r.json();if(j.error)m=j.error}catch(x){}throw new Error(m)}
  const d=await r.json();
  chat.msgs.push({r:'assistant',t:d.reply||'No response received.'});
 }catch(e){
  chat.msgs.pop();inp.value=text;att=a;pv();
  if(!chat.msgs.length)chats=chats.filter(c=>c!==chat);
  note(e.name==='AbortError'?'Request timed out. Try again.':e.message);
 }
 clearTimeout(to);busy=false;store();renderMsgs()}
$('#send').onclick=send;
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});

/* ---- history & saved ---- */
function rows(v,list,label,onOpen,onDel,empty){v.innerHTML=list.length?'':'<div class="empty">'+empty+'</div>';
 list.forEach(x=>{const r=document.createElement('div');r.className='row';r.innerHTML='<div class="t"></div><button class="btn o">'+label+'</button>';
  r.firstChild.textContent=x.title||x.t;r.firstChild.onclick=()=>onOpen(x);r.lastChild.onclick=()=>onDel(x);v.appendChild(r)})}
function renderHist(){rows($('#v-history'),chats,'Delete',c=>{chat=c;renderMsgs();show('chat')},c=>{chats=chats.filter(x=>x!==c);store();renderHist()},me?'No chats yet. Start a new chat.':'Log in to save your chat history.')}
function renderSaved(){rows($('#v-saved'),saved,'Remove',()=>{},s=>{saved=saved.filter(x=>x!==s);store();renderSaved()},'Nothing saved yet. Tap "Save" under an answer.')}

/* ---- tools, home cards ---- */
function useP(t){newChat();show('chat');$('#inp').value=t;$('#inp').focus()}
$('#qa').append(...P.map(p=>{const b=document.createElement('button');b.className='chip';b.textContent=p[0];b.onclick=()=>useP(p[1]);return b}));
$('#tl').append(...P.map(p=>{const b=document.createElement('button');b.className='card';b.innerHTML='<b></b><span>Tap to start</span>';b.firstChild.textContent=p[0];b.onclick=()=>useP(p[1]);return b}));
$$('#v-home .card').forEach(c=>c.onclick=()=>useP(c.dataset.p));

/* ---- settings ---- */
$('#ss').onclick=()=>{if(!me)return openAuth('Log in to edit your profile.');const n=$('#sn').value.trim();if(!n)return note('Enter your name.');users[me].name=n;users[me].role=$('#sr').value;ls.s('nv_users',users);paint();note('Changes saved')};
$('#dk').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;ls.s('nv_th',t)};
$('#cl').onclick=()=>{if(!confirm('Delete all your chats on this device?'))return;chats=[];store();newChat();note('Chats cleared')};
$('#lo').onclick=()=>{if(!me)return note('You are not logged in.');me=null;ls.s('nv_me',null);load();paint();newChat();show('chat');note('Logged out')};

/* ---- start ---- */
if(me){load();$('#sn').value=users[me].name;$('#sr').value=users[me].role}
paint();newChat();show('chat');
