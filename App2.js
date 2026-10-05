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
