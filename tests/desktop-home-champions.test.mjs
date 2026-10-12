import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8');
const shell=read('v2/home/desktop-board-shell.mjs');
const tune=read('v2/home/desktop-board-shell-tune.mjs');
const tuneCss=read('v2/home/desktop-board-shell-tune.css');
const css=read('v2/home/desktop-board-shell.css');
const sql=read('supabase/migrations/20261012_public_home_champions.sql');
const home=read('index.html');

assert.match(tuneCss,/grid-template-rows:minmax\(0,1fr\) minmax\(0,1fr\) 94px!important/,'Welcome must be half its previous height; champions occupy the other half');
assert.match(tuneCss,/\.desktop-welcome-art span\{font-size:clamp\(39px,3\.5vw,60px\)!important\}/,'Main decorative chess knight is halved');
assert.match(css,/\.desktop-champions-grid\{[\s\S]*?grid-template-rows:repeat\(3,minmax\(0,1fr\)\)/,'The three cards must have equal heights');
assert.match(css,/\.desktop-champion-card\{/);
for(const kind of ['week','month','site']){
  assert.match(shell,new RegExp(`data-champion="${kind}"`),`Missing ${kind} champion icon card`);
}
for(const arabic of ['بطل الأسبوع','بطل الشهر','بطل الموقع']){
  assert.ok(shell.includes(arabic),`Missing champion label ${arabic}`);
}
assert.match(shell,/supabase\.rpc\('get_public_home_champions'\)/,'All badges use actual verified server results');
assert.match(shell,/name\.textContent=champion\?\.name\|\|'بانتظار النتائج'/,'No fabricated winners');
assert.match(shell,/void refreshDesktopChampions\(\)/,'Champion refresh must run after building dashboard');
assert.match(tune,/home\.appendChild\(stats\)/,'Statistics must stay below the champion section');
assert.doesNotMatch(tune,/welcome\.insertAdjacentElement\('afterend',stats\)/,'Legacy insertion must not displace the champions');
assert.match(sql,/is_synthetic, false\) = false/,'Reject synthetic accounts');
assert.match(sql,/interval '7 days'/);
assert.match(sql,/interval '30 days'/);
assert.match(sql,/grant execute on function public\.get_public_home_champions\(\) to anon, authenticated/);
assert.match(home,/shatranj-asset-version" content="20261012-home-champions-v15"/);

const begin=shell.indexOf('  async function refreshDesktopChampions(){');
const end=shell.indexOf('\n  function setActiveNav(',begin);
assert.ok(begin>=0&&end>begin);
const fn=shell.slice(begin,end);
function makeCard(kind){
  const name={textContent:''},meta={textContent:''};
  const card={
    href:'#ranking',attributes:{},
    classList:{toggle(){}},
    querySelector(query){return query==='.desktop-champion-name'?name:query==='.desktop-champion-meta'?meta:null;},
    setAttribute(key,value){this.attributes[key]=value;},
  };
  return {kind,card,name,meta};
}
const entries=['week','month','site'].map(makeCard);
const grid={querySelector(selector){return entries.find(({kind})=>selector===`[data-champion="${kind}"]`)?.card||null}};
const ctx={
  supabase:{rpc:async()=>({data:{
    week:{id:'weekly-id',name:'Weekly winner',wins:3,rating:1600},
    month:null,
    site:{id:'site-id',name:'Site winner',rating:1800},
  },error:null})},
  document:{querySelector(){return grid;}},
  console,encodeURIComponent,
};
await vm.runInNewContext(fn+';refreshDesktopChampions()',ctx);
assert.equal(entries[0].name.textContent,'Weekly winner');
assert.match(entries[0].meta.textContent,/3 انتصار/);
assert.equal(entries[1].name.textContent,'بانتظار النتائج');
assert.equal(entries[1].card.href,'#ranking');
assert.equal(entries[2].name.textContent,'Site winner');
assert.match(entries[2].meta.textContent,/1,800 نقطة/);
console.log('Half-sized welcome, three real champion badges, honest empty states and bottom counters: PASS');
