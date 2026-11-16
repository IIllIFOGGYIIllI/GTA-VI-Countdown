/* Vice City History v3.4 — timeline, visual-only radio and spoiler-conscious comparison */
(()=>{
'use strict';
if(document.body.dataset.page!=='history')return;
const $=id=>document.getElementById(id);
const setPressed=(buttons,field,value)=>{
 for(const button of buttons){
  const active=button.dataset[field]===value;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
 }
};
// The interactive timeline is an enhancement of complete, source-linked HTML.
const years=[...document.querySelectorAll('[data-vh-year]')];
const eraPanels=[...document.querySelectorAll('[data-vh-era]')];
years.forEach(button=>button.addEventListener('click',()=>{
 const year=button.dataset.vhYear;
 setPressed(years,'vhYear',year);
 eraPanels.forEach(panel=>{panel.hidden=panel.dataset.vhEra!==year;});
}));
const radioImages={"flash":["https://www.gtabase.com/igallery/8201-8300/GTA_ViceCity_Artwork_DJ_Toni_Flash-8295-1600.jpg","Official Flash FM host Toni promotional artwork"],"vrock":["https://www.gtabase.com/igallery/8301-8400/GTA_ViceCity_Artwork_DJ_Lazlow_VRock-8301-1600.jpg","Official V-Rock Lazlow promotional artwork"],"fever":["https://www.gtabase.com/igallery/8301-8400/GTA_ViceCity_Artwork_DJ_Fever105-8334-1600.jpg","Official Fever 105 DJ promotional artwork"],"wave":["https://www.gtabase.com/igallery/8201-8300/GTA_ViceCity_Artwork_DJ_Adam_Fist_Wave-8300-1600.jpg","Official Wave 103 DJ Adam Fist promotional artwork"],"emotion":["https://www.gtabase.com/igallery/8201-8300/GTA_ViceCity_Artwork_DJ_Fernando_Emotion-8299-1600.jpg","Official Emotion 98.3 Fernando Martinez promotional artwork"]};
const stationDescriptions={
 flash:['Flash FM','Big 1980s pop and bright, familiar hooks for a drive along the coastline.'],
 vrock:['V-Rock','Hard rock and heavy metal energy for Vice City road trips and high-speed chases.'],
 fever:['Fever 105','Funk, soul and dance-floor grooves for Vice City after dark.'],
 wave:['Wave 103','Synth-led and new-wave sounds that helped define the game’s 1980s atmosphere.'],
 emotion:['Emotion 98.3','Power ballads and softer rock for an unforgettable drive at sunset.']
};
const stations=[...document.querySelectorAll('[data-vh-station]')];
stations.forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.vhStation,info=stationDescriptions[key];
 if(!info)return;
 setPressed(stations,'vhStation',key);
 $('vh-radio-name').textContent=info[0];
 $('vh-radio-description').textContent=info[1];
 const artwork=radioImages[key],photo=$('vh-radio-art'),fallback=$('vh-radio-art-fallback');
 if(artwork&&photo){photo.src=artwork[0];photo.alt=artwork[1];photo.hidden=false;if(fallback)fallback.hidden=true;}
}));
// Image choices are verified official scenic Rockstar screenshots already in
// the website's approved 138-image catalogue. None are requested before reveal.
const eras={
 coast:{original:"A City Built On Neon",originalCopy:"The original game’s pastel storefronts, palm trees and beach roads defined a fictional 1980s Miami.",modern:"A Modern Return To Vice City",modernCopy:"Rockstar’s official promotional material shows contemporary coastal Vice City within Leonida.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_01.135x56yoeu.6t.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-01-1080.jpg",alt:"Official GTA VI Vice City promotional screenshot"},
 city:{original:"Downtown, Beyond The Beach",originalCopy:"The original Vice City balanced vibrant beachfronts with denser streets, traffic and high-rise downtown districts.",modern:"The New City Skyline",modernCopy:"Rockstar’s GTA VI images show a different generation of city streets and towers. Matching buildings have not been verified.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_03.0nqz~lrqdmlze.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-07-1080.jpg",alt:"Official GTA VI Vice City cityscape promotional screenshot"},
 night:{original:"The City After Sunset",originalCopy:"A neon-lit Malibu Club and 1980s nightlife gave the original its familiar after-dark identity.",modern:"Another Generation Of Neon",modernCopy:"GTA VI promotional imagery depicts a modern city with its own after-dark atmosphere.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_09.0~ng.c8ack3fp.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-11-1080.jpg",alt:"Official Rockstar GTA VI Vice City promotional screenshot"},
 cars:{original:"The Sports Car Dream",originalCopy:"Open roads, the Cheetah and the Infernus made Vice City a playground for sports-car fans.",modern:"Modern Vice City Roads",modernCopy:"Rockstar has shown another era of streets and traffic in the city; these screenshots are not exact-location matches.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_04.06evqutgh7624.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-09-1080.jpg",alt:"Official Rockstar GTA VI Vice City screenshot from the published media gallery"},
 water:{original:"Around The Waterfront",originalCopy:"Docks, the marina and large yachts helped make the original Vice City feel like a coastal playground.",modern:"The Coast Returns",modernCopy:"The published imagery captures the modern coastal setting without confirming that any individual 2002 harbour asset returns.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_05.0~r~o0jzpp4a-.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-06-1080.jpg",alt:"Official Rockstar GTA VI scenic Vice City promotional screenshot"},
 sunset:{original:"Last Light In Vice City",originalCopy:"Golden light, palm trees and open roads were central to the original game’s 1980s-inspired atmosphere.",modern:"Sunset In A New Era",modernCopy:"Official Rockstar images present a new take on Vice City’s coastal atmosphere and natural light.",url:"https://www.rockstargames.com/VI/_next/static/media/Vice_City_08.0bbg_xp4hqdvz.jpg",originalImage:"https://www.gtabase.com/igallery/gta-vice-city-screens/gtavicecity-ps2-23-1080.jpg",alt:"Official Rockstar GTA VI Vice City promotional screenshot"},
};
const thenImage=$('vh-then-image');
const selections=[...document.querySelectorAll('[data-vh-compare]')];
const image=$('vh-modern-image'),placeholder=$('vh-modern-placeholder'),button=$('vh-compare-reveal'),
 label=$('vh-reveal-title'),status=$('vh-reveal-status');
