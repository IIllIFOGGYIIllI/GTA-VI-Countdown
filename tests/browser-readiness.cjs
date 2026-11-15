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
