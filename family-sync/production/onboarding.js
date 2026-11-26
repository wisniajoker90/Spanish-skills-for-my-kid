// Injected inside the learning module: retain tested merge/storage/transport logic.
$('Backup').onclick=()=>{
 const data=exportBackup(window.frankaStore.dump(),meta().profiles.find(p=>p.id===active()).name);
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=node('a');a.href=url;a.download='hiszpanski-franka-przed-synchronizacja-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 status('Sprawdź, czy kopia JSON została zapisana. Dopiero potem potwierdź wybór profilu.');
};
function onboarding(){
 refresh();const linked=!!readState(active());
 let parent=false;try{parent=JSON.parse(localStorage.getItem('family-sync-production37')||'null')?.role==='parent';}catch{}
 $('Publish').hidden=linked||!parent;$('Download').hidden=linked;
 $('Backup').hidden=linked;$('Confirm').closest('label').hidden=linked;
 $('Auto').closest('p').hidden=!linked;$('Sync').hidden=!linked;$('History').hidden=!linked||!parent;
 if(!linked)status(parent?'Na pierwszym iPhonie zapisz kopię i udostępnij aktualny profil. Na nowym urządzeniu pobierz istniejący wspólny profil.':'Pobierz wspólny profil. Zachowamy istniejące profile na tym urządzeniu.');
}
document.addEventListener('family-device-ready',onboarding);
document.addEventListener('family-device-joined',()=>{
 // The QR join button explicitly says “Połącz i pobierz postęp”.
 $('Confirm').checked=true;$('Download').onclick();
});
document.getElementById('fs37Launch')?.addEventListener('click',onboarding);
onboarding();
