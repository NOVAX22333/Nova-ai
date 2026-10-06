/* ---- Pro, hub, exam practice, image studio, voice ---- */
const IMG='https://nova-ai-backend-rho.vercel.app/api/image';
T.pro='Go Pro';T.hub='Formula & Definition Hub';T.exam='Probable Exam Questions';T.studio='Image Studio';
const isVip=()=>!!(acc&&(acc.pro||acc.admin));
async function needPro(){if(!me){openAuth('Log in to use Pro features.');return false}
 if(!acc)await acct();
 if(!isVip()){note('This is a Pro feature. Pick a plan to unlock it.');show('pro');return false}
 return true}

/* ask the AI, with the Pro flag */
async function apiAsk(msg,history,image,isQuiz,count,isPro){
 const t=await tok();if(!t){openAuth('Please log in again.');throw new Error('Please log in again.')}
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),60000);
 try{
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({message:msg,history:history||[],image:image||null,quiz:!!isQuiz,count:count||0,pro:!!isPro}),signal:ctl.signal});
  if(!r.ok){let m='Server error '+r.status+'. Try again.';try{const j=await r.json();if(j.error)m=j.error}catch(x){}const er=new Error(m);er.status=r.status;throw er}
  return (await r.json()).reply||'No response received.';
 }catch(e){if(e.status===401){logoutLocal();openAuth('Your session ended. Please log in again.')}
  const er=new Error(e.name==='AbortError'?'Request timed out. Try again.':e.message);er.status=e.status;throw er}
 finally{clearTimeout(to)}}

/* account display with Pro badge */
function showAcc(){
 const pro=acc&&acc.pro,adm=acc&&acc.admin;
 $('#qinfo').textContent=!me?'Log in to take quizzes.':!acc?'':(pro||adm)?(adm?'Admin: ':'Pro ⭐: ')+acc.left+' of '+acc.limit+' quiz questions left today.':acc.left+' of '+acc.limit+' free quiz questions left today'+(acc.credits?' · '+acc.credits+' bought questions':'');
 $('#qbuy').hidden=!(me&&acc&&!adm&&!pro);
 if(me)$('#mr').textContent=(prof.role||'Student')+(pro?' · ⭐ Pro':'')+(adm?' · Admin':'');
 $('#proinfo').textContent=!me?'Log in to upgrade.':pro?'You are Pro until '+new Date(acc.proUntil).toLocaleDateString()+'. Buy again to extend.':adm?'Admin: every feature is free.':'Pick a plan to unlock all Pro features.'}
const _paint=paint;paint=function(){_paint();if(me)showAcc()};
const _show=show;show=function(v){_show(v);if(['pro','hub','exam','studio'].includes(v))acct()};

/* buy Pro */
const PRO={w1:[200],w2:[400],w3:[600],m1:[800],m5:[4000],y1:[10000]};
function buyPro(plan){
 if(!me)return openAuth('Log in to go Pro.');
 if(!window.PaystackPop)return note('Payment page did not load. Check your internet and refresh.');
 PaystackPop.setup({key:PK,email:me,amount:PRO[plan][0],currency:'GHS',ref:'ax'+Date.now()+Math.floor(Math.random()*1e6),metadata:{uid:sess.id,plan:plan},
  callback:function(r){verifyPay(r.reference,plan)},onClose:function(){note('Payment window closed.')}}).openIframe()}
async function verifyPay(ref,plan){note('Confirming your payment…');
 try{acc=await callAcc({action:'verify',reference:ref,plan:plan});showAcc();note(acc.added===false?'This payment was already counted.':PRO[plan]?'Welcome to Pro! ⭐':'Payment confirmed. Questions added!')}
 catch(e){note(e.message)}}
$$('[data-pro]').forEach(b=>b.onclick=()=>buyPro(b.dataset.pro));
$('#up').onclick=()=>show('pro');

