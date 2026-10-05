const API='https://nova-ai-backend-rho.vercel.app/api/chat',ACC='https://nova-ai-backend-rho.vercel.app/api/account';
const SB='https://qlvbuxrmgxpytgpvcguw.supabase.co',PUB='sb_publishable_GVKoHxwlqBKilE0j90s2Ww_Me0rb9Ua',PK='pk_test_222f3ca8b56326bd1f91f555ffe76c4a452699ae';
const $=s=>document.querySelector(s)||document.createElement('div'),$$=s=>[...document.querySelectorAll(s)];
const ls={g:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const ses={g:k=>{try{return JSON.parse(sessionStorage.getItem(k))}catch(e){return null}},s:(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
try{localStorage.removeItem('nv_me');localStorage.removeItem('nv_users')}catch(e){}
let sess=ses.g('nv_sess'),me=sess?sess.email:null,acc=null,prof={},chats=[],saved=[],quizzes=[],plan=[],chat=null,quiz=null,busy=false,signup=false,att={img:null,txt:null,name:''},cur=new Date();
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let sel=ymd(new Date());
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const fmt=t=>{const K=[];
 t=t.replace(/\x60{3}(?:\w*\n)?([\s\S]*?)\x60{3}/g,(m,c)=>{K.push('<pre>'+esc(c)+'</pre>');return '\x01'+(K.length-1)+'\x01'});
 t=t.replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)([^\$\n]*[^\s\$])\$(?!\d)/g,(m,a,b,c,d)=>{const x=a!=null?a:b!=null?b:c!=null?c:d;K.push('<span class="mx" data-d="'+(a!=null||b!=null?1:0)+'">'+esc(x)+'</span>');return '\x01'+(K.length-1)+'\x01'});
 return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>').replace(/\x01(\d+)\x01/g,(m,i)=>K[i])};
function mathIn(el){if(!window.katex)return;el.querySelectorAll('.mx').forEach(s=>{try{katex.render(s.textContent,s,{displayMode:s.dataset.d==='1',throwOnError:false})}catch(e){}})}
const note=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2800)};
const key=()=>me||'guest';
const load=()=>{chats=ls.g('nv_c_'+key(),[]);saved=ls.g('nv_s_'+key(),[]);quizzes=ls.g('nv_q_'+key(),[]);plan=ls.g('nv_p_'+key(),[])};
const store=()=>{ls.s('nv_c_'+key(),chats.map(c=>({...c,msgs:c.msgs.map(({img,...m})=>m)})));ls.s('nv_s_'+key(),saved);ls.s('nv_q_'+key(),quizzes);ls.s('nv_p_'+key(),plan)};
function loadProf(){prof=me?ls.g('nv_prof_'+me,{}):{};$('#sn').value=prof.name||(sess?sess.name:'');$('#sr').value=prof.role||'Student'}
document.documentElement.dataset.theme='dark';
const FONTS={Modern:'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',Serif:'Georgia,"Times New Roman",serif',Mono:'ui-monospace,Menlo,Consolas,monospace',Comfort:'Verdana,Tahoma,sans-serif'};
function applyFont(){const f=ls.g('nv_font','Modern'),z=ls.g('nv_fs','16'),r=document.documentElement.style;r.setProperty('--af',FONTS[f]||FONTS.Modern);r.setProperty('--fs',z+'px');$('#sf').value=f;$('#sz').value=z}
$('#sf').onchange=e=>{ls.s('nv_font',e.target.value);applyFont()};
$('#sz').onchange=e=>{ls.s('nv_fs',e.target.value);applyFont()};
$('#fz').onclick=()=>{const k=Object.keys(FONTS),f=k[(k.indexOf(ls.g('nv_font','Modern'))+1)%k.length];ls.s('nv_font',f);applyFont();note('Font: '+f)};
applyFont();
const P=[['📝 Summarise text','Summarise this text:\n\n'],['💻 Write code','Write code in Python for: '],['🐞 Fix my code','Find and fix the bug in this code:\n\n'],['🧮 Solve a problem','Solve this step by step: '],['📅 WASSCE study plan','Create a WASSCE study plan for: '],['✉️ Official letter','Draft a formal official letter about: ']];

/* ---- real login (Supabase) ---- */
async function sbAuth(path,body){const r=await fetch(SB+path,{method:'POST',headers:{apikey:PUB,'Content-Type':'application/json'},body:JSON.stringify(body)});let d={};try{d=await r.json()}catch(e){}
 if(!r.ok)throw new Error(d.msg||d.error_description||d.message||'Could not complete that. Try again.');return d}
