/* Classic, low-chrome tournament details — responsive, RTL, accessible tables. */
(()=>{
  const style=document.createElement('style');
  style.id='tournamentDetailClassicStyles';
  style.textContent=[
    '#tournamentDetailView{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;min-width:0!important;}',
    '#tournamentDetailView .detail-toolbar{background:transparent!important;border:0!important;border-bottom:1px solid rgba(216,182,101,.21)!important;box-shadow:none!important;min-height:46px!important;padding:4px 44px!important;}',
    '#tournamentDetailView .detail-toolbar-title{font-size:17px!important;line-height:1.5!important;}',
    '#tournamentDetailView .detail-inline-back{width:32px;height:32px;border-radius:6px;border:1px solid rgba(216,182,101,.26);}',
    '#tournamentDetailCard{min-width:0!important;max-width:100%!important;overflow-y:auto!important;overflow-x:hidden!important;padding:10px 12px 18px!important;scrollbar-width:thin;scrollbar-color:rgba(216,182,101,.32) transparent;}',
    '#tournamentDetailCard .detail-title-row{justify-content:flex-start!important;align-items:center!important;flex-direction:row!important;margin:0 0 8px!important;}',
    '#tournamentDetailCard .detail-title{display:none!important;}',
    '#tournamentDetailCard .detail-title-row>.status{border:0!important;padding:3px 8px!important;font-size:12px!important;}',
    '#tournamentDetailCard .tournament-detail-classic,#tournamentDetailCard .tournament-matches-classic{width:100%!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;border:0!important;border-radius:0!important;background:transparent!important;direction:rtl!important;}',
    '#tournamentDetailCard .tournament-detail-classic th,#tournamentDetailCard .tournament-detail-classic td,#tournamentDetailCard .tournament-matches-classic th,#tournamentDetailCard .tournament-matches-classic td{box-sizing:border-box!important;min-width:0!important;width:auto!important;height:auto!important;min-height:0!important;border:0!important;border-bottom:1px solid rgba(175,203,196,.16)!important;text-align:right!important;vertical-align:middle!important;padding:10px 12px!important;line-height:1.55!important;overflow-wrap:break-word!important;word-break:normal!important;}',
    '#tournamentDetailCard .tournament-detail-classic thead th{font-size:15px!important;color:#d8b665!important;font-weight:900!important;letter-spacing:0!important;background:rgba(216,182,101,.075)!important;border-bottom:1px solid rgba(216,182,101,.25)!important;}',
    '#tournamentDetailCard .tournament-detail-classic tbody th{width:36%!important;color:#d9c58f!important;font-size:13px!important;font-weight:700!important;}',
    '#tournamentDetailCard .tournament-detail-classic tbody td{width:64%!important;color:#f4eddc!important;font-size:14px!important;font-weight:700!important;}',
    '#tournamentDetailCard .tournament-detail-classic .detail-value{display:inline!important;width:auto!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;}',
    '#tournamentDetailCard .tournament-detail-classic tbody tr:nth-child(even),#tournamentDetailCard .tournament-matches-classic tbody tr:nth-child(even){background:rgba(255,255,255,.018)!important;}',
    '#tournamentDetailCard .tournament-detail-classic tbody tr:last-child th,#tournamentDetailCard .tournament-detail-classic tbody tr:last-child td,#tournamentDetailCard .tournament-matches-classic tbody tr:last-child td{border-bottom:0!important;}',
    '#tournamentDetailCard .detail-register{border:0!important;margin-top:10px!important;padding:0!important;}',
    '#tournamentDetailCard .bracket-shell{border:0!important;margin-top:20px!important;padding:0!important;}',
    '#tournamentDetailCard .bracket-title{margin:0 0 9px!important;font-size:16px!important;color:#d8b665!important;}',
    '#tournamentDetailCard .bracket-round{margin-top:13px!important;}',
    '#tournamentDetailCard .bracket-round-title{margin:0 0 6px!important;font-size:13px!important;color:#d9c58f!important;}',
    '#tournamentDetailCard .tournament-matches-classic thead th{font-size:12px!important;font-weight:800!important;color:#d9c58f!important;background:rgba(216,182,101,.07)!important;padding:8px 10px!important;}',
    '#tournamentDetailCard .tournament-matches-classic th:nth-child(1){width:51%!important;}',
    '#tournamentDetailCard .tournament-matches-classic th:nth-child(2){width:19%!important;}',
    '#tournamentDetailCard .tournament-matches-classic th:nth-child(3){width:30%!important;}',
    '#tournamentDetailCard .tournament-matches-classic td{font-size:12px!important;color:#f4eddc!important;padding:9px 10px!important;}',
    '#tournamentDetailCard .classic-players{display:flex;align-items:center;flex-wrap:wrap;gap:4px 7px;font-size:13px;font-weight:700;}',
    '#tournamentDetailCard .classic-players .winner{color:#a7e7bd!important;}',
    '#tournamentDetailCard .classic-vs{color:#d8b665;font-size:11px;}',
    '#tournamentDetailCard .classic-action{white-space:normal!important;}',
    '#tournamentDetailCard .tournament-matches-classic tbody tr[data-tournament-spectate]{cursor:pointer;transition:background .15s ease;}',
    '#tournamentDetailCard .tournament-matches-classic tbody tr[data-tournament-spectate]:hover{background:rgba(46,147,147,.12)!important;}',
    '#tournamentDetailCard .tournament-matches-classic tbody tr[data-tournament-spectate]:focus-visible{outline:2px solid #d8b665!important;outline-offset:-2px;}',
    '#tournamentDetailCard .tournament-matches-classic tbody tr.tournament-watching{background:rgba(216,182,101,.11)!important;box-shadow:inset 3px 0 0 #d8b665;}',
    '#tournamentDetailCard .tournament-matches-classic tbody tr.tournament-watching .classic-players{color:#efcf7c;}',
    '#tournamentDetailCard .tournament-matches-classic .tournament-watch-indicator{display:inline-block;margin-right:6px;color:#efcf7c;font-size:10px;font-weight:800;}',
    '#tournamentDetailCard .classic-action .register-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:normal!important;max-width:100%!important;min-width:0!important;min-height:31px!important;padding:5px 8px!important;margin:1px 4px 1px 0!important;font-size:11px!important;border-radius:6px!important;line-height:1.35!important;}',
    '#tournamentDetailCard .bracket-empty{border:0!important;border-radius:0!important;background:transparent!important;padding:11px 0!important;text-align:right!important;}',
    '#v3TournamentFormatPanel{border:0!important;border-top:1px solid rgba(216,182,101,.18)!important;border-radius:0!important;background:transparent!important;margin-top:17px!important;padding:13px 0 0!important;box-shadow:none!important;}',
    '#v3TournamentFormatPanel .v3-format-badge{border-radius:5px!important;}',
    '#v3TournamentFormatPanel .v3-standing{gap:0!important;border-top:0!important;border-bottom:1px solid rgba(175,203,196,.16)!important;padding:10px 6px!important;font-size:12px!important;}',
    '#v3TournamentFormatPanel .v3-standing.head{background:rgba(216,182,101,.06)!important;color:#d9c58f!important;}',
    '@media(max-width:700px){',
    '  #tournamentDetailCard{padding:8px 5px 16px!important;}',
    '  #tournamentDetailView .detail-toolbar{padding:4px 42px!important;}',
    '  #tournamentDetailView .detail-toolbar-title{font-size:16px!important;}',
    '  #tournamentDetailCard .tournament-detail-classic th,#tournamentDetailCard .tournament-detail-classic td{padding:9px 8px!important;}',
    '  #tournamentDetailCard .tournament-detail-classic tbody th{width:38%!important;font-size:12px!important;}',
    '  #tournamentDetailCard .tournament-detail-classic tbody td{width:62%!important;font-size:13px!important;}',
    '  #tournamentDetailCard .tournament-matches-classic th:nth-child(1){width:45%!important;}',
    '  #tournamentDetailCard .tournament-matches-classic th:nth-child(2){width:20%!important;}',
    '  #tournamentDetailCard .tournament-matches-classic th:nth-child(3){width:35%!important;}',
    '  #tournamentDetailCard .tournament-matches-classic th,#tournamentDetailCard .tournament-matches-classic td{padding:7px 4px!important;font-size:11px!important;}',
    '  #tournamentDetailCard .classic-players{gap:3px 5px;font-size:11px!important;}',
    '  #tournamentDetailCard .classic-action .register-btn{font-size:10px!important;padding:5px 4px!important;}',
    '  #v3TournamentFormatPanel .v3-standing{font-size:10px!important;padding:8px 2px!important;}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  function detailTable(grid){
    const items=Array.from(grid.children).filter(node=>node.classList.contains('detail-item'));
    if(!items.length)return;
    const table=document.createElement('table');
    table.className='tournament-detail-classic';
    table.setAttribute('aria-label','بيانات البطولة');
    const thead=document.createElement('thead');
    const titleRow=document.createElement('tr');
    const title=document.createElement('th');
    title.scope='colgroup'; title.colSpan=2; title.textContent='بيانات البطولة';
    titleRow.appendChild(title);thead.appendChild(titleRow);
    const tbody=document.createElement('tbody');
    for(const item of items){
      const label=item.querySelector('.detail-label');
      const value=item.querySelector('.detail-value');
      if(!label||!value)continue;
      const tr=document.createElement('tr');
      const th=document.createElement('th');th.scope='row';th.textContent=label.textContent.trim();
      const td=document.createElement('td');td.appendChild(value);
      tr.append(th,td);tbody.appendChild(tr);
    }
    table.append(thead,tbody);
    grid.replaceWith(table);
  }

  function matchesTable(grid){
    const matches=Array.from(grid.children).filter(node=>node.classList.contains('bracket-match'));
    if(!matches.length)return;
    const table=document.createElement('table');
    table.className='tournament-matches-classic';
    table.setAttribute('aria-label','مواجهات الجولة');
    const thead=document.createElement('thead');
    const headers=document.createElement('tr');
    ['المواجهة','الحالة','الإجراء'].forEach(label=>{
      const th=document.createElement('th');th.scope='col';th.textContent=label;headers.appendChild(th);
    });
    thead.appendChild(headers);
    const tbody=document.createElement('tbody');
    for(const match of matches){
      const tr=document.createElement('tr');
      if(match.dataset.tournamentSpectate){
        tr.dataset.tournamentSpectate=match.dataset.tournamentSpectate;
        tr.tabIndex=0;
        tr.setAttribute('aria-label',match.getAttribute('aria-label')||'اضغط لمشاهدة المباراة على الرقعة الرئيسية');
        tr.classList.add('tournament-spectatable');
        if(match.classList.contains('tournament-watching'))tr.classList.add('tournament-watching');
        if(match.hasAttribute('aria-current'))tr.setAttribute('aria-current',match.getAttribute('aria-current'));
      }
      const players=document.createElement('td');
      const pair=document.createElement('div');pair.className='classic-players';
      const names=match.querySelectorAll('.bracket-player');
      names.forEach((player,index)=>{
        if(index){const vs=document.createElement('span');vs.className='classic-vs';vs.textContent='×';pair.appendChild(vs);}
        const name=document.createElement('span');
        name.textContent=player.textContent.trim();
        if(player.classList.contains('winner'))name.classList.add('winner');
        pair.appendChild(name);
      });
      players.appendChild(pair);
      const status=document.createElement('td');
      const action=document.createElement('td');action.className='classic-action';
      const meta=match.querySelector('.bracket-meta');
      if(meta){
        const statusNode=meta.querySelector(':scope > span');
        if(statusNode)status.appendChild(statusNode);
        for(const control of Array.from(meta.children)){
          if(control!==statusNode)action.appendChild(control);
        }
      }
      if(!action.childNodes.length)action.textContent='—';
      tr.append(players,status,action);tbody.appendChild(tr);
    }
    table.append(thead,tbody);
    grid.replaceWith(table);
  }

  function updateClassicTournamentTables(){
    const host=document.getElementById('tournamentDetailCard');
    if(!host)return;
    const rawGrid=host.querySelector(':scope > .detail-grid');
    if(rawGrid)detailTable(rawGrid);
    host.querySelectorAll('.bracket-grid').forEach(matchesTable);
  }
  function start(){
    const host=document.getElementById('tournamentDetailCard');
    if(!host)return;
    updateClassicTournamentTables();
    const observer=new MutationObserver(updateClassicTournamentTables);
    observer.observe(host,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
