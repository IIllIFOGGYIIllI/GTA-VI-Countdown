/* Real Chromium launch readiness smoke test.
 * Run: npm install && npx playwright install chromium && npm run test:browser
 * Uses a local HTTP server and fake clock. No external content is opened.
 */
'use strict';

const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const ROOT=path.resolve(__dirname,'..');
const BASE='http://127.0.0.1:4173/';
const SHOTS=path.join(ROOT,'browser-screenshots');
fs.mkdirSync(SHOTS,{recursive:true});

async function serverReady(){
  for(let i=0;i<80;i++){
    try{const r=await fetch(BASE);if(r.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw new Error('Local preview server failed to start');
}
// A synthetic 14-second sine-wave WAV created in memory for testing the
// visitor-provided cue path. No commercial recording is ever bundled.
function createCueTestWav(){
  const sampleRate=8000,duration=14,frames=sampleRate*duration;
  const out=Buffer.allocUnsafe(44+frames*2);
  out.write('RIFF',0);out.writeUInt32LE(out.length-8,4);
  out.write('WAVE',8);out.write('fmt ',12);out.writeUInt32LE(16,16);
  out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
  out.writeUInt32LE(sampleRate,24);out.writeUInt32LE(sampleRate*2,28);
  out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
  out.write('data',36);out.writeUInt32LE(frames*2,40);
  for(let i=0;i<frames;i++){
    const v=Math.round(Math.sin(i/sampleRate*Math.PI*2*330)*1600);
    out.writeInt16LE(v,44+i*2);
  }
  return out;
}
const failures=[];
async function runCase(name,fn){
  try{await fn();console.log('PASS '+name);}
  catch(e){failures.push({name,error:e});console.error('FAIL '+name+'\n'+(e?.stack||String(e)));}
}
async function main(){
  const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{
    cwd:ROOT,stdio:['ignore','ignore','pipe']
  });
  let serverLog='';
  server.stderr.on('data',part=>{serverLog+=String(part).slice(0,1000);});
  let browser;
  try{
    await serverReady();
    browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});

    for(const [width,height] of [[320,720],[375,812],[430,932],[768,1024],[1366,850]]){
      await runCase('layout and interactions '+width+'x'+height,async()=>{
        const context=await browser.newContext({
          viewport:{width,height},deviceScaleFactor:1,
          timezoneId:'Australia/Sydney',reducedMotion:'reduce',serviceWorkers:'allow'
        });
        try{
          const page=await context.newPage();
          const errors=[];
          page.on('pageerror',e=>errors.push(e.message));
          const response=await page.goto(BASE,{waitUntil:'domcontentloaded'});
          assert.equal(response.status(),200);
          await page.waitForFunction(()=>!!window.ViceCountdown && !!window.ViceLaunchWeekCore &&
            document.body.classList.contains('vc-launch-kit-ready'),{timeout:15000});
          assert.equal(errors.length,0,'Page JS errors: '+errors.join(' | '));
          const metrics=await page.evaluate(()=>{
            const el=document.documentElement;
            return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
              bodyWidth:document.body.scrollWidth,innerWidth:window.innerWidth};
          });
          assert.ok(metrics.scrollWidth<=metrics.innerWidth+2,
            'Unexpected horizontal overflow: '+JSON.stringify(metrics));
          await page.locator('#countdown-heading').waitFor({state:'visible'});
          await page.locator('#launch-kit').waitFor({state:'visible'});
          assert.equal(await page.locator('#launch-state').isVisible(),false);
          assert.equal(await page.locator('#media-content').isVisible(),false);
          if(width<=900){
            assert.equal(await page.locator('.mobile-tabbar').isVisible(),true,'Mobile tabs missing');
            const nav=page.locator('.mobile-tab-link');
            assert.equal(await nav.count(),4);
            for(const link of await nav.all()){
              const rect=await link.boundingBox();
              assert.ok(rect&&rect.height>=40,'Mobile tab too short to tap');
            }
          }else{
            assert.equal(await page.locator('.mobile-tabbar').isVisible(),false);
          }
          if(width===375){
            await page.screenshot({path:path.join(SHOTS,'mobile-375.png'),fullPage:true});
            await page.locator('#kit-platform').selectOption('PS5');
            await page.locator('#kit-motion').check();
            await page.locator('#kit-strict').check();
            assert.equal(await page.locator('#media-toggle').isDisabled(),true);
            await page.locator('#kit-check-items input[data-task="preload"]').check();
            assert.equal(await page.locator('#kit-check-count').textContent(),'1 OF 6 READY');
            await page.reload({waitUntil:'domcontentloaded'});
            await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
            assert.equal(await page.locator('#kit-platform').inputValue(),'PS5');
            assert.equal(await page.locator('#kit-motion').isChecked(),true);
            assert.equal(await page.locator('#kit-strict').isChecked(),true);
            assert.equal(await page.locator('#media-toggle').isDisabled(),true);
            assert.equal(await page.locator('#kit-check-count').textContent(),'1 OF 6 READY');
            // Opening the media remains an explicit opt-in even after disabling strict mode.
            await page.locator('#kit-strict').uncheck();
            assert.equal(await page.locator('#media-toggle').isEnabled(),true);
            assert.equal(await page.locator('#media-content').isVisible(),false);

            // Exercise both actual download controls, not just their markup.
            const calendarEvent=page.waitForEvent('download');
            await page.locator('#kit-calendar').click();
            const calendar=await calendarEvent;
            assert.ok(calendar.suggestedFilename().endsWith('.ics'));
            const calendarText=fs.readFileSync(await calendar.path(),'utf8');
            assert.ok(calendarText.includes('DTSTART:20261118T130000Z'),'Sydney release must use AEDT midnight');
            assert.ok(calendarText.includes('TRIGGER:-PT30M'),'Calendar reminder must contain a 30-minute alarm');

            const postcardEvent=page.waitForEvent('download');
            await page.locator('#kit-download-card').click();
            const postcard=await postcardEvent;
            assert.ok(postcard.suggestedFilename().endsWith('.png'));
            const png=fs.readFileSync(await postcard.path());
            assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',
              'Postcard must be a valid PNG file');
            assert.ok(png.length>10000,'Postcard export is unexpectedly small');
          }
        }finally{await context.close();}
      });
    }

    await runCase('Sydney midnight transition and region reversal',async()=>{
      const context=await browser.newContext({
        viewport:{width:375,height:812},
        timezoneId:'Australia/Sydney',serviceWorkers:'block',
        reducedMotion:'reduce'
      });
      try{
        const page=await context.newPage();
        await page.clock.install({time:new Date('2026-11-18T12:59:58.000Z')});
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(BASE,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
        assert.equal(await page.locator('#countdown-heading').textContent(),'MIDNIGHT CALLING');
        assert.equal(await page.locator('#launch-hub').isVisible(),false);
        await page.clock.runFor(2500);
        assert.equal(await page.locator('#countdown-heading').textContent(),'THE WAIT IS OVER');
        assert.equal(await page.locator('#launch-hub').isVisible(),true);
        assert.equal(await page.locator('#launch-state').isVisible(),true);
        assert.equal(await page.locator('#media-content').isVisible(),false);
        await page.screenshot({path:path.join(SHOTS,'midnight-launch-mobile.png'),fullPage:true});
        await page.locator('#timezone').selectOption('America/Los_Angeles');
        assert.equal(await page.locator('#launch-hub').isVisible(),false);
        assert.equal(await page.locator('#countdown-heading').textContent(),'MIDNIGHT CALLING');
        await page.locator('#timezone').selectOption('Australia/Sydney');
        assert.equal(await page.locator('#launch-hub').isVisible(),true);
        assert.equal(errors.length,0,'Launch switch JS errors: '+errors.join(' | '));
      }finally{await context.close();}
    });

    // The professional fireworks engine must render *real* rocket/particle
    // effects across phone, tablet and desktop. No fake static motif tests.
    for(const [vw,vh] of [[360,780],[768,920],[1440,900]]){
      await runCase('cinematic midnight fireworks '+vw+'px',async()=>{
        const context=await browser.newContext({
          viewport:{width:vw,height:vh},deviceScaleFactor:1,
          serviceWorkers:'block',reducedMotion:'no-preference',
          permissions:[]
        });
        try{
          const page=await context.newPage();
          const errors=[];
          page.on('pageerror',e=>errors.push(e.message));
          const response=await page.goto(BASE+'preview/celebration.html',{waitUntil:'load'});
          assert.equal(response.status(),200);
          await page.waitForFunction(()=>!!window.ViceMidnightShow && window.ViceMidnightShow.engine==='Grand Fireworks JS');
          assert.equal(await page.locator('#midnight-message').isVisible(),false);
          assert.equal(await page.locator('#audio-toggle').getAttribute('aria-pressed'),'false',
            'Sound must be disabled by default');
          assert.equal(await page.locator('.style-option').count(),0,
            'Remove the gimmicky design selectors from the professional show');
          const widths=await page.evaluate(()=>({
            documentWidth:document.documentElement.scrollWidth,
            viewportWidth:window.innerWidth
          }));
          assert.ok(widths.documentWidth<=widths.viewportWidth+2,
            'Horizontal overflow '+JSON.stringify(widths));
          assert.equal(await page.locator('#show-stage .grand-fireworks-root').count(),1,
            'The professional engine must mount inside the show stage');
          await page.locator('#audio-toggle').click();
          const audioStatus=await page.locator('#audio-status').textContent();
          assert.ok(audioStatus.includes('Armed')||audioStatus.includes('blocked'),
            'Audio opt-in did not respond: '+audioStatus);
          if(vw===360){
            await page.locator('#cue-file').setInputFiles({
              name:'private-test.wav',mimeType:'audio/wav',buffer:createCueTestWav()
            });
            await page.waitForFunction(()=>window.ViceMidnightShow.getCueState().loaded,undefined,{timeout:9000});
            assert.ok((await page.locator('#cue-status').textContent()).includes('Not uploaded'));
            await page.locator('#cue-offset').fill('2');
            await page.locator('#preview-ten').click();
            await page.waitForFunction(()=>window.ViceMidnightShow.getCueState().tenTriggered,undefined,{timeout:7000});
            await page.waitForFunction(()=>window.ViceMidnightShow.getCueState().playing,undefined,{timeout:7000});
            assert.equal(await page.locator('#ten-second-caption').isVisible(),true);
            assert.ok((await page.locator('#stage-phase').textContent()).includes('FINAL TEN'));
            const cue=await page.evaluate(()=>window.ViceMidnightShow.getCueState());
            assert.equal(cue.offset,2);
            await page.screenshot({path:path.join(SHOTS,'final-ten-music-cue-mobile.png')});
          }
          // Launch explicitly; no need to wait for the demo countdown.
          await page.locator('#launch-now').click();
          await page.waitForFunction(()=>window.ViceMidnightShow.hasStarted());
          assert.equal(await page.locator('#midnight-message').isVisible(),true);
          if(vw===360){
            const cueAfter=await page.evaluate(()=>window.ViceMidnightShow.getCueState());
            assert.equal(cueAfter.playing,false,'T−10 recording must fade at midnight');
          }
          await page.waitForFunction(()=>{
            const stats=window.ViceMidnightShow.getStats();
            return stats && (stats.particles>20||stats.rockets>0);
          },{timeout:12000});
          const stats=await page.evaluate(()=>window.ViceMidnightShow.getStats());
          assert.ok(['canvas2d','webgl2'].includes(stats.renderer),
            'Expected actual particle renderer, got '+stats.renderer);
          // The launch overlay must be in view; screenshots of the control
          // panel alone can't demonstrate whether the fireworks look convincing.
          await page.waitForTimeout(2300);
          if(vw===360){
            await page.locator('#show-stage').screenshot({path:path.join(SHOTS,'cinematic-fireworks-mobile.png')});
          }
          if(vw===1440){
            await page.locator('#show-stage').screenshot({path:path.join(SHOTS,'cinematic-fireworks-desktop.png')});
          }
          await page.locator('#intensity').selectOption('high');
          await page.locator('#finale').click();
          assert.equal(await page.locator('#stage-phase').textContent().then(t=>t.includes('GRAND FINALE')),true);
          await page.waitForFunction(()=>window.ViceMidnightShow.getStats().particles>20,
            {timeout:10000});
          if(vw===1440){
            await page.waitForTimeout(3000);
            await page.locator('#show-stage').screenshot({path:path.join(SHOTS,'cinematic-grand-finale-desktop.png')});
          }
          await page.locator('#replay').click();
          assert.equal(await page.locator('#midnight-message').isVisible(),true);
          await page.locator('#reduced-motion').check();
          assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('reduce-motion')),true);
          await page.locator('#demo-30').click();
          assert.equal(await page.locator('#midnight-message').isVisible(),false);
          assert.equal(await page.locator('#stage-intro').isVisible(),true);
          assert.deepEqual(errors,[],'Celebration runtime JS errors: '+errors.join(' | '));
        }finally{await context.close();}
      });
    }

    await runCase('PWA offline restart with preserved local data',async()=>{
      const context=await browser.newContext({timezoneId:'Australia/Sydney',serviceWorkers:'allow'});
      try{
        const page=await context.newPage();
        await page.goto(BASE,{waitUntil:'load'});
        await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
        await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
        await page.waitForFunction(async()=>{
          const keys=await caches.keys();
          return keys.includes('vice-city-countdown-v9');
        });
        await context.setOffline(true);
        await page.reload({waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('#countdown-heading').isVisible(),true);
        assert.equal(await page.locator('#launch-kit').isVisible(),true);
        await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
      }finally{await context.close();}
    });

  }finally{
    if(browser)await browser.close();
    server.kill('SIGTERM');
  }
  if(failures.length){
    console.error(failures.length+' Chromium readiness test(s) failed. '+serverLog.slice(0,300));
    process.exitCode=1;
  }else console.log('All Chromium mobile, launch and offline readiness checks passed.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
