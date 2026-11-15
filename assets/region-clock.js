/* v3.1 Lightweight read-only regional clock for pages without a countdown dial. */
(()=>{
 'use strict';
 const preference='vc-countdown-timezone-v1';
 const date={year:2026,month:11,day:19};
 const detect=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Australia/Sydney';}catch{return 'Australia/Sydney';}};
 const chosen=()=>{try{const saved=localStorage.getItem(preference);if(saved){new Intl.DateTimeFormat('en',{timeZone:saved});return saved;}}catch{}return detect();};
 let zone=chosen();
 const formatters=new Map();
 const parts=(epoch,z)=>{
  let f=formatters.get(z);
  if(!f){f=new Intl.DateTimeFormat('en-GB',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formatters.set(z,f);}
  const v={};for(const x of f.formatToParts(new Date(epoch)))if(x.type!=='literal')v[x.type]=Number(x.value);return v;
 };
 const midnight=z=>{const desired=Date.UTC(date.year,date.month-1,date.day);let now=desired;
  for(let i=0;i<4;i++){const p=parts(now,z);const current=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=desired-current;now+=delta;if(!delta)break;}return now;
 };
 let release=midnight(zone);
 const getState=()=>{const now=Date.now();return {now,release,selectedZone:zone,remainingMs:Math.max(0,release-now),launched:now>=release};};
 const emit=()=>{const state=getState(),hub=document.getElementById('launch-hub');
   if(hub){hub.hidden=!state.launched;const label=document.getElementById('launch-region-name');if(label)label.textContent=zone.replaceAll('_',' ').replaceAll('/',' / ');}
   window.dispatchEvent(new CustomEvent('vice:tick',{detail:state}));
 };
 const update=()=>{const next=chosen();if(next!==zone){zone=next;release=midnight(zone);}emit();};
 window.ViceCountdown=Object.freeze({getState});
 window.addEventListener('storage',e=>{if(e.key===preference)update();});
 window.addEventListener('focus',update);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
 setInterval(emit,1000);emit();
})();