function setSess(d){if(!d.access_token||!d.user)throw new Error('Could not log in. Please try again.');
 const keep=sess&&sess.name;
 sess={at:d.access_token,rt:d.refresh_token,exp:Date.now()+(d.expires_in||3600)*1000-60000,id:d.user.id,email:(d.user.email||'').toLowerCase(),name:(d.user.user_metadata&&d.user.user_metadata.name)||keep||(d.user.email||'').split('@')[0]};
 ses.s('nv_sess',sess);me=sess.email}
async function tok(){if(!sess)return null;
 if(Date.now()>sess.exp){try{setSess(await sbAuth('/auth/v1/token?grant_type=refresh_token',{refresh_token:sess.rt}))}catch(e){logoutLocal();return null}}
 return sess.at}
function logoutLocal(){sess=null;me=null;acc=null;ses.s('nv_sess',null);load();loadProf();quiz=null;renderQuiz();paint();showAcc();refresh();newChat();show('chat')}
function openAuth(m){$('#am').textContent=m||'Log in to continue.';$('#auth').hidden=false}
function mode(s){signup=s;$('#at').textContent=s?'Create account':'Log in';$('#nm').hidden=!s;$('#go').textContent=s?'Sign Up':'Log in';$('#sw').textContent=s?'Already have an account?':"Don't have an account?";$('#tg').textContent=s?'Log in':'Sign Up';$('#err').textContent=''}
$('#tg').onclick=()=>mode(!signup);
$('#ax').onclick=()=>{$('#auth').hidden=true};
$('#li').onclick=()=>{mode(false);openAuth('Log in to chat, take quizzes and save your work.')};
$('#go').onclick=async()=>{
 const e=$('#email').value.trim().toLowerCase(),p=$('#pw').value,n=$('#name').value.trim(),er=m=>{$('#err').textContent=m},b=$('#go');
 if(!/^\S+@\S+\.\S+$/.test(e))return er('Enter a valid email address.');
 if(p.length<6)return er('Password must be at least 6 characters.');
 if(signup&&!n)return er('Enter your name.');
 b.disabled=true;er('');
 try{setSess(signup?await sbAuth('/auth/v1/signup',{email:e,password:p,data:{name:n}}):await sbAuth('/auth/v1/token?grant_type=password',{email:e,password:p}))}
 catch(x){b.disabled=false;return er(x.message)}
 b.disabled=false;$('#pw').value='';$('#auth').hidden=true;
 load();loadProf();paint();refresh();acct();
 if($('#inp').value.trim()||att.img||att.txt)send();
};
function paint(){
 if(me){$('#mn').textContent=prof.name||sess.name;$('#mr').textContent=prof.role||'Student';$('#li').hidden=true;$('#hi').textContent='Welcome back, '+(prof.name||sess.name).split(' ')[0]}
 else{$('#mn').textContent='Guest';$('#mr').textContent='Not logged in';$('#li').hidden=false;$('#hi').textContent='Welcome to ACE_X AI'}
}
function refresh(){dash();renderPast();renderCal()}

