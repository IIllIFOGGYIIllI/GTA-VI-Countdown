/* Vice City Countdown — Cinematic Midnight Mode v2.6
 * Uses the authoritative window.ViceCountdown selected-region release.
 * No second release schedule, no spoilers, no automatically playing audio.
 * Preview is a local simulation and does not mutate the real countdown.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const countdown=window.ViceCountdown;
const overlay=$('vc-cinema');
if(!countdown||!overlay)return;
const startButton=$('vc-cinema-preview');
const realButton=$('vc-cinema-reopen');
const closeButton=$('vc-cinema-close');
const fullButton=$('vc-cinema-fullscreen');
const skipButton=$('vc-cinema-skip');
const restartButton=$('vc-cinema-restart');
const timer=$('vc-cinema-number');
const phase=$('vc-cinema-phase');
const label=$('vc-cinema-label');
const region=$('vc-cinema-region');
const left=$('vc-cinema-left');
const progress=$('vc-cinema-progress');
const liveFlag=$('vc-cinema-live-flag');
const welcome=$('vc-cinema-welcome');
const countdownArea=$('vc-cinema-countdown-area');
const fireworksLink=$('vc-cinema-fireworks');
const main=document.querySelector('main');
const mobileNav=document.querySelector('.mobile-tabbar');
const header=document.querySelector('.site-header');
const footer=document.querySelector('footer');
const releaseKey=state=>state.selectedZone+'|'+state.release;
const motionPref=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||
  document.documentElement.classList.contains('vc-low-motion');
let mode=null; // null | 'preview' | 'real'
let previewTarget=0,previewDuration=60000;
let realDismissedKey=null,realSeenKey=null;
let lastRealRegion=null,visibleFocus=null,phaseName=null,lastDisplayedSecond=null;
let interval=null;
const clamps=(n,min,max)=>Math.min(max,Math.max(min,n));
const padded=n=>String(Math.max(0,n)).padStart(2,'0');
const getRegion=state=>{
 const select=$('timezone');
 if(select&&select.value===state.selectedZone)
  return select.selectedOptions?.[0]?.textContent?.trim()||state.selectedZone;
 return String(state.selectedZone||'Your region').replaceAll('_',' ').replaceAll('/',' / ');
};
function setState(name){
 if(phaseName===name)return;
 phaseName=name;
 overlay.dataset.phase=name;
 const atTen=name==='final-ten';
 overlay.classList.toggle('vc-cinema-ten',atTen);
 overlay.classList.toggle('vc-cinema-arrived',name==='launched');
 $('vc-cinema-stars').setAttribute('aria-hidden','true');
 if(name==='launched'){
  phase.textContent='19 NOVEMBER 2026 · MIDNIGHT';
  label.textContent='THE WAIT IS OVER';
  liveFlag.textContent=mode==='preview'?'SIMULATED MIDNIGHT':'SCHEDULED MIDNIGHT';
  countdownArea.hidden=true;
  welcome.hidden=false;
  restartButton.hidden=mode!=='preview';
  fireworksLink.hidden=false;
 }else{
  phase.textContent=atTen?'THE FINAL TEN SECONDS':'THE FINAL 60 SECONDS';
  label.textContent=atTen?'THIS IS THE MOMENT':'VICE CITY IS CALLING';
  liveFlag.textContent=mode==='preview'?'SIMULATION · NO REAL-TIME CHANGES':'LIVE REGION COUNTDOWN';
  countdownArea.hidden=false;
  welcome.hidden=true;
  restartButton.hidden=true;
  fireworksLink.hidden=true;
 }
}
function constrainFocus(event){
 if(event.key==='Escape'){event.preventDefault();close();return;}
 if(event.key!=='Tab')return;
 const controls=[...overlay.querySelectorAll('button:not([hidden]):not(:disabled),a[href]:not([hidden])')]
  .filter(el=>!el.closest('[hidden]')&&el.getClientRects().length);
 if(!controls.length)return;
 const first=controls[0],last=controls[controls.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
function open(kind){
 if(mode){
  if(kind==='preview'){
   mode='preview';previewDuration=60000;previewTarget=Date.now()+previewDuration;
   phaseName=null;update();
  }
  return;
 }
 mode=kind;
 visibleFocus=document.activeElement;
 if(kind==='preview'){previewDuration=60000;previewTarget=Date.now()+previewDuration;}
 const state=countdown.getState();
 lastRealRegion=releaseKey(state);
 document.documentElement.classList.add('vc-cinema-open');
 document.body.classList.add('vc-cinema-open');
 overlay.hidden=false;
 main?.setAttribute('inert','');
 mobileNav?.setAttribute('inert','');
 header?.setAttribute('inert','');
 footer?.setAttribute('inert','');
 realButton.hidden=true;
 $('vc-cinema-sim-controls').hidden=kind!=='preview';
 phaseName=null;lastDisplayedSecond=null;
 region.textContent=kind==='preview'?getRegion(state)+' · simulated preview':getRegion(state);
 $('vc-cinema-description').textContent=kind==='preview'
  ?'This is a spoiler-free simulation. Your real countdown will keep running in the background.'
  :'This milestone follows your selected timezone. Check your console storefront for actual game access.';
 overlay.classList.toggle('vc-cinema-reduce',!!motionPref());
 closeButton.focus();
 update();
}
function close(){
 if(!mode)return;
 if(mode==='real')realDismissedKey=releaseKey(countdown.getState());
 mode=null;
 document.documentElement.classList.remove('vc-cinema-open');
 document.body.classList.remove('vc-cinema-open');
 overlay.hidden=true;
 main?.removeAttribute('inert');
 mobileNav?.removeAttribute('inert');
 header?.removeAttribute('inert');
 footer?.removeAttribute('inert');
 if(document.fullscreenElement===overlay){
  document.exitFullscreen?.().catch(()=>{});
 }
 const state=countdown.getState();
 realButton.hidden=!(state.remainingMs<=60000&&!state.launched);
 if(visibleFocus instanceof HTMLElement&&visibleFocus.isConnected)visibleFocus.focus();
 else startButton.focus();
 visibleFocus=null;
 phaseName=null;
}
function secondsForDemo(){
 return Math.max(0,previewTarget-Date.now());
}
function update(){
 if(document.hidden)return;
 const state=countdown.getState();
 if(mode==='real'&&lastRealRegion!==releaseKey(state)){
  close();return;
 }
 const eligible=state.remainingMs>0&&state.remainingMs<=60000&&!state.launched;
 if(!mode){
  realButton.hidden=!eligible;
  const key=releaseKey(state);
  if(eligible&&realDismissedKey!==key&&realSeenKey!==key){
   realSeenKey=key;open('real');
  }
  return;
 }
 const remaining=mode==='preview'?secondsForDemo():Math.max(0,state.release-Date.now());
 const launched=remaining<=0;
 const secs=Math.ceil(remaining/1000);
 if(launched){
  setState('launched');
  left.textContent='SCHEDULED MIDNIGHT MILESTONE';
  progress.style.width='100%';
  timer.textContent='00';
  $('vc-cinema-progress-ring').style.strokeDashoffset='0';
  return;
 }
 const lastTen=remaining<=10000;
 setState(lastTen?'final-ten':'countdown');
 if(lastDisplayedSecond!==secs){
  timer.textContent=padded(secs);
  lastDisplayedSecond=secs;
 }
 const elapsed=60000-clamps(remaining,0,60000);
 progress.style.width=(elapsed/60000*100).toFixed(2)+'%';
 $('vc-cinema-progress-ring').style.strokeDashoffset=
  String((1-clamps(elapsed/60000,0,1))*565.487);
 left.textContent=lastTen?'TEN SECONDS UNTIL MIDNIGHT':'THE LAST MINUTE BEFORE MIDNIGHT';
 region.textContent=mode==='preview'?getRegion(state)+' · simulated preview':getRegion(state);
}
function skipToTen(){
 if(mode!=='preview')return;
 previewDuration=10000;
 previewTarget=Date.now()+10000;
 phaseName=null;lastDisplayedSecond=null;
 update();
}
function restart(){
 if(mode!=='preview')return;
 previewDuration=60000;previewTarget=Date.now()+60000;
 phaseName=null;lastDisplayedSecond=null;
 update();
}
startButton.addEventListener('click',()=>open('preview'));
realButton.addEventListener('click',()=>open('real'));
closeButton.addEventListener('click',close);
skipButton.addEventListener('click',skipToTen);
restartButton.addEventListener('click',restart);
overlay.addEventListener('keydown',constrainFocus);
fullButton.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement===overlay)await document.exitFullscreen();
  else if(overlay.requestFullscreen)await overlay.requestFullscreen();
  else fullButton.textContent='FULLSCREEN NOT SUPPORTED';
 }catch{
  fullButton.textContent='FULLSCREEN NOT AVAILABLE';
 }
});
document.addEventListener('fullscreenchange',()=>{
 fullButton.textContent=document.fullscreenElement===overlay?'EXIT FULLSCREEN':'⛶ FULLSCREEN';
});
window.addEventListener('vice:tick',update);
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden)update();
});
window.addEventListener('focus',update);
// High-frequency visual updates for the last ten seconds and reliable zero,
// while the source countdown still owns the release instant.
interval=window.setInterval(update,100);
window.ViceCinematicLaunch=Object.freeze({
 preview:()=>open('preview'),
 close,
 getState:()=>({mode,phase:phaseName,remainingMs:mode==='preview'?secondsForDemo():
   countdown.getState().remainingMs,autoDismissed:realDismissedKey===releaseKey(countdown.getState())})
});
update();
})();