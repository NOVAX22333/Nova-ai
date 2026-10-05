/* ---- history & saved ---- */
function rows(v,list,label,onOpen,onDel,empty){v.innerHTML=list.length?'':'<div class="empty">'+empty+'</div>';
 list.forEach(x=>{const r=document.createElement('div');r.className='row';r.innerHTML='<div class="t"></div><button class="btn o">'+label+'</button>';
  r.firstChild.textContent=x.title||x.t;r.firstChild.onclick=()=>onOpen(x);r.lastChild.onclick=()=>onDel(x);v.appendChild(r)})}
function renderHist(){rows($('#v-history'),chats,'Delete',c=>{chat=c;renderMsgs();show('chat')},c=>{chats=chats.filter(x=>x!==c);store();renderHist()},me?'No chats yet. Start a new chat.':'Log in to save your chat history.')}
function renderSaved(){rows($('#v-saved'),saved,'Remove',()=>{},s=>{saved=saved.filter(x=>x!==s);store();renderSaved()},'Nothing saved yet. Tap "Save" under an answer.')}

/* ---- quiz limits now count questions ---- */
async function apiAsk(msg,history,image,isQuiz,count){
 const t=await tok();if(!t){openAuth('Please log in again.');throw new Error('Please log in again.')}
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),60000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({message:msg,history:history||[],image:image||null,quiz:!!isQuiz,count:count||0}),signal:ctl.signal});
  if(!r.ok){let m='Server error '+r.status+'. Try again.';try{const j=await r.json();if(j.error)m=j.error}catch(x){}const er=new Error(m);er.status=r.status;throw er}
  return (await r.json()).reply||'No response received.';
 }catch(e){if(e.status===401){logoutLocal();openAuth('Your session ended. Please log in again.')}
  const er=new Error(e.name==='AbortError'?'Request timed out. Try again.':e.message);er.status=e.status;throw er}
 finally{clearTimeout(to)}}
function showAcc(){
 $('#qinfo').textContent=!me?'Log in to take quizzes.':!acc?'':acc.admin?'Admin: '+acc.left+' of '+acc.limit+' quiz questions left today.':acc.left+' of '+acc.limit+' free quiz questions left today'+(acc.credits?' · '+acc.credits+' bought questions':'');
 $('#qbuy').hidden=!(me&&acc&&!acc.admin)}

/* ---- quizzes (with timer) ---- */
let qtimer=null;
const stopT=()=>{if(qtimer){clearInterval(qtimer);qtimer=null}};
$('#qg').onclick=async()=>{
 if(!me)return openAuth('Log in to generate quizzes.');
 if(busy)return;
 await acct();
 if(!acc)return note('Could not check your quiz limit. Try again.');
 const avail=acc.admin?acc.left:acc.left+acc.credits;
 let n=+$('#qn').value;
 if(avail<=0)return note('No quiz questions left. Buy more below.');
 if(n>avail){n=avail;note('Only '+avail+' questions left, so this quiz is shorter.')}
 const secs=Math.max(0,Math.min(300,parseInt($('#qs').value,10)||0));
 busy=true;stopT();const b=$('#qg');b.disabled=true;b.textContent='Generating…';
 const typed=$('#qt').value.trim(),topic=typed||'a mix of ICT, mathematics and science',d=$('#qd').value;
 try{
  const t=await apiAsk('Create a '+n+'-question multiple choice quiz ('+d+' difficulty) for Senior High School students in Ghana on: '+topic+'. Reply with ONLY a JSON array and no other text or markdown. Each item must look like {"q":"question","o":["A","B","C","D"],"a":0,"e":"short explanation"} where a is the index (0-3) of the correct option. Do not use LaTeX or dollar signs; write any maths in plain text.',[],null,true,n);
  const qs=JSON.parse(t.slice(t.indexOf('['),t.lastIndexOf(']')+1));
  if(!Array.isArray(qs)||!qs.length||!qs.every(x=>x&&typeof x.q==='string'&&Array.isArray(x.o)&&x.o.length>1&&Number.isInteger(x.a)&&x.a>=0&&x.a<x.o.length))throw 0;
  quiz={topic:typed||'Mixed quiz',qs:qs.slice(0,n),ans:[],done:false,i:0,t:secs};renderQuiz();
 }catch(x){note(x instanceof SyntaxError||x===0?'Could not make the quiz. Please try again.':x.message)}
 acct();b.disabled=false;b.textContent='✨ Generate quiz';busy=false};
