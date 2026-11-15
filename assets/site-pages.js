/* URL-addressable news, media and opt-in Leonida categories. */
(()=>{
 'use strict';
 const page=document.body.dataset.page||'home';
 const map={
  home:'./index.html', 'launch-info':'./launch-info.html','launch-kit':'./launch-kit.html',
  news:'./news.html','leonida-files':'./leonida-files.html',media:'./media.html',app:'./app.html'
 };
 document.querySelectorAll('.desktop-nav a,.site-pages-menu a,.mobile-tabbar a').forEach(link=>{
  const url=new URL(link.getAttribute('href'),location.href);
  const own=new URL(map[page]||map.home,location.href);
  if(url.pathname===own.pathname)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
 });
 // Give each category a stable, shareable address without bypassing spoiler gates.
 const category=new URLSearchParams(location.search).get('category');
 const categories={
  news:{selector:'#news .filter[data-filter]',values:['all','launch','preload','updates'],attr:'filter'},
  media:{selector:'#gallery-filters button[data-category]',values:['All','Vice City','Characters','Leonida Keys','Port Gellhorn','Grassrivers','Ambrosia','Mount Kalaga'],attr:'category'},
  'leonida-files':{selector:'#guide-filters button[data-guide-filter]',values:['all','story','characters','places','world'],attr:'guideFilter'}
 };
 const config=categories[page];
 const selected=config?.values.includes(category)?category:null;
 if(config&&selected&&page!=='leonida-files'){
   const button=[...document.querySelectorAll(config.selector)].find(b=>b.dataset[config.attr]===selected);
   button?.click();
 }
 if(config){
   const box=document.querySelector(page==='news'?'.news-tools':page==='media'?'#gallery-filters':'#guide-filters');
   box?.addEventListener('click',event=>{
     const control=event.target.closest(config.selector.split(' ').pop());
     if(!control)return;
     const next=control.dataset[config.attr];
     if(!config.values.includes(next))return;
     const url=new URL(location.href);
     if(next==='all'||next==='All')url.searchParams.delete('category');
     else url.searchParams.set('category',next);
     history.replaceState({},'',url);
   });
 }
 window.VicePageRouter=Object.freeze({page,getCategory:()=>new URLSearchParams(location.search).get('category')||'all'});
})();
