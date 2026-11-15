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
intensity:'medium',reduce:preference.matches,pausedAt:0,lastTick:0,nextBurst:0,
motifs:[],rockets:[],width:0,height:0,dpr:1};
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
 state.launched=false;state.launchAt=0;state.nextBurst=0;
 state.rockets.length=0;state.motifs.length=0;
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
 state.nextBurst=state.launchAt+1100;
 hero.classList.add('launched');
 $('counter').hidden=true;$('timer-line').hidden=true;$('launch-message').hidden=false;
 $('panel-status').textContent='MIDNIGHT CELEBRATION · DEMO';
 $('panel-heading').innerHTML='THE CITY <em>IS YOURS</em>';
 $('panel-sub').textContent='The selected firework design lights up the skyline.';
 $('hero-lead').textContent='Midnight has arrived in this simulation. Watch the skyline come alive with your chosen neon fireworks and an original synthwave soundtrack.';
 $('show-label').textContent=DESIGN_INFO[state.fireworkStyle].status;
 // The main canvas and the miniature preview use exactly the same renderer.
 const w=state.width,h=state.height,now=performance.now();
 state.rockets.length=0;state.motifs.length=0;
 if(state.fireworkStyle==='vi'){
  launchFirework(w*.40,h*.18,'vi',1.40,now);
 }else{
  launchFirework(w*.28,h*.23,state.fireworkStyle,1.18,now);
  if(!state.reduce)launchFirework(w*.65,h*.34,state.fireworkStyle,.92,now);
 }
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
/* One shared, scalable design engine for the miniature preview AND the
   full-size fireworks. No fallback to unrelated generic particle bursts. */