let selected='coast',revealed=false;
const locked=()=>document.documentElement.classList.contains('vc-strict-spoilers');
function hideComparison(){
 revealed=false;image.hidden=true;image.removeAttribute('src');image.alt='';
 placeholder.hidden=false;button.setAttribute('aria-pressed','false');
}
function showComparison(){
 if(locked())return;
 const item=eras[selected];
 image.alt=item.alt;
 image.src=item.url+'?akim=1&imdensity=1&imwidth=960';
 image.hidden=false;placeholder.hidden=true;
 revealed=true;button.setAttribute('aria-pressed','true');
}
function selectComparison(id){
 const era=eras[id];if(!era)return;
 selected=id;
 setPressed(selections,'vhCompare',id);
 $('vh-then-heading').textContent=era.original;
 $('vh-then-copy').textContent=era.originalCopy;
 if(thenImage){
  thenImage.alt='Original Grand Theft Auto: Vice City PlayStation 2 promotional screenshot, thematic '+id+' comparison';
  thenImage.src=era.originalImage;
 }
 $('vh-now-heading').textContent=era.modern;
 $('vh-now-copy').textContent=era.modernCopy;
 if(revealed&&!locked())showComparison();
}
function syncPreferences(){
 if(locked()){
  hideComparison();button.disabled=true;button.textContent='Comparison Locked';
  label.textContent='Strict Spoiler Lock Is Active';
  status.textContent='Disable Strict Spoiler Lock in Launch Kit Settings to reveal official GTA VI screenshots.';
 }else{
  button.disabled=false;button.textContent=revealed?'Hide Official Comparison':'Reveal Official Comparison';
  label.textContent=revealed?'Official Comparison Revealed':'Modern Screenshots Are Optional';
  status.textContent=revealed
   ?'Scenic promotional imagery only. Hide it again at any time.'
   :'Reveal a scenic GTA VI screenshot only when you choose.';
 }
}
selections.forEach(item=>item.addEventListener('click',()=>selectComparison(item.dataset.vhCompare)));
button.addEventListener('click',()=>{
 if(locked())return;
 if(revealed)hideComparison();
 else showComparison();
 syncPreferences();
});
image.addEventListener('error',()=>{
 hideComparison();syncPreferences();
 status.textContent='The official screenshot could not load. Check your connection or try another comparison.';
});
document.addEventListener('vice:preferences',syncPreferences);
window.addEventListener('storage',syncPreferences);
window.addEventListener('pageshow',syncPreferences);
const archival=document.querySelector('.vh-photo img');
archival?.addEventListener('error',()=>{
 archival.hidden=true;
 const text=document.querySelector('.vh-photo figcaption strong');
 if(text)text.textContent='Original Screenshot Unavailable · Visit Rockstar’s Archive';
});

