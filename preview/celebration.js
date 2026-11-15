/* Interactive Midnight Celebration
 * Original canvas fireworks and an original Web Audio synthwave arrangement.
 * This isolated preview does not alter the live GTA VI countdown.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const hero=document.querySelector('.hero'),canvas=$('fireworks'),ctx=canvas.getContext('2d',{alpha:true});
const styleButtons=[...document.querySelectorAll('.style-option')];
const designCanvas=$('firework-design-canvas'),designCtx=designCanvas.getContext('2d',{alpha:true});
const DESIGN_INFO={
 palms:{title:'NEON PALMS',description:'Tropical palm-shaped trails with luminous turquoise and pink fronds.',status:'NEON PALMS LIVE PREVIEW'},
 deco:{title:'ART DECO',description:'Golden geometric diamonds, precision starbursts and symmetrical retro-neon rays.',status:'ART DECO LIVE PREVIEW'},
 vi:{title:'VI FINALE',description:'A glowing VI monogram framed by magenta and cyan particles, built for the midnight finale.',status:'VI FINALE LIVE PREVIEW'}
};
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={duration:12000,left:12000,startedAt:performance.now(),launched:false,launchAt:0,fireworkStyle:'palms',
intensity:'medium',reduce:preference.matches,pausedAt:0,lastTick:0,nextBurst:0,viShown:false,
particles:[],rockets:[],flashes:[],width:0,height:0,dpr:1};
let musicEnabled=false,context=null,master=null,scheduler=null,step=0,nextMusicTime=0,volume=.45;
const COLORS=['#fe86b9','#ffbad7','#ffcc91','#86fff2','#b590ff','#ffd9a0'];
const rng=(a,b)=>a+Math.random()*(b-a),pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
function updateCount(){
 const remaining=Math.max(0,Math.ceil(state.left/1000));
 $('d-days').textContent='00';$('d-hours').textContent='00';
 $('d-mins').textContent=pad(Math.floor(remaining/60));$('d-secs').textContent=pad(remaining%60);
 $('timer-fill').style.width=(100-Math.max(0,state.left)/state.duration*100).toFixed(2)+'%';
}
function resetDemo(seconds){
 stopMusic();state.duration=seconds*1000;state.left=state.duration;state.startedAt=performance.now();
 state.launched=false;state.launchAt=0;state.nextBurst=0;state.viShown=false;
 state.rockets.length=0;state.particles.length=0;state.flashes.length=0;
 hero.classList.remove('launched');
 $('counter').hidden=false;$('timer-line').hidden=false;$('launch-message').hidden=true;
 $('panel-heading').innerHTML='MIDNIGHT <em>CALLING</em>';
 $('panel-status').textContent='COUNTING DOWN · DEMO';
 $('panel-sub').textContent='The city lights up when this demo timer reaches zero.';
 $('show-label').textContent='COUNTDOWN ACTIVE';
 $('hero-lead').textContent='One night. One city. A neon midnight celebration, created for the GTA VI countdown.';
 $('sky-notice').style.opacity='';
 updateCount();
}
function launchMidnight(){
 if(state.launched)return;
 state.left=0;state.launched=true;state.launchAt=performance.now();
 state.nextBurst=state.launchAt+850;
 hero.classList.add('launched');
 $('counter').hidden=true;$('timer-line').hidden=true;$('launch-message').hidden=false;
 $('panel-status').textContent='MIDNIGHT CELEBRATION · DEMO';
 $('panel-heading').innerHTML='THE CITY <em>IS YOURS</em>';
 $('panel-sub').textContent='An original Vice City-style fireworks show, now live.';
 $('hero-lead').textContent='Midnight has arrived in this simulation. Watch the skyline come alive with neon light and an original synthwave soundtrack.';
 $('show-label').textContent='FIREWORKS ACTIVE';
 const w=state.width,h=state.height;
 if(!state.reduce){
  explode(w*.40,h*.24,state.fireworkStyle,1.3);
  explode(w*.73,h*.28,state.fireworkStyle,1.1);
  if(state.fireworkStyle==='vi'){state.viShown=true;viLetters();}
  for(let i=0;i<12;i++)state.flashes.push({x:rng(0,w),y:rng(h*.35,h*.7),size:rng(2,5),life:rng(.7,1.7),age:0});
 }else explode(w*.54,h*.28,'deco',.7);
 if(musicEnabled)startMusic();
}
function canvasSize(){
 const box=canvas.getBoundingClientRect();
 state.dpr=Math.min(1.5,window.devicePixelRatio||1);
 state.width=Math.max(1,box.width);state.height=Math.max(1,box.height);
 canvas.width=Math.round(state.width*state.dpr);canvas.height=Math.round(state.height*state.dpr);
 ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
}
function designCanvasSize(){
 const box=designCanvas.getBoundingClientRect();
 const dpr=Math.min(1.5,window.devicePixelRatio||1);
 designCanvas.width=Math.max(1,Math.round(box.width*dpr));
 designCanvas.height=Math.max(1,Math.round(box.height*dpr));
 designCtx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',()=>{canvasSize();designCanvasSize();},{passive:true});
canvasSize();designCanvasSize();
function particle(x,y,vx,vy,color,size,life,gravity=.055){
 return{x,y,px:x,py:y,vx,vy,color,size,life,maxLife:life,gravity};
}
function explode(x,y,type,scale=1){
 const mobile=state.width<650;
 const quality=state.intensity==='low'?.55:state.intensity==='high'?1.4:1;
 const motion=state.reduce?.22:1;
 const n=Math.max(12,Math.floor((mobile?27:39)*quality*scale*motion));
 const base=pick(COLORS),secondary=pick(COLORS);
 const add=(vx,vy,color,size=2.8,life=1.8,gravity=.04)=>{
  state.particles.push(particle(x,y,vx,vy,color,size,life,gravity));
 };
 if(type==='palms'){
  // Curved, illuminated palm fronds: signature Vice City-style burst.
  for(let i=0;i<n;i++){
   const group=i%8,angle=-Math.PI*.95+(group/7)*Math.PI*1.85+rng(-.11,.11);
   const power=rng(85,195)*scale;
   add(Math.cos(angle)*power*.78,Math.sin(angle)*power-25,
     i%3===0?secondary:base,rng(1.7,3.1),rng(1.35,2.5),rng(.12,.23));
  }
  for(let i=0;i<n*.28;i++){
   const a=rng(0,Math.PI*2),v=rng(20,115);
   add(Math.cos(a)*v,Math.sin(a)*v,pick(['#ffdbab','#88fff0']),1.5,1.7,.08);
  }
 }else if(type==='deco'){
  for(let i=0;i<n;i++){
   const angle=(i%12)/12*Math.PI*2+rng(-.016,.016),v=rng(60,200)*scale;
   add(Math.cos(angle)*v,Math.sin(angle)*v,i%3===0?secondary:base,rng(2,3.7),rng(1.5,2.4),.045);
  }
 }else{
  // Symmetric circular finale with sharp neon spokes.
  for(let i=0;i<n;i++){
   const a=i/n*Math.PI*2,v=i%5===0?200*scale:rng(85,155)*scale;
   add(Math.cos(a)*v,Math.sin(a)*v,i%3===0?'#88fff3':base,rng(1.8,3.1),rng(1.4,2.1),.042);
  }
 }
 const max=mobile?180:300;
 if(state.particles.length>max)state.particles.splice(0,state.particles.length-max);
 state.flashes.push({x,y,size:12*scale,age:0,life:.23});
}
function viLetters(){
 if(state.reduce)return;
 const w=state.width,h=state.height;
 const off=document.createElement('canvas');off.width=300;off.height=170;
 const t=off.getContext('2d');t.textAlign='center';t.textBaseline='middle';
 t.font='italic 1000 150px Impact, Arial Black, sans-serif';
 t.fillStyle='#fff';t.fillText('VI',150,90);
 const pixels=t.getImageData(0,0,300,170).data,positions=[];
 for(let y=0;y<170;y+=7)for(let x=0;x<300;x+=7){
  if(pixels[(y*300+x)*4+3]>180)positions.push([x,y]);
 }
 const scale=Math.min(1.15,w/750);
 const offsetX=w*.51-150*scale,offsetY=h*.24-85*scale;
 // Spread the dots across both letters. Taking just the first N samples
 // only rendered the top-left of the V and made the I disappear.
 const stride=Math.max(1,Math.ceil(positions.length/155));
 for(let i=0;i<positions.length;i+=stride){
  const [x,y]=positions[i];
  state.particles.push(particle(offsetX+x*scale,offsetY+y*scale,
     rng(-6,6),rng(-6,6),Math.random()>.45?'#8bfff1':'#ff99cb',2.2,rng(1.5,2.5),0));
 }
}
function fireRocket(now){
 const mobile=state.width<650,x=rng(state.width*.17,state.width*.87);
 const y=rng(state.height*.14,state.height*(mobile?.32:.46));
 state.rockets.push({x0:x+rng(-50,50),y0:state.height*.75,x1:x,y1:y,
  began:now,ms:rng(600,980),color:pick(COLORS),style:state.fireworkStyle});
}

/* Show every design *before* the midnight cue, inside its own live panel.
   This low-cost canvas intentionally stays visible when the main sky is
   obscured by the countdown or the hero layout. */