const MOTIF_COLOURS=['#8affee','#fa8cbd','#ffdda1'];
function drawFireworkMotif(g,type,x,y,size,time,alpha=1,reduced=false){
 if(size<=0||alpha<=0)return;
 g.save();
 g.translate(x,y);
 g.scale(size/100,size/100);
 g.globalAlpha*=Math.max(0,Math.min(1,alpha));
 g.lineCap='round';g.lineJoin='round';
 const twinkle=reduced?0:time;
 if(type==='palms'){
  for(let burst=0;burst<3;burst++){
   const cx=(burst-1)*61,cy=burst%2?14:-7;
   const mult=burst===1?1:.73;
   for(let i=0;i<9;i++){
    const theta=-Math.PI+(i/8)*Math.PI;
    const radius=(40+5*Math.sin(twinkle*2+i*.65+burst))*mult;
    const endX=cx+Math.cos(theta)*radius*1.6;
    const endY=cy-19+Math.sin(theta)*radius*.79;
    const colour=MOTIF_COLOURS[(i+burst)%3];
    g.beginPath();g.strokeStyle=colour;g.lineWidth=2.2*mult;
    g.shadowColor=colour;g.shadowBlur=reduced?0:6;
    g.moveTo(cx,cy+38*mult);
    g.quadraticCurveTo(cx+Math.cos(theta)*radius*.6,cy-45*mult,endX,endY);
    g.stroke();g.fillStyle=colour;
    g.beginPath();g.arc(endX,endY,1.65*mult,0,Math.PI*2);g.fill();
   }
  }
 }else if(type==='deco'){
  for(let cluster=0;cluster<3;cluster++){
   const px=(cluster-1)*80,py=cluster%2?-6:6;
   const radius=47*(cluster===1?1:.73);
   g.save();g.translate(px,py);
   if(!reduced)g.rotate(Math.sin(twinkle*.65+cluster)*.13);
   for(let ring=0;ring<3;ring++){
    const r=radius*(1-ring*.24);
    const colour=ring===1?'#8dfff0':ring===2?'#ff8bb9':'#ffd59b';
    g.beginPath();g.strokeStyle=colour;g.lineWidth=ring===0?2.5:1.7;
    g.shadowColor=colour;g.shadowBlur=reduced?0:9;
    g.moveTo(0,-r);g.lineTo(r,0);g.lineTo(0,r);g.lineTo(-r,0);
    g.closePath();g.stroke();
   }
   for(let i=0;i<12;i++){
    const angle=(i/12)*Math.PI*2;
    g.beginPath();g.strokeStyle=i%3===0?'#8affed':i%2?'#ffd49e':'#ff98c6';
    g.lineWidth=2;g.moveTo(Math.cos(angle)*radius*.77,Math.sin(angle)*radius*.77);
    g.lineTo(Math.cos(angle)*radius*1.3,Math.sin(angle)*radius*1.3);
    g.stroke();
   }
   g.restore();
  }
 }else if(type==='vi'){
  // Crisp legible monogram, not a handful of random radial particles.
  g.textAlign='center';g.textBaseline='middle';
  g.font='italic 1000 95px Impact, Arial Black, sans-serif';
  g.shadowColor='#ff6db3';g.shadowBlur=reduced?0:18;
  g.fillStyle='#ffb6d1';g.fillText('VI',0,3);
  g.shadowBlur=0;g.lineWidth=1.8;g.strokeStyle='#91fff0';
  g.strokeText('VI',0,3);
  for(let i=0;i<24;i++){
   const angle=i*Math.PI*2/24;
   const radius=119*(1+(reduced?0:.032*Math.sin(twinkle*2+i)));
   const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius*.51;
   g.fillStyle=i%2?'#ffb6d7':'#8effeb';
   g.beginPath();g.arc(px,py,i%5===0?2.3:1.4,0,Math.PI*2);g.fill();
  }
 }
 g.restore();
}
// Read-only runtime diagnostics allow browser QA to check that the selected
// visual motif, rather than a generic fallback, powers the full-size sky.
window.ViceFireworksPreview=Object.freeze({
 selectedDesign:()=>state.fireworkStyle,
 largeMotifTypes:()=>state.motifs.map(motif=>motif.type),
 previewAndSkyShareRenderer:true
});
function launchFirework(x,y,type,scale=1,at=performance.now()){
 const w=state.width;
 const base=Math.min(165,Math.max(89,w*.132));
 state.motifs.push({x,y,type,scale,size:base*scale,born:at,life:3400});
 if(state.motifs.length>8)state.motifs.splice(0,state.motifs.length-8);
}
function fireRocket(now){
 if(state.reduce){
  launchFirework(rng(state.width*.25,state.width*.75),state.height*.23,state.fireworkStyle,.75,now);
  return;
 }
 const w=state.width,h=state.height;
 const x=rng(w*.17,w*.82);
 const y=rng(h*.15,h*(w<650?.35:.42));
 state.rockets.push({x0:x+rng(-60,60),y0:h*.72,x1:x,y1:y,
  began:now,ms:rng(650,1050),color:pick(COLORS),style:state.fireworkStyle});
 if(state.rockets.length>5)state.rockets.shift();
}
function renderDesign(now){
 const w=designCanvas.clientWidth,h=designCanvas.clientHeight;
 if(w<1||h<1)return;
 const t=state.reduce?0:now/1000;
 designCtx.clearRect(0,0,w,h);
 const size=Math.min(h*.78,w*.32,130);
 drawFireworkMotif(designCtx,state.fireworkStyle,w*.5,h*.52,size,t,1,state.reduce);
}
function render(now){
 if(document.hidden){state.lastTick=now;requestAnimationFrame(render);return;}
 if(state.lastTick&&now-state.lastTick<32){requestAnimationFrame(render);return;}
 state.lastTick=now;
 if(!state.launched){
  state.left=Math.max(0,state.duration-(now-state.startedAt));updateCount();
  if(state.left===0)launchMidnight();
 }else{
  const age=now-state.launchAt;
  const pace=state.intensity==='high'?650:state.intensity==='low'?1850:1050;
  const adjusted=state.reduce?4800:pace;
  if(now>=state.nextBurst){
   fireRocket(now);state.nextBurst=now+(age<30000?adjusted:adjusted*1.8);
  }
 }
 ctx.clearRect(0,0,state.width,state.height);
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=state.rockets.length-1;i>=0;i--){
  const r=state.rockets[i],u=Math.min(1,(now-r.began)/r.ms),ease=1-(1-u)**2;
  const x=r.x0+(r.x1-r.x0)*ease,y=r.y0+(r.y1-r.y0)*ease;
  ctx.save();ctx.globalAlpha=.88;
  ctx.shadowBlur=8;ctx.shadowColor=r.color;
  ctx.strokeStyle=r.color;ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(x,y+Math.min(48,u*55));ctx.lineTo(x,y);ctx.stroke();
  ctx.restore();
  if(u>=1){
   launchFirework(r.x1,r.y1,r.style,rng(.76,1.15),now);
   state.rockets.splice(i,1);
  }
 }
 for(let i=state.motifs.length-1;i>=0;i--){
  const motif=state.motifs[i];
  const age=now-motif.born,life=motif.life;
  if(age>life){state.motifs.splice(i,1);continue;}
  const entrance=Math.min(1,Math.max(.03,age/480));
  const exit=Math.min(1,Math.max(0,(life-age)/900));
  const opacity=state.reduce?exit:entrance*exit;
  const growing=state.reduce?1:.66+.34*entrance;
  drawFireworkMotif(ctx,motif.type,motif.x,motif.y,
    motif.size*growing,age/1000,opacity,state.reduce);
 }
 ctx.restore();
 renderDesign(now);
 requestAnimationFrame(render);
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
 state.fireworkStyle=name;hero.dataset.fireworksStyle=name;
 const info=DESIGN_INFO[name];
 $('firework-design-title').textContent=info.title;
 $('firework-design-description').textContent=info.description;
 $('show-label').textContent=info.status;
 for(const button of styleButtons){
  const active=button.dataset.style===name;
  button.classList.toggle('selected',active);
  button.setAttribute('aria-pressed',String(active));
 }
 // All active effects switch immediately to the *same shared design*
 // as the small animated stage, even before the demo reaches midnight.
 state.motifs.length=0;state.rockets.length=0;
 const now=performance.now();
 if(name==='vi'){
  launchFirework(state.width*.40,state.height*.18,name,1.40,now);
 }else{
  launchFirework(state.width*.3,state.height*.23,name,1.12,now);
  launchFirework(state.width*.66,state.height*.32,name,.85,now);
 }
 renderDesign(now);
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