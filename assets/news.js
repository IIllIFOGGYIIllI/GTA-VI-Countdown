/* Vice City Countdown v3.1 — approved Newswire, scoped to the News page */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
   const editorialTitleCase=value=>String(value).replace(/\b[A-Za-z][A-Za-z0-9]*(?:['’][A-Za-z]+)*/g,word=>{
 const match=word.match(/^(.+)(['’]s)$/i),base=match?match[1]:word,suffix=match?match[2].toLowerCase():'';
 if(/^(GTA|VI|PS5|PWA|PNG|API|HTML|CSS|PC|USB|DJ|AM|PM|TV|URL|IANA|NSW)$/i.test(base))return base.toUpperCase()+suffix;
 if(/[a-z][A-Z]|['’][A-Z][a-z]/.test(word))return word;
 if(/^xbox$/i.test(base))return 'Xbox'+suffix;
 if(/^youtube$/i.test(base))return 'YouTube'+suffix;
 return base[0].toUpperCase()+base.slice(1).toLowerCase()+suffix;
});

 if(!$('news-grid'))return;
  for(const b of document.querySelectorAll('.filter')) b.addEventListener('click',()=>{
    const category=b.dataset.filter;
    for(const item of document.querySelectorAll('.filter')){const active=item===b;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));}
    for(const article of document.querySelectorAll('.news-card'))article.hidden=category!=='all'&&article.dataset.category!==category;
  });

  // News is an approval-only file. GitHub Actions may create review issues,
  // but only a maintainer can publish an article through the controlled workflow.
  // Newswire uses scenic Rockstar promotional stills only, distinct from the
  // character/story images which remain locked in the optional Leonida guide.
  // Strict Spoiler Lock prevents image requests, not just their visibility.
  function officialScreenshotURL(url){
    if(typeof url!=='string')return '';
    try{
      const x=new URL(url);
      if(x.protocol!=='https:'||x.hostname!=='www.rockstargames.com'||
         !x.pathname.startsWith('/VI/_next/static/media/')||
         !/\.(?:jpe?g|webp|png)$/i.test(x.pathname))return '';
      if(!['640','800','960'].includes(x.searchParams.get('imwidth')))return '';
      return x.href;
    }catch{return '';}
  }
  const newsSpoilersLocked=()=>document.documentElement.classList.contains('vc-strict-spoilers');
  function syncNewsImages(){
    const blocked=newsSpoilersLocked();
    for(const image of document.querySelectorAll('#news-grid img.news-visual-image')){
      const parent=image.closest('.news-visual');
      if(blocked){
        image.removeAttribute('src');
        parent?.classList.remove('has-artwork');
      }else if(!image.getAttribute('src')&&image.dataset.officialImage&&!image.dataset.failed){
        image.src=image.dataset.officialImage;
      }
    }
  }
  $('kit-strict')?.addEventListener('change',syncNewsImages);
  $('kit-reset-settings')?.addEventListener('click',syncNewsImages);
  window.addEventListener('pageshow',syncNewsImages);
  document.addEventListener('vice:preferences',syncNewsImages);
  window.addEventListener('storage',syncNewsImages);
  async function refreshApprovedNews(){
    const grid=$('news-grid'),status=$('news-status'),verified=$('news-verified');
    if(!grid||!status)return;
    try{
      const response=await fetch('./data/news.json?v=3.1.0',{cache:'no-store'});
      if(!response.ok)throw Error('Approved news is unavailable');
      const feed=await response.json();
      if(!Array.isArray(feed.articles))throw Error('Invalid approved-news format');
      const safe=feed.articles.filter(a=>{
        if(!a||typeof a.title!=='string'||typeof a.summary!=='string'||typeof a.date!=='string')return false;
        if(!['launch','preload','updates'].includes(a.category)||a.title.length>130||a.summary.length>330)return false;
        try{
          const url=new URL(a.url);
          return url.protocol==='https:'&&(['rockstargames.com','www.rockstargames.com','support.rockstargames.com'].includes(url.hostname));
        }catch{return false;}
      }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
      if(!safe.length){status.textContent='No approved stories yet. New candidates are reviewed before publishing.';return;}
      const fragment=document.createDocumentFragment();
      safe.forEach((item,i)=>{
        const card=document.createElement('article');card.className='news-card';card.dataset.category=item.category;
        const visual=document.createElement('div');visual.className='news-visual news-visual-'+(i%3+1);visual.setAttribute('aria-hidden','true');
        const heading=document.createElement('span');heading.className='news-visual-big';heading.textContent=item.category==='preload'?'Ready':i%3===1?'19 / 11':'VI';
        const picture=officialScreenshotURL(item.image);
        if(picture){
          const img=document.createElement('img');
          img.className='news-visual-image';
          img.alt=typeof item.imageAlt==='string'&&item.imageAlt.length<150
            ?item.imageAlt:'Official Rockstar Games GTA VI promotional screenshot';
          img.loading='lazy';img.decoding='async';img.width=960;img.height=540;
          img.referrerPolicy='strict-origin-when-cross-origin';
          img.dataset.officialImage=picture;
          img.addEventListener('load',()=>{
            if(!newsSpoilersLocked()&&img.getAttribute('src'))visual.classList.add('has-artwork');
          });
          img.addEventListener('error',()=>{
            visual.classList.remove('has-artwork');img.dataset.failed='true';
            img.removeAttribute('src'); // Keep the existing attractive gradient fallback
          });
          visual.append(img);
        }
        const number=document.createElement('span');number.className='news-visual-corner';number.textContent=String(i+1).padStart(2,'0');visual.append(heading,number);
        const content=document.createElement('div');content.className='news-content';
        const metadata=document.createElement('div');metadata.className='news-meta';
        const label=document.createElement('span');label.textContent=editorialTitleCase(String(item.tag||item.category).slice(0,28));
        const published=document.createElement('time');published.dateTime=item.date;published.textContent=new Date(item.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
        metadata.append(label,published);
        const title=document.createElement('h3');title.textContent=editorialTitleCase(item.title.replace(/\.+$/,''));
        const summary=document.createElement('p');summary.textContent=item.summary;
        const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Open official source for '+item.title);link.textContent='Open Official Source ↗';
        content.append(metadata,title,summary,link);card.append(visual,content);fragment.append(card);
      });
      grid.replaceChildren(fragment);
      syncNewsImages();
      const pressed=document.querySelector('.filter.active');
      const category=pressed?.dataset.filter||'all';
      for(const article of grid.querySelectorAll('.news-card'))article.hidden=category!=='all'&&article.dataset.category!==category;
      const dateText=feed.reviewedAt&&Number.isFinite(Date.parse(feed.reviewedAt))
        ?new Date(feed.reviewedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()
        :'Date Unavailable';
      verified.textContent='✓ Editor Approved · '+dateText;
      status.textContent=safe.length+' verified updates · Official sources only · New discoveries require manual approval.';
    }catch{
      status.textContent='Offline or unable to refresh; showing the last saved, editor-approved news.';
    }
  }
  refreshApprovedNews();
  window.addEventListener('online',refreshApprovedNews);


})();
