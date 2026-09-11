import './pull-to-refresh.js?v=20260910-tournament-pull1';
import './site-presence-base.js?v=20260910-tournament-detail-table2';

const tournamentLinkVersion=`20260911-grid4-${Date.now()}`;
document.querySelectorAll('a[href*="tournaments.html"]').forEach(link=>{
  try{
    const url=new URL(link.getAttribute('href'),location.href);
    url.searchParams.set('v',tournamentLinkVersion);
    link.setAttribute('href',url.pathname.split('/').pop()+url.search+url.hash);
  }catch(error){
    console.warn('تعذر تحديث رابط البطولات',error);
  }
});

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
  style.textContent='.tournament-table th,.tournament-table td,.tournament-name,.tournament-date,.status,.champion-name{font-size:14px!important}.detail-toolbar-title,.detail-title,.bracket-title{font-size:20px!important}.detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}.detail-value{font-size:14px!important;font-weight:700!important}.detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:14px!important}.detail-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0!important}.detail-grid>.detail-item{display:grid!important;grid-template-columns:minmax(62px,.9fr) minmax(0,1.25fr)!important;padding:0!important;border-radius:0!important}.detail-grid>.detail-item>.detail-label{font-size:12px!important}.detail-grid>.detail-item>.detail-value{font-size:10px!important}';
  document.head.appendChild(style);

  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='tournament-mobile-fonts.css?v=20260910-detail-scale3';
  document.head.appendChild(link);
}
