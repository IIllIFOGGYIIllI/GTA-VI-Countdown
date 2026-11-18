/* Vice City Countdown · OBS Browser Source scenes · v1
   Release instant: 19 Nov 2026 00:00 AEDT (Australia/Sydney).
   Independent of the OBS machine timezone and refreshed from Date.now().
*/
(()=>{
 'use strict';
 const root=document.getElementById('scene');
 if(!root)return;
 const SCENE=document.body.dataset.scene;
 const TARGET_MS=Date.parse('2026-11-19T00:00:00+11:00');
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
 let wasLaunched=null,previousSecond=-1;
 function tick(){
   if(SCENE==='ending')return;
   const state=timeLeft();
   const whole=Math.ceil(state.remainingMs/1000);
   if(state.launched!==wasLaunched){
     root.classList.toggle('is-launched',state.launched);
     wasLaunched=state.launched;
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
 if(SCENE!=='ending'){
   tick();
   setInterval(tick,150);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
   window.addEventListener('focus',tick);
   window.addEventListener('pageshow',tick);
 }
 window.OBSLaunchScenes=Object.freeze({
   scene:SCENE,
   releaseAt:TARGET_MS,
   getState:timeLeft,
   refresh:tick,
   overlay
 });
})();
