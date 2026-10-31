// QA сценария: node scripts/qa-scenario.js (нужен пакет typescript). Прогоняет граф открытий в разном порядке.
const ts=require('typescript'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(root+'/src/lib/engine/evaluator.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:'commonjs',target:'es2019'}}).outputText;
const m={exports:{}};new Function('module','exports','require',js)(m,m.exports,require);
const {isConditionMet}=m.exports;
const L=n=>JSON.parse(fs.readFileSync(`${root}/content/cases/case-001/${n}.json`,'utf8'));
const docs=L('documents'),ivs=L('interviews'),locs=L('locations'),term=L('terminal');
const mk=()=>({viewedEvidence:[],solvedQuestions:[],completedDeductions:[],exploredLocations:[],discoveredHotspots:[],askedQuestions:[],presentedClues:[]});
const add=(a,x)=>{if(x&&!a.includes(x)){a.push(x);return true}return false};
function actions(s){
  const A=[];
  const avail=d=>d.unlockedByDefault!==false&&!d.unlockCondition||isConditionMet(d.unlockCondition,s);
  for(const d of docs){ if(avail(d)) A.push([`view ${d.id}`,()=>add(s.viewedEvidence,d.id)]);
    if(avail(d)&&s.viewedEvidence.includes(d.id)) for(const h of d.hotspots||[]) A.push([`hotspot ${h.id}`,()=>{let c=add(s.discoveredHotspots,h.id);if(h.resultEvidenceId)c=add(s.viewedEvidence,h.resultEvidenceId)||c;return c}]);}
  for(const iv of ivs){ if(iv.unlockCondition&&!isConditionMet(iv.unlockCondition,s)) continue;
    for(const q of iv.questions){ if(q.unlockCondition&&!isConditionMet(q.unlockCondition,s))continue;
      A.push([`ask ${q.id}`,()=>{let c=add(s.askedQuestions,q.id);if(q.unlockedEvidenceId)c=add(s.viewedEvidence,q.unlockedEvidenceId)||c;return c}]);}
    for(const c of s.viewedEvidence) A.push([`present ${c}`,()=>add(s.presentedClues,c)]);}
  for(const l of locs){ if(l.unlockCondition&&!isConditionMet(l.unlockCondition,s))continue;
    A.push([`explore ${l.id}`,()=>{let c=add(s.exploredLocations,l.id);if(l.linkedEvidenceId)c=add(s.viewedEvidence,l.linkedEvidenceId)||c;return c}]);}
  for(const q of term.questions){ if(q.unlockCondition&&!isConditionMet(q.unlockCondition,s))continue; A.push([`solve ${q.id}`,()=>add(s.solvedQuestions,q.id)]);}
  // deduction board
  const v=s.viewedEvidence;
  if(v.includes('P02')&&v.includes('P03')&&(v.includes('P06')||v.includes('D03')||v.includes('clue_ring_confirmed_stolen')))
    A.push(['deduction',()=>add(s.solvedQuestions,'archive_unlocked')]);
  if(s.solvedQuestions.includes('archive_unlocked'))
    for(const q of term.queries) for(const h of q.archiveHits||[]) A.push([`search ${q.id}`,()=>add(s.solvedQuestions,h)]);
  return A;
}
function run(order){const s=mk();const log=[];let ch=true;
  while(ch){ch=false;let A=actions(s);if(order==='rand')A.sort(()=>Math.random()-.5);if(order==='rev')A.reverse();
    for(const [n,f] of A){ if(f()){log.push(n);ch=true;break} } }
  return {s,log};}
const spoilers=['D10','A01','A02','A03','N01'];
let bad=0;
for(const mode of ['fwd','rev',...Array(200).fill('rand')]){
  const {s,log}=run(mode);
  const reach=d=>d.unlockedByDefault!==false&&!d.unlockCondition||isConditionMet(d.unlockCondition,s);
  const unreachable=docs.filter(d=>!reach(d)).map(d=>d.id);
  if(unreachable.length){bad++;console.log(mode,'UNREACHABLE',unreachable)}
  // spoiler order: first index of archive actions vs deduction
  const iD=log.indexOf('deduction');
  const early=log.slice(0,iD).filter(x=>x.startsWith('search'));
  if(early.length){bad++;console.log('search before deduction',early)}
  const iQ=log.indexOf('solve Q01'); const iT=log.indexOf('ask q_thomas_04');
  if(iQ>=0&&iQ<log.indexOf('view D04')) {bad++;console.log('Q01 before D04')}
}
console.log('issues:',bad);
const f=run('fwd');console.log('steps',f.log.length,'unsolved locs',locs.filter(l=>!f.s.exploredLocations.includes(l.id)).map(l=>l.id),
 'unasked',ivs.flatMap(i=>i.questions).filter(q=>!f.s.askedQuestions.includes(q.id)).map(q=>q.id));
// start state spoilers
const s0=mk();console.log('available at start:',docs.filter(d=>d.unlockedByDefault!==false&&!d.unlockCondition||isConditionMet(d.unlockCondition,s0)).map(d=>d.id).join(','));
