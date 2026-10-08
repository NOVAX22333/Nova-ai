/* ---- voice that keeps listening through pauses ---- */
let listening=false;
function startRec(){
 vbase=$('#inp').value;
 try{rec=new SR();rec.lang=vlang();rec.interimResults=true;rec.continuous=true;
  rec.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;$('#inp').value=(vbase?vbase+' ':'')+t};
  rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){listening=false;note('Allow the microphone to use voice input.')}};
  rec.onend=()=>{rec=null;if(listening)setTimeout(()=>{if(listening)startRec()},250);else $('#mic').textContent='🎤'};
  rec.start()}catch(e){listening=false;rec=null;$('#mic').textContent='🎤';note('Could not start voice input.')}}
$('#mic').onclick=()=>{
 if(!SR)return note('Voice input works in Chrome or Edge. Please use one of them.');
 if(listening){listening=false;if(rec)rec.stop();$('#mic').textContent='🎤';return}
 listening=true;$('#mic').textContent='⏺';startRec()};
$('#send').addEventListener('click',()=>{if(listening){listening=false;if(rec)rec.stop();$('#mic').textContent='🎤'}});

/* ---- double-check button (Pro) ---- */
function addVerify(){if(!chat)return;
 const ms=chat.msgs,els=$$('#msgs .m.assistant');let k=0;
 ms.forEach((m,idx)=>{if(m.r!=='assistant')return;const el=els[k++];if(!el)return;
  const q=ms[idx-1]&&ms[idx-1].r==='user'?ms[idx-1].t:'';
  if(!q||!/\d|solve|calculate|prove|formula|equation/i.test(q+m.t))return;
  const b=document.createElement('button');b.className='sv';b.textContent='✅ Double-check (Pro)';
  b.onclick=async()=>{if(!await needPro())return;b.disabled=true;b.textContent='Checking…';
   try{const r=await apiAsk('Independently re-solve the question below from scratch, using a different method if possible. Then compare with the answer given. If the given answer is correct, start your reply with "✅ Verified" and explain briefly why. If it has any mistake, start with "⚠️ Correction" and show the full correct working.\n\nQUESTION:\n'+q.slice(0,4000)+'\n\nANSWER GIVEN:\n'+m.t.slice(0,4000),[],null,false,0,true);
    const d=document.createElement('div');d.className='panel';d.innerHTML=fmt(r);el.querySelector('.bd').appendChild(d);mathIn(d);b.remove()}
   catch(e){b.disabled=false;b.textContent='✅ Double-check (Pro)';note(e.message)}};
  el.querySelector('.bd').appendChild(b)})}
const _rm2=renderMsgs;renderMsgs=function(){_rm2();addVerify()};

