/* Midnight Spectacular — cinematic fireworks + original synthwave
   Isolated preview only. No production countdown or PWA integration. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const stage=$('show-stage');
const G=window.GrandFireworks;
if(typeof G!=='function'){
 $('stage-caption').textContent='FIREWORKS ENGINE UNAVAILABLE';
 $('stage-phase').textContent='PREVIEW ERROR';
 return;
}
const prefersReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={countdownStart:performance.now(),countdownDuration:20000,
 showStarted:false,showEnded:false,showStartAt:0,showDuration:42000,
 tenTriggered:false,
 finaled:false,intensity:'medium',reduce:prefersReduce.matches,phase:'standby',
 timers:[],lastAnimation:0};
let musicEnabled=false,context=null,master=null,scheduler=null,step=0,nextMusicTime=0,volume=.45;
let cueBuffer=null,cueSource=null,cueGain=null,cueLabel='',cueDecodeSequence=0;
const AUDIO_LIMIT_BYTES=35*1024*1024;
const GOLD_PALETTES=[
 ['#FFE9B2','#FFD078','#FFF8D8'],
 ['#FBC9A2','#FFB574','#FFFFFF'],
 ['#FFF3D4','#F5C984','#FFB69C']
];
const NEON_PALETTES=[
 ['#FFA5CB','#FFDEE9','#FFFFFF'],
 ['#9CFFF1','#F0FFFA','#FFCCA4'],
 ['#C1ABFF','#FFB5DE','#FFFFFF'],
 ['#FFDF9A','#FF93B1','#FFFFFF']
];
const COLORS=[
 ['#FFDFA4','#FF95C4','#FFFFFF'],
 ['#7FFFE8','#CCFFF5','#FFF4D7'],
 ['#FFB88E','#FFDBB7','#FFFFFF'],
 ['#C19BFF','#FF96CE','#FFF3EB'],
 ['#FFE196','#FFDEBB','#FF8AB9']
];
function performancePreset(){
 return state.reduce?'low':state.intensity==='low'?'low':state.intensity==='high'?'high':'medium';
}
function showIntensity(){
 return state.reduce?.18:state.intensity==='low'?.38:state.intensity==='high'?.82:.57;
}
let engine=new G({
 container:stage,mode:'contained',placement:'overlay',clip:true,zIndex:3,
 baseStyle:'cinematic',autoStart:false,duration:0,background:false,
 renderer:{preferred:'canvas2d',fallback:'canvas2d'},
 performance:{preset:performancePreset(),adaptive:true,secondary:.56,pauseWhenHidden:true,
  pauseWhenOffscreen:false,respectReducedMotion:true},
 visuals:{opacity:.92,trails:true,trailFade:.23,bloom:.42,rocketExhaust:true,
  explosionFlashes:true,flashBangChance:0,flashScale:.65,flashAlpha:.13,
  sparkleChance:.18,shimmerChance:.35,starChance:.015,
  pyroBurn:false,secondaryCrackle:true,groupedSalvos:false},
 show:{intensity:showIntensity(),openingSalvo:3,launchSpread:.70,
  closeShellChance:0,minShellScale:.38,maxShellScale:.56,maxRockets:4,maxParticles:1900,
  launchInterval:1200,
  enabledTypes:['grand_peony','imperial_chrysanthemum','weeping_willow',
   'royal_palm','golden_brocade','glitter_nova','diamond_ring',
   'crossette_supreme','cascading_horsetail','galactic_spiral',
   'crown_jewel','dragon_fish'],
  palettes:COLORS},
 finale:{enabled:true,type:'super-grand-finale',trails:6,trailFlight:1100,burstScale:.68,
  particleScale:.60,finishDelay:1200,maxDuration:11000},
 sound:{enabled:false,volume:.17,ambience:0,stereo:true,finaleRhythm:true}
});
function getEngineStats(){
 try{return engine.getStats();}catch{return {state:'unknown',particles:0,rockets:0};}
}
window.ViceMidnightShow=Object.freeze({
 engine:'Grand Fireworks JS',
 version:G.VERSION,
 getStats:getEngineStats,
 getPhase:()=>state.phase,
 isShowPlaying:()=>state.showStarted&&!state.showEnded,
 hasStarted:()=>state.showStarted,
 durationSeconds:state.showDuration/1000,
 getCueState:()=>({loaded:!!cueBuffer,playing:!!cueSource,tenTriggered:state.tenTriggered,secondsRemaining:Math.max(0,Math.ceil((state.countdownDuration-(performance.now()-state.countdownStart))/1000)),offset:cueOffset()})
});
const timerStore=[];
function later(callback,ms){
 const id=window.setTimeout(callback,ms);
 state.timers.push(id);
 return id;
}
function clearCues(){
 state.timers.forEach(clearTimeout);
 state.timers.length=0;
}
function setPhase(key,label,caption){
 state.phase=key;
 stage.dataset.act=key;
 $('stage-phase').innerHTML='<i aria-hidden="true"></i> '+label;
 $('stage-caption').textContent=caption;
}
function applyQuality(){
 const preset=performancePreset();
 engine.setOptions({performance:{preset,adaptive:true,secondary:.56,respectReducedMotion:true},
  show:{intensity:showIntensity(),openingSalvo:state.reduce?1:3,
   closeShellChance:0,minShellScale:.38,maxShellScale:.56}});
}
function resetDemo(seconds=20){
 clearCues();stopCue(.08);stopMusic();
 state.countdownDuration=seconds*1000;
 state.countdownStart=performance.now();
 state.showStarted=false;state.showEnded=false;state.finaled=false;state.tenTriggered=false;
 $('stage-intro').hidden=false;
 $('midnight-message').hidden=true;
 $('ten-second-caption').hidden=true;
 stage.classList.remove('final-ten');
 $('show-progress').style.width='0%';
 $('demo-seconds').textContent=String(seconds).padStart(2,'0');
 setPhase('countdown','FINAL COUNTDOWN','STAND BY FOR MIDNIGHT');
 $('countdown-unit').textContent='SECONDS TO MIDNIGHT';
 try{engine.stop({immediate:true,finale:false});engine.clear();}catch{}
}
function enterFinalTen(){
 if(state.tenTriggered||state.showStarted)return;
 state.tenTriggered=true;
 stage.classList.add('final-ten');
 $('ten-second-caption').hidden=false;
 $('countdown-unit').textContent='SECONDS · THE FINAL STRETCH';
 setPhase('final-ten','FINAL TEN SECONDS','YOUR MUSIC CUE IS NOW');
 if(musicEnabled&&cueBuffer)startCue();
 else if(musicEnabled)$('audio-status').textContent='Final 10 seconds · load your song to hear the requested cue';
}
function burstAt(fx,xFraction,yFraction,type,colors,radius){
 const rect=stage.getBoundingClientRect();
 const x=rect.width*xFraction,y=rect.height*yFraction;
 fx.placeburst({x,y,type,colors,radius:Math.min(radius,rect.width*.35),density:1.08});
}
function launchSalvo(types){
 if(!state.showStarted||state.showEnded)return;
 for(const type of types)engine.launch({type});
}
function triggerGrandFinale(){
 if(!state.showStarted){
  startShow();
  later(()=>triggerGrandFinale(),3500);
  return;
 }
 if(state.finaled)return;
 state.finaled=true;
 setPhase('finale','GRAND FINALE','THE SKY BELONGS TO VICE CITY');
 applyQuality();
 engine.setOptions({show:{intensity:state.reduce?.18:state.intensity==='high'?1.03:.78,
   minShellScale:.48,maxShellScale:.69,palettes:COLORS}});
 engine.launchFinale({stopAfter:false});
 if(!state.reduce){
  later(()=>burstAt(engine,.25,.28,'golden_brocade',['#FFE7A0','#FFF5CF'],155),1900);
  later(()=>burstAt(engine,.76,.31,'glitter_nova',['#81FFEC','#FFFFFF'],150),2600);
  later(()=>launchSalvo(['weeping_willow','crossette_supreme','grand_peony']),3700);
 }
}
function startShow(){
 clearCues();stopMusic();
 state.showStarted=true;state.showEnded=false;state.finaled=false;
 stage.classList.remove('final-ten');
 stopCue(2.2);
 state.showStartAt=performance.now();
 $('stage-intro').hidden=true;
 $('ten-second-caption').hidden=true;
 $('midnight-message').hidden=false;
 setPhase('opening','ACT I · SKYLINE SALUTE','WELCOME TO VICE CITY');
 $('show-progress').style.width='0%';
 try{
  engine.clear();
  applyQuality();
  engine.setOptions({show:{palettes:GOLD_PALETTES,intensity:state.reduce?.14:.43}});
  engine.start();
 }catch(e){
  setPhase('error','RENDERER ERROR','TRY RELOADING THE PREVIEW');
  console.error('Fireworks engine startup failed',e);
  return;
 }
 if(musicEnabled)startMusic();
 // Opening volley: real rockets climb and burst.
 later(()=>launchSalvo(['imperial_chrysanthemum','golden_brocade']),900);
 later(()=>launchSalvo(['royal_palm','grand_peony']),3900);
 // Act II: cool neon peonies alternate with gold willow and palm shells.
 later(()=>{
   setPhase('neon','ACT II · NEON RUSH','NEON RUSH · COLOUR ACROSS THE SKY');
   engine.setOptions({show:{palettes:NEON_PALETTES,
     intensity:state.reduce?.17:state.intensity==='high'?.81:.61}});
 },8200);
 later(()=>launchSalvo(['glitter_nova','grand_peony']),10400);
 later(()=>launchSalvo(['diamond_ring','crossette_supreme']),13500);
 later(()=>launchSalvo(['weeping_willow','galactic_spiral']),17500);
 later(()=>launchSalvo(['royal_palm','cascading_horsetail','crown_jewel']),22400);
 later(()=>launchSalvo(['golden_brocade','imperial_chrysanthemum']),26000);
 // Act III: staged carriers, crackles, a gold waterfall and a final volley.
 later(()=>triggerGrandFinale(),29500);
 later(()=>{
  state.showEnded=true;
  setPhase('complete','CELEBRATION COMPLETE','REPLAY THE MIDNIGHT SHOW ANY TIME');
  engine.stop({finale:false});
  stopMusic();
 },state.showDuration);
}
function loop(now){
 if(state.lastAnimation&&now-state.lastAnimation<80){requestAnimationFrame(loop);return;}
 state.lastAnimation=now;
 if(!state.showStarted){
  const remaining=Math.max(0,state.countdownDuration-(now-state.countdownStart));
  $('demo-seconds').textContent=String(Math.ceil(remaining/1000)).padStart(2,'0');
  if(remaining<=10000&&!state.tenTriggered)enterFinalTen();
  if(!remaining)startShow();
 }else{
  const elapsed=Math.min(state.showDuration,now-state.showStartAt);
  $('show-progress').style.width=(elapsed/state.showDuration*100).toFixed(1)+'%';
 }
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

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


/* Personal audio cue: decoded locally and retained in memory only.
   The copyrighted recording is never fetched, bundled, uploaded or cached.
   Web Audio is resumed only after the visitor explicitly enables sound. */