function score(){return quiz.qs.filter((q,i)=>quiz.ans[i]===q.a).length}
function finish(){stopT();quiz.done=true;const sc=score();quizzes.unshift({id:Date.now(),topic:quiz.topic,score:sc,total:quiz.qs.length,date:ymd(new Date())});store();renderPast();renderQuiz();note('You scored '+sc+'/'+quiz.qs.length)}
function nextQ(){if(quiz.i<quiz.qs.length-1){quiz.i++;renderQuiz()}else finish()}
function renderQuiz(){stopT();const box=$('#qbox');box.innerHTML='';if(!quiz)return;
 if(quiz.t>0&&!quiz.done){
  const q=quiz.qs[quiz.i],c=document.createElement('div');c.className='panel qq';
  const hd=document.createElement('p');hd.className='sub';hd.textContent='Question '+(quiz.i+1)+' of '+quiz.qs.length;
  const tm=document.createElement('p');tm.className='sub';
  const h=document.createElement('b');h.textContent=q.q;c.append(hd,tm,h);
  q.o.forEach((o,j)=>{const b=document.createElement('button');b.className='opt';b.textContent=String.fromCharCode(65+j)+'. '+o;
   b.onclick=()=>{stopT();quiz.ans[quiz.i]=j;c.querySelectorAll('.opt').forEach(x=>x.disabled=true);b.classList.add('sel');setTimeout(nextQ,350)};c.appendChild(b)});
  box.appendChild(c);
  let s=quiz.t;tm.textContent='⏱ '+s+'s';
  qtimer=setInterval(()=>{s--;tm.textContent='⏱ '+s+'s';if(s<=0){stopT();nextQ()}},1000);
  return}
 quiz.qs.forEach((q,i)=>{const c=document.createElement('div');c.className='panel qq';const h=document.createElement('b');h.textContent=(i+1)+'. '+q.q;c.appendChild(h);
  q.o.forEach((o,j)=>{const b=document.createElement('button');b.className='opt';b.textContent=String.fromCharCode(65+j)+'. '+o;
   if(quiz.ans[i]===j)b.classList.add('sel');
   if(quiz.done){b.disabled=true;if(j===q.a)b.classList.add('ok');else if(quiz.ans[i]===j)b.classList.add('bad')}
   b.onclick=()=>{quiz.ans[i]=j;renderQuiz()};c.appendChild(b)});
  if(quiz.done&&q.e){const e=document.createElement('p');e.className='sub';e.textContent='💡 '+q.e;c.appendChild(e)}
  box.appendChild(c)});
 const f=document.createElement('button');f.className='btn wide';
 if(quiz.done){f.textContent='Score: '+score()+'/'+quiz.qs.length+' · New quiz';f.onclick=()=>{quiz=null;renderQuiz();$('#qt').focus()}}
 else{f.textContent='Submit answers';f.onclick=finish}
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

/* ---- formula of the day ---- */
const FODS=[
['Maths','Quadratic formula','x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}','Solves ax² + bx + c = 0. If b² − 4ac is negative, there are no real roots.'],
['Maths','Pythagoras theorem','a^2+b^2=c^2','In a right-angled triangle, c is the hypotenuse (the side opposite the right angle).'],
['Maths','Area of a circle','A=\\pi r^2','r is the radius. The circumference is C = 2πr.'],
['Maths','Sine rule','\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}','Use it with two angles and a side, or two sides and a non-included angle.'],
['Maths','Cosine rule','a^2=b^2+c^2-2bc\\cos A','Use it with two sides and the included angle, or with all three sides.'],
['Maths','Sum of an arithmetic progression','S_n=\\frac{n}{2}\\left[2a+(n-1)d\\right]','a is the first term, d the common difference, n the number of terms.'],
['Maths','Sum of a geometric progression','S_n=\\frac{a(r^n-1)}{r-1}','a is the first term and r the common ratio (r ≠ 1).'],
['Maths','Gradient of a line','m=\\frac{y_2-y_1}{x_2-x_1}','The slope between the points (x₁, y₁) and (x₂, y₂).'],
['Maths','Compound interest','A=P\\left(1+\\frac{r}{100}\\right)^n','P is the principal, r the yearly rate in percent, n the number of years.'],
['Physics','Newton\'s second law','F=ma','Force equals mass times acceleration.'],
['Physics','Lami\'s theorem','\\frac{F_1}{\\sin\\alpha}=\\frac{F_2}{\\sin\\beta}=\\frac{F_3}{\\sin\\gamma}','For three coplanar forces in equilibrium at a point, each force is proportional to the sine of the angle between the other two. α is the angle between F₂ and F₃, and so on.'],
['Physics','Ohm\'s law','V=IR','Voltage equals current times resistance.'],
['Physics','Equations of motion','v=u+at,\\quad s=ut+\\frac{1}{2}at^2,\\quad v^2=u^2+2as','For constant acceleration a: u is the initial velocity, v the final velocity, s the displacement, t the time.'],
['Physics','Kinetic energy','E_k=\\frac{1}{2}mv^2','The energy of an object of mass m moving at speed v.'],
['Physics','Density','\\rho=\\frac{m}{V}','Mass divided by volume. Unit: kg/m³.'],
['Physics','Pressure','P=\\frac{F}{A}','Force per unit area. Unit: pascal (Pa).'],
['Physics','Wave speed','v=f\\lambda','Speed equals frequency times wavelength.'],
['Physics','Heat energy','Q=mc\\Delta\\theta','m is the mass, c the specific heat capacity, Δθ the temperature change.'],
['Chemistry','Amount of substance','n=\\frac{m}{M}','n is the moles, m the mass in grams, M the molar mass in g/mol.'],
['Chemistry','Ideal gas equation','PV=nRT','P pressure, V volume, n moles, R the gas constant, T temperature in kelvin.'],
['Chemistry','Molar concentration','C=\\frac{n}{V}','Moles of solute per litre (mol/dm³) of solution.']
];
function fod(){const f=FODS[Math.floor(Date.now()/864e5)%FODS.length],e=$('#fod');
 e.innerHTML='<h3>📐 Formula of the day</h3><p class="sub"></p><span class="mx" data-d="1"></span><p class="sub" style="margin-top:10px"></p>';
 e.children[1].textContent=f[0]+' · '+f[1];e.children[2].textContent=f[2];e.children[3].textContent=f[3];mathIn(e)}
const showBase=show;show=function(v){showBase(v);if(v==='home')fod()};

/* ---- settings ---- */
$('#ss').onclick=()=>{if(!me)return openAuth('Log in to edit your profile.');const n=$('#sn').value.trim();if(!n)return note('Enter your name.');prof={name:n,role:$('#sr').value};ls.s('nv_prof_'+me,prof);paint();note('Changes saved')};
$('#dk').onclick=()=>note('ACE_X uses the dark glass theme.');
$('#cl').onclick=()=>{if(!confirm('Delete all your chats on this device?'))return;chats=[];store();newChat();dash();note('Chats cleared')};
$('#lo').onclick=()=>{if(!me)return note('You are not logged in.');logoutLocal();note('Logged out')};

/* ---- start ---- */
if(me){load();loadProf()}
paint();showAcc();refresh();fod();newChat();show('chat');
if(me)tok().then(t=>{if(t)acct()});
