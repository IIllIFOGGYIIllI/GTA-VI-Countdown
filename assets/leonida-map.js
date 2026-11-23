/* Vice City Hub — zoomable, pannable Leonida poster. No GIS claims. */
(()=>{
'use strict';
const stage=document.getElementById('leonida-map-viewport');
const img=document.getElementById('leonida-map-image');
const detail=document.getElementById('leonida-map-detail-image');
const zoomText=document.getElementById('map-zoom');
const status=document.getElementById('map-status');
const empty=document.getElementById('map-empty');
if(!stage||!img||!zoomText||!status||!empty)return;
let z=1,dx=0,dy=0,baseW=0,baseH=0,ready=false,usingFallback=false;
let detailRequested=false,detailReady=false,detailFailed=false;
const pointers=new Map();
const DETAIL_THRESHOLD=1.25;
const loadDetail=()=>{
 if(!detail||detailRequested||detailFailed||!ready)return;
 const source=detail.dataset.detailSrc;
 if(!source||!source.startsWith('./assets/posters/'))return;
 detailRequested=true;
 status.textContent='Loading High-Resolution Leonida Map…';
 detail.src=source;
};
if(detail){
 detail.addEventListener('load',()=>{
  if(!detail.naturalWidth||detail.naturalWidth<5000){detailFailed=true;return;}
  detailReady=true;
  status.textContent='High-Resolution Map Ready · Original Printable Detail';
  paint();
 });
 detail.addEventListener('error',()=>{
  detailFailed=true;detail.hidden=true;
  status.textContent='Standard Map Ready · High-Resolution Copy Unavailable';
 });
}
let lastCenter=null,lastDistance=0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fit=()=>{
 if(!ready)return;
 const iw=img.naturalWidth||1122,ih=img.naturalHeight||1536;
 const scale=Math.min((stage.clientWidth-26)/iw,(stage.clientHeight-26)/ih);
 baseW=Math.max(1,iw*scale);baseH=Math.max(1,ih*scale);
 img.style.width=baseW+'px';img.style.height=baseH+'px';
 if(detail){detail.style.width=baseW+'px';detail.style.height=baseH+'px';}
 keepInside();paint();
};
const keepInside=()=>{
 const maxX=Math.max(0,(baseW*z-stage.clientWidth)/2);
 const maxY=Math.max(0,(baseH*z-stage.clientHeight)/2);
 dx=clamp(dx,-maxX,maxX);dy=clamp(dy,-maxY,maxY);
};
const paint=()=>{
 const transform='translate(-50%,-50%) translate('+dx+'px,'+dy+'px) scale('+z+')';
 img.style.transform=transform;
 if(detail){
  detail.style.transform=transform;
  detail.hidden=!(detailReady&&z>=DETAIL_THRESHOLD);
  if(z>=DETAIL_THRESHOLD&&!detailRequested&&!detailFailed)loadDetail();
 }
 zoomText.textContent=Math.round(z*100)+'%';
 document.getElementById('map-zoom-out').disabled=z<=1.001;
 document.getElementById('map-zoom-in').disabled=z>=5.999;
};
const zoomAt=(mult,cx=stage.clientWidth/2,cy=stage.clientHeight/2)=>{
 if(!ready)return;
 const next=clamp(z*mult,1,6);
 const pivotX=cx-stage.clientWidth/2,pivotY=cy-stage.clientHeight/2;
 dx=pivotX-(pivotX-dx)*(next/z);
 dy=pivotY-(pivotY-dy)*(next/z);
 z=next;keepInside();paint();
};
const reset=()=>{z=1;dx=0;dy=0;fit();};
const pan=(x,y)=>{if(!ready)return;dx+=x;dy+=y;keepInside();paint();};
const coords=e=>{const r=stage.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
img.addEventListener('load',()=>{
 ready=true;empty.hidden=true;status.textContent='Map Ready · Zoom In For More Detail';reset();
});
img.addEventListener('error',()=>{
 if(!usingFallback){
  usingFallback=true;
  const fallback=img.dataset.fallback;
  if(fallback&&fallback.startsWith('https://')){
   status.textContent='Loading Official Poster Mirror…';
   img.src=fallback;return;
  }
 }
 ready=false;empty.hidden=false;status.textContent='Map Image Unavailable — Use Rockstar’s Official Download';
});
document.getElementById('map-zoom-in').addEventListener('click',()=>zoomAt(1.35));
document.getElementById('map-zoom-out').addEventListener('click',()=>zoomAt(1/1.35));
document.getElementById('map-reset').addEventListener('click',reset);
const fullscreen=document.getElementById('map-fullscreen');
fullscreen?.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement===stage)await document.exitFullscreen();
  else await stage.requestFullscreen();
 }catch{status.textContent='Fullscreen Unavailable In This Browser';}
});
document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement===stage?'Exit Fullscreen':'Fullscreen';requestAnimationFrame(fit);});
stage.addEventListener('wheel',e=>{
 if(!ready)return;
 e.preventDefault();
 const p=coords(e);
 zoomAt(Math.exp(-e.deltaY*.002),p.x,p.y);
},{passive:false});
stage.addEventListener('pointerdown',e=>{
 if(!ready||e.button>0)return;
 stage.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,coords(e));stage.classList.add('is-dragging');
 lastCenter=null;lastDistance=0;
});
stage.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||!ready)return;
 const next=coords(e);
 const prev=pointers.get(e.pointerId);
 pointers.set(e.pointerId,next);
 const pts=[...pointers.values()];
 if(pts.length===1){
  pan(next.x-prev.x,next.y-prev.y);
 }else if(pts.length>=2){
  const a=pts[0],b=pts[1];
  const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const distance=Math.hypot(a.x-b.x,a.y-b.y);
  if(lastCenter)pan(center.x-lastCenter.x,center.y-lastCenter.y);
  if(lastDistance>1&&distance>1)zoomAt(distance/lastDistance,center.x,center.y);
  lastCenter=center;lastDistance=distance;
 }
});
const end=e=>{
 pointers.delete(e.pointerId);
 lastCenter=null;lastDistance=0;
 if(!pointers.size)stage.classList.remove('is-dragging');
};
stage.addEventListener('pointerup',end);
stage.addEventListener('pointercancel',end);
stage.addEventListener('lostpointercapture',end);
stage.addEventListener('keydown',e=>{
 const arrows={ArrowLeft:[45,0],ArrowRight:[-45,0],ArrowUp:[0,45],ArrowDown:[0,-45]};
 if(arrows[e.key]){e.preventDefault();pan(...arrows[e.key]);}
 else if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.3);}
 else if(e.key==='-'){e.preventDefault();zoomAt(1/1.3);}
 else if(e.key==='0'){e.preventDefault();reset();}
});
window.addEventListener('resize',()=>requestAnimationFrame(fit));
if(img.complete){if(img.naturalWidth)img.dispatchEvent(new Event('load'));else img.dispatchEvent(new Event('error'));}
})();
