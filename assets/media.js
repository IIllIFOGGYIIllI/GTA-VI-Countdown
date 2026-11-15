/* Vice City Countdown v3.1 — opt-in screenshot gallery, scoped to Media */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 if(!$('gallery-grid'))return;
  const galleryGrid=$('gallery-grid'), galleryMore=$('gallery-more'), galleryStatus=$('gallery-status');
  const galleryModal=$('gallery-modal'), galleryLarge=$('gallery-large');
  const imagePrefix='https://www.rockstargames.com/VI/_next/static/media/';
  let galleryItems=[], galleryVisible=[], galleryLimit=18, galleryFilter='All', gallerySelected=0;
  let galleryLoaded=false, galleryLoading=false, previousFocus=null;
  function screenshotURL(item,width){
    if(!item||typeof item.image!=='string'||!item.image.startsWith(imagePrefix))return '';
    return item.image+'?akim=1&imdensity=1&imwidth='+width;
  }
  function filteredScreenshots(){
    const query=$('gallery-search').value.trim().toLowerCase();
    return galleryItems.filter(x=>(galleryFilter==='All'||x.category===galleryFilter)&&(!query||(x.title+' '+x.category).toLowerCase().includes(query)));
  }
  function renderScreenshots(reset=false){
    if(reset)galleryLimit=18;
    galleryVisible=filteredScreenshots();
    const selected=galleryVisible.slice(0,galleryLimit);
    const frag=document.createDocumentFragment();
    for(let i=0;i<selected.length;i++){
      const item=selected[i],tile=document.createElement('button');
      tile.className='viewer-tile';tile.type='button';tile.setAttribute('aria-label','View screenshot: '+item.title);
      const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.src=screenshotURL(item,640);
      img.addEventListener('error',()=>{tile.classList.add('viewer-broken');img.remove();},{once:true});
      const caption=document.createElement('span');caption.className='viewer-tile-caption';
      const title=document.createElement('strong');title.textContent=item.title;
      const category=document.createElement('small');category.textContent=item.category;
      caption.append(title,category);tile.append(img,caption);
      tile.addEventListener('click',()=>openScreenshot(i));frag.append(tile);
    }
    galleryGrid.replaceChildren(frag);
    galleryMore.hidden=galleryLimit>=galleryVisible.length;
    $('gallery-count').textContent='Showing '+Math.min(galleryLimit,galleryVisible.length)+' of '+galleryVisible.length+' matching screenshots';
    galleryStatus.textContent=galleryVisible.length?'Choose a screenshot to view it fullscreen. Use arrow keys to browse.':'No screenshots match those filters.';
  }
  function changeScreenshot(delta){
    if(!galleryVisible.length)return;
    gallerySelected=(gallerySelected+delta+galleryVisible.length)%galleryVisible.length;
    const item=galleryVisible[gallerySelected];
    galleryLarge.hidden=false;$('gallery-image-error').hidden=true;
    galleryLarge.alt='Official Grand Theft Auto VI screenshot: '+item.title;
    galleryLarge.src=screenshotURL(item,1920);
    $('gallery-title').textContent=item.title;
    $('gallery-position').textContent=(gallerySelected+1)+' / '+galleryVisible.length+' · '+item.category;
    $('gallery-original').href=screenshotURL(item,3840);
  }
  function openScreenshot(index){
    if(!galleryVisible.length)return;
    previousFocus=document.activeElement;
    gallerySelected=index;changeScreenshot(0);
    if(typeof galleryModal.showModal==='function')galleryModal.showModal();
    else galleryModal.setAttribute('open','');
  }
  function closeScreenshot(){
    if(typeof galleryModal.close==='function'&&galleryModal.open)galleryModal.close();
    else {galleryModal.removeAttribute('open');previousFocus?.focus();}
  }
  galleryLarge.addEventListener('error',()=>{galleryLarge.hidden=true;$('gallery-image-error').hidden=false;});
  $('gallery-close').addEventListener('click',closeScreenshot);
  $('gallery-prev').addEventListener('click',()=>changeScreenshot(-1));
  $('gallery-next').addEventListener('click',()=>changeScreenshot(1));
  galleryModal.addEventListener('close',()=>previousFocus?.focus());
  galleryModal.addEventListener('click',event=>{if(event.target===galleryModal)closeScreenshot();});
  galleryModal.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();changeScreenshot(-1);}
    else if(event.key==='ArrowRight'){event.preventDefault();changeScreenshot(1);}
    else if(event.key==='Escape'&&typeof galleryModal.close!=='function')closeScreenshot();
  });
  let swipeStart=null;
  $('gallery-modal-stage').addEventListener('touchstart',event=>{swipeStart=event.touches[0]?.clientX??null;},{passive:true});
  $('gallery-modal-stage').addEventListener('touchend',event=>{
    if(swipeStart===null)return;
    const delta=(event.changedTouches[0]?.clientX??swipeStart)-swipeStart;
    if(Math.abs(delta)>50)changeScreenshot(delta<0?1:-1);
    swipeStart=null;
  },{passive:true});
  galleryMore.addEventListener('click',()=>{galleryLimit+=18;renderScreenshots();});
  $('gallery-search').addEventListener('input',()=>renderScreenshots(true));
  $('gallery-filters').addEventListener('click',event=>{
    const button=event.target.closest('button[data-category]');
    if(!button)return;
    galleryFilter=button.dataset.category;
    for(const b of $('gallery-filters').querySelectorAll('button')){
      const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
    }
    renderScreenshots(true);
  });
  async function loadScreenshots(){
    if(galleryLoaded||galleryLoading)return;
    galleryLoading=true;galleryStatus.textContent='Loading official screenshot catalogue…';
    try{
      const response=await fetch('./data/screenshots.json?v=1.2.0',{cache:'no-store'});
      if(!response.ok)throw new Error('Catalogue request failed');
      const data=await response.json();
      if(!Array.isArray(data.items))throw new Error('Invalid catalogue');
      galleryItems=data.items.filter(x=>typeof x.title==='string'&&typeof x.category==='string'&&typeof x.image==='string'&&x.image.startsWith(imagePrefix));
      galleryLoaded=true;
      $('gallery-total').textContent=galleryItems.length+' Verified Images';
      renderScreenshots(true);
    }catch{
      galleryStatus.textContent='Screenshots are unavailable. You can still open Rockstar’s official gallery below.';
    }finally{galleryLoading=false;}
  }

  const mediaToggle=$('media-toggle'), mediaContent=$('media-content');
  if(mediaToggle&&mediaContent){
    mediaToggle.addEventListener('click',()=>{
      const open=mediaContent.hidden;
      mediaContent.hidden=!open;
      mediaToggle.setAttribute('aria-expanded',String(open));
      mediaToggle.textContent=open?'Hide Official Media ↑':'Reveal Official Media ↗';
      if(open){loadScreenshots();mediaContent.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}else if(galleryModal.open)closeScreenshot();
    });
  }


 const syncMediaLock=()=>{
   const locked=document.documentElement.classList.contains('vc-strict-spoilers');
   if(locked && !mediaContent.hidden){
     mediaContent.hidden=true;
     mediaToggle.setAttribute('aria-expanded','false');
     galleryGrid.replaceChildren();
     if(galleryLarge)galleryLarge.removeAttribute('src');
     if(galleryModal?.open)closeScreenshot();
     galleryLoaded=false;galleryLoading=false;galleryItems=[];galleryVisible=[];
   }
   mediaToggle.disabled=locked;
   mediaToggle.setAttribute('aria-disabled',String(locked));
   mediaToggle.textContent=locked?'Media Locked — Change Launch Kit Settings':
     mediaContent.hidden?'Reveal Official Media ↗':'Hide Official Media ↑';
 };
 window.addEventListener('storage',syncMediaLock);
 window.addEventListener('pageshow',syncMediaLock);
 document.addEventListener('vice:preferences',syncMediaLock);
 syncMediaLock();
})();
