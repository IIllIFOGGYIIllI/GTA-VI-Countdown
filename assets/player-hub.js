/* Vice City Hub — private local player checklist. */
(()=>{
 'use strict';
 const items=[...document.querySelectorAll('#player-checks [data-player-task]')];
 const count=document.getElementById('player-progress');
 const note=document.getElementById('player-save-note');
 const reset=document.getElementById('player-reset');
 if(!items.length||!count)return;
 const key='vc-first-session-v1';
 let completed=[];
 try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))completed=saved.filter(x=>typeof x==='string');}
 catch{}
 const render=()=>{count.textContent=items.filter(x=>x.checked).length+' Of '+items.length+' Complete';};
 const save=()=>{
  try{localStorage.setItem(key,JSON.stringify(items.filter(x=>x.checked).map(x=>x.dataset.playerTask)));}
  catch{if(note)note.textContent='Local Storage Unavailable — Changes Are Temporary';}
  render();
 };
 items.forEach(item=>{item.checked=completed.includes(item.dataset.playerTask);item.addEventListener('change',save);});
 reset?.addEventListener('click',()=>{items.forEach(item=>item.checked=false);try{localStorage.removeItem(key);}catch{}render();});
 render();
})();