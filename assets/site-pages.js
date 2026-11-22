/* Vice City Hub v4.1 — shared navigation, preferences and PWA lifecycle. */
(()=>{
 'use strict';
 const page=document.body.dataset.page||'home';
 const map={home:'./index.html',archive:'./countdown-archive.html','launch-info':'./launch-info.html','after-launch':'./player-hub.html','player-hub':'./player-hub.html','launch-kit':'./launch-kit.html',news:'./news.html',history:'./vice-city-history.html',
  'leonida-files':'./leonida-files.html','leonida-map':'./leonida-map.html',media:'./media.html',app:'./app.html'};
 const config={
  news:{selector:'.news-tools [data-filter]',values:['all','launch','preload','updates'],attr:'filter'},
  media:{selector:'#gallery-filters [data-category]',values:['All','Vice City','Characters','Leonida Keys','Port Gellhorn','Grassrivers','Ambrosia','Mount Kalaga'],attr:'category'},
  'leonida-files':{selector:'#guide-filters [data-guide-filter]',values:['all','story','characters','places','world'],attr:'guideFilter'}
 }[page];
 const updatePrefs=()=>{
  let prefs={};try{prefs=JSON.parse(localStorage.getItem('vice-launch-preferences-v1')||'{}')||{};}catch{}
  document.documentElement.classList.toggle('vc-strict-spoilers',prefs.strict===true);
  document.documentElement.classList.toggle('vc-low-motion',prefs.motion===true);
  document.dispatchEvent(new Event('vice:preferences'));
 };
 updatePrefs();
 window.addEventListener('storage',e=>{if(e.key==='vice-launch-preferences-v1')updatePrefs();});
 window.addEventListener('pageshow',updatePrefs);
 document.querySelectorAll('.desktop-nav a,.site-pages-menu a,.mobile-tabbar a').forEach(link=>{
  const target=new URL(link.getAttribute('href'),location.href).pathname;
  const own=new URL(map[page],location.href).pathname;
  const active=target===own;
  link.classList.toggle('is-active',active);
  if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 const menu=document.querySelector('.site-pages-menu');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}});
 document.addEventListener('click',e=>{if(menu?.open&&!menu.contains(e.target))menu.open=false;});
 const getCategory=()=>new URL(location.href).searchParams.get('category')||'all';
 // Never reload a visitor's final countdown or live celebration because a
 // newer PWA shell arrived in the background. The next navigation picks it up.
 const isLaunchProtected=()=>{
  if(document.body.classList.contains('vc-cinema-open'))return true;
  const state=window.ViceCountdown?.getState?.();
  if(!state||!Number.isFinite(state.release))return false;
  const msUntilRelease=state.release-Date.now();
  return msUntilRelease<=120000&&msUntilRelease>=-300000;
 };
 window.VicePageRouter=Object.freeze({page,getCategory,isLaunchProtected});
 const applyFilter=()=>{
  if(!config||page==='leonida-files')return; // Leonida is revealed only on deliberate opt-in.
  const category=getCategory();
  if(!config.values.includes(category))return;
  const target=[...document.querySelectorAll(config.selector)].find(b=>b.dataset[config.attr]===category);
  target?.click();
 };
 if(config){
  document.addEventListener('DOMContentLoaded',applyFilter,{once:true});
  const panel=document.querySelector(page==='news'?'.news-tools':page==='media'?'#gallery-filters':'#guide-filters');
  panel?.addEventListener('click',event=>{
   const button=event.target.closest('[data-'+config.attr.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+']');
   if(!button)return;
   const next=button.dataset[config.attr];if(!config.values.includes(next))return;
   const url=new URL(location.href);
   if(next==='all'||next==='All')url.searchParams.delete('category');
   else url.searchParams.set('category',next);
   history.replaceState({},'',url);
  });
  window.addEventListener('popstate',applyFilter);
 }
 // Keep update detection available on every page; installing SW never opens media.
 if('serviceWorker' in navigator){
  let hadController=Boolean(navigator.serviceWorker.controller),reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(reloading)return;
   if(isLaunchProtected())return;
   if(!hadController){hadController=true;return;}
   try{
    // Rate-limit navigation refresh, not the entire version lifetime:
    // multiple future updates must each be allowed to refresh once.
    const key='vice-city-last-controller-reload';
    const recent=Number(sessionStorage.getItem(key)||0);
    if(Date.now()-recent<10000)return;
    sessionStorage.setItem(key,String(Date.now()));
   }catch{}
   reloading=true;location.reload();
  });
  window.addEventListener('load',async()=>{
   try{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    let last=0;
    const check=()=>{if(isLaunchProtected()||Date.now()-last<60000)return;last=Date.now();reg.update().catch(()=>{});};
    check();window.addEventListener('focus',check);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
    const button=document.getElementById('check-updates');
    if(button)button.addEventListener('click',async()=>{
     button.disabled=true;button.textContent='Checking for Updates…';
     try{
      await reg.update();
      const waiting=reg.waiting;
      if(waiting){
       const approved=window.confirm('A website update is ready. Apply it now?');
       if(approved)waiting.postMessage({type:'SKIP_WAITING'});
       else button.textContent='Update Ready — Apply Later';
      }else{
       button.textContent='Update Check Complete';
       setTimeout(()=>{button.textContent='Refresh to Latest Version';},2600);
      }
     }catch{button.textContent='Check Failed — Try Again';}
     finally{button.disabled=false;}
    });
   }catch{}
  });
 }
 document.querySelector('#current-year')?.replaceChildren(String(new Date().getFullYear()));
})();
