(() => {
  'use strict';
  const RELEASE = {year:2026, month:11, day:19};
  const PREF = 'vc-countdown-timezone-v1';
  const $ = id => document.getElementById(id);
  const zoneSelect = $('timezone');
  if (!zoneSelect) return;
  const favoriteZones = [
    ['Australia/Sydney','Sydney / Melbourne · Australia'],
    ['Australia/Brisbane','Brisbane · Australia'],
    ['Australia/Adelaide','Adelaide · Australia'],
    ['Australia/Perth','Perth · Australia'],
    ['Pacific/Auckland','Auckland · New Zealand'],
    ['Pacific/Fiji','Fiji'],
    ['Asia/Tokyo','Tokyo · Japan'],
    ['Asia/Singapore','Singapore'],
    ['Asia/Dubai','Dubai · UAE'],
    ['Europe/London','London · United Kingdom'],
    ['Europe/Paris','Paris · France'],
    ['Europe/Berlin','Berlin · Germany'],
    ['America/New_York','New York · USA'],
    ['America/Chicago','Chicago · USA'],
    ['America/Denver','Denver · USA'],
    ['America/Los_Angeles','Los Angeles · USA'],
    ['America/Toronto','Toronto · Canada'],
    ['America/Sao_Paulo','São Paulo · Brazil'],
    ['Africa/Johannesburg','Johannesburg · South Africa'],
    ['Pacific/Honolulu','Honolulu · USA']
  ];
  function getDetectedZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney'; } catch { return 'Australia/Sydney'; } }
  function getSavedZone() { try { return localStorage.getItem(PREF); } catch { return null; } }
  function saveZone(zone) { try { localStorage.setItem(PREF,zone); } catch { /* storage may be unavailable */ } }
  function fillZones() {
    zoneSelect.innerHTML = '';
    const seen = new Set();
    function group(label, zones) {
      const element = document.createElement('optgroup');
      element.label=label;
      zones.forEach(([value, title]) => { if(seen.has(value))return; const o=document.createElement('option');o.value=value;o.textContent=title;element.append(o);seen.add(value); });
      if(element.children.length)zoneSelect.append(element);
    }
    group('POPULAR REGIONS',favoriteZones);
    try {
      const supported = Intl.supportedValuesOf('timeZone');
      const expanded = supported.map(z=>[z,z.replaceAll('_',' ').replaceAll('/',' / ')]);
      group('ALL TIMEZONES (IANA)',expanded);
    } catch { /* defaults remain available in older browsers */ }
    const detected = getDetectedZone();
    if(!seen.has(detected))group('YOUR DEVICE',[[detected,detected]]);
    const stored = getSavedZone();
    if(stored && !seen.has(stored))group('SAVED REGION',[[stored,stored]]);
    zoneSelect.value = stored || detected;
    if(!zoneSelect.value)zoneSelect.value=detected;
    if(!zoneSelect.value)zoneSelect.value='Australia/Sydney';
  }
  const datePartFormatter = new Map();
  function formatParts(epoch,zone) {
    let fmt=datePartFormatter.get(zone);
    if(!fmt){
      fmt=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
      datePartFormatter.set(zone,fmt);
    }
    const values = {};
    for (const p of fmt.formatToParts(new Date(epoch))) if(p.type!=='literal')values[p.type]=Number(p.value);
    return values;
  }
  function releaseEpoch(zone) {
    const wanted=Date.UTC(RELEASE.year,RELEASE.month-1,RELEASE.day);
    let epoch=wanted;
    for(let i=0;i<4;i++){
      const p=formatParts(epoch,zone);
      const actual=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
      const delta=wanted-actual;
      epoch+=delta;
      if(delta===0)break;
    }
    return epoch;
  }
  function localTime(date,zone,opts) { return new Intl.DateTimeFormat('en-AU',{timeZone:zone,...opts}).format(date); }
  function pad(n){return String(n).padStart(2,'0');}
  let selectedZone=zoneSelect.value,release=0;
  let lastDisplaySecond=-1;
  function selectZone(zone){
    try { release=releaseEpoch(zone); selectedZone=zone; saveZone(zone); }
    catch { selectedZone='Australia/Sydney';zoneSelect.value=selectedZone;release=releaseEpoch(selectedZone); }
    const releaseDate = new Date(release);
    $('zone-time').textContent=localTime(releaseDate,selectedZone,{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
    $('countdown-intro').textContent='Until 12:00 AM · 19 November 2026';
    lastDisplaySecond=-1;
    tick();
  }
  function tick() {
    const now=Date.now();
    const second=Math.floor(now/1000);
    if(second===lastDisplaySecond)return;
    lastDisplaySecond=second;
    let seconds=Math.max(0,Math.floor((release-now)/1000));
    const days=Math.floor(seconds/86400);seconds%=86400;
    const hours=Math.floor(seconds/3600);seconds%=3600;
    const minutes=Math.floor(seconds/60),secs=seconds%60;
    $('days').textContent=String(days).padStart(2,'0');
    $('hours').textContent=pad(hours);
    $('minutes').textContent=pad(minutes);
    $('seconds').textContent=pad(secs);
    const inMyZone = localTime(new Date(now),selectedZone,{weekday:'short',hour:'numeric',minute:'2-digit',hour12:true});
    $('local-time').textContent=inMyZone;
    const initial=Date.UTC(2026,0,1);
    const pct=Math.max(0,Math.min(100,((now-initial)/(release-initial))*100));
    $('progress-bar').style.width=pct.toFixed(2)+'%';
    const launched=now>=release;
    $('count-done').hidden=!launched;
    document.title=launched?'GTA VI Launch Day | Vice City Countdown':(days+'d '+pad(hours)+'h '+pad(minutes)+'m | GTA VI Countdown');
  }
  fillZones();
  selectZone(zoneSelect.value);
  zoneSelect.addEventListener('change',()=>selectZone(zoneSelect.value));
  $('detect-zone').addEventListener('click',()=>{const tz=getDetectedZone();if(!Array.from(zoneSelect.options).some(o=>o.value===tz)){const o=new Option(tz,tz);zoneSelect.append(o);}zoneSelect.value=tz;selectZone(tz);toast('Device timezone selected.');});
  setInterval(tick,250);
  window.addEventListener('focus',()=>{lastDisplaySecond=-1;tick()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastDisplaySecond=-1;tick()}});
  $('current-year').textContent=new Date().getFullYear();
  for(const b of document.querySelectorAll('.filter')) b.addEventListener('click',()=>{
    const category=b.dataset.filter;
    for(const item of document.querySelectorAll('.filter')){const active=item===b;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));}
    for(const article of document.querySelectorAll('.news-card'))article.hidden=category!=='all'&&article.dataset.category!==category;
  });
  let toastTimer;
  function toast(message) {
    const element=$('toast');
    element.textContent=message;element.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.hidden=true,4000);
  }
  let deferredInstall;
  const installBtn=$('install-btn');
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;installBtn.textContent='Install the PWA ↗';});
  installBtn.addEventListener('click',async()=>{
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {toast('The app is already installed.');return;}
    if(deferredInstall){const prompt=deferredInstall;deferredInstall=null;prompt.prompt();try{await prompt.userChoice;}catch{} return;}
    const apple=/iPad|iPhone|iPod/.test(navigator.userAgent);
    toast(apple?'On iPhone: tap Share, then Add to Home Screen.':'Use your browser menu and choose Install app or Add to Home Screen.');
  });
  window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('Vice City Countdown installed!');});
  if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
})();