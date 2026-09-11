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

function transformTournamentDetail4x4(){
  const host=document.getElementById('tournamentDetailCard');
  if(!host)return;

  const grid=host.querySelector('.detail-grid');
  if(!grid)return;

  const items=[...grid.querySelectorAll(':scope > .detail-item')];
  if(items.length<8)return;
  const baseItems=items.slice(0,8);

  const table=document.createElement('table');
  table.className='tournament-detail-table';
  table.setAttribute('aria-label','بيانات البطولة');
  const tbody=document.createElement('tbody');

  for(let i=0;i<8;i+=2){
    const first=baseItems[i];
    const second=baseItems[i+1];
    const firstLabel=first.querySelector('.detail-label');
    const firstValue=first.querySelector('.detail-value');
    const secondLabel=second.querySelector('.detail-label');
    const secondValue=second.querySelector('.detail-value');
    if(!firstLabel||!firstValue||!secondLabel||!secondValue)return;

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
  grid.replaceWith(table);

  const championItem=items[8];
  if(championItem){
    const label=championItem.querySelector('.detail-label');
    const value=championItem.querySelector('.detail-value');
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