/* formula and definition hub */
async function hub(kind){if(!await needPro())return;
 const q=$('#hq').value.trim();if(!q)return note('Type a formula, topic or word.');
 const out=$('#hout');out.hidden=false;out.textContent='Thinking…';
 const p=kind==='f'?'Topic or formula: "'+q+'". State the formula clearly, explain every symbol and unit, then give a step-by-step proof or derivation a secondary-school student can follow, then one worked example. Use LaTeX for all maths.':'Term: "'+q+'". Give: 1) a simple definition, 2) the formal definition, 3) an everyday example, 4) related terms. Keep it clear for secondary-school students.';
 try{out.innerHTML=fmt(await apiAsk(p,[],null,false,0,true));mathIn(out)}catch(e){out.hidden=true;note(e.message)}}
$('#hf').onclick=()=>hub('f');$('#hd').onclick=()=>hub('d');

/* probable exam questions */
$('#eg').onclick=async()=>{if(!await needPro())return;
 const s=$('#es').value.trim();if(!s)return note('Enter a subject.');
 const t=$('#et').value.trim(),n=$('#en').value,ex=$('#ex').value,out=$('#eout');
 out.hidden=false;out.textContent='Generating…';
 const p='Create '+n+' probable '+ex+' exam questions for '+s+(t?' on the topic: '+t:'')+'. Base them on the style, difficulty and most frequently tested areas of past papers for this exam. For each question give the marks, then a model answer with a short marking scheme. Use LaTeX for maths. End with one line saying these are predictions, not real exam papers.';
 try{out.innerHTML=fmt(await apiAsk(p,[],null,false,0,true));mathIn(out)}catch(e){out.hidden=true;note(e.message)}};

/* image studio */
$('#ig').onclick=async()=>{if(!await needPro())return;
 const p=$('#ip').value.trim();if(!p)return note('Describe the image first.');
 const b=$('#ig'),out=$('#iout');b.disabled=true;b.textContent='Creating…';
 try{const t=await tok();
  const r=await fetch(IMG,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({prompt:p})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not create the image.');
  out.hidden=false;out.innerHTML='';
  const im=new Image();im.src=d.image;im.style.cssText='max-width:100%;border-radius:12px';
  const a=document.createElement('a');a.href=d.image;a.download='ace_x_image.png';a.textContent='⬇ Download';a.className='btn o';a.style.marginTop='10px';
  out.append(im,document.createElement('br'),a)}
 catch(e){note(e.message)}
 b.disabled=false;b.textContent='Create image'};

/* explain my mistakes (Pro) */
const _fin=finish;finish=function(){_fin();addExplain()};
function addExplain(){if(!quiz||!quiz.done)return;
 const wrong=quiz.qs.map((q,i)=>({q:q,i:i})).filter(x=>quiz.ans[x.i]!==x.q.a);if(!wrong.length)return;
 const b=document.createElement('button');b.className='btn o wide';b.textContent='💡 Explain my mistakes (Pro)';
 const out=document.createElement('div');out.className='panel';out.hidden=true;
 b.onclick=async()=>{if(!await needPro())return;b.disabled=true;out.hidden=false;out.textContent='Thinking…';
  const list=wrong.map(x=>'Q: '+x.q.q+'\nStudent answered: '+(x.q.o[quiz.ans[x.i]]||'no answer')+'\nCorrect: '+x.q.o[x.q.a]).join('\n\n');
  try{out.innerHTML=fmt(await apiAsk('For each question below, explain simply why the student answer is wrong and why the correct answer is right, then give a quick tip to remember it.\n\n'+list,[],null,false,0,true));mathIn(out)}
  catch(e){out.hidden=true;b.disabled=false;note(e.message)}};
 $('#qbox').append(b,out)}

/* voice input (free) */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,vbase='';
const vlang=()=>ls.g('nv_vl',navigator.language||'en-US');
$('#vl').value=vlang();if($('#vl').value!==vlang())$('#vl').value='en-US';
$('#vl').onchange=e=>ls.s('nv_vl',e.target.value);
$('#mic').onclick=()=>{
 if(!SR)return note('Voice input works in Chrome or Edge. Please use one of them.');
 if(rec){rec.stop();return}
 const m=$('#mic');vbase=$('#inp').value;
 try{rec=new SR();rec.lang=vlang();rec.interimResults=true;rec.continuous=false;m.textContent='⏺';
  rec.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;$('#inp').value=(vbase?vbase+' ':'')+t};
  rec.onerror=e=>note(e.error==='not-allowed'?'Allow the microphone to use voice input.':'Voice input stopped. Try again.');
  rec.onend=()=>{rec=null;m.textContent='🎤'};
  rec.start()}catch(e){rec=null;m.textContent='🎤';note('Could not start voice input.')}};

