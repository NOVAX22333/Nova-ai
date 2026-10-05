(function(){
const PRO_PRICE=15;
const st=document.createElement('style');
st.textContent=`
#pro{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:14px}
#pro[hidden]{display:none}
#pro .pb{background:#14141f;color:#fff;border-radius:18px;max-width:440px;width:100%;max-height:90vh;overflow:auto;padding:20px;position:relative}
#pro h2{margin:0 0 4px}#pro .px{position:absolute;top:10px;right:12px;background:none;border:0;color:#fff;font-size:20px;cursor:pointer}
#pro table{width:100%;border-collapse:collapse;margin:14px 0;font-size:14px}
#pro td,#pro th{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.1);text-align:center}
#pro td:first-child,#pro th:first-child{text-align:left}
#pro .pr{font-size:28px;font-weight:700;text-align:center;margin:6px 0}
.mic.on{background:#e53935!important;color:#fff}
`;
document.head.appendChild(st);

const qs=document.getElementById('qs');
if(qs)qs.addEventListener('change',()=>{const v=parseInt(qs.value,10);if(v>0&&v<5){qs.value=5;note('Minimum is 5 seconds per question.')}});

const pro=document.createElement('div');pro.id='pro';pro.hidden=true;
pro.innerHTML=`<div class="pb"><button class="px" aria-label="Close">✕</button>
<h2>⭐ ACE_X Pro</h2><p style="opacity:.75;margin:0">Study without limits.</p>
<table><tr><th></th><th>Free</th><th>Pro</th></tr>
<tr><td>Quiz questions</td><td>15/day</td><td>Unlimited</td></tr>
<tr><td>Custom quiz timer</td><td>✓</td><td>✓</td></tr>
<tr><td>Exam mode</td><td>–</td><td>✓</td></tr>
<tr><td>Image and voice questions</td><td>Limited</td><td>Unlimited</td></tr>
<tr><td>Step-by-step solutions</td><td>–</td><td>✓</td></tr>
<tr><td>Mistake notebook</td><td>–</td><td>✓</td></tr>
<tr><td>Weak-topic report</td><td>–</td><td>✓</td></tr>
<tr><td>Streaks and daily goals</td><td>–</td><td>✓</td></tr>
<tr><td>Priority AI replies</td><td>–</td><td>✓</td></tr></table>
<div class="pr">GH₵${PRO_PRICE}<small style="font-size:14px;font-weight:400"> / month</small></div>
<button class="btn wide" id="probuy">Upgrade to Pro</button></div>`;
document.body.appendChild(pro);
const closePro=()=>{pro.hidden=true};
pro.querySelector('.px').onclick=closePro;
pro.onclick=e=>{if(e.target===pro)closePro()};
document.getElementById('up').onclick=()=>{pro.hidden=false};
document.getElementById('probuy').onclick=()=>{
 if(!me){closePro();return openAuth('Log in to upgrade to Pro.')}
 if(!window.PaystackPop)return note('Payment page did not load. Check your internet and refresh.');
 PaystackPop.setup({key:PK,email:me,amount:PRO_PRICE*100,currency:'GHS',ref:'axpro'+Date.now()+Math.floor(Math.random()*1e6),metadata:{uid:sess.id,plan:'pro'},
  callback:function(r){
   note('Confirming your payment…');
   callAcc({action:'verify',reference:r.reference,plan:'pro'}).then(a=>{acc=a;showAcc();closePro();note('Welcome to Pro!')}).catch(e=>note(e.message))
  },onClose:function(){note('Payment window closed.')}}).openIframe()};

const comp=document.querySelector('.comp'),inp=document.getElementById('inp');
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const mic=document.createElement('button');mic.className='ic mic';mic.textContent='🎤';mic.setAttribute('aria-label','Speak');
const cam=document.createElement('button');cam.className='ic';cam.textContent='📷';cam.setAttribute('aria-label','Take a photo');
comp.insertBefore(cam,inp);comp.insertBefore(mic,inp);

const ci=document.createElement('input');ci.type='file';ci.accept='image/*';ci.setAttribute('capture','environment');ci.hidden=true;document.body.appendChild(ci);
cam.onclick=()=>{ci.value='';ci.click()};
ci.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{att={img:await shrink(f),txt:null,name:f.name||'photo.jpg'};pv()}catch(x){note(x.message)}};

let rec=null,base='';
mic.onclick=()=>{
 if(!SR)return note('Voice input is not supported in this browser. Try Chrome.');
 if(rec){rec.stop();return}
 rec=new SR();rec.lang='en-GB';rec.interimResults=true;rec.continuous=true;
 base=inp.value?inp.value.trim()+' ':'';
 rec.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=base+t};
 rec.onerror=e=>{note(e.error==='not-allowed'?'Allow microphone access to speak.':'Voice error: '+e.error)};
 rec.onend=()=>{rec=null;mic.classList.remove('on');mic.textContent='🎤'};
 rec.start();mic.classList.add('on');mic.textContent='⏹';note('Listening… tap again to stop.')};
})();
