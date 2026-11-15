(() => {
  'use strict';
  const RELEASE = {year:2026, month:11, day:19};
  const PREF = 'vc-countdown-timezone-v1';
  const $ = id => document.getElementById(id);
  const editorialTitleCase=value=>String(value).replace(/\b[A-Za-z][A-Za-z0-9]*(?:['’][A-Za-z]+)*/g,word=>{
 const match=word.match(/^(.+)(['’]s)$/i),base=match?match[1]:word,suffix=match?match[2].toLowerCase():'';
 if(/^(GTA|VI|PS5|PWA|PNG|API|HTML|CSS|PC|USB|DJ|AM|PM|TV|URL|IANA|NSW)$/i.test(base))return base.toUpperCase()+suffix;
 if(/[a-z][A-Z]|['’][A-Z][a-z]/.test(word))return word;
 if(/^xbox$/i.test(base))return 'Xbox'+suffix;
 if(/^youtube$/i.test(base))return 'YouTube'+suffix;
 return base[0].toUpperCase()+base.slice(1).toLowerCase()+suffix;
});
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
    group('Popular Regions',favoriteZones);
    try {
      const supported = Intl.supportedValuesOf('timeZone');
      const expanded = supported.map(z=>[z,z.replaceAll('_',' ').replaceAll('/',' / ')]);
      group('All Timezones (IANA)',expanded);
    } catch { /* defaults remain available in older browsers */ }
    const detected = getDetectedZone();
    if(!seen.has(detected))group('Your Device',[[detected,detected]]);
    const stored = getSavedZone();
    if(stored && !seen.has(stored))group('Saved Region',[[stored,stored]]);
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
  // Launch mode is calculated from the selected region's midnight,
  // not merely the viewer's device date or clock timezone.
  let currentLaunchMode=null;
  function updateLaunchMode(launched){
    const mode=launched?'launched':'countdown';
    if(mode===currentLaunchMode)return;
    currentLaunchMode=mode;
    const region=zoneSelect.selectedOptions?.[0]?.textContent?.trim()||selectedZone.replaceAll('_',' ').replaceAll('/',' / ');
    const showTimer=!launched;
    $('count-grid').hidden=!showTimer;
    $('count-progress').hidden=!showTimer;
    $('launch-state').hidden=!launched;
    $('launch-hub').hidden=!launched;
    $('countdown-heading').textContent=launched?'The Wait Is Over':'Midnight Calling';
    $('countdown-intro').textContent=launched
      ?'Scheduled release time reached · 19 November 2026'
      :'Until midnight · 19 November 2026';
    $('card-status-label').textContent=launched?'Launch Milestone · Region':'Live · Your Region';
    $('header-state-label').textContent=launched?'Launch Day':'Live Countdown';
    $('hero-primary-label').textContent=launched?'Launch guide':'See the countdown';
    $('hero-primary-action').href=launched?'./launch-info.html#launch-hub':'./index.html#countdown-panel';
    $('hero-chapter').textContent=launched?'01 / The City Is Yours':'01 / The Final Countdown';
    $('hero-intro').textContent=launched
      ?'The wait is over in your selected region. Explore official launch information, keep your first playthrough spoiler-free, and welcome back to Vice City.'
      :'Sunset skies. Neon nights. One final countdown. Track the launch of Grand Theft Auto VI across the globe, without ruining a second of the story.';
    $('launch-region-name').textContent=region;
    $('launch-state-message').textContent=
      'The scheduled midnight release time has arrived for '+region+'. Check your console storefront for availability.';
    document.body.classList.toggle('has-launched',launched);
  }

  function selectZone(zone){
    try { release=releaseEpoch(zone); selectedZone=zone; saveZone(zone); }
    catch { selectedZone='Australia/Sydney';zoneSelect.value=selectedZone;release=releaseEpoch(selectedZone); }
    const releaseDate = new Date(release);
    $('zone-time').textContent=localTime(releaseDate,selectedZone,{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
    currentLaunchMode=null;
    lastDisplaySecond=-1;
    tick();
  }
  function tick() {
    const now=Date.now();
    const second=Math.floor(now/1000);
    if(second===lastDisplaySecond)return;
    lastDisplaySecond=second;
    let seconds=Math.max(0,Math.ceil((release-now)/1000));
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
    updateLaunchMode(launched);
    if(launched){
      const since=Math.max(0,Math.floor((now-release)/1000));
      const elapsedDays=Math.floor(since/86400);
      const elapsedHours=Math.floor((since%86400)/3600);
      const elapsedMinutes=Math.floor((since%3600)/60);
      $('launch-elapsed').textContent=
        (elapsedDays>0?elapsedDays+'D ':'')+pad(elapsedHours)+'H '+pad(elapsedMinutes)+'M';
    }
    document.title=launched?'GTA VI Launch Milestone | Vice City Countdown':(days+'d '+pad(hours)+'h '+pad(minutes)+'m | GTA VI Countdown');
    // No event in the Node test harness; browser listeners update stage and card.
    if(typeof CustomEvent==='function' && typeof window.dispatchEvent==='function'){
      window.dispatchEvent(new CustomEvent('vice:tick',{detail:{
        now, release, selectedZone, remainingMs:Math.max(0,release-now), launched
      }}));
    }
  }
  // Public read-only state for Launch Week. Keeps timezone calculations
  // authoritative in this one place and avoids a second competing timer.
  window.ViceCountdown=Object.freeze({
    getState:()=>({
      now:Date.now(),
      release,
      remainingMs:Math.max(0,release-Date.now()),
      selectedZone,
      launched:Date.now()>=release
    })
  });
  fillZones();
  selectZone(zoneSelect.value);
  zoneSelect.addEventListener('change',()=>selectZone(zoneSelect.value));
  $('detect-zone').addEventListener('click',()=>{const tz=getDetectedZone();if(!Array.from(zoneSelect.options).some(o=>o.value===tz)){const o=new Option(tz,tz);zoneSelect.append(o);}zoneSelect.value=tz;selectZone(tz);toast('Device timezone selected.');});
  setInterval(tick,250);
  window.addEventListener('focus',()=>{lastDisplaySecond=-1;tick()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastDisplaySecond=-1;tick()}});
  $('current-year').textContent=new Date().getFullYear();

  // The countdown page owns the clock; other features have their own page scripts.
  let toastTimer;
  function toast(message){
    const box=$('toast');if(!box)return;
    box.textContent=message;box.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{box.hidden=true;},4000);
  }
})();