/* ---- exact diagrams: Pascal's triangle and Pythagoras ---- */
const svgWrap=(s,w,h)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" font-family="Arial, sans-serif"><rect width="100%" height="100%" fill="#fff"/>'+s+'</svg>';
function pascalSVG(n){n=Math.max(2,Math.min(12,Math.round(n)||6));
 const R=22,gx=52,gy=46,w=Math.max(520,n*gx+80),h=n*gy+80,rows=[];
 for(let r=0;r<n;r++){rows[r]=[];for(let c=0;c<=r;c++)rows[r][c]=(c===0||c===r)?1:rows[r-1][c-1]+rows[r-1][c]}
 let s='<text x="'+w/2+'" y="32" text-anchor="middle" font-size="22" font-weight="bold" fill="#111">Pascal\'s Triangle ('+n+' rows)</text>';
 for(let r=0;r<n;r++)for(let c=0;c<=r;c++){const x=w/2+(c-r/2)*gx,y=70+r*gy,v=rows[r][c];
  s+='<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+(r%2?'#dbeafe':'#fef3c7')+'" stroke="#334155" stroke-width="2"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="'+(String(v).length>2?13:16)+'" fill="#111">'+v+'</text>'}
 return svgWrap(s,w,h)}
function pythSVG(a,b){a=Math.min(Math.max(+a||3,1),60);b=Math.min(Math.max(+b||4,1),60);
 const W=760,H=680,k=Math.min((W-80)/(a+2*b),(H-170)/(b+2*a)),ox=(W-k*(a+2*b))/2,oy=80;
 const X=x=>(ox+k*(x+b)).toFixed(1),Y=y=>(oy+k*(a+b-y)).toFixed(1),f=n=>+n.toFixed(2);
 const poly=(p,fill)=>'<polygon points="'+p.map(q=>X(q[0])+','+Y(q[1])).join(' ')+'" fill="'+fill+'" stroke="#1e293b" stroke-width="2.5"/>';
 const mid=p=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
 const txt=(q,t,sz)=>'<text x="'+X(q[0])+'" y="'+Y(q[1])+'" text-anchor="middle" font-size="'+(sz||18)+'" fill="#111">'+t+'</text>';
 const sa=[[0,0],[a,0],[a,-a],[0,-a]],sb=[[0,0],[0,b],[-b,b],[-b,0]],sc=[[a,0],[0,b],[b,a+b],[a+b,a]],s=Math.min(a,b)*0.14,A=a*a,B=b*b,C=A+B,u=(a+b)*0.06;
 return svgWrap('<text x="380" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#111">Pythagoras\' Theorem</text>'
  +poly(sa,'#bfdbfe')+poly(sb,'#bbf7d0')+poly(sc,'#fecaca')+poly([[0,0],[a,0],[0,b]],'#fde68a')+poly([[0,0],[s,0],[s,s],[0,s]],'none')
  +txt(mid(sa),'a² = '+f(A),20)+txt(mid(sb),'b² = '+f(B),20)+txt(mid(sc),'c² = '+f(C),20)
  +txt([a/2,u],'a = '+f(a),16)+txt([u*2.2,b/2],'b = '+f(b),16)+txt([a*0.4,b*0.4],'c = '+f(Math.sqrt(C)),16)
  +'<text x="380" y="'+(H-30)+'" text-anchor="middle" font-size="22" fill="#111">a² + b² = c²  →  '+f(A)+' + '+f(B)+' = '+f(C)+'</text>',W,H)}
function localDiagram(p){
 if(/pascal/i.test(p)){const m=p.match(/\d+/);return pascalSVG(m?+m[0]:6)}
 if(/pythagor|right[- ]angled? triangle/i.test(p)){const A=p.match(/\ba\s*=\s*(\d+(?:\.\d+)?)/i),B=p.match(/\bb\s*=\s*(\d+(?:\.\d+)?)/i);return pythSVG(A?+A[1]:3,B?+B[1]:4)}
 return null}
function showSvg(svg,name){const out=$('#iout'),url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 out.hidden=false;out.innerHTML='';
 const im=new Image();im.src=url;im.style.cssText='max-width:100%;background:#fff;border-radius:12px';
 const a=document.createElement('a');a.href=url;a.download=name+'.svg';a.textContent='⬇ Download';a.className='btn o';a.style.marginTop='10px';
 out.append(im,document.createElement('br'),a)}
const _ig=$('#ig').onclick,_ig2=$('#ig2').onclick;
const localFirst=orig=>async()=>{const p=$('#ip').value.trim(),s=p&&localDiagram(p);
 if(s){if(!await needPro())return;showSvg(s,'ace_x_diagram');return}
 return orig&&orig()};
$('#ig').onclick=localFirst(_ig);$('#ig2').onclick=localFirst(_ig2);

/* ---- free chat counter and upgrade nudge ---- */
const _ask=apiAsk;
apiAsk=async function(...a){
 try{return await _ask(...a)}
 catch(e){if(e.status===402&&/free messages/i.test(e.message))setTimeout(()=>show('pro'),1400);throw e}
 finally{if(me&&!isVip())acct()}};
const _sa=showAcc;
showAcc=function(){_sa();if(me&&acc&&!acc.pro&&!acc.admin&&acc.chatLeft!=null)$('#mr').textContent+=' · '+acc.chatLeft+' free messages left'};
showAcc();
