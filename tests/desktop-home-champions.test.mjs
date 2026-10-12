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

assert.match(tuneCss,/grid-template-rows:minmax\(0,1fr\) minmax\(0,1fr\) 94px!important/,'Welcome and champion cards retain separate equal areas');
assert.match(tuneCss,/\.desktop-welcome-art span\{font-size:clamp\(39px,3\.5vw,60px\)!important\}/,'Welcome artwork retains the approved size');
assert.match(css,/\.desktop-champions-grid\{[\s\S]*?grid-template-rows:repeat\(3,minmax\(0,1fr\)\)/,'Three champions remain in equal rows');
assert.match(css,/\.desktop-champion-card\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.42fr\) minmax\(0,1fr\)/,'The center column is wider than two identical side columns');
assert.match(css,/\.desktop-champion-title,\.desktop-champion-result\{[^}]*flex-direction:row/,'Titles and scores remain horizontal');
assert.match(css,/\.desktop-champion-title\{[^}]*gap:4px/,'Compact icon-title grouping');
assert.match(css,/\.desktop-champion-result\{gap:4px;text-align:center\}/,'Score is centered in a single line');
assert.match(css,/\.desktop-champion-title strong\{[^}]*font-size:clamp\(10px,\.72vw,11\.5px\)/,'Championship title remains compact');
assert.match(css,/\.desktop-champion-icon\{[^}]*width:21px;height:21px/,'Championship icon size is preserved');
assert.match(css,/\.desktop-champion-name\{[^}]*text-align:center;white-space:nowrap;\s*overflow:hidden;text-overflow:ellipsis/,'Player names remain single-line and centered');
assert.doesNotMatch(css,/\.desktop-champion-result\{[^}]*border-inline-start:/,'Avoid an asymmetric side divider');
const cardLayout=css.match(/\.desktop-champion-card\{[^}]*grid-template-columns:minmax\(0,([\d.]+)fr\) minmax\(0,([\d.]+)fr\) minmax\(0,([\d.]+)fr\)/);
assert.ok(cardLayout,'Champion card areas must retain three proportional columns');
const [right,center,left]=cardLayout.slice(1).map(Number);
assert.equal(right,left,'Both outer columns share the same width');
assert.ok(center>right,'Center column remains the widest');
for(const available of [320,350]){
  const free=available-2*8-2*6-2;
  const side=free*right/(right+center+left);
  assert.ok(side>=80,'Both outer areas must remain legible');
}
assert.match(css,/@media\(max-height:720px\) and \(min-width:901px\)\{[\s\S]*?\.desktop-champion-card\{padding:3px 7px;column-gap:2px\}/,'Compact screens preserve card spacing');

for(const kind of ['week','month','site']){
  assert.match(shell,new RegExp(`data-champion="${kind}"`),`Missing ${kind} champion icon card`);
}
for(const arabic of ['بطل الأسبوع','بطل الشهر','بطل الموقع']){
  assert.ok(shell.includes(arabic),`Missing champion label ${arabic}`);
}
assert.match(shell,/supabase\.rpc\('get_public_home_champions'\)/,'All badges use actual verified server results');
assert.equal((shell.match(/class="desktop-champion-result"/g)||[]).length,3,'Each badge must have its own left-aligned score');
assert.equal((shell.match(/class="desktop-champion-title"/g)||[]).length,3,'Each icon and champion title share one right-side zone');
assert.equal((shell.match(/class="desktop-champion-name"/g)||[]).length,3,'Each card includes exactly one centered name');
assert.doesNotMatch(shell,/desktop-champion-info/,'Do not restore the stacked title and name layout');
for(const block of shell.match(/<span class="desktop-champion-info">[\s\S]*?<\/span><\/span>/g)||[]){
  assert.doesNotMatch(block,/desktop-champion-meta/,'No stacked third information row next to the icon');
}
assert.match(shell,/name\.textContent=champion\?\.name\|\|'بانتظار النتائج'/,'No fabricated winners');
assert.match(shell,/void refreshDesktopChampions\(\)/,'Champion refresh must run after building dashboard');
assert.match(tune,/home\.appendChild\(stats\)/,'Statistics must stay below the champion section');
assert.doesNotMatch(tune,/welcome\.insertAdjacentElement\('afterend',stats\)/,'Legacy insertion must not displace the champions');
assert.match(sql,/is_synthetic, false\) = false/,'Reject synthetic accounts');
assert.match(sql,/interval '7 days'/);
assert.match(sql,/interval '30 days'/);
assert.match(sql,/grant execute on function public\.get_public_home_champions\(\) to anon, authenticated/);
assert.match(home,/shatranj-asset-version" content="20261012-champions-evenpadding-v19"/);

const begin=shell.indexOf('  async function refreshDesktopChampions(){');
const end=shell.indexOf('\n  function setActiveNav(',begin);
assert.ok(begin>=0&&end>begin);
const fn=shell.slice(begin,end);
function makeCard(kind){
  const name={textContent:''},meta={textContent:''},count={textContent:''};
  const card={
    href:'#ranking',attributes:{},
    classList:{toggle(){}},
    querySelector(query){return query==='.desktop-champion-name'?name:query==='.desktop-champion-meta'?meta:query==='.desktop-champion-count'?count:null;},
    setAttribute(key,value){this.attributes[key]=value;},
  };
  return {kind,card,name,meta,count};
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
assert.equal(entries[0].count.textContent,'3');
assert.equal(entries[0].meta.textContent,'فوز');
assert.equal(entries[1].name.textContent,'بانتظار النتائج');
assert.equal(entries[1].card.href,'#ranking');
assert.equal(entries[1].count.textContent,'—');
assert.equal(entries[2].name.textContent,'Site winner');
assert.equal(entries[2].count.textContent,'1800','Site points must never have thousands separator');
assert.equal(entries[2].meta.textContent,'نقطة');
assert.doesNotMatch(entries[2].count.textContent,/,/,'Unformatted numeric site points');
assert.match(css,/\.desktop-champion-title strong\{[^}]*white-space:nowrap/,'Champion title must stay on a single line');
console.log('Half-sized welcome, three real champion badges, honest empty states and bottom counters: PASS');
