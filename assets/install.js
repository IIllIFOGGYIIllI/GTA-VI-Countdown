/* Vice City Countdown v3.1 — installation UI, scoped to App page */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const toast=message=>{const element=$('toast');if(element){element.textContent=message;element.hidden=false;setTimeout(()=>{element.hidden=true;},5000);}};
 if(!$('install-btn'))return;
  let deferredInstall;
  const installBtn=$('install-btn');
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;installBtn.textContent='Install the App ↗';});
  installBtn.addEventListener('click',async()=>{
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {toast('The app is already installed.');return;}
    if(deferredInstall){const prompt=deferredInstall;deferredInstall=null;prompt.prompt();try{await prompt.userChoice;}catch{} return;}
    const apple=/iPad|iPhone|iPod/.test(navigator.userAgent);
    toast(apple?'On iPhone: tap Share, then Add to Home Screen.':'Use your browser menu and choose Install app or Add to Home Screen.');
  });
  window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('Vice City Countdown installed!');});


})();
