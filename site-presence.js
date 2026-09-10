import './pull-to-refresh.js?v=20260910-tournament-pull1';
import './site-presence-base.js?v=20260910-tournament-detail-table2';

if(document.querySelector('.tournament-table')){
  document.querySelector('.page-head')?.remove();
  document.querySelectorAll('.tournament-table-scroll').forEach(scroll=>{
    scroll.style.touchAction='pan-y';
  });

  const layout=document.createElement('link');
  layout.rel='stylesheet';
  layout.href='tournament-layout-5rows.css?v=20260910-stretch1';
  document.head.appendChild(layout);

  const style=document.createElement('style');
  style.id='tournamentFont14Override';
  style.textContent='.tournament-table th,.tournament-table td,.tournament-name,.tournament-date,.status,.champion-name{font-size:14px!important}.detail-toolbar-title,.detail-title,.bracket-title{font-size:20px!important}.detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}.detail-value{font-size:14px!important;font-weight:700!important}.detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:14px!important}';
  document.head.appendChild(style);

  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='tournament-mobile-fonts.css?v=20260910-detail-scale3';
  document.head.appendChild(link);
}