// The original game's locations and vehicles are public archive information:
// no story spoilers and no images are requested by these filters.
function createArchiveFilter(buttonSelector,cardSelector,dataKey,countId,displayName){
 const buttons=[...document.querySelectorAll(buttonSelector)];
 const cards=[...document.querySelectorAll(cardSelector)];
 const message=$(countId);
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const active=button.dataset[dataKey];setPressed(buttons,dataKey,active);
  let shown=0;
  for(const card of cards){
   card.hidden=active!=='all'&&card.dataset[dataKey.replace('Filter','')]!==active;
   if(!card.hidden)shown++;
  }
  if(message)message.textContent=active==='all'
   ?'Showing All '+shown+' Classic '+displayName
   :'Showing '+shown+' '+displayName+' In '+button.textContent.trim();
 }));
}
createArchiveFilter('[data-vh-place-filter]','[data-vh-place]','vhPlaceFilter','vh-place-result','Locations');
createArchiveFilter('[data-vh-vehicle-filter]','[data-vh-vehicle]','vhVehicleFilter','vh-vehicle-result','Vehicles');

// Images are Rockstar promotional PS2 shots mirrored by GTABase; the viewer
// never describes them as frame-matched GTA VI captures.
const galleryButtons=[...document.querySelectorAll('[data-vh-gallery-index]')];
const galleryDialog=$('vh-gallery-dialog'),galleryImage=$('vh-gallery-full');
const galleryTitle=$('vh-gallery-modal-title'),galleryCaption=$('vh-gallery-modal-caption');
const galleryCounter=$('vh-gallery-counter'),galleryLink=$('vh-gallery-source');
const galleryClose=$('vh-gallery-close');
let galleryIndex=0,lastGalleryFocus=null;
function galleryAt(index){
 if(!galleryButtons.length||!galleryImage)return;
 galleryIndex=(index+galleryButtons.length)%galleryButtons.length;
 const card=galleryButtons[galleryIndex];
 const thumbnail=card.querySelector('img');
 const title=card.querySelector('.vh-gallery-title')?.textContent||'Original Vice City Screenshot';
 galleryImage.src=thumbnail?.src||'';
 galleryImage.alt=thumbnail?.alt||title;
 galleryTitle.textContent=title;
 galleryCaption.textContent='Rockstar Games original PlayStation 2 promotional screenshot, mirrored by GTABase';
 galleryCounter.textContent=String(galleryIndex+1).padStart(2,'0')+' / '+String(galleryButtons.length).padStart(2,'0');
 galleryLink.href='https://www.gtabase.com/gta-vice-city/screenshots/';
}
function closeGallery(){
 if(galleryDialog?.open)galleryDialog.close();
 galleryImage?.removeAttribute('src');
 lastGalleryFocus?.focus();
}
galleryButtons.forEach((card,index)=>{
 card.addEventListener('click',()=>{
  lastGalleryFocus=card;galleryAt(index);
  if(typeof galleryDialog?.showModal==='function')galleryDialog.showModal();
  else galleryDialog?.setAttribute('open','');
  galleryClose?.focus();
 });
 const image=card.querySelector('img');
 image?.addEventListener('error',()=>{
  image.style.display='none';
  const cardFrame=card.querySelector('.vh-gallery-frame');
  if(cardFrame&&!cardFrame.querySelector('.vh-image-unavailable')){
   const fallback=document.createElement('span');
   fallback.className='vh-image-unavailable';
   fallback.textContent='Archival Screenshot Unavailable';
   cardFrame.append(fallback);
  }
 });
});
galleryClose?.addEventListener('click',closeGallery);
$('vh-gallery-prev')?.addEventListener('click',()=>galleryAt(galleryIndex-1));
$('vh-gallery-next')?.addEventListener('click',()=>galleryAt(galleryIndex+1));
galleryDialog?.addEventListener('close',()=>{galleryImage?.removeAttribute('src');lastGalleryFocus?.focus();});
galleryDialog?.addEventListener('click',event=>{
 if(event.target===galleryDialog)closeGallery();
});
galleryDialog?.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();galleryAt(galleryIndex+1);}
 if(event.key==='ArrowLeft'){event.preventDefault();galleryAt(galleryIndex-1);}
});