function ensureAudioContext(){
 if(!context){
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)throw new Error('Web Audio is unavailable');
  context=new Ctx();
  master=context.createGain();
  master.gain.value=.0001;
  master.connect(context.destination);
 }
 return context;
}
function stopCue(fadeSeconds=.18){
 const source=cueSource,gain=cueGain;
 cueSource=null;cueGain=null;
 if(!source)return;
 try{
  if(context&&gain&&context.state==='running'&&fadeSeconds>0){
   const now=context.currentTime;
   gain.gain.cancelScheduledValues(now);
   gain.gain.setTargetAtTime(.0001,now,Math.max(.012,fadeSeconds/3));
   source.stop(now+fadeSeconds);
  }else source.stop();
 }catch{}
}
function cueOffset(){
 const seconds=Number($('cue-offset').value);
 return Number.isFinite(seconds)?Math.max(0,Math.min(1800,seconds)):0;
}
function startCue(){
 if(!musicEnabled||!cueBuffer||!context||context.state!=='running')return false;
 stopCue(.05);
 const offset=cueOffset();
 if(offset>=cueBuffer.duration-.04){
  $('cue-status').textContent='Start position exceeds the audio duration. Choose a smaller number.';
  return false;
 }
 try{
  const source=context.createBufferSource();
  const gain=context.createGain();
  source.buffer=cueBuffer;
  const now=context.currentTime;
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.setTargetAtTime(Math.max(.0001,volume*.57),now,.085);
  source.connect(gain);gain.connect(context.destination);
  source.start(now+.015,offset);
  cueSource=source;cueGain=gain;
  source.onended=()=>{
   if(cueSource===source){
    cueSource=null;cueGain=null;
   }
  };
  $('audio-status').textContent='Playing your selected track · final 10-second cue';
  return true;
 }catch{
  $('audio-status').textContent='Your browser could not play the selected audio.';
  return false;
 }
}
$('cue-file').addEventListener('change',async event=>{
 const file=event.target.files?.[0],current=++cueDecodeSequence;
 stopCue(.05);cueBuffer=null;cueLabel='';
 if(!file){
  $('cue-status').textContent='No track selected · choose a local audio file';
  return;
 }
 if(file.size>AUDIO_LIMIT_BYTES){
  $('cue-status').textContent='File too large (35 MB limit). Use a shorter personal audio file.';
  return;
 }
 const accepted=/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)||
   /^audio\//i.test(file.type);
 if(!accepted){
  $('cue-status').textContent='Unsupported file type. Choose an MP3, M4A, WAV or OGG audio file.';
  return;
 }
 $('cue-status').textContent='Preparing the audio locally…';
 try{
  const audio=ensureAudioContext();
  const raw=await file.arrayBuffer();
  const decoded=await audio.decodeAudioData(raw);
  if(current!==cueDecodeSequence)return;
  cueBuffer=decoded;
  cueLabel=file.name.slice(0,110);
  const total=Math.floor(decoded.duration);
  $('cue-status').textContent='Ready: '+cueLabel+' ('+Math.floor(total/60)+'m '+String(total%60).padStart(2,'0')+'s). Not uploaded.';
  $('cue-offset').max=String(Math.max(0,Math.floor(decoded.duration-.1)));
  if(cueOffset()>=decoded.duration)$('cue-offset').value='0';
  if(musicEnabled&&state.tenTriggered&&!state.showStarted)startCue();
 }catch(error){
  if(current!==cueDecodeSequence)return;
  $('cue-status').textContent='Could not decode this recording. Try MP3 or WAV.';
 }
});
$('cue-offset').addEventListener('change',()=>{
 if(!cueBuffer)return;
 $('cue-offset').value=String(Math.max(0,Math.min(
  Math.floor(cueBuffer.duration-.1),Math.floor(cueOffset()))));
 if(musicEnabled&&state.tenTriggered&&!state.showStarted)startCue();
});

