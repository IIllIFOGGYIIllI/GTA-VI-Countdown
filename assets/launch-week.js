/* Vice City Countdown — Launch Week v2.8
   Local-first: no account, analytics, external assets or automatically opened media.
*/
(()=>{
  'use strict';
  const core=window.ViceLaunchWeekCore;
  const countdown=window.ViceCountdown;
  const $=id=>document.getElementById(id);
  if(!core||!countdown||!$('launch-kit'))return;

  const SETTINGS_KEY='vice-launch-preferences-v1';
  const CHECKLIST_KEY='vice-launch-checklist-v1';
  const defaults=Object.freeze({platform:'none',motion:false,sounds:false,strict:false});
  const platformChoices=new Set(['none','PS5','Xbox Series X|S']);
  const tasks=[...document.querySelectorAll('#kit-check-items input[data-task]')];
  const taskKeys=new Set(tasks.map(t=>t.dataset.task));
  const settings={...defaults};
  let completed=new Set(),lastPhase=null,lastSecond=null;
  let audioContext=null;

  function readLocal(key){
    try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;}
    catch{return null;}
  }
  function writeLocal(key,data){
    try{localStorage.setItem(key,JSON.stringify(data));return true;}
    catch{return false;}
  }
  function applySettings(){
    document.documentElement.classList.toggle('vc-low-motion',settings.motion);
    document.documentElement.classList.toggle('vc-strict-spoilers',settings.strict);
    const toggle=$('media-toggle');
    const content=$('media-content');
    if(toggle&&content){
      if(settings.strict && !content.hidden){
        // Existing media controller closes the viewer and hides the content.
        toggle.click();
      }
      toggle.disabled=settings.strict;
      toggle.setAttribute('aria-disabled',String(settings.strict));
      if(settings.strict){
        toggle.textContent='Media locked — change your launch settings';
      } else {
        toggle.textContent=content.hidden?'Reveal official media ↗':'Hide official media ↑';
      }
    }
    $('kit-platform').value=settings.platform;
    $('kit-motion').checked=settings.motion;
    $('kit-sounds').checked=settings.sounds;
    $('kit-strict').checked=settings.strict;
  }
  function persistSettings(){
    const stored=writeLocal(SETTINGS_KEY,settings);
    $('kit-settings-status').textContent=stored
      ?'Preferences saved locally. No data is uploaded.'
      :'Preferences applied for this visit. Your browser blocked local storage.';
  }
  const saved=readLocal(SETTINGS_KEY);
  if(saved && typeof saved==='object' && !Array.isArray(saved)){
    settings.platform=platformChoices.has(saved.platform)?saved.platform:'none';
    settings.motion=saved.motion===true;
    settings.sounds=saved.sounds===true;
    settings.strict=saved.strict===true;
  }
  applySettings();
  $('kit-platform').addEventListener('change',()=>{
    const requested=$('kit-platform').value;
    settings.platform=platformChoices.has(requested)?requested:'none';
    persistSettings();
  });
  $('kit-motion').addEventListener('change',()=>{
    settings.motion=$('kit-motion').checked;
    applySettings();persistSettings();
  });
  $('kit-sounds').addEventListener('change',()=>{
    settings.sounds=$('kit-sounds').checked;
    if(settings.sounds)playTone([440,660],.06,true);
    persistSettings();
  });
  $('kit-strict').addEventListener('change',()=>{
    settings.strict=$('kit-strict').checked;
    applySettings();persistSettings();
  });
  $('kit-reset-settings').addEventListener('click',()=>{
    Object.assign(settings,defaults);applySettings();persistSettings();
  });

  function refreshChecklist(){
    let done=0;
    for(const box of tasks){
      box.checked=completed.has(box.dataset.task);
      if(box.checked)done++;
    }
    const total=tasks.length;
    $('kit-check-count').textContent=done+' OF '+total+' READY';
    $('kit-check-progress').style.width=(total?done/total*100:0)+'%';
    $('kit-check-message').textContent=done===total
      ?'Launch kit complete — enjoy your first night!'
      :'Progress is stored on this device only';
  }
  const storedChecks=readLocal(CHECKLIST_KEY);
  if(Array.isArray(storedChecks)){
    completed=new Set(storedChecks.filter(key=>taskKeys.has(key)));
  }
  for(const box of tasks){
    box.addEventListener('change',()=>{
      if(box.checked)completed.add(box.dataset.task);
      else completed.delete(box.dataset.task);
      if(!writeLocal(CHECKLIST_KEY,[...completed])){
        $('kit-check-message').textContent='Your browser blocked local storage.';
      }
      refreshChecklist();
    });
  }
  $('kit-clear-checklist').addEventListener('click',()=>{
    completed.clear();writeLocal(CHECKLIST_KEY,[]);refreshChecklist();
  });
  refreshChecklist();

  function playTone(notes,duration,force=false){
    if(!settings.sounds || document.hidden)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)return;
      if(!audioContext && force)audioContext=new Ctx();
      if(!audioContext || audioContext.state!=='running')return;
      notes.forEach((freq,i)=>{
        const oscillator=audioContext.createOscillator();
        const gain=audioContext.createGain();
        const t=audioContext.currentTime+i*.1;
        oscillator.type='sine';
        oscillator.frequency.setValueAtTime(freq,t);
        gain.gain.setValueAtTime(.0001,t);
        gain.gain.exponentialRampToValueAtTime(.036,t+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,t+duration+.06);
        oscillator.connect(gain);gain.connect(audioContext.destination);
        oscillator.start(t);oscillator.stop(t+duration+.08);
      });
    }catch{ /* Muted devices and unsupported audio simply stay silent. */ }
  }
  function friendlyRegion(zone){return String(zone||'your selected region').replaceAll('_',' ').replaceAll('/',' / ');}
  function renderTiming(data){
    const state=data||countdown.getState();
    const ms=Math.max(0,state.remainingMs);
    const phase=core.phase(state.launched?-1:ms);
    const labels=core.PHASE_LABELS[phase];
    const previous=lastPhase;
    if(previous!==phase){
      document.body.dataset.launchPhase=phase;
      const banner=$('launch-eve-banner');
      banner.hidden=phase==='normal'||phase==='launched';
      if(!banner.hidden){
        $('launch-eve-title').textContent=labels[0];
        $('launch-eve-detail').textContent=labels[1];
      }
      if(previous!==null&&!settings.motion &&
         (phase==='final-minute'||phase==='launched')){
        playTone(phase==='launched'?[523,784]:[440,550],.13);
      }
      lastPhase=phase;
    }
    const t=core.remainingParts(ms);
    const preview=phase==='launched'
      ?'LAUNCH TIME REACHED'
      :core.padded(t.days)+'D '+core.padded(t.hours)+'H '+core.padded(t.minutes)+'M';
    if($('kit-preview-count').textContent!==preview){
      $('kit-preview-count').textContent=preview;
    }
    lastSecond=Math.floor(state.now/1000);
  }
  // Read the authoritative timezone-aware countdown even on the first load
  // before the next one-second event arrives.
  renderTiming(countdown.getState());
  window.addEventListener('vice:tick',event=>{
    if(event.detail)renderTiming(event.detail);
  });

  function showShareStatus(message){$('kit-share-status').textContent=message;}
  function downloadBlob(blob,filename){
    const href=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=href;anchor.download=filename;
    anchor.style.display='none';document.body.appendChild(anchor);
    anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(href),12000);
  }
  async function copyText(value){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(value);return true;
    }
    const textarea=document.createElement('textarea');
    textarea.value=value;textarea.style.position='fixed';textarea.style.opacity='0';
    document.body.appendChild(textarea);textarea.focus();textarea.select();
    const success=document.execCommand?.('copy')===true;
    textarea.remove();
    return success;
  }
  $('kit-copy-share').addEventListener('click',async()=>{
    const state=countdown.getState();
    const copy=core.shareText(state.remainingMs,state.selectedZone,settings.platform);
    try{
      const ok=await copyText(copy);
      showShareStatus(ok?'Countdown text copied — ready to paste.':'Copy not available in this browser.');
    }catch{showShareStatus('Copy unavailable. Please use your browser share options.');}
  });
  $('kit-calendar').addEventListener('click',()=>{
    const state=countdown.getState();
    try{
      const file=core.buildCalendar(state.release,state.selectedZone);
      downloadBlob(new Blob([file],{type:'text/calendar;charset=utf-8'}),
        'GTA-VI-launch-'+state.selectedZone.replace(/[^a-z0-9-]/gi,'-').slice(0,55)+'.ics');
      showShareStatus('Calendar reminder exported. Import the .ics file into your calendar app.');
    }catch{showShareStatus('Could not create the calendar file on this device.');}
  });

  // Fully original vector-style canvas postcard. No screenshots, external
  // image requests, third-party logos or CDN assets are used.
  function drawPostcard(state){
    const canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=1350;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas 2D is unavailable');
    const {width:W,height:H}=canvas;
    const sky=ctx.createLinearGradient(0,0,0,H);
    [
      [0,'#1b163c'],[.23,'#5e2e70'],[.48,'#ee7499'],
      [.62,'#ffad88'],[.79,'#243d61'],[1,'#14142e']
    ].forEach(([at,color])=>sky.addColorStop(at,color));
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(790,515,30,790,515,340);
    glow.addColorStop(0,'rgba(255,232,186,.55)');
    glow.addColorStop(1,'rgba(255,167,148,0)');
    ctx.fillStyle=glow;ctx.fillRect(380,150,700,680);
    ctx.beginPath();ctx.arc(790,515,185,0,Math.PI*2);
    const sun=ctx.createLinearGradient(0,320,0,690);
    sun.addColorStop(0,'#fff1b4');sun.addColorStop(1,'#ff799e');
    ctx.fillStyle=sun;ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(790,515,185,0,Math.PI*2);ctx.clip();
    ctx.fillStyle='rgba(243,100,145,.54)';
    for(let y=528;y<706;y+=20){ctx.fillRect(595,y,390,(y-500)/13);}
    ctx.restore();
    ctx.fillStyle='rgba(21,26,52,.85)';
    const buildings=[
      [0,690,90,210],[85,650,90,250],[172,735,65,160],
      [241,680,83,212],[324,620,95,284],[417,705,73,185],
      [483,650,85,252],[569,710,75,160],[645,665,60,215],
      [708,710,80,190],[795,660,74,250],[873,700,65,195],
      [931,640,90,245],[1014,680,66,230]
    ];
    buildings.forEach(([x,y,w,h],i)=>{
      ctx.fillRect(x,y,w,h);
      ctx.fillStyle=i%2?'#e9a0ba':'#8be6d6';
      ctx.globalAlpha=.25;
      for(let col=0;col<w-10;col+=18){
        for(let yy=y+18;yy<y+h-15;yy+=24)ctx.fillRect(x+col+8,yy,5,8);
      }
      ctx.globalAlpha=1;ctx.fillStyle='rgba(21,26,52,.85)';
    });
    ctx.fillStyle='#182743';ctx.fillRect(0,840,W,H-840);
    ctx.fillStyle='rgba(255,183,175,.17)';
    for(let y=850;y<1060;y+=17){
      ctx.fillRect(360+(y-850)*-.6,y,420+(y-850)*2.2,2);
    }
    // Palm silhouettes: curved trunks and arching leaves, drawn locally.
    function palm(x,y,s,flip){
      ctx.save();ctx.translate(x,y);ctx.scale(flip*s,s);
      ctx.strokeStyle='#101630';ctx.fillStyle='#101630';
      ctx.lineWidth=18;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(5,-95,-4,-210,-25,-345);ctx.stroke();
      const o={x:-25,y:-345};
      for(let i=0;i<8;i++){
        const ang=(-175+i*45)*Math.PI/180;
        const dx=Math.cos(ang)*170,dy=Math.sin(ang)*125;
        ctx.beginPath();ctx.moveTo(o.x,o.y);
        ctx.quadraticCurveTo(o.x+dx*.48,o.y+dy*.88-75,o.x+dx,o.y+dy+25);
        ctx.quadraticCurveTo(o.x+dx*.47,o.y+dy*.48+10,o.x,o.y);
        ctx.fill();
      }
      ctx.restore();
    }
    palm(116,920,1.05,1);palm(1044,985,1.2,-1);
    ctx.lineWidth=4;ctx.strokeStyle='rgba(255,216,190,.7)';
    ctx.strokeRect(39,39,W-78,H-78);
    ctx.lineWidth=1;ctx.strokeStyle='rgba(148,255,235,.65)';
    ctx.strokeRect(50,50,W-100,H-100);
    ctx.textAlign='left';
    ctx.fillStyle='#9bfced';ctx.font='bold 30px Arial,sans-serif';
    ctx.fillText('THE FINAL COUNTDOWN',88,142);
    ctx.fillStyle='#fff2d6';ctx.font='italic bold 48px Georgia,serif';
    ctx.fillText('GREETINGS FROM',88,234);
    ctx.shadowColor='rgba(55,16,85,.75)';ctx.shadowBlur=12;
    ctx.fillStyle='#fff9e8';ctx.font='italic 1000 158px Impact,Arial Black,sans-serif';
    ctx.fillText('VICE',78,392);
    ctx.fillStyle='#ffb6c4';ctx.font='italic bold 178px Georgia,serif';
    ctx.fillText('CITY',93,558);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(14,15,39,.92)';ctx.fillRect(88,990,904,213);
    ctx.strokeStyle='rgba(123,249,232,.85)';ctx.lineWidth=2;ctx.strokeRect(88,990,904,213);
    const rem=core.remainingParts(state.remainingMs);
    const launched=state.launched||state.remainingMs<=0;
    const counter=launched?'LAUNCH TIME REACHED':
      core.padded(rem.days)+'D  '+core.padded(rem.hours)+'H  '+core.padded(rem.minutes)+'M';
    ctx.fillStyle='#9ffff0';ctx.font='bold 21px Arial,sans-serif';ctx.fillText('19 NOVEMBER 2026 · SELECTED REGION',117,1036);
    ctx.fillStyle='#fff4e5';ctx.font=launched?'bold 49px Impact,Arial Black,sans-serif':'bold 71px Impact,Arial Black,sans-serif';
    ctx.fillText(counter,113,1128);
    ctx.font='bold 20px Arial,sans-serif';ctx.fillStyle='#ffdbb8';
    const zoneName=friendlyRegion(state.selectedZone);
    const zoneSafe=zoneName.length>55?zoneName.slice(0,52)+'…':zoneName;
    ctx.fillText(zoneSafe+(settings.platform==='none'?'':' · '+settings.platform),116,1174);
    ctx.fillStyle='#fff0e5';ctx.font='bold 21px Arial,sans-serif';
    ctx.fillText('SPOILER-FREE · UNOFFICIAL FAN PROJECT',88,1271);
    return canvas;
  }
  $('kit-download-card').addEventListener('click',()=>{
    const button=$('kit-download-card');
    if(button.disabled)return;
    button.disabled=true;
    button.textContent='Creating your card…';
    try{
      const state=countdown.getState();
      const canvas=drawPostcard(state);
      if(!canvas.toBlob)throw new Error('No canvas exporter');
      canvas.toBlob(blob=>{
        button.disabled=false;
        button.textContent='Save countdown PNG ↗';
        if(!blob){showShareStatus('Your browser could not save the image.');return;}
        downloadBlob(blob,'Vice-City-Countdown-'+String(state.selectedZone).replace(/[^a-z0-9]/gi,'-').slice(0,40)+'.png');
        showShareStatus('PNG postcard created. Save or share it from your downloads.');
      },'image/png');
    }catch{
      button.disabled=false;button.textContent='Save countdown PNG ↗';
      showShareStatus('Image export is unavailable in this browser.');
    }
  });

  // No feature changes required after official launch: user can still
  // save a postcard, keep preferences and consult their checklist.
  document.body.classList.add('vc-launch-kit-ready');
})();