function renderDesign(now){
 const w=designCanvas.clientWidth,h=designCanvas.clientHeight;
 if(w<1||h<1)return;
 const t=state.reduce?0:now/1000;
 const cx=w*.5,cy=h*.54;
 designCtx.clearRect(0,0,w,h);
 designCtx.save();
 designCtx.lineCap='round';
 designCtx.lineJoin='round';
 const shape=state.fireworkStyle;
 if(shape==='palms'){
  const colours=['#8affee','#fa8cbd','#ffdda1'];
  for(let burst=0;burst<3;burst++){
   const x=cx+(burst-1)*Math.min(w*.23,105),y=cy+(burst%2?18:-7);
   const mult=burst===1?1:.73;
   for(let i=0;i<9;i++){
    const theta=-Math.PI+(i/8)*Math.PI;
    const radius=(44+8*Math.sin(t*2+i*.65+burst))*mult;
    const endX=x+Math.cos(theta)*radius*1.6;
    const endY=y-19+Math.sin(theta)*radius*.79;
    designCtx.beginPath();designCtx.strokeStyle=colours[(i+burst)%3];designCtx.lineWidth=2.2*mult;
    designCtx.shadowColor=designCtx.strokeStyle;designCtx.shadowBlur=state.reduce?0:7;
    designCtx.moveTo(x,y+38*mult);
    designCtx.quadraticCurveTo(x+Math.cos(theta)*radius*.6,y-45*mult,endX,endY);
    designCtx.stroke();
    designCtx.fillStyle=designCtx.strokeStyle;
    designCtx.beginPath();designCtx.arc(endX,endY,1.65*mult,0,Math.PI*2);designCtx.fill();
   }
  }
 }else if(shape==='deco'){
  const radius=Math.min(58,h*.34,w*.21);
  for(let cluster=0;cluster<3;cluster++){
   const x=cx+(cluster-1)*radius*1.65,y=cy+(cluster%2?-6:6);
   const size=radius*(cluster===1?1:.73);
   designCtx.save();designCtx.translate(x,y);
   const turn=state.reduce?0:Math.sin(t*.65+cluster)*.13;
   designCtx.rotate(turn);
   for(let ring=0;ring<3;ring++){
    const r=size*(1-ring*.24),color=ring===1?'#8dfff0':ring===2?'#ff8bb9':'#ffd59b';
    designCtx.beginPath();designCtx.strokeStyle=color;designCtx.lineWidth=ring===0?2.5:1.7;
    designCtx.shadowColor=color;designCtx.shadowBlur=state.reduce?0:10;
    designCtx.moveTo(0,-r);designCtx.lineTo(r,0);
    designCtx.lineTo(0,r);designCtx.lineTo(-r,0);designCtx.closePath();designCtx.stroke();
   }
   for(let i=0;i<12;i++){
    const a=(i/12)*Math.PI*2;
    designCtx.beginPath();
    designCtx.strokeStyle=i%3===0?'#8affed':i%2?'#ffd49e':'#ff98c6';
    designCtx.lineWidth=2;
    designCtx.moveTo(Math.cos(a)*size*.77,Math.sin(a)*size*.77);
    designCtx.lineTo(Math.cos(a)*size*1.3,Math.sin(a)*size*1.3);designCtx.stroke();
   }
   designCtx.restore();
  }
 }else{
  const size=Math.min(111,h*.75,w*.31);
  designCtx.textAlign='center';designCtx.textBaseline='middle';
  designCtx.font='italic 1000 '+Math.round(size)+'px Impact, Arial Black, sans-serif';
  designCtx.shadowColor='#ff6db3';designCtx.shadowBlur=state.reduce?0:22;
  designCtx.fillStyle='#ffb6d1';designCtx.fillText('VI',cx,cy+3);
  designCtx.shadowBlur=0;
  designCtx.strokeStyle='#91fff0';designCtx.lineWidth=2;
  designCtx.strokeText('VI',cx,cy+3);
  for(let i=0;i<24;i++){
   const a=i*Math.PI*2/24;
   const radius=Math.min(w*.41,170)*(1+.032*Math.sin(t*2+i));
   const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.51;
   designCtx.fillStyle=i%2?'#ffb6d7':'#8effeb';
   designCtx.beginPath();designCtx.arc(x,y,i%5===0?2.3:1.4,0,Math.PI*2);designCtx.fill();
  }
 }
 designCtx.restore();
}

