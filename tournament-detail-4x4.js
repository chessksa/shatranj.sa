const style=document.createElement('style');
style.id='tournamentDetail4x4Final';
style.textContent=`
#tournamentDetailCard .tournament-detail-table{
  width:100%!important;
  table-layout:fixed!important;
  border-collapse:collapse!important;
  direction:rtl!important;
  background:rgba(3,38,40,.24)!important;
}
#tournamentDetailCard .tournament-detail-table th,
#tournamentDetailCard .tournament-detail-table td{
  width:25%!important;
  min-width:0!important;
  height:32px!important;
  padding:4px 3px!important;
  border:1px solid rgba(216,182,101,.20)!important;
  text-align:center!important;
  vertical-align:middle!important;
  line-height:1.2!important;
  overflow-wrap:anywhere!important;
}
#tournamentDetailCard .tournament-detail-table th{
  background:rgba(216,182,101,.045)!important;
  color:#d9c58f!important;
  font-size:12px!important;
  font-weight:900!important;
}
#tournamentDetailCard .tournament-detail-table td,
#tournamentDetailCard .tournament-detail-table td .detail-value,
#tournamentDetailCard .tournament-detail-table .tournament-detail-value{
  background:rgba(3,38,40,.18)!important;
  color:var(--hero-cream,#f4eddc)!important;
  font-size:10px!important;
  font-weight:700!important;
}
#tournamentDetailCard .tournament-detail-champion{
  margin-top:6px!important;
  min-height:30px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  border:1px solid rgba(216,182,101,.18)!important;
  border-radius:8px!important;
}
#tournamentDetailCard .tournament-detail-champion-label{color:#d9c58f!important;font-size:12px!important;font-weight:900!important}
#tournamentDetailCard .tournament-detail-champion-value{color:var(--hero-cream,#f4eddc)!important;font-size:10px!important;font-weight:700!important}
`;
document.head.appendChild(style);

function moveChampionOutsideTable(table,extraRows){
  const extra=extraRows[0];
  if(!extra)return;
  const cells=[...extra.children];
  if(cells.length<2)return;
  if(table.parentElement?.querySelector(':scope > .tournament-detail-champion'))return;

  const champion=document.createElement('div');
  champion.className='tournament-detail-champion';
  const label=document.createElement('span');
  label.className='tournament-detail-champion-label';
  label.textContent=cells[0].textContent?.trim()||'البطل';
  const value=document.createElement('span');
  value.className='tournament-detail-champion-value';
  const valueNode=cells[1].firstElementChild;
  if(valueNode)value.appendChild(valueNode);
  else value.textContent=cells[1].textContent?.trim()||'—';
  champion.append(label,value);
  table.insertAdjacentElement('afterend',champion);
}

function compactExistingDetailTable(table){
  if(table.dataset.fourByFour==='1')return true;
  const tbody=table.tBodies[0];
  if(!tbody)return false;
  const rows=[...tbody.querySelectorAll(':scope > tr')];
  if(rows.length<8)return false;
  const baseRows=rows.slice(0,8);
  const newBody=document.createElement('tbody');

  for(let i=0;i<8;i+=2){
    const firstCells=[...baseRows[i].children];
    const secondCells=[...baseRows[i+1].children];
    if(firstCells.length<2||secondCells.length<2)return false;
    const tr=document.createElement('tr');
    tr.append(firstCells[0],firstCells[1],secondCells[0],secondCells[1]);
    newBody.appendChild(tr);
  }

  const extraRows=rows.slice(8);
  tbody.replaceWith(newBody);
  table.dataset.fourByFour='1';
  moveChampionOutsideTable(table,extraRows);
  return true;
}

function transformRawDetailGrid(grid){
  const items=[...grid.querySelectorAll(':scope > .detail-item')];
  if(items.length<8)return false;
  const baseItems=items.slice(0,8);

  const table=document.createElement('table');
  table.className='tournament-detail-table';
  table.dataset.fourByFour='1';
  table.setAttribute('aria-label','بيانات البطولة');
  const tbody=document.createElement('tbody');

  for(let i=0;i<8;i+=2){
    const first=baseItems[i];
    const second=baseItems[i+1];
    const firstLabel=first.querySelector('.detail-label');
    const firstValue=first.querySelector('.detail-value');
    const secondLabel=second.querySelector('.detail-label');
    const secondValue=second.querySelector('.detail-value');
    if(!firstLabel||!firstValue||!secondLabel||!secondValue)return false;

    const tr=document.createElement('tr');
    const th=document.createElement('th');
    th.scope='row';
    th.textContent=firstLabel.textContent;
    const td=document.createElement('td');
    firstValue.classList.remove('detail-value');
    firstValue.classList.add('tournament-detail-value');
    const value=firstValue;
    td.appendChild(value);

    const th2=document.createElement('th');
    th2.scope='row';
    th2.textContent=secondLabel.textContent;
    const td2=document.createElement('td');
    secondValue.classList.remove('detail-value');
    secondValue.classList.add('tournament-detail-value');
    td2.appendChild(secondValue);

    tr.append(th,td,th2,td2);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  const extraItems=items.slice(8);
  grid.replaceWith(table);
  if(extraItems.length){
    const extra=extraItems[0];
    const label=extra.querySelector('.detail-label');
    const value=extra.querySelector('.detail-value');
    if(label&&value){
      const champion=document.createElement('div');
      champion.className='tournament-detail-champion';
      const championLabel=document.createElement('span');
      championLabel.className='tournament-detail-champion-label';
      championLabel.textContent=label.textContent;
      value.classList.remove('detail-value');
      value.classList.add('tournament-detail-champion-value');
      champion.append(championLabel,value);
      table.insertAdjacentElement('afterend',champion);
    }
  }
  return true;
}

let fallbackTimer=null;
function transformTournamentDetail4x4(){
  const host=document.getElementById('tournamentDetailCard');
  if(!host)return;

  const existingTable=host.querySelector('.tournament-detail-table');
  if(existingTable){
    clearTimeout(fallbackTimer);
    fallbackTimer=null;
    compactExistingDetailTable(existingTable);
    return;
  }

  const grid=host.querySelector('.detail-grid');
  if(!grid)return;
  clearTimeout(fallbackTimer);
  fallbackTimer=setTimeout(()=>{
    const tableNow=host.querySelector('.tournament-detail-table');
    if(tableNow){compactExistingDetailTable(tableNow);return;}
    const gridNow=host.querySelector('.detail-grid');
    if(gridNow)transformRawDetailGrid(gridNow);
  },0);
}

function startTournamentDetail4x4(){
  const host=document.getElementById('tournamentDetailCard');
  if(!host)return;
  transformTournamentDetail4x4();
  const observer=new MutationObserver(transformTournamentDetail4x4);
  observer.observe(host,{childList:true,subtree:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',startTournamentDetail4x4,{once:true});
}else{
  startTournamentDetail4x4();
}
