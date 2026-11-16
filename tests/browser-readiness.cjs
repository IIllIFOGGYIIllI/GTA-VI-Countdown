/* GTA VI Countdown v3.1 — responsive, isolation, spoiler, PWA and midnight QA. */
'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const BASE='http://127.0.0.1:4173/';
const SHOTS=path.join(ROOT,'browser-screenshots');
fs.mkdirSync(SHOTS,{recursive:true});
async function ready(){
 for(let i=0;i<80;i++){try{const res=await fetch(BASE);if(res.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,150));}
 throw Error('Local preview server failed to start');
}
const failures=[];
async function runCase(name,fn){
 try{await fn();console.log('PASS '+name);}
 catch(e){failures.push(name);console.error('FAIL '+name+'\n'+(e.stack||e));}
}
async function main(){
 const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{
  cwd:ROOT,stdio:['ignore','ignore','pipe']});
 let browser,serverLog='';
 server.stderr.on('data',chunk=>{serverLog+=String(chunk).slice(0,600)});
 try{
  await ready();
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const routes=[
   ['index.html','countdown'],
   ['launch-info.html','milestones'],
   ['launch-kit.html','launch-kit'],
   ['news.html','news'],
   ['leonida-files.html','intel'],
   ['media.html','media'],
   ['app.html','app']
  ];
  for(const width of [320,375,768,1366]){
   await runCase('page isolation and responsive navigation '+width+'px',async()=>{
    const ctx=await browser.newContext({viewport:{width,height:850},timezoneId:'Australia/Sydney',
      reducedMotion:'reduce',serviceWorkers:'block'});
    try{
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     for(const [file,section] of routes){
      const response=await page.goto(BASE+file,{waitUntil:'load'});
      assert.equal(response.status(),200,file);
      const visible=await page.locator('#'+section).isVisible();
      assert.equal(visible,true,file+' has no visible primary section');
      const mainSections=await page.locator('main section[id]').evaluateAll(nodes=>nodes.map(n=>n.id));
      assert.ok(mainSections.length<=2,file+' has too many sections: '+mainSections);
      const sizes=await page.evaluate(()=>({
       document:document.documentElement.scrollWidth,viewport:innerWidth}));
      assert.ok(sizes.document<=sizes.viewport+2,'Overflow '+file+' '+JSON.stringify(sizes));
      assert.equal(await page.locator('.desktop-nav a[aria-current="page"],.site-pages-menu a[aria-current="page"]').count(),2,file);
      const title=await page.title();assert.ok(title.includes('GTA VI')||title.includes('Vice City'),file+' title');
      if(width===375)await page.screenshot({
       path:path.join(SHOTS,'v31-'+file.replace('.html','')+'-mobile.png'),fullPage:true});
     }
     if(width<=1130){
      const menu=page.locator('.site-pages-menu');
      await menu.locator('summary').click();
      assert.equal(await menu.locator('nav').isVisible(),true);
      await menu.locator('nav a[href="./news.html"]').click();
      await page.waitForURL('**/news.html');
      assert.equal(await page.locator('#news').isVisible(),true);
     }
     assert.deepEqual(errors,[],'JavaScript exceptions: '+errors.join(' | '));
    }finally{await ctx.close();}
   });
  }
  await runCase('regional midnight and background clock recovery',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},
    timezoneId:'Australia/Sydney',serviceWorkers:'block',reducedMotion:'reduce'});
   try{
    const page=await ctx.newPage();
    await page.clock.install({time:new Date('2026-11-18T12:59:58.000Z')});
    await page.goto(BASE+'index.html',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ViceCountdown);
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,false);
    await page.clock.runFor(2200);
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,true);
    assert.equal(await page.locator('#launch-state').isVisible(),true);
    assert.equal(await page.locator('#count-grid').isVisible(),false);
    const state=await page.evaluate(()=>window.ViceCountdown.getState());
    assert.equal(state.selectedZone,'Australia/Sydney');
    await page.clock.fastForward(24*60*60*1000);
    assert.ok((await page.locator('#launch-elapsed').textContent()).includes('1D'));
    await page.locator('#timezone').selectOption('America/Los_Angeles');
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,false);
   }finally{await ctx.close();}
  });
  await runCase('launch kit persists checklist and protects separate pages',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},
    timezoneId:'Australia/Sydney',acceptDownloads:true,serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'launch-kit.html',{waitUntil:'load'});
    await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
    assert.equal(await page.locator('#kit-check-items input').count(),6);
    assert.ok(await page.evaluate(()=>Number.isFinite(window.ViceCountdown.getState().release)));
    await page.locator('#kit-platform').selectOption('PS5');
    await page.locator('#kit-check-items input[data-task="preload"]').check();
    assert.equal(await page.locator('#kit-check-count').textContent(),'1 of 6 Ready');
    const dl=page.waitForEvent('download');
    await page.locator('#kit-calendar').click();
    const cal=await dl;
    assert.ok(cal.suggestedFilename().endsWith('.ics'));
    assert.ok(fs.readFileSync(await cal.path(),'utf8').includes('BEGIN:VCALENDAR'));
    await page.locator('#kit-strict').check();
    await page.goto(BASE+'leonida-files.html',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ViceOfficialIntel);
    assert.equal(await page.locator('#guide-toggle').isDisabled(),true);
    assert.equal(await page.locator('#guide-content').isVisible(),false);
    await page.goto(BASE+'media.html',{waitUntil:'load'});
    assert.equal(await page.locator('#media-toggle').isDisabled(),true);
    await page.goto(BASE+'news.html',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelectorAll('#news-grid .news-card').length===11);
    assert.equal(await page.locator('#news-grid img.news-visual-image[src]').count(),0);
    await page.goto(BASE+'launch-kit.html',{waitUntil:'load'});
    await page.locator('#kit-strict').uncheck();
    assert.equal(await page.locator('#kit-check-count').textContent(),'1 of 6 Ready');
    assert.equal(await page.locator('#kit-platform').inputValue(),'PS5');
    assert.deepEqual(errors,[]);
   }finally{await ctx.close();}
  });
  await runCase('approved news categories, source links and image fallbacks',async()=>{
   const ctx=await browser.newContext({viewport:{width:1366,height:850},serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'news.html?category=updates',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelectorAll('#news-grid .news-card').length===11);
    assert.equal(await page.locator('#news-grid .news-card:visible').count(),7);
    await page.locator('.news-tools [data-filter="preload"]').click();
    assert.equal(await page.locator('#news-grid .news-card:visible').count(),1);
    assert.equal(new URL(page.url()).searchParams.get('category'),'preload');
    assert.equal(await page.locator('#news-grid .news-card a[target="_blank"]').count(),11);
    assert.equal(await page.locator('#news-grid .news-visual img[data-official-image]').count(),11);
    assert.deepEqual(errors,[]);
   }finally{await ctx.close();}
  });
  await runCase('Leonida details loaded only after explicit reveal',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];let guideCalls=0;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().includes('/data/official-guide.json'))guideCalls++;});
    await page.goto(BASE+'leonida-files.html?category=places',{waitUntil:'load'});
    assert.equal(guideCalls,0);
    assert.equal(await page.locator('#guide-grid img').count(),0);
    await page.locator('#guide-toggle').click();
    await page.waitForFunction(()=>window.ViceOfficialIntel.getState().revealed);
    assert.equal(guideCalls,1);
    assert.equal(await page.locator('#guide-grid .vc-intel-card').count(),6);
    await page.locator('#guide-filters [data-guide-filter="characters"]').click();
    assert.equal(await page.locator('#guide-grid .vc-intel-card').count(),8);
    assert.equal(new URL(page.url()).searchParams.get('category'),'characters');
    await page.locator('#guide-hide').click();
    assert.equal(await page.locator('#guide-grid .vc-intel-card').count(),0);
    assert.equal(await page.locator('#guide-grid img').count(),0);
    assert.deepEqual(errors,[]);
   }finally{await ctx.close();}
  });
  await runCase('media gallery opt-in, filtering and keyboard navigation',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'media.html?category=Characters',{waitUntil:'load'});
    assert.equal(await page.locator('#media-content').isVisible(),false);
    await page.locator('#media-toggle').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery-grid .viewer-tile').length>0);
    assert.equal(await page.locator('#gallery-filters [data-category="Characters"]').getAttribute('aria-pressed'),'true');
    await page.locator('#gallery-grid .viewer-tile').first().click();
    assert.equal(await page.locator('#gallery-modal').evaluate(m=>m.open),true);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#gallery-modal').evaluate(m=>m.open),false);
    assert.deepEqual(errors,[]);
   }finally{await ctx.close();}
  });
  await runCase('PWA offline routes and updated shortcuts',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'allow',
    timezoneId:'Australia/Sydney'});
   try{
    const page=await ctx.newPage();
    await page.goto(BASE+'index.html',{waitUntil:'load'});
    await page.evaluate(async()=>await navigator.serviceWorker.ready);
    await page.waitForFunction(async()=>{
      const keys=await caches.keys();
      if(!keys.includes('vice-city-countdown-v21')||!navigator.serviceWorker.controller)return false;
      const cache=await caches.open('vice-city-countdown-v21');
      return !!(await cache.match('./news.html'))&&!!(await cache.match('./launch-kit.html'));
    });
    await ctx.setOffline(true);
    for(const route of ['news.html','launch-kit.html','media.html']){
     const response=await page.goto(BASE+route,{waitUntil:'domcontentloaded'});
     assert.ok(response?.ok(),route+' offline navigation failed');
     assert.equal(await page.locator('.page-lead h1').isVisible(),true);
    }
    assert.equal(await page.locator('#media-toggle').isDisabled(),false);
   }finally{await ctx.close();}
  });
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
 if(failures.length){console.error(failures.length+' readiness failure(s): '+failures.join(', '));
  console.error(serverLog.slice(0,350));process.exitCode=1;}
 else console.log('All v3.1 Chromium checks passed: responsive pages, midnight, spoilers, PWA and media.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