function render(now){
 if(document.hidden){state.lastTick=now;requestAnimationFrame(render);return;}
 if(state.lastTick&&now-state.lastTick<32){requestAnimationFrame(render);return;}
 const dt=Math.min(.05,Math.max(0,(now-(state.lastTick||now))/1000));
 state.lastTick=now;
 if(!state.launched){
  state.left=Math.max(0,state.duration-(now-state.startedAt));updateCount();
  if(state.left===0)launchMidnight();
 }else{
  const age=now-state.launchAt;
  const pace=state.intensity==='high'?480:state.intensity==='low'?1600:900;
  const adjusted=state.reduce?4800:pace;
  if(now>=state.nextBurst){
   fireRocket(now);state.nextBurst=now+(age<32000?adjusted:adjusted*2);
  }
  if(age>4000&&!state.viShown&&state.fireworkStyle==='vi'){
   state.viShown=true;viLetters();
  }
 }
 ctx.clearRect(0,0,state.width,state.height);
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=state.rockets.length-1;i>=0;i--){
  const r=state.rockets[i],u=Math.min(1,(now-r.began)/r.ms),ease=1-(1-u)**2;
  const x=r.x0+(r.x1-r.x0)*ease,y=r.y0+(r.y1-r.y0)*ease;
  ctx.globalAlpha=1;ctx.shadowBlur=7;ctx.shadowColor=r.color;ctx.strokeStyle=r.color;
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+Math.min(48,u*55));ctx.lineTo(x,y);ctx.stroke();
  if(u>=1){explode(r.x1,r.y1,r.style,rng(.74,1.12));state.rockets.splice(i,1);}
 }
 for(let i=state.particles.length-1;i>=0;i--){
  const a=state.particles[i];a.life-=dt;
  if(a.life<=0){state.particles.splice(i,1);continue;}
  a.px=a.x;a.py=a.y;a.x+=a.vx*dt;a.y+=a.vy*dt;
  a.vx*=1-dt*.26;a.vy+=a.gravity*115*dt;
  const alpha=Math.min(1,a.life/.6)*(1-Math.pow(1-a.life/a.maxLife,3)*.38);
  ctx.globalAlpha=alpha;ctx.strokeStyle=a.color;ctx.fillStyle=a.color;
  ctx.shadowBlur=0;ctx.lineWidth=Math.max(.8,a.size*.57);
  ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(a.x,a.y);ctx.stroke();
  if(a.life>1.35){ctx.beginPath();ctx.arc(a.x,a.y,a.size*.53,0,Math.PI*2);ctx.fill();}
 }
 for(let i=state.flashes.length-1;i>=0;i--){
  const flash=state.flashes[i];flash.age+=dt;
  if(flash.age>=flash.life){state.flashes.splice(i,1);continue;}
  ctx.globalAlpha=(1-flash.age/flash.life)*.65;ctx.shadowColor='#fff4d6';ctx.shadowBlur=13;
  ctx.fillStyle='#fff6d9';ctx.beginPath();ctx.arc(flash.x,flash.y,Math.max(1,flash.size*(1+flash.age*2)),0,Math.PI*2);ctx.fill();
 }
 ctx.restore();renderDesign(now);requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Original multi-instrument synthwave composition, made with Web Audio only.
