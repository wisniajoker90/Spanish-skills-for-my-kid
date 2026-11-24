/* Family Sync learning merge: three-way deltas, no writes or network. */
(function(root){'use strict';
const KEYS=['A1Practice39V1','A1ProgressV1','Car26V1','DailyMission20V1','Exam13V1','Insights25V1','Journey8V1','LastActivityV1','Level14V1','Path10V2','ProgressV1','Skills22V1','Smart23V1','Smart7V1','Speaking20V1','Sprint6ProgressV1'].map(k=>'hiszpanskiFranka'+k);
const LOCAL=new Set(['hiszpanskiFrankaDailyMission20V1','hiszpanskiFrankaLastActivityV1']);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(obj(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
const same=(a,b)=>canonical(a)===canonical(b);
function validate(records){if(!obj(records)||Object.keys(records).length>KEYS.length)throw Error('Nieprawidłowy profil nauki.');for(const[k,v]of Object.entries(records)){if(!KEYS.includes(k)||typeof v!=='string'||v.length>700000)throw Error('Nieobsługiwane dane profilu: '+k);let d;try{d=JSON.parse(v)}catch{throw Error('Uszkodzony zapis: '+k)}if(!obj(d))throw Error('Nieprawidłowy zapis: '+k);const check=(x,depth=0)=>{if(depth>30)throw Error('Zbyt złożone dane.');if(obj(x)||Array.isArray(x))for(const[n,y]of Object.entries(x)){if(['__proto__','prototype','constructor'].includes(n))throw Error('Niedozwolone pole.');check(y,depth+1)}};check(d);if(k.endsWith('ProgressV1')&&k.includes('FrankaProgress'))for(const f of ['points','quizCorrect','quizTotal'])if(d[f]!==undefined&&(!Number.isSafeInteger(d[f])||d[f]<0))throw Error('Nieprawidłowy licznik.');}return records;}
function shared(records){validate(records);const out={};for(const[k,v]of Object.entries(records)){if(LOCAL.has(k))continue;const d=JSON.parse(v);if(k==='hiszpanskiFrankaProgressV1'){delete d.unit;delete d.index;}if(k==='hiszpanskiFrankaCar26V1'||k==='hiszpanskiFrankaA1Practice39V1')delete d.pending;if(k==='hiszpanskiFrankaSmart23V1')delete d.partial;out[k]=canonical(d);}return out;}
function materialize(records,local={}){validate(records);validate(local);const out={...local};for(const[k,v]of Object.entries(records)){const d=JSON.parse(v),prev=JSON.parse(local[k]||'{}');if(k==='hiszpanskiFrankaProgressV1'){d.unit=prev.unit??1;d.index=prev.index??0;}if(k==='hiszpanskiFrankaCar26V1'||k==='hiszpanskiFrankaA1Practice39V1')d.pending=prev.pending??null;if(k==='hiszpanskiFrankaSmart23V1'&&prev.partial!==undefined)d.partial=prev.partial;out[k]=JSON.stringify(d);}return out;}
function conflict(path){throw Error('Nie można bezpiecznie scalić pola '+path.join(' / ')+'. Obie kopie zostały zachowane.');}
const counters=new Set(['points','quizCorrect','quizTotal','right','wrong','count','total','repeated','practised','confident','needsHelp','spoken','listeningAttempts','listeningCorrect','vocabularyAttempts','vocabularyCorrect','speakingAttempts','dialogueAttempts']);
function additive(path){const k=path[0],f=path.at(-1);if(k==='hiszpanskiFrankaPath10V2'||k==='hiszpanskiFrankaSprint6ProgressV1')return false;if(k==='hiszpanskiFrankaSpeaking20V1'&&path[1]==='bySeason')return true;return counters.has(f);}
function arrayMerge(b,l,r,path){b=Array.isArray(b)?b:[];const identity=x=>obj(x)&&typeof x.id==='string'?'id:'+x.id:canonical(x);const buckets=new Map();for(const list of [b,r,l]){const counts=new Map();for(const x of list){const id=identity(x),prior=buckets.get(id);if(prior&&id.startsWith('id:')&&!same(prior.value,x))conflict([...path,id]);counts.set(id,(counts.get(id)||0)+1);buckets.set(id,{value:clone(x),count:Math.max(prior?.count||0,counts.get(id))});}}return [...buckets.values()].flatMap(x=>Array.from({length:x.count},()=>clone(x.value))).sort((a,z)=>{const ta=obj(a)?String(a.at??a.day??a.startedAt??''):String(a),tz=obj(z)?String(z.at??z.day??z.startedAt??''):String(z);return ta.localeCompare(tz)||identity(a).localeCompare(identity(z));});}
function mergeNode(b,l,r,path){
 // Counter deltas must be added even when both devices independently reach the same value.
 if(additive(path)&&typeof l==='number'&&typeof r==='number') {const before=b??0;if(!Number.isSafeInteger(before)||!Number.isSafeInteger(l)||!Number.isSafeInteger(r)||l<before||r<before)conflict(path);const n=r+(l-before);if(!Number.isSafeInteger(n))conflict(path);return n;}
 if(l===undefined)return clone(r);if(r===undefined)return clone(l);
 if(Array.isArray(l)&&Array.isArray(r))return same(l,b)?clone(r):arrayMerge(b,l,r,path);
 if(obj(l)&&obj(r)){
  if(same(l,b))return clone(r);
  // Mastery scheduling cannot infer a global answer order from two offline aggregates.
  // Preserve counts; take the more conservative streak/level/due when both changed.
  if(path[0]==='hiszpanskiFrankaProgressV1'&&path[1]==='mastery'&&path.length===3){if(same(r,b))return clone(l);const out={...clone(r),right:mergeNode(b?.right,l.right,r.right,[...path,'right']),wrong:mergeNode(b?.wrong,l.wrong,r.wrong,[...path,'wrong'])};for(const f of ['streak','level','due'])out[f]=Math.min(l[f]??0,r[f]??0);out.last=Math.max(l.last??0,r.last??0);out.source='family-sync';return out;}
  if(path[0]==='hiszpanskiFrankaJourney8V1'&&path[1]==='entries'&&path.length===3){if(same(r,b))return clone(l);const out={...clone(r),right:mergeNode(b?.right,l.right,r.right,[...path,'right']),wrong:mergeNode(b?.wrong,l.wrong,r.wrong,[...path,'wrong']),streak:Math.min(l.streak??0,r.streak??0),next:Math.min(l.next??0,r.next??0),days:arrayMerge(b?.days,l.days||[],r.days||[],[...path,'days'])};return out;}
  if(path[0]==='hiszpanskiFrankaPath10V2'&&path.length===3){const chosen=String(l.date||'')>String(r.date||'')?l:r;return {...clone(chosen),done:!!(l.done||r.done)};}
  const out={};for(const k of new Set([...Object.keys(b||{}),...Object.keys(l),...Object.keys(r)])){const v=mergeNode(b?.[k],l[k],r[k],[...path,k]);if(v!==undefined)out[k]=v;}return out;
 }
 if(same(l,b))return clone(r);if(same(r,b)||same(l,r))return clone(l);
 if(path.includes('badges')&&path.at(-1)==='date')return [l,r].sort()[0];
 if(['lastAt','last','at','date'].includes(path.at(-1)))return l>r?l:r;
 if(path[0]==='hiszpanskiFrankaProgressV1'&&path[1]==='words')return l==='review'||r==='review'?'review':r;
 if(path.includes('checkpoints')&&typeof l==='number'&&typeof r==='number')return Math.max(l,r);
 if(typeof l==='boolean'&&typeof r==='boolean'&&['done','initialized','finished'].includes(path.at(-1)))return l||r;
 conflict(path);
}
function merge(base,local,remote){validate(base);validate(local);validate(remote);const out={};for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){const parse=d=>d[k]===undefined?undefined:JSON.parse(d[k]);const v=mergeNode(parse(base),parse(local),parse(remote),[k]);if(v!==undefined)out[k]=canonical(v);}return out;}
const api={shared,materialize,merge,validate,same,canonical};if(typeof module==='object'&&module.exports)module.exports=api;else root.hf37LearningCore=api;
})(typeof window==='object'?window:globalThis);
