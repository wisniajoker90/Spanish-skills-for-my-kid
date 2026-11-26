// Build a reviewable production candidate. Never deploys or changes root index.html.
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const out=path.resolve(root,process.argv[2]||'family-sync/production/candidate');
if(out===root)throw Error('Refusing to overwrite the live entry point');
mkdirSync(out,{recursive:true});
const read=p=>readFileSync(path.join(root,p),'utf8');
function replace(s,a,b){if(!s.includes(a))throw Error('Build anchor missing: '+a.slice(0,100));return s.replace(a,b);}
const testHost='franka-family-sync-test.wisniajoker90.workers.dev',prodHost='franka-family-sync.wisniajoker90.workers.dev';
const prodUrl='https://wisniajoker90.github.io/Spanish-skills-for-my-kid/';
let worker=read('family-sync/worker.mjs');
worker=worker.replaceAll(testHost,prodHost).replaceAll('https://hiszpanski-franka-test.pages.dev','https://wisniajoker90.github.io').replaceAll('family-sync-test-4','family-sync-production-1').replaceAll("'family-test'","'family-production'").replaceAll("service: 'franka-family-sync-test'","service: 'franka-family-sync'").replaceAll("'test_host_only'","'host_not_allowed'");
worker=replace(worker,'syncEnabled: false','syncEnabled: env.SYNC_ENABLED === \'true\'');
worker=replace(worker,"  if (path === '/v1/setup'", "  if (env.SYNC_ENABLED !== 'true') fail(503, 'sync_disabled');\n  if (path === '/v1/setup'");
worker=replace(worker,'// Family Sync TEST backend v1. No production origin or automatic data migration.','// Production candidate. Dedicated D1 binding; all data routes disabled until explicit activation.');
writeFileSync(path.join(out,'worker.mjs'),worker);
cpSync(path.join(root,'family-sync/schema.sql'),path.join(out,'schema.sql'));
let panel=read('family-sync/pilot.html');
panel=replace(panel,"const active=location.hostname==='hiszpanski-franka-test.pages.dev'||(['localhost','127.0.0.1'].includes(location.hostname)&&navigator.webdriver);","const active=location.hostname==='wisniajoker90.github.io'&&location.pathname.startsWith('/Spanish-skills-for-my-kid/')||(['localhost','127.0.0.1'].includes(location.hostname)&&navigator.webdriver);");
panel=panel.replaceAll(testHost,prodHost).replaceAll('family-sync-pilot37','family-sync-production37').replaceAll('https://hiszpanski-franka-test.pages.dev/',prodUrl);
// Remove the technical points sandbox, including its event handlers.
panel=panel.replace(/<p id="fs37Stats"><\/p><p id="fs37Pending" class="note"><\/p>[\s\S]*?(?=<div id="fs37Parent")/,'');
panel=panel.replace(/function merge\([\s\S]*?(?=function render\()/,'');
panel=panel.replace(/\$\('Stats'\)\.textContent=[\s\S]*?(?=for\(const b of root)/,'');
panel=panel.replace(/async function ensureProfile\([\s\S]*?(?=\$\('Create'\)\.onclick)/,`async function sync(){if(!state.token)return;const me=await request('/v1/me');save({...state,role:me.device.role,name:me.device.name});message('Urządzenie połączone. Wybierz poniżej postęp do synchronizacji.');document.dispatchEvent(new Event('family-device-ready'));}\n`);
panel=panel.replace(/\$\('Add'\)\.onclick=[\s\S]*?(?=function clearPair\()/,'');
panel=replace(panel,"profileName:'Fikcyjny profil Family Sync',snapshot:{schema:1,data:{pilot:true,events:[]}}","profileName:'Konfiguracja rodziny',snapshot:{schema:1,data:{kind:'family-config'}}");
panel=replace(panel,"message('Rodzina testowa gotowa. Dodaj fikcyjny punkt lub wygeneruj kod dla drugiego urządzenia.');","message('Rodzina gotowa. Teraz zapisz kopię i wybierz aktualny profil z Safari jako punkt startowy.');document.dispatchEvent(new Event('family-device-ready'));");
panel=replace(panel,"joinAttempt:null});await sync();","joinAttempt:null});await sync();document.dispatchEvent(new Event('family-device-joined'));");
panel=replace(panel,'Tylko fikcyjny profil. Ten ekran nie odczytuje ani nie zmienia postępów Franka. Łącz urządzenia na tej samej stronie TEST.','Na pierwszym iPhonie wybierz aktualny postęp Franka. Na kolejnych urządzeniach zeskanuj QR i pobierz wspólny profil. Nauka działa również offline.');
panel=replace(panel,'Pilot techniczny Sprintu 37. Synchronizacja właściwych lekcji, odznak i wyników Franka będzie osobnym krokiem.','Po połączeniu postęp synchronizuje się automatycznie przy otwartej aplikacji. Trwające ćwiczenie pozostaje nieprzerwane.');
panel=panel.replaceAll('Family Sync — test rodzica','Family Sync — urządzenia rodziny').replaceAll('1. Pierwsze urządzenie — utwórz rodzinę testową','Pierwszy iPhone — rozpocznij synchronizację').replaceAll('2. Kolejne urządzenie — dołącz kodem','Kolejne urządzenie — dołącz przez QR lub kod').replaceAll('Utwórz fikcyjny profil testowy','Rozpocznij konfigurację rodziny').replaceAll('Połącz urządzenie testowe','Połącz i pobierz postęp').replaceAll('🧪 TEST · Family Sync — panel rodzica','Family Sync — połącz urządzenia').replaceAll('Klucz konfiguracji TEST','Klucz konfiguracji rodziny').replaceAll('Klucz odzyskiwania TEST','Klucz odzyskiwania rodziny').replaceAll('np. iPhone TEST','np. iPhone rodzica').replaceAll('np. Komputer TEST','np. Komputer rodzica').replaceAll('Rodzina testowa','Rodzina').replaceAll('rodziny testowej','rodziny').replaceAll('Lokalne punkty nadal czekają.','Dane lokalne pozostają zapisane.');
panel=replace(panel,'Ponowne połączenie zachowa lokalne punkty i połączy je ze wspólnymi.','Połączenie pobierze wspólny profil. Istniejące profile lokalne pozostaną zachowane.');
panel=panel.replaceAll('aktualizacji serwera TEST. Zaktualizuj Worker do wersji family-sync-test-3','aktualizacji serwera. Skontaktuj się z rodzicem');
panel=replace(panel,'</style>','#fs37 input[type="checkbox"]{width:22px;min-height:22px;height:22px;padding:0;margin:0 8px 0 0;vertical-align:middle}#fs37 label:has(input[type="checkbox"]){padding:12px 0}\n</style>');
let ui=read('family-sync/learning-ui.js');
ui=replace(ui,"location.hostname==='hiszpanski-franka-test.pages.dev'","(location.hostname==='wisniajoker90.github.io'&&location.pathname.startsWith('/Spanish-skills-for-my-kid/'))");
ui=ui.replaceAll(testHost,prodHost).replaceAll('family-sync-pilot37','family-sync-production37').replaceAll('hf37:','hf37prod:').replaceAll('family-sync-test-4','family-sync-production-1').replaceAll('Postęp nauki — TEST','Postęp Franka').replaceAll('Potwierdzam pracę na kopii TEST wybranego profilu.','Potwierdzam wybór profilu; przed pierwszym udostępnieniem mam zapisaną aktualną kopię JSON.').replaceAll('Potwierdź pracę na kopii TEST.','Potwierdź wybór profilu i zapisanie kopii.').replaceAll('Zaktualizuj Worker TEST do','Serwer wymaga aktualizacji do').replaceAll(' · Sync TEST',' · Rodzina');
ui=replace(ui,'<button id="fs37LearningPublish"','<button id="fs37LearningBackup" type="button">Pobierz kopię przed połączeniem</button><button id="fs37LearningPublish"');
// Opt in only after explicit baseline or QR/download consent; never publish a profile on load.
ui=replace(ui,'localStorage.removeItem(initKey);await sync(id);',"localStorage.removeItem(initKey);localStorage.setItem(autoKey(id),'1');await sync(id);");
ui=replace(ui,"updates['hf18:meta']=", "updates[autoKey(id)]='1';\n updates['hf18:meta']=");
ui=replace(ui,"if(existing)throw Error('Ten profil jest już na urządzeniu: '+existing.name+'. Wybierz go i synchronizuj.');", "if(existing){if(existing.id!==active())throw Error('Wybierz już połączony profil: '+existing.name);localStorage.setItem(autoKey(existing.id),'1');await sync(existing.id);return;}");
ui=replace(ui,"document.getElementById('fs37Launch')?.addEventListener('click',refresh);",read('family-sync/production/onboarding.js')+"\ndocument.getElementById('fs37Launch')?.addEventListener('click',refresh);");
// Replace only sync modules; preserve all learning/awards content byte for byte.
let html=read('index.html');
const start=html.indexOf('<!-- Family Sync TEST pilot:'),end=html.indexOf('<!-- Family Sync learning UI BEGIN -->');
if(start<0||end<start)throw Error('Missing panel boundaries');
html=html.slice(0,start)+panel+'\n'+html.slice(end);
const a=html.indexOf('<!-- Family Sync learning UI BEGIN -->'),b=html.indexOf('<!-- Family Sync learning UI END -->',a);
html=html.slice(0,a)+'<!-- Family Sync learning UI BEGIN -->\n<script>'+read('family-sync/learning-core.js')+'</script>\n<script>'+ui+'</script>\n'+html.slice(b);
// Crash recovery uses the same production namespace as the generated learning module.
html=html.replaceAll("hf37:learning-transaction","hf37prod:learning-transaction");
if(html.includes(testHost)||html.includes('family-sync-pilot37'))throw Error('TEST credentials/backend leaked into production candidate');
writeFileSync(path.join(out,'index.html'),html);
for(const p of ['sw.js','manifest.webmanifest','icons'])cpSync(path.join(root,p),path.join(out,p),{recursive:true});
writeFileSync(path.join(out,'worker.test.mjs'),read('family-sync/worker.test.mjs').replace("{Origin:'https://wisniajoker90.github.io'}","{Origin:'https://untrusted.example'}").replaceAll(testHost,prodHost).replaceAll('https://hiszpanski-franka-test.pages.dev','https://wisniajoker90.github.io').replaceAll('family-test','family-production').replaceAll('FAMILY_SETUP_KEY:secret,DB','FAMILY_SETUP_KEY:secret,SYNC_ENABLED:\'true\',DB').replaceAll('syncEnabled,false','syncEnabled,true'));
console.log('Production candidate built at '+out+'; nothing deployed.');