// Nostalgia checklist is purely local and does not infer player achievement.
const memoryKey='vice-history-memories-v1';
const memories=[...document.querySelectorAll('[data-vh-memory]')];
let savedMemories=[];
try{const stored=JSON.parse(localStorage.getItem(memoryKey)||'[]');if(Array.isArray(stored))savedMemories=stored.filter(x=>Number.isInteger(x)&&x>=0&&x<memories.length);}catch{}
for(const item of memories)item.checked=savedMemories.includes(Number(item.dataset.vhMemory));
function updateMemories(){
 const selected=memories.filter(item=>item.checked).map(item=>Number(item.dataset.vhMemory));
 $('vh-memory-count').textContent=selected.length+' / '+memories.length+' Memories';
 $('vh-memory-progress-fill').style.width=Math.round(selected.length/memories.length*100)+'%';
 try{localStorage.setItem(memoryKey,JSON.stringify(selected));}catch{}
}
memories.forEach(item=>item.addEventListener('change',updateMemories));
$('vh-memory-reset')?.addEventListener('click',()=>{
 for(const item of memories)item.checked=false;updateMemories();
});
updateMemories();


// Every historical visual card is backed by an item-specific image and source.
// The dialog displays the clicked image rather than a static preview.
const visualDialog=$('vh-visual-dialog');
const visualImg=$('vh-visual-image');
const visualTitle=$('vh-visual-title');
const visualSource=$('vh-visual-source');
const visualError=$('vh-visual-error');
let visualReturnFocus=null;
document.querySelectorAll('[data-vh-open-art]').forEach(trigger=>{
 const image=trigger.querySelector('img');
 const fallback=trigger.querySelector('.vh-image-error');
 image?.addEventListener('error',()=>{
  if(fallback)fallback.hidden=false;
  image.hidden=true;
 });
 trigger.addEventListener('click',()=>{
  visualReturnFocus=trigger;
  const url=trigger.dataset.image,title=trigger.dataset.title,source=trigger.dataset.source;
  if(!url||!title||!source)return;
  visualImg.hidden=false;
  visualError.hidden=true;
  visualImg.alt=image?.alt||title;
  visualImg.src=url;
  visualTitle.textContent=title;
  visualSource.href=source;
  visualDialog.showModal();
  $('vh-visual-close')?.focus();
 });
});
visualImg?.addEventListener('error',()=>{
 visualImg.hidden=true;
 visualError.hidden=false;
});
function closeVisual(){
 if(visualDialog?.open)visualDialog.close();
 visualImg?.removeAttribute('src');
 visualReturnFocus?.focus();
}
$('vh-visual-close')?.addEventListener('click',closeVisual);
visualDialog?.addEventListener('close',()=>{visualImg?.removeAttribute('src');visualReturnFocus?.focus();});
visualDialog?.addEventListener('click',e=>{if(e.target===visualDialog)closeVisual();});
const eraImage=$('vh-era-2026-image');
const eraReveal=$('vh-era-show-image');
const eraCover=$('vh-era-modern-cover');
function hideModernTimeline(){
 if(!eraImage)return;
 eraImage.hidden=true;eraImage.removeAttribute('src');
 if(eraCover)eraCover.hidden=false;
 if(eraReveal)eraReveal.textContent='Reveal GTA VI Preview';
}
function syncModernTimeline(){
 if(!eraReveal)return;
 if(locked())hideModernTimeline();
 eraReveal.disabled=locked();
 if(locked())eraReveal.textContent='Preview Locked By Spoiler Setting';
}
eraReveal?.addEventListener('click',()=>{
 if(locked()||!eraImage)return;
 if(!eraImage.hidden){
  hideModernTimeline();return;
 }
 const url=eraImage.dataset.vhSource;
 if(!url)return;
 eraImage.src=url+'?akim=1&imdensity=1&imwidth=960';
 eraImage.hidden=false;
 if(eraCover)eraCover.hidden=true;
 eraReveal.textContent='Hide GTA VI Preview';
});
eraImage?.addEventListener('error',()=>{
 hideModernTimeline();
 if(eraCover)eraCover.querySelector('span').textContent='Official Preview Unavailable';
});
document.addEventListener('vice:preferences',syncModernTimeline);
window.addEventListener('storage',syncModernTimeline);
window.addEventListener('pageshow',syncModernTimeline);
$('vh-radio-art')?.addEventListener('error',()=>{
 $('vh-radio-art').hidden=true;
 $('vh-radio-art-fallback').hidden=false;
});
syncModernTimeline();

syncPreferences();
window.ViceHistory=Object.freeze({
 getState:()=>({
  year:years.find(x=>x.getAttribute('aria-pressed')==='true')?.dataset.vhYear||'2002',
  station:stations.find(x=>x.getAttribute('aria-pressed')==='true')?.dataset.vhStation||'flash',
  comparison:selected,revealed,locked:locked(),
  galleryIndex:galleryDialog?.open?galleryIndex:null,
  memories:memories.filter(x=>x.checked).length
 })
});
})();