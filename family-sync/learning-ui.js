/* TEST-only real-profile synchronization with opt-in background updates. No automatic production migration. */
(()=>{'use strict';
const allowed=location.hostname==='hiszpanski-franka-test.pages.dev'||(['localhost','127.0.0.1'].includes(location.hostname)&&navigator.webdriver);
if(!allowed)return;
const C=window.hf37LearningCore,S=window.hf37LearningStorage,API='https://franka-family-sync-test.wisniajoker90.workers.dev',REMOTE='00000000-0000-4000-8000-000000000037';
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
const box=node('section');box.id='fs37Learning';box.style.cssText='margin-top:24px;border-top:2px solid #c9d7e6;padding-top:16px';
box.innerHTML='<h3>Postęp nauki — TEST</h3><p id="fs37LearningIdentity"></p><p>Postęp może zapisywać się automatycznie. Zmiany z drugiego urządzenia odświeżą widok dopiero na ekranie Dziś, bez przerywania ćwiczenia lub dźwięku. Używaj jednej karty aplikacji.</p><label><input id="fs37LearningConfirm" type="checkbox"> Potwierdzam pracę na kopii TEST wybranego profilu.</label><p><label><input id="fs37LearningAuto" type="checkbox"> Automatyczna synchronizacja na tym urządzeniu</label></p><div style="display:grid;gap:10px;margin-top:12px"><button id="fs37LearningPublish" type="button">Udostępnij wybrany profil — punkt startowy</button><button id="fs37LearningDownload" type="button">Pobierz wspólny profil jako nowy</button><button id="fs37LearningSync" type="button">Synchronizuj postęp nauki</button><button id="fs37LearningHistory" type="button">Kopie poprzednich wersji</button></div><p id="fs37LearningStatus" role="status"></p><div id="fs37LearningVersions"></div>';
const host=document.querySelector('#fs37Linked');if(!host)return;host.append(box);
const $=id=>document.getElementById('fs37Learning'+id),meta=()=>window.hfProfiles19.getMeta(),active=()=>meta().active,key=id=>'hf37:learning:'+id;
let busy=false,waitingForHome=false,autoBlocked=false,failures=0,nextAuto=Date.now()+2000,lastInteraction=Date.now();
const autoKey=id=>'hf37:auto:'+id;
const autoEnabled=()=>localStorage.getItem(autoKey(active()))==='1'&&!!readState(active());
const homeStatus=node('p');homeStatus.id='fs37AutoStatus';homeStatus.setAttribute('role','status');homeStatus.style.cssText='font-size:14px;padding:8px 12px;color:#34546b';(document.getElementById('s15Today')||document.body).append(homeStatus);
function autoLabel(text){homeStatus.hidden=!readState(active());homeStatus.textContent=text;}
function visible(el){return !!el&&!el.hidden&&el.getClientRects().length>0;}
function safeToRefresh(){
 if(document.hidden||Date.now()-lastInteraction<2000||!visible(document.getElementById('s15Today')))return false;
 if(window.hfCar26?.isRunning?.()||window.hf27bAudio?.owner||window.speechSynthesis?.speaking||window.speechSynthesis?.pending)return false;
 if([...document.querySelectorAll('#s15DailyDetails[open],#s15CoachDetails[open],#s13ExamDetails[open]')].some(visible))return false;
 if([...document.querySelectorAll('[role="dialog"],#hf202Shade,#s39Shade,#hf192Shade')].some(visible))return false;
 return true;
}
function schedule(delay=2000){if(autoEnabled()&&!autoBlocked)nextAuto=Math.min(nextAuto,Date.now()+delay);}
for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{lastInteraction=Date.now();},true);

function status(t){$('Status').textContent=t;}
function refresh(){$('Auto').checked=autoEnabled();const m=meta(),p=m.profiles.find(x=>x.id===m.active),s=JSON.parse(localStorage.getItem(key(m.active))||'null');$('Identity').textContent='Wybrany profil: '+p.name+(s?' · połączony · wersja '+(s.revision||'startowa'):' · jeszcze niepołączony');}
function credentials(){const p=JSON.parse(localStorage.getItem('family-sync-pilot37')||'null');if(!p?.token)throw Error('Najpierw połącz urządzenie przez Family Sync.');return p;}
async function request(path,method='GET',data){const token=credentials().token,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(API+path,{method,headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:controller.signal,cache:'no-store',credentials:'omit'});const v=await r.json();if(!r.ok){const e=Error(r.status===401?'Brak dostępu. Ponownie połącz urządzenie.':r.status===403?'Ta operacja wymaga dostępu rodzica.':v.error);e.status=r.status;throw e;}return v;}finally{clearTimeout(timer)}}
function readState(id){return JSON.parse(localStorage.getItem(key(id))||'null');}
function saveState(id,s){localStorage.setItem(key(id),JSON.stringify(s));}
function readRemote(r){if(r.snapshot?.schema!==1||r.snapshot.data?.kind!=='learning-v1'||!Array.isArray(r.snapshot.data.applied))throw Error('Serwer nie zawiera obsługiwanego profilu nauki.');C.validate(r.snapshot.data.records);return r;}
function ensureActive(id){if(active()!==id)throw Error('Profil zmienił się. Otwórz ponownie panel.');}
function exportBackup(records,name){return {format:'hiszpanski-franka-backup',schema:2,appVersion:'family-sync-test-4',exportedAt:new Date().toISOString(),profiles:[{id:'franek-sync',name}],active:'franek-sync',data:{'franek-sync':records}};}
function apply(id,records,state){ensureActive(id);const before=window.frankaStore.dump(),updates={};for(const[k,v]of Object.entries(C.materialize(records,before)))updates['hf18:p:'+id+':'+k]=v;updates['hf37:last-backup:'+id]=JSON.stringify(exportBackup(before,meta().profiles.find(p=>p.id===id).name));updates[key(id)]=JSON.stringify(state);S.commit(localStorage,updates);location.reload();}
async function sync(id,options={}){ensureActive(id);let state=readState(id);if(!state)throw Error('Najpierw udostępnij profil lub pobierz go na to urządzenie.');
for(let round=0;round<5;round++){
 ensureActive(id);const current=C.shared(window.frankaStore.dump());
 if(!state.pending){state={...state,pending:{id:crypto.randomUUID(),before:state.base,after:current}};saveState(id,state);}
 const pending=state.pending;let remote=readRemote(await request('/v1/profiles/'+REMOTE));
 if(!remote.snapshot.data.applied.includes(pending.id)&&!C.same(pending.before,pending.after)){
  const merged=C.merge(pending.before,pending.after,remote.snapshot.data.records),snap={schema:1,data:{...remote.snapshot.data,records:merged,applied:[...remote.snapshot.data.applied,pending.id]}};
  try{const r=await request('/v1/profiles/'+REMOTE,'PUT',{baseRevision:remote.revision,snapshot:snap});remote={...remote,revision:r.revision,snapshot:snap};}catch(e){if(e.status===409)continue;throw e;}
 }
 ensureActive(id);const now=C.shared(window.frankaStore.dump());
 if(!C.same(now,pending.after)){state={...state,pending:{id:crypto.randomUUID(),before:pending.after,after:now}};saveState(id,state);continue;}
 const finalState={remoteId:REMOTE,base:remote.snapshot.data.records,revision:remote.revision,pending:null,lastSync:Date.now()};
 if(options.automatic){
  if(!autoEnabled())return;
  if(C.same(now,remote.snapshot.data.records)){saveState(id,finalState);waitingForHome=false;autoLabel('Zapisano · postęp zsynchronizowany');status('Postęp zapisany automatycznie.');return;}
  if(!safeToRefresh()){waitingForHome=true;autoLabel('Twój postęp wysłany · zmiany z drugiego urządzenia pokażemy po powrocie na Dziś');status('Zmiany są pobrane. Widok odświeży się automatycznie na ekranie Dziś.');return;}
 }
 waitingForHome=false;apply(id,remote.snapshot.data.records,finalState);return;
}
throw Error('Pojawiły się kolejne zmiany. Zostały zachowane; ponów synchronizację.');}
async function action(fn,confirmRequired=true,automatic=false){if(busy)return;if(confirmRequired&&!$('Confirm').checked){status('Potwierdź pracę na kopii TEST.');return;}if(!navigator.onLine){autoLabel('Czeka na internet · postęp zapisany na urządzeniu');status('Brak internetu. Nauka jest zapisana lokalnie. Synchronizuj po odzyskaniu połączenia.');return;}if(!navigator.locks){autoBlocked=true;autoLabel('Wymaga uwagi rodzica · zaktualizuj przeglądarkę');status('Ta przeglądarka nie obsługuje bezpiecznej blokady synchronizacji. Zaktualizuj przeglądarkę.');return;}busy=true;for(const b of box.querySelectorAll('button'))b.disabled=true;status('Sprawdzam i zapisuję kopię…');try{await navigator.locks.request('hf37-learning',{ifAvailable:true},async lock=>{if(!lock){if(automatic){nextAuto=Date.now()+3000;return;}throw Error('Synchronizacja trwa w innej karcie.');}const health=await request('/health');if(!health.learningProfiles||!health.versionHistory)throw Error('Zaktualizuj Worker TEST do family-sync-test-4.');await fn();failures=0;autoBlocked=false;});}catch(e){if(automatic){failures++;if([401,403,413].includes(e.status)||(!['AbortError','TypeError'].includes(e.name)&&!e.status&&!e.message.startsWith('Pojawiły się kolejne zmiany')))autoBlocked=true;autoLabel(autoBlocked?'Wymaga uwagi rodzica · szczegóły w Family Sync':'Czeka na połączenie · postęp zapisany na urządzeniu');nextAuto=Date.now()+Math.min(120000,15000*2**Math.min(failures,3));}status(e.name==='AbortError'||e instanceof TypeError?'Nie udało się połączyć. Dane lokalne i próba synchronizacji są zachowane. Spróbuj ponownie.':e.message);}finally{busy=false;for(const b of box.querySelectorAll('button'))b.disabled=false;refresh();}}
$('Publish').onclick=()=>action(async()=>{
 const id=active();if(readState(id)){await sync(id);return;}
 const me=await request('/v1/me');if(me.device.role!=='parent')throw Error('Punkt startowy wybiera rodzic.');
 const initKey='hf37:init:'+id;let attempt=JSON.parse(localStorage.getItem(initKey)||'null');
 if(!attempt){try{await request('/v1/profiles/'+REMOTE);throw Error('Wspólny profil już istnieje. Użyj „Pobierz wspólny profil jako nowy”.');}catch(e){if(e.status!==404)throw e;}
 ensureActive(id);attempt={originId:crypto.randomUUID(),records:C.shared(window.frankaStore.dump()),name:meta().profiles.find(p=>p.id===id).name};localStorage.setItem(initKey,JSON.stringify(attempt));}
 await request('/v1/learning','POST',{name:attempt.name,snapshot:{schema:1,data:{kind:'learning-v1',originId:attempt.originId,records:attempt.records,applied:[]}}});
 const remote=readRemote(await request('/v1/profiles/'+REMOTE));if(remote.snapshot.data.originId!==attempt.originId)throw Error('Profil został wcześniej utworzony na innym urządzeniu. Pobierz go jako nowy profil.');
 ensureActive(id);saveState(id,{remoteId:REMOTE,base:attempt.records,revision:1,pending:null});localStorage.removeItem(initKey);await sync(id);
});
$('Download').onclick=()=>action(async()=>{
 const sourceId=active(),remote=readRemote(await request('/v1/profiles/'+REMOTE));ensureActive(sourceId);const m=meta();
 const existing=m.profiles.find(p=>readState(p.id)?.remoteId===REMOTE);if(existing)throw Error('Ten profil jest już na urządzeniu: '+existing.name+'. Wybierz go i synchronizuj.');
 if(m.profiles.length>=12)throw Error('Osiągnięto limit profili. Nie usuwamy istniejących danych.');
 const id='sync-'+crypto.randomUUID(),records=C.materialize(remote.snapshot.data.records),updates={};for(const[k,v]of Object.entries(records))updates['hf18:p:'+id+':'+k]=v;
 updates[key(id)]=JSON.stringify({remoteId:REMOTE,base:remote.snapshot.data.records,revision:remote.revision,pending:null,lastSync:Date.now()});
 updates['hf18:meta']=JSON.stringify({...m,active:id,profiles:[...m.profiles,{id,name:remote.name+' · Sync TEST',createdAt:new Date().toISOString()}]});S.commit(localStorage,updates);location.reload();
});
$('Sync').onclick=()=>action(()=>sync(active()));
$('History').onclick=()=>action(async()=>{const list=$('Versions');list.replaceChildren();const result=await request('/v1/profiles/'+REMOTE+'/history');if(!result.versions.length){status('Nie ma jeszcze wcześniejszych wersji. Kopia powstanie przy pierwszej zmianie wspólnego postępu.');return;}for(const v of result.versions){const button=node('button','Pobierz kopię wersji '+v.revision);button.onclick=()=>action(async()=>{const r=readRemote(await request('/v1/profiles/'+REMOTE+'/history/'+v.revision)),blob=new Blob([JSON.stringify(exportBackup(C.materialize(r.snapshot.data.records),'Franek — kopia wersji '+v.revision),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='hiszpanski-franka-sync-kopia-'+v.revision+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status('Pobrano kopię. Jej import doda nowy profil.');},false);list.append(button);}status('Poprzednie wersje można pobrać bez zmiany bieżących danych.');},false);
$('Auto').onchange=()=>{
 const enabled=$('Auto').checked;
 if(enabled&&!readState(active())){$('Auto').checked=false;status('Najpierw połącz profil nauki.');return;}
 localStorage.setItem(autoKey(active()),enabled?'1':'0');autoBlocked=false;failures=0;nextAuto=Date.now()+1000;
 autoLabel(enabled?'Sprawdzam zapis postępu…':'Synchronizacja ręczna');status(enabled?'Automatyczna synchronizacja włączona dla tego profilu i urządzenia.':'Automatyczna synchronizacja wyłączona.');
};
// Observe successful profile writes only. Failed local saves must not be reported as synced.
for(const method of ['setItem','removeItem']){const original=window.frankaStore[method];window.frankaStore[method]=function(...args){const result=original.apply(this,args);if(autoEnabled()){autoLabel(navigator.onLine?'Zapisano na urządzeniu · czeka na synchronizację':'Czeka na internet · postęp zapisany na urządzeniu');schedule();}return result;};}
window.addEventListener('online',()=>schedule(500));
window.addEventListener('offline',()=>{if(autoEnabled())autoLabel('Czeka na internet · postęp zapisany na urządzeniu');});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(1000);});
window.addEventListener('pageshow',()=>schedule(1000));
window.addEventListener('storage',e=>{if(e.key===autoKey(active())){refresh();schedule(1000);}});
setInterval(()=>{
 if(!autoEnabled()||autoBlocked||busy||document.hidden)return;
 if(!navigator.onLine){autoLabel('Czeka na internet · postęp zapisany na urządzeniu');return;}
 if(Date.now()<nextAuto&&!(waitingForHome&&safeToRefresh()))return;
 nextAuto=Date.now()+15000;
 action(()=>sync(active(),{automatic:true}),false,true);
},1000);
document.getElementById('fs37Launch')?.addEventListener('click',refresh);refresh();autoLabel(autoEnabled()?'Sprawdzam zapis postępu…':'Synchronizacja ręczna');
})();
