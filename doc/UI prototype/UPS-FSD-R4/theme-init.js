(function(){
  'use strict';
  const root=document.documentElement;
  let project=root.dataset.projectId||'ups-project';
  let user=root.dataset.userId||'local-user';
  let value='light';
  const key=()=>`ups:${encodeURIComponent(project)}:${encodeURIComponent(user)}:theme`;
  function read(){try{const saved=localStorage.getItem(key());return saved==='light'||saved==='dark'?saved:'light'}catch{return 'light'}}
  function paint(){root.dataset.theme=value;const button=document.getElementById('themeSwitch');if(button){button.textContent=value==='light'?L.m847:L.m848;button.setAttribute('aria-label',value==='light'?L.m849:L.m850);button.setAttribute('aria-pressed',String(value==='dark'))}}
  window.ThemePreference={
    get value(){return value},
    set(next){value=next==='dark'?'dark':'light';try{localStorage.setItem(key(),value)}catch{}paint()},
    toggle(){this.set(value==='light'?'dark':'light')},
    setIdentity(projectId,userId){project=projectId||'ups-project';user=userId||'local-user';value=read();paint()},
    reset(){this.set('light')},
    refreshButton:paint
  };
  value=read();paint();
  document.addEventListener('DOMContentLoaded',()=>{paint();document.getElementById('themeSwitch')?.addEventListener('click',()=>window.ThemePreference.toggle())});
})();