// 104 BPM; eight-bar motif repeats with synth lead, chords, bass, kick, snare, hats.
const BPM=104,BEAT=60/BPM,STEP=BEAT/2;
const CHORDS=[[62,65,69],[58,62,65],[65,69,72],[60,64,67],
 [62,65,69],[58,62,65],[67,70,74],[60,64,67]];
const BASS=[38,34,41,36,38,34,43,36];
const LEAD=[
 74,null,77,79,81,79,77,null,72,74,77,null,74,72,70,null,
 72,76,77,79,76,74,72,null,72,null,74,76,79,76,72,null,
 77,null,79,81,84,81,79,null,77,74,72,70,74,72,70,null,
 74,77,79,82,79,77,74,null,76,79,81,79,76,74,72,null
];
const midi=n=>440*Math.pow(2,(n-69)/12);
function oscillator(note,at,duration,type,level,filterHz){
 if(!context||!master)return;
 const o=context.createOscillator(),g=context.createGain();o.type=type;
 o.frequency.setValueAtTime(midi(note),at);
 const peak=Math.max(.0001,level);
 g.gain.setValueAtTime(.0001,at);
 g.gain.exponentialRampToValueAtTime(peak,at+.022);
 g.gain.exponentialRampToValueAtTime(peak*.7,at+.09);
 g.gain.exponentialRampToValueAtTime(.0001,at+duration);
 if(filterHz){
  const f=context.createBiquadFilter();f.type='lowpass';f.frequency.value=filterHz;
  o.connect(f);f.connect(g);
 }else o.connect(g);
 g.connect(master);o.start(at);o.stop(at+duration+.025);
}
function kick(at){
 if(!context||!master)return;
 const o=context.createOscillator(),g=context.createGain();
 o.type='sine';o.frequency.setValueAtTime(130,at);
 o.frequency.exponentialRampToValueAtTime(45,at+.15);
 g.gain.setValueAtTime(.21,at);
 g.gain.exponentialRampToValueAtTime(.0001,at+.29);
 o.connect(g);g.connect(master);o.start(at);o.stop(at+.3);
}
let noiseBuffer=null;
function makeNoise(){
 if(noiseBuffer||!context)return;
 noiseBuffer=context.createBuffer(1,context.sampleRate*.24,context.sampleRate);
 const data=noiseBuffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
}
function perc(at,snare){
 if(!context||!master)return;
 makeNoise();
 const n=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();
 n.buffer=noiseBuffer;f.type='highpass';f.frequency.value=snare?1900:7500;
 g.gain.setValueAtTime(snare?.065:.018,at);
 g.gain.exponentialRampToValueAtTime(.0001,at+(snare?.17:.055));
 n.connect(f);f.connect(g);g.connect(master);
 n.start(at);n.stop(at+(snare?.18:.07));
}
function scheduleStep(at,index){
 const bar=Math.floor(index/8)%8,sub=index%8;
 if(sub===0)CHORDS[bar].forEach((note,i)=>oscillator(note,at,BEAT*3.9,'triangle',.025/(i+1)*1.5,1450));
 if(sub%2===0){
  oscillator(BASS[bar]+(sub===4?12:0),at,BEAT*.79,'sawtooth',.053,540);
  kick(at);
 }
 if(sub===2||sub===6)perc(at,true);
 if(sub%2===1)perc(at,false);
 const note=LEAD[index%LEAD.length];
 if(note!==null){
  oscillator(note,at,STEP*.86,'square',.017,1650);
  oscillator(note-12,at,STEP*.83,'triangle',.025,1900);
 }
}
function pumpMusic(){
 if(!context||!musicEnabled||!master||context.state!=='running')return;
 while(nextMusicTime<context.currentTime+.24){
  scheduleStep(nextMusicTime,step);
  step=(step+1)%LEAD.length;
  nextMusicTime+=STEP;
 }
}
function stopMusic(){
 if(scheduler){clearInterval(scheduler);scheduler=null;}
 if(master&&context)master.gain.setTargetAtTime(.0001,context.currentTime,.025);
}
function startMusic(){
 if(!musicEnabled||!context||context.state!=='running')return;
 if(scheduler)return;
 if(!master){master=context.createGain();master.connect(context.destination);}
 master.gain.setTargetAtTime(Math.max(.0001,volume*.5),context.currentTime,.02);
 step=0;nextMusicTime=context.currentTime+.07;
 scheduler=setInterval(pumpMusic,80);pumpMusic();
 $('audio-status').textContent='Original track playing · Ocean Drive at Midnight';
}
async function toggleAudio(){
 if(musicEnabled){
  musicEnabled=false;stopMusic();
  $('audio-toggle').setAttribute('aria-pressed','false');
  $('audio-toggle').textContent='♫ Enable launch music';
  $('audio-status').textContent='Music disabled';return;
 }
 try{
  if(!context){
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(!Ctx)throw new Error('Web Audio unavailable');
   context=new Ctx();master=context.createGain();master.gain.value=.0001;master.connect(context.destination);
  }
  await context.resume();
  if(context.state!=='running')throw new Error('Audio still suspended');
  musicEnabled=true;
  $('audio-toggle').setAttribute('aria-pressed','true');
  $('audio-toggle').textContent='♫ Disable launch music';
  $('audio-status').textContent='Armed — music starts when the demo reaches midnight';
  if(state.launched)startMusic();
 }catch{
  musicEnabled=false;
  $('audio-status').textContent='This browser blocked audio. Tap Enable again.';
 }
}
$('audio-toggle').addEventListener('click',toggleAudio);
$('volume').addEventListener('input',e=>{
 volume=Number(e.target.value)/100;
 $('volume-value').textContent=String(e.target.value)+'%';
 if(master&&context)master.gain.setTargetAtTime(Math.max(.0001,volume*.5),context.currentTime,.03);
});
$('launch-now').addEventListener('click',launchMidnight);
$('demo-30').addEventListener('click',()=>resetDemo(30));
$('replay').addEventListener('click',()=>{resetDemo(1);launchMidnight();});
$('intensity').addEventListener('change',e=>{state.intensity=e.target.value;});
$('reduced-motion').checked=state.reduce;
$('reduced-motion').addEventListener('change',e=>{
 state.reduce=e.target.checked;
 document.body.classList.toggle('reduce-motion',state.reduce);
});
document.body.classList.toggle('reduce-motion',state.reduce);
function activateDesign(name){
 if(!Object.prototype.hasOwnProperty.call(DESIGN_INFO,name))return;
 state.fireworkStyle=name;state.viShown=false;
 hero.dataset.fireworksStyle=name;
 const info=DESIGN_INFO[name];
 $('firework-design-title').textContent=info.title;
 $('firework-design-description').textContent=info.description;
 $('show-label').textContent=info.status;
 for(const button of styleButtons){
  const active=button.dataset.style===name;
  button.classList.toggle('selected',active);
  button.setAttribute('aria-pressed',String(active));
 }
 // Trigger the selected design straight away, even while the demo clock runs.
 // The always-visible miniature canvas simultaneously updates the motif.
 state.particles.length=0;state.rockets.length=0;
 explode(state.width*.37,state.height*.26,name,1.08);
 explode(state.width*.75,state.height*.31,name,.88);
 if(name==='vi'){
  state.viShown=true;
  viLetters();
 }
 renderDesign(performance.now());
}
for(const button of styleButtons){
 button.addEventListener('click',()=>activateDesign(button.dataset.style));
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopMusic();state.pausedAt=performance.now();}
 else if(state.pausedAt){
  // Freeze the preview while backgrounded. Live midnight scheduling would use Date.now.
  state.startedAt+=performance.now()-state.pausedAt;
  state.pausedAt=0;state.lastTick=performance.now();
  if(state.launched&&musicEnabled&&context?.state==='running')startMusic();
 }
});
resetDemo(12);
renderDesign(performance.now());
})();