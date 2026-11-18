/* Vice City Countdown — Cinematic Midnight Mode v3.7
 * Uses the authoritative window.ViceCountdown selected-region release.
 * No second release schedule, no spoilers, no automatically playing audio.
 * Runs only for the real regional launch instant, never a simulation.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const countdown=window.ViceCountdown;
const overlay=$('vc-cinema');
if(!countdown||!overlay)return;
const realButton=$('vc-cinema-reopen');
const closeButton=$('vc-cinema-close');
const fullButton=$('vc-cinema-fullscreen');
const timer=$('vc-cinema-number');
const phase=$('vc-cinema-phase');
const label=$('vc-cinema-label');
const region=$('vc-cinema-region');
const left=$('vc-cinema-left');
const progress=$('vc-cinema-progress');
const liveFlag=$('vc-cinema-live-flag');
const welcome=$('vc-cinema-welcome');
const countdownArea=$('vc-cinema-countdown-area');
const main=document.querySelector('main');
const mobileNav=document.querySelector('.mobile-tabbar');
const header=document.querySelector('.site-header');
const footer=document.querySelector('footer');
const releaseKey=state=>state.selectedZone+'|'+state.release;
// Late visitors still get the genuine midnight celebration, not a fake countdown.
const RECENT_LAUNCH_WINDOW_MS=90000;
function updateLaunchAction(state){
 const finalMinute=!state.launched&&state.remainingMs>0&&state.remainingMs<=60000;
 realButton.hidden=!(finalMinute||state.launched);
 realButton.textContent=state.launched?'✦ View Welcome Screen':'✦ Enter Final 60 Seconds';
 return finalMinute;
}
const motionPref=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||
  document.documentElement.classList.contains('vc-low-motion');
let mode=null; // null | 'real'
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
  phase.textContent='19 November 2026 · Midnight';
  label.textContent='The Wait Is Over';
  liveFlag.textContent='Scheduled Midnight';
  countdownArea.hidden=true;
  welcome.hidden=false;
 }else{
  phase.textContent=atTen?'The Final Ten Seconds':'The Final 60 Seconds';
  label.textContent=atTen?'This Is the Moment':'Vice City Is Calling';
  liveFlag.textContent='Live Region Countdown';
  countdownArea.hidden=false;
  welcome.hidden=true;
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
function open(){
 if(mode)return;
 mode='real';
 visibleFocus=document.activeElement;
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
 phaseName=null;lastDisplayedSecond=null;
 region.textContent=getRegion(state);
 $('vc-cinema-description').textContent='This milestone follows your selected timezone. Check your console storefront for actual game access.';
 overlay.classList.toggle('vc-cinema-reduce',!!motionPref());
 closeButton.focus();
 update();
}
function close(){
 if(!mode)return;
 realDismissedKey=releaseKey(countdown.getState());
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
 updateLaunchAction(state);
 if(visibleFocus instanceof HTMLElement&&visibleFocus.isConnected)visibleFocus.focus();
 else if(!realButton.hidden)realButton.focus();
 visibleFocus=null;
 phaseName=null;
}
function update(){
 if(document.hidden)return;
 const state=countdown.getState();
 if(mode&&lastRealRegion!==releaseKey(state)){
  close();return;
 }
 if(!mode){
  const eligible=updateLaunchAction(state);
  const justLaunched=state.launched&&Date.now()-state.release<=RECENT_LAUNCH_WINDOW_MS;
  const key=releaseKey(state);
  if((eligible||justLaunched)&&realDismissedKey!==key&&realSeenKey!==key){
   realSeenKey=key;open();
  }
  return;
 }
 const remaining=Math.max(0,state.release-Date.now());
 const launched=remaining<=0;
 const secs=Math.ceil(remaining/1000);
 if(launched){
  setState('launched');
  left.textContent='Scheduled Midnight Milestone';
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
 left.textContent=lastTen?'Ten Seconds Until Midnight':'The Last Minute Before Midnight';
 region.textContent=getRegion(state);
}
realButton.addEventListener('click',open);
closeButton.addEventListener('click',close);
overlay.addEventListener('keydown',constrainFocus);
fullButton.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement===overlay)await document.exitFullscreen();
  else if(overlay.requestFullscreen)await overlay.requestFullscreen();
  else fullButton.textContent='Fullscreen Not Supported';
 }catch{
  fullButton.textContent='Fullscreen Not Available';
 }
});
document.addEventListener('fullscreenchange',()=>{
 fullButton.textContent=document.fullscreenElement===overlay?'Exit Fullscreen':'⛶ Fullscreen';
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
 close,
 getState:()=>({mode,phase:phaseName,remainingMs:countdown.getState().remainingMs,
   autoDismissed:realDismissedKey===releaseKey(countdown.getState())})
});
update();
})();