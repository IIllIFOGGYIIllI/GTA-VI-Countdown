/* GTA VI Countdown v3.8 — responsive, isolation, spoiler, PWA and midnight QA. */
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
   ['after-launch.html','after-launch'],
   ['news.html','news'],
   ['leonida-files.html','intel'],
   ['vice-city-history.html','history'],
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
      assert.ok(file==='vice-city-history.html'?mainSections.length===10:(file==='after-launch.html'?mainSections.length===4:mainSections.length<=3),file+' has unexpected sections: '+mainSections);
      const sizes=await page.evaluate(()=>({
       document:document.documentElement.scrollWidth,viewport:innerWidth}));
      if(sizes.document>sizes.viewport+2){
       const bounds=await page.evaluate(()=>['.vh-years','.vh-timeline','#history-timeline','.vh-stat-strip','.vh-vehicles','.vh-culture','.vh-hero-grid','.vh-main']
         .map(selector=>{const el=document.querySelector(selector),r=el?.getBoundingClientRect();
          return {selector,left:Math.round(r?.left||0),right:Math.round(r?.right||0),width:Math.round(r?.width||0),scroll:el?.scrollWidth};}));
       const culprits=await page.evaluate(()=>[...document.querySelectorAll('body *')]
         .filter(el=>{const r=el.getBoundingClientRect();return !el.closest('.vh-years') && r.right>innerWidth+2 && r.width>0;})
         .slice(0,10).map(el=>({tag:el.tagName,classes:String(el.className).slice(0,70),right:Math.round(el.getBoundingClientRect().right)})));
       throw Error('Overflow '+file+' '+JSON.stringify(sizes)+' '+JSON.stringify(bounds)+' '+JSON.stringify(culprits));
      }
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
    assert.equal(await page.evaluate(()=>window.VicePageRouter.isLaunchProtected()),true);
    assert.equal(await page.locator('#vc-cinema-preview').count(),0);
    assert.equal(await page.locator('#vc-cinema-sim-controls').count(),0);
    assert.equal(await page.locator('#vc-cinema-restart').count(),0);
    assert.equal((await page.evaluate(()=>window.ViceCinematicLaunch.getState())).mode,'real');
    assert.equal(await page.locator('#vc-cinema').isVisible(),true);
    await page.clock.runFor(2200);
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,true);
    assert.equal(await page.evaluate(()=>window.VicePageRouter.isLaunchProtected()),true);
    assert.equal(await page.locator('#vc-cinema-welcome').isVisible(),true);
    assert.equal(await page.locator('#launch-state').isVisible(),true);
    assert.equal(await page.locator('#count-grid').isVisible(),false);
    const state=await page.evaluate(()=>window.ViceCountdown.getState());
    assert.equal(state.selectedZone,'Australia/Sydney');
    // At Sydney midnight, Los Angeles is still waiting for its own midnight.
    await page.locator('#timezone').selectOption('America/Los_Angeles');
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,false);
    await page.locator('#timezone').selectOption('Australia/Sydney');
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,true);
    // Moving ahead a full day must refresh elapsed time without 345,600 timer ticks.
    await page.clock.fastForward(24*60*60*1000);
    assert.ok((await page.locator('#launch-elapsed').textContent()).includes('1D'));
    // Switching the selected region already closed the cinema; the guard
    // should be inactive well after launch without clicking a hidden Exit.
    assert.equal(await page.evaluate(()=>window.VicePageRouter.isLaunchProtected()),false);
   }finally{await ctx.close();}
  });
  await runCase('late arrival still sees midnight welcome and can reopen it',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},
    timezoneId:'Australia/Sydney',reducedMotion:'reduce',serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-11-18T13:00:25.000Z')});
    await page.goto(BASE+'index.html',{waitUntil:'load'});
    await page.waitForFunction(()=>window.ViceCinematicLaunch?.getState().phase==='launched');
    assert.equal((await page.evaluate(()=>window.ViceCountdown.getState())).launched,true);
    assert.equal(await page.locator('#vc-cinema-welcome').isVisible(),true);
    assert.equal(await page.locator('#vc-cinema-preview').count(),0);
    await page.locator('#vc-cinema-close').click();
    assert.equal(await page.locator('#vc-cinema-reopen').isVisible(),true);
    assert.ok((await page.locator('#vc-cinema-reopen').textContent()).includes('View Welcome Screen'));
    await page.locator('#vc-cinema-reopen').click();
    assert.equal(await page.locator('#vc-cinema-welcome').isVisible(),true);
    assert.equal((await page.evaluate(()=>window.ViceCinematicLaunch.getState())).mode,'real');
    await page.locator('#vc-cinema-close').click();
    await page.clock.fastForward(12*60*1000);
    assert.equal(await page.locator('#vc-cinema-reopen').isVisible(),true);
    assert.deepEqual(errors,[]);
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
  await runCase('Vice City history timeline, radio and opt-in comparison',async()=>{
   const ctx=await browser.newContext({viewport:{width:375,height:812},
    timezoneId:'Australia/Sydney',serviceWorkers:'block',reducedMotion:'reduce'});
   try{
    const page=await ctx.newPage(),errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(request.url().includes('/VI/_next/static/media/Vice_City_'))requests.push(request.url());});
    await page.goto(BASE+'vice-city-history.html',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ViceHistory);
    assert.equal(await page.locator('[data-vh-era]:visible').count(),1);
    await page.locator('[data-vh-year="1997"]').click();
    assert.equal(await page.locator('[data-vh-era="1997"]').isVisible(),true);
    await page.locator('[data-vh-year="2012"]').click();
    assert.equal(await page.locator('[data-vh-era="2012"]').isVisible(),true);
    await page.locator('[data-vh-year="2006"]').click();
    assert.equal(await page.locator('[data-vh-era="2006"]').isVisible(),true);
    await page.locator('[data-vh-station="vrock"]').click();
    assert.equal(await page.locator('#vh-radio-name').textContent(),'V-Rock');
    // Archive filters and gallery remain accessible without the modern reveal.
    assert.equal(await page.locator('[data-vh-place]').count(),12);
    assert.equal(await page.locator('[data-vh-vehicle]').count(),12);
    assert.equal(await page.locator('[data-vh-gallery-index]').count(),8);
    assert.equal(await page.locator('.vh-place .vh-open-art img').count(),12);
    assert.equal(await page.locator('.vh-people .vh-open-art img').count(),4);
    assert.equal(await page.locator('.vh-vehicle-card .vh-open-art img').count(),12);
    assert.equal(await page.locator('.vh-era-photo img').count(),5);
    await page.locator('.vh-place .vh-open-art').first().click();
    assert.equal(await page.locator('#vh-visual-dialog').evaluate(el=>el.open),true);
    assert.ok((await page.locator('#vh-visual-image').getAttribute('src')).includes('OceanBeach'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#vh-visual-dialog').evaluate(el=>el.open),false);
    await page.locator('.vh-vehicle-card .vh-open-art').first().click();
    assert.ok((await page.locator('#vh-visual-image').getAttribute('src')).includes('infernus.webp'));
    await page.keyboard.press('Escape');
    await page.locator('[data-vh-year="2026"]').click();
    assert.equal(await page.locator('#vh-era-2026-image').getAttribute('src'),null);
    assert.equal(requests.length,0,'GTA VI images loaded without an explicit reveal');
    await page.locator('#vh-era-show-image').click();
    assert.ok((await page.locator('#vh-era-2026-image').getAttribute('src')).includes('Vice_City_01'));
    await page.locator('#vh-era-show-image').click();
    assert.equal(await page.locator('#vh-era-2026-image').getAttribute('src'),null);
    await page.locator('[data-vh-year="2006"]').click();
    await page.locator('[data-vh-station="wave"]').click();
    assert.ok((await page.locator('#vh-radio-art').getAttribute('src')).includes('Adam_Fist_Wave'));
    await page.locator('[data-vh-station="vrock"]').click();
    await page.locator('[data-vh-place-filter="nightlife"]').click();
    assert.equal(await page.locator('[data-vh-place]:visible').count(),2);
    await page.locator('[data-vh-place-filter="all"]').click();
    assert.equal(await page.locator('[data-vh-place]:visible').count(),12);
    await page.locator('[data-vh-vehicle-filter="bikes"]').click();
    assert.equal(await page.locator('[data-vh-vehicle]:visible').count(),3);
    await page.locator('[data-vh-vehicle-filter="all"]').click();
    assert.equal(await page.locator('[data-vh-vehicle]:visible').count(),12);
    await page.locator('[data-vh-gallery-index="0"]').click();
    assert.equal(await page.locator('#vh-gallery-dialog').evaluate(el=>el.open),true);
    assert.ok((await page.locator('#vh-gallery-full').getAttribute('src')).includes('ps2-23'));
    await page.keyboard.press('ArrowRight');
    assert.ok((await page.locator('#vh-gallery-full').getAttribute('src')).includes('ps2-01'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#vh-gallery-dialog').evaluate(el=>el.open),false);
    await page.locator('[data-vh-memory="0"]').check();
    await page.locator('[data-vh-memory="4"]').check();
    assert.equal(await page.locator('#vh-memory-count').textContent(),'2 / 8 Memories');
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ViceHistory);
    assert.equal(await page.locator('[data-vh-memory="0"]').isChecked(),true);
    assert.equal(await page.locator('[data-vh-memory="4"]').isChecked(),true);
    await page.locator('#vh-memory-reset').click();
    assert.equal(await page.locator('#vh-memory-count').textContent(),'0 / 8 Memories');
    assert.ok(requests.length>=1,'The deliberately revealed timeline screenshot was never requested');
    await page.locator('[data-vh-compare="cars"]').click();
    assert.ok((await page.locator('#vh-then-image').getAttribute('src')).includes('ps2-09'));
    await page.locator('[data-vh-compare="city"]').click();
    assert.equal(await page.locator('#vh-preview-overlay').isVisible(),true);
    assert.equal(await page.locator('#vh-compare-reveal-inline').isVisible(),true);
    assert.equal(await page.locator('#vh-modern-image').getAttribute('src'),null);
    await page.locator('#vh-compare-reveal-inline').click();
    assert.equal((await page.evaluate(()=>window.ViceHistory.getState())).revealed,true);
    assert.equal(await page.locator('#vh-preview-overlay').isVisible(),false);
    assert.ok((await page.locator('#vh-modern-image').getAttribute('src')).includes('Vice_City_03'));
    await page.locator('[data-vh-compare="water"]').click();
    assert.ok((await page.locator('#vh-modern-image').getAttribute('src')).includes('Vice_City_05'));
    await page.locator('#vh-compare-reveal').click();
    assert.equal(await page.locator('#vh-modern-image').getAttribute('src'),null);
    await page.goto(BASE+'launch-kit.html',{waitUntil:'load'});
    await page.waitForFunction(()=>document.body.classList.contains('vc-launch-kit-ready'));
    await page.locator('#kit-strict').check();
    await page.goto(BASE+'vice-city-history.html',{waitUntil:'load'});
    assert.equal(await page.locator('#vh-compare-reveal').isDisabled(),true);
    assert.equal(await page.locator('#vh-compare-reveal-inline').isDisabled(),true);
    assert.equal(await page.locator('#vh-era-show-image').isDisabled(),true);
    assert.equal(await page.locator('#vh-era-2026-image').getAttribute('src'),null);
    assert.equal(await page.locator('#vh-modern-image').getAttribute('src'),null);
    assert.deepEqual(errors,[],'History page JavaScript errors');
   }finally{await ctx.close();}
  });
  await runCase('OBS Starting Soon, Countdown and Ending in 1920x1080 and scaled previews',async()=>{
   const browserSizes=[[1920,1080],[1280,720],[854,480]];
   for(const [width,height] of browserSizes){
    const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',
      timezoneId:'Australia/Sydney',reducedMotion:'reduce'});
    try{
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     for(const scene of ['starting','countdown','ending']){
      const res=await page.goto(BASE+'obs/'+scene+'.html',{waitUntil:'load'});
      assert.equal(res.status(),200,scene+' page status');
      await page.waitForFunction(()=>!!window.OBSLaunchScenes);
      assert.equal(await page.evaluate(()=>window.OBSLaunchScenes.scene),scene);
      const bounds=await page.evaluate(()=>{
       const rect=document.getElementById('scene').getBoundingClientRect();
       return {left:rect.left,top:rect.top,width:rect.width,height:rect.height,
        overflow:document.documentElement.scrollWidth>innerWidth+1
        ||document.documentElement.scrollHeight>innerHeight+1};
      });
      assert.ok(!bounds.overflow,scene+' should never scroll');
      assert.ok(bounds.width<=width+1&&bounds.height<=height+1,scene+' scales to source size');
      assert.ok(bounds.width>width*.9&&bounds.height>height*.9,scene+' fills display');
      if(width===1920){
       const layout=await page.evaluate(()=>{
        const rect=selector=>{const b=document.querySelector(selector).getBoundingClientRect();
          return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,centerX:(b.left+b.right)/2};};
        return {content:rect('.content'),regions:rect('.region-status-board'),
          footer:rect('.scene-footer'),scene:rect('#scene')};
       });
       assert.ok(Math.abs(layout.content.centerX-960)<7,scene+' content centred');
       assert.ok(Math.abs(layout.regions.centerX-960)<7,scene+' release board centred');
       assert.ok(layout.content.bottom<layout.footer.top+1,scene+' content above footer');
       assert.ok(layout.regions.bottom<layout.content.top+10,scene+' region status clear of headline');
      }
      if(width===1920)await page.screenshot({
       path:path.join(SHOTS,'obs-'+scene+'-1920x1080.png'),fullPage:false});
     }
     assert.deepEqual(errors,[],'OBS scene JS exceptions');
    }finally{await ctx.close();}
   }
  });
  await runCase('OBS NZ and NSW release windows show correct live status',async()=>{
   const ctx=await browser.newContext({viewport:{width:1920,height:1080},
    timezoneId:'Pacific/Auckland',reducedMotion:'reduce',serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.clock.install({time:new Date('2026-11-18T10:59:58.000Z')});
    await page.goto(BASE+'obs/starting.html',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.OBSLaunchScenes);
    assert.equal(await page.locator('#obs-region-nz').getAttribute('data-status'),'upcoming');
    assert.equal(await page.locator('#obs-region-au').getAttribute('data-status'),'upcoming');
    assert.ok((await page.locator('#obs-nz-status').textContent()).includes('TO GO'));
    await page.clock.runFor(2200);
    assert.equal(await page.locator('#obs-nz-status').textContent(),'LIVE NOW');
    assert.equal(await page.locator('#obs-region-nz').getAttribute('data-status'),'live');
    assert.equal(await page.locator('#obs-region-au').getAttribute('data-status'),'upcoming');
    await page.clock.fastForward(2*60*60*1000);
    assert.equal(await page.locator('#obs-au-status').textContent(),'LIVE NOW');
    assert.equal(await page.locator('#obs-region-au').getAttribute('data-status'),'live');
    await page.goto(BASE+'obs/ending.html',{waitUntil:'load'});
    assert.equal(await page.locator('#obs-nz-status').textContent(),'LIVE NOW');
    assert.equal(await page.locator('#obs-au-status').textContent(),'LIVE NOW');
    assert.deepEqual(errors,[]);
   }finally{await ctx.close();}
  });
  await runCase('OBS Sydney midnight accuracy and launched state',async()=>{
   const ctx=await browser.newContext({viewport:{width:1920,height:1080},
    timezoneId:'Pacific/Auckland',reducedMotion:'reduce',serviceWorkers:'block'});
   try{
    const page=await ctx.newPage();
    await page.clock.install({time:new Date('2026-11-18T12:59:58.000Z')});
    await page.goto(BASE+'obs/countdown.html',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.OBSLaunchScenes);
    assert.equal(await page.evaluate(()=>window.OBSLaunchScenes.getState().launched),false);
    assert.equal(await page.locator('#obs-hours').textContent(),'00');
    assert.equal(await page.locator('#obs-minutes').textContent(),'00');
    assert.ok(['02','01'].includes(await page.locator('#obs-seconds').textContent()));
    await page.clock.runFor(2200);
    assert.equal(await page.evaluate(()=>window.OBSLaunchScenes.getState().launched),true);
    assert.equal(await page.locator('#obs-launched').isVisible(),true);
    assert.equal(await page.locator('.countdown-tiles').isVisible(),false);
    assert.equal(await page.locator('#obs-launched').isVisible(),true);
    assert.equal(await page.locator('canvas').count(),0);
    const launchText=await page.locator('.launch-message strong').textContent();
    assert.ok(launchText.includes('WELCOME TO')&&launchText.includes('VICE CITY'));
    await page.goto(BASE+'obs/starting.html',{waitUntil:'load'});
    assert.equal(await page.locator('#obs-start-remaining').textContent(),'THE WAIT IS OVER');
   }finally{await ctx.close();}
  });
  await runCase('OBS transparent overlay and live scene styling',async()=>{
   const ctx=await browser.newContext({viewport:{width:1920,height:1080},
    serviceWorkers:'block'});
   try{
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'obs/countdown.html?overlay=1&channel=FOGGY',{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.OBSLaunchScenes);
    const state=await page.evaluate(()=>({
     overlay:window.OBSLaunchScenes.overlay,
     body:document.body.classList.contains('is-overlay'),
     sceneBackground:getComputedStyle(document.querySelector('.scene')).backgroundColor,
     background:getComputedStyle(document.querySelector('.background')).display,
     channel:document.getElementById('obs-footer-right').textContent
    }));
    assert.equal(state.overlay,true);
    assert.equal(state.body,true);
    assert.equal(state.sceneBackground,'rgba(0, 0, 0, 0)');
    assert.equal(state.background,'none');
    assert.ok(state.channel.includes('FOGGY'));
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
      if(!keys.includes('vice-city-countdown-v36')||!navigator.serviceWorker.controller)return false;
      const cache=await caches.open('vice-city-countdown-v36');
      return !!(await cache.match('./news.html'))&&!!(await cache.match('./launch-kit.html'));
    });
    await ctx.setOffline(true);
    for(const route of ['news.html','launch-kit.html','media.html','vice-city-history.html']){
     const response=await page.goto(BASE+route,{waitUntil:'domcontentloaded'});
     assert.ok(response?.ok(),route+' offline navigation failed');
     assert.equal(await page.locator(route==='vice-city-history.html'?'#vh-title':'.page-lead h1').isVisible(),true);
    }
    assert.equal(await page.locator('[data-vh-year="2002"]').count(),1);
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