/* read answers aloud (free) */
function addListen(){if(!window.speechSynthesis||!chat)return;
 const ms=chat.msgs.filter(m=>m.r==='assistant'),els=$$('#msgs .m.assistant');
 els.forEach((el,i)=>{const m=ms[i];if(!m)return;
  const b=document.createElement('button');b.className='sv';b.textContent='🔊 Listen';
  b.onclick=()=>{const s=speechSynthesis;if(s.speaking){s.cancel();return}
   const u=new SpeechSynthesisUtterance(m.t.replace(/\$+/g,'').replace(/\\[a-zA-Z]+/g,' ').replace(/[*_`#{}]/g,''));u.lang=vlang();s.speak(u)};
  el.querySelector('.bd').appendChild(b)})}
const _rm=renderMsgs;renderMsgs=function(){_rm();addListen()};

showAcc();
/* labelled diagrams (Pro) */
$('#ig2').onclick=async()=>{if(!await needPro())return;
 const p=$('#ip').value.trim();if(!p)return note('Describe the diagram first.');
 const b=$('#ig2'),out=$('#iout');b.disabled=true;b.textContent='Drawing…';
 try{
  const t=await apiAsk('Draw a clear, accurate, labelled educational diagram of: '+p+'. Reply with ONLY one complete SVG element and nothing else (no markdown, no explanation). Use viewBox="0 0 800 600", a white background rectangle, thick dark outlines, soft fill colours and font-size 18 dark text. Label every important part with a short text label joined by a thin line to the part. Keep labels from overlapping. Do not use scripts, images or external links.',[],null,false,0,true);
  const m=t.match(/<svg[\s\S]*<\/svg>/i);if(!m)throw new Error('Could not draw that. Try describing it differently.');
  let svg=m[0].replace(/<script[\s\S]*?<\/script>/gi,'');
  if(!/xmlns=/.test(svg.slice(0,300)))svg=svg.replace(/<svg/i,'<svg xmlns="http://www.w3.org/2000/svg"');
  const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  out.hidden=false;out.innerHTML='';
  const im=new Image();im.src=url;im.style.cssText='max-width:100%;background:#fff;border-radius:12px';
  const a=document.createElement('a');a.href=url;a.download='ace_x_diagram.svg';a.textContent='⬇ Download';a.className='btn o';a.style.marginTop='10px';
  out.append(im,document.createElement('br'),a)}
 catch(e){note(e.message)}
 b.disabled=false;b.textContent='✏️ Draw labelled diagram'};
$$('.bottom-nav .nav-item').forEach(item => {
  item.onclick = (e) => {
    e.preventDefault();
    const view = item.dataset.v;
    show(view);
    $$('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  };
});
<script>
// Emergency mobile button fix
(function() {
  'use strict';
  
  // Wait a bit for everything to load
  setTimeout(function() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    
    navItems.forEach(function(item) {
      // Remove old listeners by cloning
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      
      // Add fresh listener
      newItem.addEventListener('click', function(e) {
        e.preventDefault();
        const view = this.getAttribute('data-v');
        if (typeof show === 'function') {
          show(view);
        }
        
        // Update active state
        navItems.forEach(function(i) {
          i.classList.remove('active');
        });
        this.classList.add('active');
      });
    });
    
    console.log('Mobile navigation initialized');
  }, 500);
})();
</script>
