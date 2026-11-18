/* After Launch v1.0 — regional status, approved editorial news and local checklist. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 if(!$('after-launch'))return;
 const tasks=[...document.querySelectorAll('[data-after-task]')];
 const storageKey='vc-first-session-v1';
 let saved=[];
 try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data))saved=data.filter(x=>typeof x==='string');}catch{}
 function renderProgress(){
  $('after-progress').textContent=tasks.filter(t=>t.checked).length+' Of '+tasks.length+' Complete';
 }
 tasks.forEach(input=>{
  input.checked=saved.includes(input.dataset.afterTask);
  input.addEventListener('change',()=>{
   try{localStorage.setItem(storageKey,JSON.stringify(tasks.filter(t=>t.checked).map(t=>t.dataset.afterTask)));}
   catch{$('after-save-note').textContent='Browser Storage Unavailable — Progress Is Temporary';}
   renderProgress();
  });
 });
 $('after-reset')?.addEventListener('click',()=>{
  tasks.forEach(t=>t.checked=false);
  try{localStorage.removeItem(storageKey);}catch{}
  renderProgress();
 });
 renderProgress();
 const duration=ms=>{
  const total=Math.max(0,Math.floor(ms/1000));
  const days=Math.floor(total/86400),hours=Math.floor(total%86400/3600),mins=Math.floor(total%3600/60);
  if(days)return days+'D '+hours+'H '+mins+'M';
  if(hours)return hours+'H '+mins+'M';
  const seconds=total%60;
  return mins+'M '+seconds+'S';
 };
 function syncRegion(state){
  if(!state||!Number.isFinite(state.release))return;
  const zone=String(state.selectedZone||'Your Region').replaceAll('_',' ').replaceAll('/',' / ');
  $('after-state').textContent=state.launched?'Scheduled Midnight Reached':'Countdown Still Running';
  $('after-time-caption').textContent=state.launched?'Since Scheduled Midnight':'Until Scheduled Midnight';
  $('after-time').textContent=duration(state.launched?state.now-state.release:state.remainingMs);
  $('after-region-note').textContent=(state.launched
   ?'The published release milestone has passed in ':'The published release milestone has not yet arrived in ')+zone+
   '. Actual access depends on your platform account and storefront.';
  document.body.classList.toggle('after-region-launched',Boolean(state.launched));
 }
 window.addEventListener('vice:tick',event=>syncRegion(event.detail));
 syncRegion(window.ViceCountdown?.getState?.());
 const grid=$('after-news-grid'),status=$('after-feed-status');
 function approved(item){
  if(!item||typeof item.title!=='string'||typeof item.summary!=='string'||typeof item.date!=='string')return false;
  if(item.title.length>130||item.summary.length>330||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(item.date))return false;
  if(!['launch','preload','updates'].includes(item.category))return false;
  try{const u=new URL(item.url);return u.protocol==='https:'&&
   ['www.rockstargames.com','rockstargames.com','support.rockstargames.com'].includes(u.hostname);}
  catch{return false;}
 }
 async function loadApproved(){
  try{
   const response=await fetch('./data/news.json?v=3.1.0',{cache:'no-store'});
   if(!response.ok)throw Error('News offline');
   const data=await response.json();
   if(!Array.isArray(data.articles))throw Error('Invalid news');
   const articles=data.articles.filter(approved).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
   if(!articles.length){status.textContent='No Editorially Approved Headlines Yet';return;}
   const fragment=document.createDocumentFragment();
   for(const item of articles){
    const article=document.createElement('article');article.className='after-news-card';
    const top=document.createElement('div');top.className='after-news-meta';
    const category=document.createElement('span');category.textContent=String(item.tag||item.category).slice(0,32);
    const date=document.createElement('time');date.dateTime=item.date;
    date.textContent=new Date(item.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    top.append(category,date);
    const title=document.createElement('h3');title.textContent=item.title.replace(/\.+$/,'');
    const summary=document.createElement('p');summary.textContent=item.summary;
    const link=document.createElement('a');link.textContent='Read Official Source ↗';link.href=item.url;
    link.target='_blank';link.rel='noopener noreferrer';
    article.append(top,title,summary,link);fragment.append(article);
   }
   grid.replaceChildren(fragment);
   const checked=data.reviewedAt&&Number.isFinite(Date.parse(data.reviewedAt))
    ?' · Last Reviewed '+new Date(data.reviewedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
    :'';
   status.textContent='Editor-Approved Stories Only'+checked;
  }catch{status.textContent='Unable To Refresh Headlines · Open News For Saved Articles';}
 }
 loadApproved();
 window.addEventListener('online',loadApproved);
})();
