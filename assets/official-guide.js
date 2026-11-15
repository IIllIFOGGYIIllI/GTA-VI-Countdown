/* Official Rockstar information archive v2.9.1
 * No story or character data is loaded until the visitor explicitly opts in.
 * The existing Strict Spoiler Lock is an overriding permission gate.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const toggle=$('guide-toggle');
const panel=$('guide-content');
const hideButton=$('guide-hide');
const grid=$('guide-grid');
const filters=$('guide-filters');
const search=$('guide-search');
const count=$('guide-count');
const lock=$('guide-lock-status');
if(!toggle||!panel||!grid||!filters||!search)return;
let items=null,selected='all',requestId=0;
const labels={story:'Story',characters:'Characters',places:'Locations',world:'World & Features'};
const locked=()=>document.documentElement.classList.contains('vc-strict-spoilers');
const officialScreenshot=value=>{
 try{
  if(typeof value!=='string')return '';
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='www.rockstargames.com'||
     !url.pathname.startsWith('/VI/_next/static/media/')||
     !/\.(?:jpe?g|webp|png)$/i.test(url.pathname))return '';
  if(!['640','800','960'].includes(url.searchParams.get('imwidth')))return '';
  return url.href;
 }catch{return '';}
};
const sourceSafe=value=>{
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&['www.rockstargames.com','rockstargames.com','support.rockstargames.com'].includes(url.hostname);
 }catch{return false;}
};
const editorialTitleCase=value=>String(value).replace(/\b[A-Za-z][A-Za-z0-9]*(?:['’][A-Za-z]+)*/g,word=>{
 const match=word.match(/^(.+)(['’]s)$/i),base=match?match[1]:word,suffix=match?match[2].toLowerCase():'';
 if(/^(GTA|VI|PS5|PWA|PNG|API|HTML|CSS|PC|USB|DJ|AM|PM|TV|URL|IANA|NSW)$/i.test(base))return base.toUpperCase()+suffix;
 if(/[a-z][A-Z]|['’][A-Z][a-z]/.test(word))return word;
 if(/^xbox$/i.test(base))return 'Xbox'+suffix;
 if(/^youtube$/i.test(base))return 'YouTube'+suffix;
 return base[0].toUpperCase()+base.slice(1).toLowerCase()+suffix;
});
const make=(tag,cls,value)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(value!==undefined)element.textContent=value;
 return element;
};
const monogram=title=>(String(title).split(/\s+/).map(x=>x[0]).slice(0,2).join('')).toUpperCase();
function render(){
 if(panel.hidden||!Array.isArray(items))return;
 const query=search.value.trim().toLocaleLowerCase();
 const relevant=items.filter(a=>(selected==='all'||selected===a.category)&&
  (!query||(a.title+' '+a.kicker+' '+a.summary).toLocaleLowerCase().includes(query)));
 const fragment=document.createDocumentFragment();
 relevant.forEach((item,i)=>{
  const card=make('article','vc-intel-card');
  card.dataset.category=item.category;
  const pictureSrc=officialScreenshot(item.image);
  if(pictureSrc){
    const picture=make('div','vc-intel-card-picture');
    const fallback=make('span','vc-intel-picture-backup',monogram(item.title));
    fallback.setAttribute('aria-hidden','true');
    const img=document.createElement('img');
    img.loading='lazy';img.decoding='async';img.width=800;img.height=450;
    img.referrerPolicy='strict-origin-when-cross-origin';
    img.alt=typeof item.imageAlt==='string'&&item.imageAlt.length<160
      ?item.imageAlt:'Official Rockstar Games GTA VI promotional screenshot';
    img.addEventListener('load',()=>{picture.classList.add('has-artwork');card.classList.add('has-artwork');});
    img.addEventListener('error',()=>{picture.classList.remove('has-artwork');card.classList.remove('has-artwork');img.removeAttribute('src');});
    const badge=make('span','vc-intel-picture-badge','Official Rockstar Screenshot');
    picture.append(fallback,img,badge);
    card.append(picture);
    // This function is invoked only after the explicit Show Story Details
    // action; the guide remains completely image-free while locked.
    img.src=pictureSrc;
  }
  const overline=make('div','vc-intel-card-index');
  const category=make('span','',labels[item.category]);
  const number=make('span','',String(i+1).padStart(2,'0')+' / '+String(relevant.length).padStart(2,'0'));
  overline.append(category,number);
  const mark=make('div','vc-intel-card-monogram',monogram(item.title));
  mark.setAttribute('aria-hidden','true');
  const heading=make('h4','',editorialTitleCase(item.title));
  const subtitle=make('div','vc-intel-card-index',editorialTitleCase(item.kicker));
  const summary=make('p','',item.summary);
  card.append(overline,mark,heading,subtitle,summary);
  const link=make('a','', 'Read Rockstar’s Official Information ↗');
  link.href=item.source;
  link.target='_blank';link.rel='noopener noreferrer';
  link.setAttribute('aria-label','Read Rockstar official source for '+item.title+' (opens in a new tab)');
  card.append(link);
  fragment.append(card);
 });
 if(!relevant.length)fragment.append(make('p','vc-intel-empty','No matching official information. Try another category or search.'));
 grid.replaceChildren(fragment);
 count.textContent='Showing '+relevant.length+' of '+items.length+' confirmed information files · Reviewed 16 Nov 2026';
}
function hide(){
 ++requestId;
 panel.hidden=true;
 grid.replaceChildren();
 items=null;
 search.value='';
 selected='all';
 filters.querySelectorAll('[data-guide-filter]').forEach(el=>{
  const active=el.dataset.guideFilter==='all';
  el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));
 });
 toggle.textContent='◈ Show Story Details';
 toggle.setAttribute('aria-expanded','false');
 count.textContent='Details hidden';
 if(!locked())lock.textContent='Story details hidden · Nothing is revealed automatically';
}
function syncLock(){
 const blocked=locked();
 if(blocked){
  if(!panel.hidden)hide();
  toggle.disabled=true;
  toggle.textContent='◈ Strict Spoiler Lock Enabled';
  lock.textContent='Strict spoiler lock is active · Disable it under Launch Kit settings to reveal official details';
 }else{
  toggle.disabled=false;
  toggle.textContent=panel.hidden?'◈ Show Story Details':'✕ Hide Story Details';
  lock.textContent=panel.hidden
   ?'Story details hidden by default · Your launch experience stays spoiler-free'
   :'Official details revealed by your choice · Hide them at any time';
 }
 toggle.setAttribute('aria-expanded',String(!panel.hidden));
}
async function reveal(){
 if(locked()){syncLock();return;}
 if(!panel.hidden){hide();toggle.focus();return;}
 const attempt=++requestId;
 toggle.disabled=true;toggle.textContent='Preparing official files…';
 lock.textContent='Loading only approved, Rockstar-confirmed facts…';
 try{
  const response=await fetch('./data/official-guide.json?v=3.1.0');
  if(!response.ok)throw Error('Official archive unavailable');
  const documentData=await response.json();
  if(attempt!==requestId||locked())return;
  if(documentData?.schema!==1||!Array.isArray(documentData.items))throw Error('Guide structure unavailable');
  const valid=new Set(Object.keys(labels));
  const checked=documentData.items.filter(x=>
   x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.summary==='string'&&
   typeof x.kicker==='string'&&valid.has(x.category)&&sourceSafe(x.source));
  if(!checked.length)throw Error('No verified facts');
  items=checked;
  panel.hidden=false;
  const preset=window.VicePageRouter?.getCategory?.()||'all';
  selected=(preset==='all'||valid.has(preset))?preset:'all';
  filters.querySelectorAll('[data-guide-filter]').forEach(el=>{
   const active=el.dataset.guideFilter===selected;el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));
  });
  search.value='';
  render();syncLock();
  hideButton.focus();
 }catch(e){
  if(attempt!==requestId)return;
  lock.textContent='Official files could not load. Check your connection and try again.';
  toggle.disabled=false;toggle.textContent='◈ Try Loading Story Details';
 }
}
toggle.addEventListener('click',reveal);
hideButton.addEventListener('click',()=>{hide();syncLock();toggle.focus();});
filters.addEventListener('click',e=>{
 const button=e.target.closest('[data-guide-filter]');
 if(!button||panel.hidden)return;
 selected=button.dataset.guideFilter;
 filters.querySelectorAll('[data-guide-filter]').forEach(el=>{
  const active=el===button;
  el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));
 });
 render();
});
search.addEventListener('input',render);
window.addEventListener('storage',syncLock);
window.addEventListener('focus',syncLock);
document.addEventListener('vice:preferences',syncLock);
$('kit-reset-settings')?.addEventListener('click',syncLock);
window.addEventListener('pageshow',syncLock);
window.ViceOfficialIntel=Object.freeze({
 getState:()=>({revealed:!panel.hidden,locked:locked(),loaded:!!items,count:items?.length||0})
});
syncLock();
})();