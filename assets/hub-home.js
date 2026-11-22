/* Vice City Hub v4.0 — spoiler-conscious homepage, official reviewed news only. */
(()=>{
 'use strict';
 const poster=document.getElementById('hub-cover-poster');
 if(poster){
  const updatePoster=()=>{
   const locked=document.documentElement.classList.contains('vc-strict-spoilers');
   if(locked){
    poster.removeAttribute('src');
    delete poster.dataset.fallbackUsed;
    poster.closest('.hub-cover-poster')?.classList.remove('is-unavailable');
   }else if(!poster.getAttribute('src')){
    poster.src=poster.dataset.localSrc;
   }
  };
  poster.addEventListener('error',()=>{
   if(document.documentElement.classList.contains('vc-strict-spoilers'))return;
   const fallback=poster.dataset.fallback;
   if(!poster.dataset.fallbackUsed&&fallback&&fallback.startsWith('https://')){
    poster.dataset.fallbackUsed='1';poster.src=fallback;
   }else poster.closest('.hub-cover-poster')?.classList.add('is-unavailable');
  });
  document.addEventListener('vice:preferences',updatePoster);
  updatePoster();
 }
 const grid=document.getElementById('hub-news-grid');
 const status=document.getElementById('hub-news-status');
 if(!grid||!status)return;
 const valid=item=>{
  if(!item||typeof item.title!=='string'||typeof item.summary!=='string'||typeof item.date!=='string')return false;
  if(item.title.length>130||item.summary.length>330||!/^\d{4}-\d{2}-\d{2}$/.test(item.date))return false;
  if(!['launch','preload','updates'].includes(item.category))return false;
  try{
   const url=new URL(item.url);
   return url.protocol==='https:'&&['www.rockstargames.com','rockstargames.com','support.rockstargames.com'].includes(url.hostname);
  }catch{return false;}
 };
 const refresh=async()=>{
  try{
   const response=await fetch('./data/news.json?v=3.1.0',{cache:'no-store'});
   if(!response.ok)throw Error('News feed unavailable');
   const feed=await response.json();
   if(!Array.isArray(feed.articles))throw Error('Invalid feed');
   const entries=feed.articles.filter(valid).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
   if(!entries.length)throw Error('No reviewed news');
   const fragment=document.createDocumentFragment();
   for(const item of entries){
    const card=document.createElement('article');card.className='hub-news-card';
    const meta=document.createElement('div');meta.className='hub-news-meta';
    const tag=document.createElement('span');tag.textContent=String(item.tag||item.category).slice(0,32);
    const date=document.createElement('time');date.dateTime=item.date;
    date.textContent=new Date(item.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    meta.append(tag,date);
    const title=document.createElement('h3');title.textContent=item.title.replace(/\.+$/,'');
    const summary=document.createElement('p');summary.textContent=item.summary;
    const link=document.createElement('a');link.href=item.url;link.rel='noopener noreferrer';
    link.target='_blank';link.textContent='Read Official Source ↗';
    card.append(meta,title,summary,link);fragment.append(card);
   }
   grid.replaceChildren(fragment);
   const reviewed=Number.isFinite(Date.parse(feed.reviewedAt||''))?
    new Date(feed.reviewedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):null;
   status.textContent='Official Sources · Editor Approved'+(reviewed?' · Last Reviewed '+reviewed:'');
  }catch{
   status.textContent='Approved Headlines Could Not Be Refreshed';
   grid.replaceChildren();
   const card=document.createElement('article');card.className='hub-news-card';
   const title=document.createElement('h3');title.textContent='Browse The Newsroom';
   const info=document.createElement('p');info.textContent='Read our saved editor-approved Rockstar updates on the dedicated News page.';
   const link=document.createElement('a');link.href='./news.html#news';link.textContent='Open News ↗';
   card.append(title,info,link);grid.append(card);
  }
 };
 refresh();window.addEventListener('online',refresh);
})();