/* ---- account, quiz limits, payments ---- */
async function callAcc(body){const t=await tok();if(!t)throw new Error('Please log in again.');
 const r=await fetch(ACC,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Request failed.');return d}
async function acct(){if(!me){acc=null;showAcc();return}try{acc=await callAcc({action:'status'})}catch(e){acc=null}showAcc()}
function showAcc(){
 $('#qinfo').textContent=!me?'Log in to take quizzes.':!acc?'':acc.admin?'Admin: '+acc.left+' of '+acc.limit+' quizzes left today.':acc.left+' of '+acc.limit+' free quizzes left today'+(acc.credits?' · '+acc.credits+' bought quizzes':'');
 $('#qbuy').hidden=!(me&&acc&&!acc.admin)}
function buy(plan){
 if(!me)return openAuth('Log in to buy quizzes.');
 if(!window.PaystackPop)return note('Payment page did not load. Check your internet and refresh.');
 PaystackPop.setup({key:PK,email:me,amount:plan==='p1'?100:200,currency:'GHS',ref:'ax'+Date.now()+Math.floor(Math.random()*1e6),metadata:{uid:sess.id,plan:plan},
  callback:function(r){verifyPay(r.reference,plan)},onClose:function(){note('Payment window closed.')}}).openIframe()}
async function verifyPay(ref,plan){note('Confirming your payment…');
 try{acc=await callAcc({action:'verify',reference:ref,plan:plan});showAcc();note(acc.added===false?'This payment was already counted.':'Payment confirmed. Quizzes added!')}
 catch(e){note(e.message)}}
$$('#qbuy button').forEach(b=>b.onclick=()=>buy(b.dataset.p));
$('#adm').onclick=async()=>{if(!me)return openAuth('Log in first, then enter the admin code.');
 const c=$('#acode').value.trim();if(!c)return note('Enter the admin code.');
 try{acc=await callAcc({action:'admin',code:c});$('#acode').value='';showAcc();note('Admin mode is on.')}catch(e){note(e.message)}};

/* ---- navigation ---- */
const T={home:'Dashboard',chat:'Tutor Chat',history:'Chat History',saved:'Saved Items',quiz:'Quizzes',plan:'Study Planner',settings:'Settings'};
function show(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));$$('.nav').forEach(x=>x.classList.toggle('on',x.dataset.v===v));$('#ttl').textContent=T[v];$('#side').classList.remove('open');
 if(v==='home')dash();if(v==='history')renderHist();if(v==='saved')renderSaved();if(v==='quiz'){renderPast();acct()}if(v==='plan')renderCal();if(v==='chat')$('#inp').focus()}
$$('.nav').forEach(b=>b.onclick=()=>{if(b.id==='newc')newChat();show(b.dataset.v)});
$('#burger').onclick=()=>$('#side').classList.toggle('open');
$('#startc').onclick=()=>{newChat();show('chat')};
$('#up').onclick=()=>note('Pro plans are coming soon.');

/* ---- dashboard ---- */
function dash(){
 $('#s1').textContent=chats.length;$('#s2').textContent=quizzes.length;
 $('#s3').textContent=(quizzes.length?Math.round(quizzes.reduce((a,q)=>a+q.score/q.total*100,0)/quizzes.length):0)+'%';
 $('#s4').textContent=plan.filter(p=>!p.done).length;
 const p=$('#perf');p.innerHTML=quizzes.length?'':'<div class="empty">Not enough activity yet. Take a quiz to see your trend here.</div>';
 quizzes.slice(0,8).reverse().forEach(q=>{const pc=Math.round(q.score/q.total*100),r=document.createElement('div');r.className='bar';r.innerHTML='<span></span><i><u style="width:'+pc+'%"></u></i><em>'+pc+'%</em>';r.firstChild.textContent=q.topic;p.appendChild(r)})}

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
async function apiAsk(msg,history,image,isQuiz){
 const t=await tok();if(!t){openAuth('Please log in again.');throw new Error('Please log in again.')}
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),60000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({message:msg,history:history||[],image:image||null,quiz:!!isQuiz}),signal:ctl.signal});
  if(!r.ok){let m='Server error '+r.status+'. Try again.';try{const j=await r.json();if(j.error)m=j.error}catch(x){}const er=new Error(m);er.status=r.status;throw er}
  return (await r.json()).reply||'No response received.';
 }catch(e){if(e.status===401){logoutLocal();openAuth('Your session ended. Please log in again.')}
  const er=new Error(e.name==='AbortError'?'Request timed out. Try again.':e.message);er.status=e.status;throw er}
 finally{clearTimeout(to)}}
function newChat(){chat={id:Date.now(),title:'New chat',msgs:[]};renderMsgs()}
function renderMsgs(){const box=$('#msgs');box.innerHTML='';
 if(!chat.msgs.length){const e=document.createElement('div');e.className='empty';e.innerHTML='<img src="logo.png" alt="ACE_X AI" class="main-logo" onerror="this.remove()"><h2>ACE_X AI</h2>Your coding and study assistant. Ask me anything.<div class="chips e"></div>';
  P.slice(0,4).forEach(p=>{const b=document.createElement('button');b.className='chip';b.textContent=p[0];b.onclick=()=>{$('#inp').value=p[1];$('#inp').focus()};e.lastChild.appendChild(b)});box.appendChild(e);return}
 chat.msgs.forEach(m=>{const d=document.createElement('div');d.className='m '+m.r;
  d.innerHTML='<div class="av">'+(m.r==='user'?'U':'N')+'</div><div class="bd">'+fmt(m.t)+(m.r==='assistant'?'<button class="sv cp">Copy</button><button class="sv sa">🔖 Save</button>':'')+'</div>';
  if(m.img){const i=new Image();i.src=m.img;d.querySelector('.bd').prepend(i)}
  const c=d.querySelector('.cp');
  if(c){c.onclick=async()=>{try{await navigator.clipboard.writeText(m.t);note('Copied')}catch(e){note('Could not copy')}};
   d.querySelector('.sa').onclick=()=>{saved.unshift({id:Date.now(),t:m.t});store();note('Saved')}}
  box.appendChild(d);mathIn(d)});
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
 try{chat.msgs.push({r:'assistant',t:await apiAsk(msg,history,a.img,false)})}
 catch(e){
  chat.msgs.pop();inp.value=text;att=a;pv();
  if(!chat.msgs.length)chats=chats.filter(c=>c!==chat);
  note(e.message);
 }
 busy=false;store();renderMsgs()}