async function toggleAudio(){
 if(musicEnabled){
  musicEnabled=false;
  stopCue(.06);stopMusic();engine.disableSound();
  $('audio-toggle').setAttribute('aria-pressed','false');
  $('audio-toggle').textContent='♫ Enable music + fireworks sound';
  $('audio-status').textContent='Sound off';
  return;
 }
 try{
  ensureAudioContext();
  await context.resume();
  if(context.state!=='running')throw new Error('Audio is suspended');
  musicEnabled=true;
  engine.enableSound();
  engine.setOptions({sound:{enabled:true,volume:Math.min(.35,volume*.40)}});
  $('audio-toggle').setAttribute('aria-pressed','true');
  $('audio-toggle').textContent='♫ Turn off all show audio';
  $('audio-status').textContent=cueBuffer
   ?'Armed — your track starts at T−10, original soundtrack at midnight'
   :'Armed — choose your own audio file for T−10; original music starts at midnight';
  if(state.showStarted&&!state.showEnded)startMusic();
  else if(state.tenTriggered&&cueBuffer)startCue();
 }catch(error){
  musicEnabled=false;
  $('audio-status').textContent='Audio blocked. Try enabling sound again.';
 }
}
$('audio-toggle').addEventListener('click',toggleAudio);
$('volume').addEventListener('input',event=>{
 volume=Number(event.target.value)/100;
 $('volume-value').textContent=event.target.value+'%';
 if(master&&context)master.gain.setTargetAtTime(Math.max(.0001,volume*.5),context.currentTime,.04);
 if(cueGain&&context)cueGain.gain.setTargetAtTime(Math.max(.0001,volume*.57),context.currentTime,.06);
 if(musicEnabled)engine.setOptions({sound:{volume:Math.min(.35,volume*.40)}});
});
$('launch-now').addEventListener('click',startShow);
$('replay').addEventListener('click',startShow);
$('demo-30').addEventListener('click',()=>resetDemo(20));
$('preview-ten').addEventListener('click',()=>resetDemo(11));
$('finale').addEventListener('click',triggerGrandFinale);
$('intensity').addEventListener('change',event=>{
 state.intensity=event.target.value;applyQuality();
});
$('reduced-motion').checked=state.reduce;
$('reduced-motion').addEventListener('change',event=>{
 state.reduce=event.target.checked;
 document.body.classList.toggle('reduce-motion',state.reduce);
 applyQuality();
});
document.body.classList.toggle('reduce-motion',state.reduce);
$('fullscreen').addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await stage.requestFullscreen();
 }catch{
  $('stage-caption').textContent='FULL-SCREEN MODE UNAVAILABLE IN THIS BROWSER';
 }
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopMusic();state.hiddenAt=performance.now();}
 else if(state.hiddenAt){
  const away=performance.now()-state.hiddenAt;
  if(!state.showStarted)state.countdownStart+=away;
  if(state.showStarted&&!state.showEnded){
   state.showStartAt+=away;
   // Suppress outdated timed cues after returning to the tab.
   if(musicEnabled&&context?.state==='running')startMusic();
  }
  state.hiddenAt=0;
 }
});
window.addEventListener('beforeunload',()=>{
 clearCues();stopMusic();engine.destroy();
});
resetDemo(20);
})();