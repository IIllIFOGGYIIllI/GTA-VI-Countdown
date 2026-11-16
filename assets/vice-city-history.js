/* Vice City History v3.2 — timeline, visual-only radio and spoiler-conscious comparison */
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
}));
// Image choices are verified official scenic Rockstar screenshots already in
// the website's approved 138-image catalogue. None are requested before reveal.
const eras={
 coast:{
  original:'A City Built On Neon',
  originalCopy:'The original game’s pastel storefronts, palm trees and beach roads captured the cinematic imagination of a fictional 1980s Miami.',
  modern:'A Modern Return To Vice City',
  modernCopy:'Rockstar’s official images show a contemporary coastal city, now part of the wider state of Leonida.',
  url:'https://www.rockstargames.com/VI/_next/static/media/Vice_City_01.135x56yoeu.6t.jpg',
  alt:'Official GTA VI promotional screenshot featuring Vice City'
 },
 city:{
  original:'Downtown, Beyond The Beach',
  originalCopy:'The first Vice City mixed pastel beachfront avenues with denser Downtown streets, traffic and a big-city skyline.',
  modern:'The New City Skyline',
  modernCopy:'Rockstar’s GTA VI screenshots depict the modern city on a different scale, without promising identical streets or buildings.',
  url:'https://www.rockstargames.com/VI/_next/static/media/Vice_City_03.0nqz~lrqdmlze.jpg',
  alt:'Official GTA VI city screenshot released by Rockstar Games'
 },
 night:{
  original:'The City After Sunset',
  originalCopy:'Neon signs, radio music and brightly lit streets made night-time free-roaming one of the original game’s signatures.',
  modern:'Another Generation Of Neon',
  modernCopy:'Promotional images of modern Vice City evoke a new chapter of the same sun-and-neon atmosphere.',
  url:'https://www.rockstargames.com/VI/_next/static/media/Vice_City_09.0~ng.c8ack3fp.jpg',
  alt:'Official GTA VI Vice City scenic promotional screenshot'
 }
};
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
syncPreferences();
window.ViceHistory=Object.freeze({
 getState:()=>({
  year:years.find(x=>x.getAttribute('aria-pressed')==='true')?.dataset.vhYear||'2002',
  station:stations.find(x=>x.getAttribute('aria-pressed')==='true')?.dataset.vhStation||'flash',
  comparison:selected,revealed,locked:locked()
 })
});
})();