$('#send').onclick=send;
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
/* ---- history & saved ---- */
function rows(v,list,label,onOpen,onDel,empty){v.innerHTML=list.length?'':'<div class="empty">'+empty+'</div>';
 list.forEach(x=>{const r=document.createElement('div');r.className='row';r.innerHTML='<div class="t"></div><button class="btn o">'+label+'</button>';
  r.firstChild.textContent=x.title||x.t;r.firstChild.onclick=()=>onOpen(x);r.lastChild.onclick=()=>onDel(x);v.appendChild(r)})}
function renderHist(){rows($('#v-history'),chats,'Delete',c=>{chat=c;renderMsgs();show('chat')},c=>{chats=chats.filter(x=>x!==c);store();renderHist()},me?'No chats yet. Start a new chat.':'Log in to save your chat history.')}
function renderSaved(){rows($('#v-saved'),saved,'Remove',()=>{},s=>{saved=saved.filter(x=>x!==s);store();renderSaved()},'Nothing saved yet. Tap "Save" under an answer.')}

/* ---- quizzes ---- */
$('#qg').onclick=async()=>{
 if(!me)return openAuth('Log in to generate quizzes.');
 if(busy)return;busy=true;const b=$('#qg');b.disabled=true;b.textContent='Generating…';
 const typed=$('#qt').value.trim(),topic=typed||'a mix of ICT, mathematics and science',n=+$('#qn').value,d=$('#qd').value;
 try{
  const t=await apiAsk('Create a '+n+'-question multiple choice quiz ('+d+' difficulty) for Senior High School students in Ghana on: '+topic+'. Reply with ONLY a JSON array and no other text or markdown. Each item must look like {"q":"question","o":["A","B","C","D"],"a":0,"e":"short explanation"} where a is the index (0-3) of the correct option. Do not use LaTeX or dollar signs; write any maths in plain text.',[],null,true);
  const qs=JSON.parse(t.slice(t.indexOf('['),t.lastIndexOf(']')+1));
  if(!Array.isArray(qs)||!qs.length||!qs.every(x=>x&&typeof x.q==='string'&&Array.isArray(x.o)&&x.o.length>1&&Number.isInteger(x.a)&&x.a>=0&&x.a<x.o.length))throw 0;
  quiz={topic:typed||'Mixed quiz',qs,ans:[],done:false};renderQuiz();
 }catch(x){note(x instanceof SyntaxError||x===0?'Could not make the quiz. Please try again.':x.message)}
 acct();b.disabled=false;b.textContent='✨ Generate quiz';busy=false};
function score(){return quiz.qs.filter((q,i)=>quiz.ans[i]===q.a).length}
function renderQuiz(){const box=$('#qbox');box.innerHTML='';if(!quiz)return;
 quiz.qs.forEach((q,i)=>{const c=document.createElement('div');c.className='panel qq';const h=document.createElement('b');h.textContent=(i+1)+'. '+q.q;c.appendChild(h);
  q.o.forEach((o,j)=>{const b=document.createElement('button');b.className='opt';b.textContent=String.fromCharCode(65+j)+'. '+o;
   if(quiz.ans[i]===j)b.classList.add('sel');
   if(quiz.done){b.disabled=true;if(j===q.a)b.classList.add('ok');else if(quiz.ans[i]===j)b.classList.add('bad')}
   b.onclick=()=>{quiz.ans[i]=j;renderQuiz()};c.appendChild(b)});
  if(quiz.done&&q.e){const e=document.createElement('p');e.className='sub';e.textContent='💡 '+q.e;c.appendChild(e)}
  box.appendChild(c)});
 const f=document.createElement('button');f.className='btn wide';
 if(quiz.done){f.textContent='Score: '+score()+'/'+quiz.qs.length+' · New quiz';f.onclick=()=>{quiz=null;renderQuiz();$('#qt').focus()}}
 else{f.textContent='Submit answers';f.onclick=()=>{quiz.done=true;const sc=score();quizzes.unshift({id:Date.now(),topic:quiz.topic,score:sc,total:quiz.qs.length,date:ymd(new Date())});store();renderPast();renderQuiz();note('You scored '+sc+'/'+quiz.qs.length)}}
 box.appendChild(f)}
