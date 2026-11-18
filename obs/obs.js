/* Vice City Countdown · OBS Browser Source scenes · v1.2
   Release instant: 19 Nov 2026 00:00 AEDT (Australia/Sydney).
   Independent of the OBS machine timezone and refreshed from Date.now().
*/
(()=>{
 'use strict';
 const root=document.getElementById('scene');
 if(!root)return;
 const SCENE=document.body.dataset.scene;
 const TARGET_MS=Date.parse('2026-11-19T00:00:00+11:00');
 // New Zealand reaches Nov 19 midnight exactly two hours before Sydney in November.
 // Regional launch windows follow published PlayStation Store timing, not live server telemetry.
 const NZ_TARGET_MS=Date.parse('2026-11-19T00:00:00+13:00');
 const DESIGN_WIDTH=1920,DESIGN_HEIGHT=1080;
 const params=new URLSearchParams(location.search);
 const overlay=SCENE==='countdown'&&params.get('overlay')==='1';
 if(overlay)document.body.classList.add('is-overlay');
 const channel=params.get('channel');
 if(channel&&channel.trim()){
   const clean=channel.trim().slice(0,48);
   const foot=document.getElementById('obs-footer-right');
   if(foot)foot.textContent='HOSTED BY '+clean.toUpperCase();
 }
 function fit(){
   const zoom=Math.min(innerWidth/DESIGN_WIDTH,innerHeight/DESIGN_HEIGHT);
   const x=Math.round((innerWidth-DESIGN_WIDTH*zoom)/2);
   const y=Math.round((innerHeight-DESIGN_HEIGHT*zoom)/2);
   root.style.transform='translate('+x+'px,'+y+'px) scale('+zoom+')';
   root.style.transformOrigin='top left';
 }
 window.addEventListener('resize',fit);
 fit();
 const byId=id=>document.getElementById(id);
 const pad=n=>String(n).padStart(2,'0');
 function regionStatus(target,now){
   const remaining=Math.max(0,target-now);
   const seconds=Math.ceil(remaining/1000);
   const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),secs=seconds%60;
   return Object.freeze({live:now>=target,remainingMs:remaining,
     label:now>=target?'LIVE NOW':hours>0?pad(hours)+'H '+pad(minutes)+'M TO GO':pad(minutes)+'M '+pad(secs)+'S TO GO'});
 }
 function syncRegionStatus(now){
   for(const [id,target] of [['nz',NZ_TARGET_MS],['au',TARGET_MS]]){
     const state=regionStatus(target,now);
     const card=byId('obs-region-'+id),text=byId('obs-'+id+'-status');
     if(card)card.dataset.status=state.live?'live':'upcoming';
     if(text&&text.textContent!==state.label)text.textContent=state.label;
   }
 }

 const timeLeft=()=>{
   const remaining=Math.max(0,TARGET_MS-Date.now());
   const whole=Math.ceil(remaining/1000);
   return {
     launched:remaining<=0,
     remainingMs:remaining,
     hours:Math.floor(whole/3600),
     minutes:Math.floor((whole%3600)/60),
     seconds:whole%60
   };
 };

 // This is the identical local canvas-based fireworks engine used by
 // the website's real launch celebration. It never plays audio.
 const fireworksStage=byId('obs-fireworks-stage');
 const fireworksStatus=byId('obs-fireworks-status');
 const CELEBRATION_MS=38000;
 const AUTO_LAUNCH_WINDOW_MS=90000;
 const palettes=[
   ['#FFDCA0','#F9B77A','#FF91C5'],
   ['#88FFEE','#61DCE6','#FFE2B0'],
   ['#C9B6FF','#FF91CD','#FFC6E0'],
   ['#FFE5A5','#FFB58F','#FFD3B5']
 ];
 let fireworks=null,fireworksPlaying=false,fireworksTimers=[],fireworksRun=0;
 const motionReduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 const afterFireworks=(ms,action,run)=>{
   const id=setTimeout(()=>{
     if(run!==fireworksRun||!fireworksPlaying)return;
     try{action();}catch(error){console.warn('Fireworks sequence event skipped',error);}
   },ms);
   fireworksTimers.push(id);
 };
 function clearFireworks(){
   ++fireworksRun;
   fireworksTimers.forEach(clearTimeout);
   fireworksTimers=[];
   fireworksPlaying=false;
   if(fireworks){
     try{fireworks.stop({immediate:true,finale:false});}catch{}
     try{fireworks.destroy();}catch{}
     fireworks=null;
   }
 }
 function startFireworks(){
   if(SCENE!=='countdown'||overlay||!fireworksStage||Date.now()<TARGET_MS)return;
   clearFireworks();
   const G=window.GrandFireworks;
   if(typeof G!=='function'){
     if(fireworksStatus)fireworksStatus.textContent='Celebration visuals unavailable';
     return;
   }
   const reduced=motionReduced(),run=fireworksRun;
   try{
     fireworks=new G({
       container:fireworksStage,mode:'contained',placement:'overlay',clip:true,zIndex:1,
       baseStyle:'cinematic',autoStart:false,duration:0,background:false,
       renderer:{preferred:'canvas2d',fallback:'canvas2d'},
       performance:{preset:reduced?'low':'medium',adaptive:true,secondary:reduced?.35:.49,
         pauseWhenHidden:true,pauseWhenOffscreen:false,respectReducedMotion:true},
       visuals:{opacity:.93,trails:true,trailFade:.23,bloom:.34,rocketExhaust:true,
         explosionFlashes:!reduced,flashBangChance:0,flashScale:.5,flashAlpha:.06,
         flashColor:'#FFCA98',flashLife:105,sparkleChance:.27,shimmerChance:.35,
         starChance:.013,secondaryCrackle:true,groupedSalvos:false},
       show:{intensity:reduced?.23:.72,openingSalvo:reduced?2:5,maxRockets:reduced?3:6,
         maxParticles:reduced?1100:3700,minShellScale:.40,maxShellScale:.70,
         launchInterval:950,closeShellChance:0,launchSpread:.77,
         enabledTypes:['grand_peony','imperial_chrysanthemum','golden_brocade',
           'weeping_willow','royal_palm','glitter_nova','crossette_supreme',
           'diamond_ring','cascading_horsetail','crown_jewel'],palettes},
       finale:{enabled:true,type:'super-grand-finale',trails:reduced?4:8,
         trailFlight:1040,burstScale:.75,particleScale:reduced?.35:.66,
         finishDelay:1600,maxDuration:11000},
       sound:{enabled:false,volume:0}
     });
     fireworks.start();
     fireworksPlaying=true;
     if(fireworksStatus)fireworksStatus.textContent='Launch fireworks in progress';
     afterFireworks(1400,()=>{
       const rect=fireworksStage.getBoundingClientRect();
       fireworks.placeburst({x:rect.width*.28,y:rect.height*.23,
         radius:Math.min(115,rect.width*.13),type:'golden_brocade',
         density:.66,colors:['#FFE0A0','#FFBA7F','#FFAFBF']});
     },run);
     afterFireworks(2700,()=>fireworks.launch({type:'golden_brocade'}),run);
     afterFireworks(5200,()=>fireworks.launch({type:'royal_palm'}),run);
     afterFireworks(8500,()=>fireworks.launch({type:'glitter_nova'}),run);
     afterFireworks(11400,()=>fireworks.launch({type:'crossette_supreme'}),run);
     afterFireworks(14300,()=>fireworks.launch({type:'weeping_willow'}),run);
     afterFireworks(18300,()=>{
       fireworks.launch({type:'imperial_chrysanthemum'});
       fireworks.launch({type:'diamond_ring'});
     },run);
     afterFireworks(25200,()=>{
       fireworks.launchFinale({stopAfter:false});
       if(fireworksStatus)fireworksStatus.textContent='Grand finale in progress';
     },run);
     afterFireworks(CELEBRATION_MS,()=>{
       fireworks.stop({finale:false});
       fireworksPlaying=false;
       if(fireworksStatus)fireworksStatus.textContent='Celebration complete';
     },run);
   }catch(error){
     clearFireworks();
     if(fireworksStatus)fireworksStatus.textContent='Celebration visuals unavailable';
     console.error('OBS countdown fireworks failed to start',error);
   }
 }

 let wasLaunched=null,previousSecond=-1;
 function tick(){
   const now=Date.now();
   syncRegionStatus(now);
   if(SCENE==='ending')return;
   const state=timeLeft();
   const whole=Math.ceil(state.remainingMs/1000);
   if(state.launched!==wasLaunched){
     root.classList.toggle('is-launched',state.launched);
     wasLaunched=state.launched;
     if(state.launched&&Date.now()-TARGET_MS<=AUTO_LAUNCH_WINDOW_MS)
       startFireworks();
   }
   root.classList.toggle('is-final-ten',!state.launched&&state.remainingMs<=10000);
   if(whole===previousSecond)return;
   previousSecond=whole;
   if(SCENE==='starting'){
     const out=byId('obs-start-remaining');
     if(out)out.textContent=state.launched?'THE WAIT IS OVER':pad(state.hours)+'H : '+pad(state.minutes)+'M : '+pad(state.seconds)+'S';
   }
   if(SCENE==='countdown'){
     if(byId('obs-hours'))byId('obs-hours').textContent=pad(state.hours);
     if(byId('obs-minutes'))byId('obs-minutes').textContent=pad(state.minutes);
     if(byId('obs-seconds'))byId('obs-seconds').textContent=pad(state.seconds);
     const launched=byId('obs-launched');
     if(launched)launched.hidden=!state.launched;
     const progress=byId('obs-progress');
     if(progress){
       // Progress covers the final hour and remains stable when starting early.
       const remainingSeconds=state.remainingMs/1000;
       progress.style.width=(Math.max(0,Math.min(1,(3600-remainingSeconds)/3600))*100).toFixed(2)+'%';
     }
     const kicker=byId('obs-clock-kicker');
     if(kicker)kicker.textContent=state.remainingMs<=60000&&!state.launched?'THE FINAL 60 SECONDS':'COUNTING DOWN TO VICE CITY';
     const status=byId('obs-countdown-status');
     if(status&&!state.launched)status.innerHTML=state.remainingMs<=60000
      ?'<span class="ticker-dot"></span> THE FINAL MINUTE &nbsp; / &nbsp; THE MOMENT IS HERE'
      :'<span class="ticker-dot"></span> THE FINAL HOURS &nbsp; / &nbsp; WE MADE IT THIS FAR';
   }
 }
 tick();
 setInterval(tick,150);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 window.addEventListener('focus',tick);
 window.addEventListener('pageshow',tick);
 window.addEventListener('pagehide',clearFireworks);
 window.OBSLaunchScenes=Object.freeze({
   scene:SCENE,
   releaseAt:TARGET_MS,
   nzReleaseAt:NZ_TARGET_MS,
   getState:timeLeft,
   getRegions:()=>({nz:regionStatus(NZ_TARGET_MS,Date.now()),au:regionStatus(TARGET_MS,Date.now())}),
   refresh:tick,
   replayFireworks:startFireworks,
   getFireworksState:()=>({playing:fireworksPlaying,available:typeof window.GrandFireworks==='function',status:fireworksStatus?.textContent||''}),
   overlay
 });
})();