function renderPast(){const p=$('#qp');p.innerHTML=quizzes.length?'':'<div class="panel sub">You haven\'t taken a quiz yet. Generate one to get started.</div>';
 quizzes.slice(0,10).forEach(q=>{const r=document.createElement('div');r.className='row';r.innerHTML='<div class="t"></div><b></b>';r.firstChild.textContent=q.topic+' · '+q.date;r.lastChild.textContent=q.score+'/'+q.total;p.appendChild(r)})}

/* ---- planner ---- */
function renderCal(){const y=cur.getFullYear(),m=cur.getMonth();$('#pm').textContent=cur.toLocaleString('en',{month:'long'})+' '+y;
 const c=$('#cal');c.innerHTML='';['S','M','T','W','T','F','S'].forEach(d=>{const h=document.createElement('i');h.textContent=d;c.appendChild(h)});
 const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
 for(let i=0;i<first;i++)c.appendChild(document.createElement('span'));
 for(let d=1;d<=days;d++){const k=y+'-'+pad(m+1)+'-'+pad(d),b=document.createElement('button');b.textContent=d;
  if(k===sel)b.classList.add('on');if(plan.some(p=>p.date===k))b.classList.add('has');b.onclick=()=>{sel=k;renderCal()};c.appendChild(b)}
 $('#pd').textContent=new Date(sel+'T00:00').toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
 const l=$('#pl'),list=plan.filter(p=>p.date===sel).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
 l.innerHTML=list.length?'':'<p class="sub">Nothing planned for this day yet.</p>';
 list.forEach(p=>{const r=document.createElement('div');r.className='row';r.innerHTML='<input type="checkbox" class="ck"><div class="t"></div><button class="btn o">✕</button>';
  const ck=r.firstChild,t=r.children[1];ck.checked=!!p.done;ck.onchange=()=>{p.done=ck.checked;store();renderCal()};
  t.textContent=(p.time?p.time+' · ':'')+p.title;if(p.done)t.style.textDecoration='line-through';
  r.lastChild.onclick=()=>{plan=plan.filter(x=>x!==p);store();renderCal()};l.appendChild(r)})}
$('#pp').onclick=()=>{cur=new Date(cur.getFullYear(),cur.getMonth()-1,1);renderCal()};
$('#pn').onclick=()=>{cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);renderCal()};
$('#padd').onclick=()=>{
 if(!me)return openAuth('Log in to save your study plan.');
 const t=$('#ptitle').value.trim();if(!t)return note('Enter a session title.');
 plan.push({id:Date.now(),date:sel,time:$('#ptime').value,title:t,done:false});$('#ptitle').value='';store();renderCal()};

/* ---- quick actions ---- */
function useP(t){newChat();show('chat');$('#inp').value=t;$('#inp').focus()}
$('#qa').append(...P.map(p=>{const b=document.createElement('button');b.className='chip';b.textContent=p[0];b.onclick=()=>useP(p[1]);return b}));

/* ---- settings ---- */
$('#ss').onclick=()=>{if(!me)return openAuth('Log in to edit your profile.');const n=$('#sn').value.trim();if(!n)return note('Enter your name.');prof={name:n,role:$('#sr').value};ls.s('nv_prof_'+me,prof);paint();note('Changes saved')};
$('#dk').onclick=()=>note('ACE_X uses the dark glass theme.');
$('#cl').onclick=()=>{if(!confirm('Delete all your chats on this device?'))return;chats=[];store();newChat();dash();note('Chats cleared')};
$('#lo').onclick=()=>{if(!me)return note('You are not logged in.');logoutLocal();note('Logged out')};

/* ---- start ---- */
if(me){load();loadProf()}
paint();showAcc();refresh();newChat();show('chat');
if(me)tok().then(t=>{if(t)acct()});
