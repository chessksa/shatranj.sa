import './pull-to-refresh.js?v=20260910-tournament-pull1';
import './site-presence-base.js?v=20260910-tournament-detail-table2';

if(!document.querySelector('link[data-v2-shell]')){
  const shellStyle=document.createElement('link');
  shellStyle.rel='stylesheet';
  shellStyle.href='v2/site/shell.css?v=20260912-v2-shell1';
  shellStyle.dataset.v2Shell='1';
  document.head.appendChild(shellStyle);
}
void import('./v2/site/shell.mjs?v=20260912-v2-shell1');

const tournamentLinkVersion=`20260911-grid5-${Date.now()}`;
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
  style.textContent='.tournament-table th,.tournament-table td,.tournament-name,.tournament-date,.status,.champion-name{font-size:14px!important}.detail-toolbar-title,.detail-title,.bracket-title{font-size:20px!important}.detail-label,.bracket-round-title{font-size:16px!important;font-weight:900!important}.detail-value{font-size:14px!important;font-weight:700!important}.detail-shell .status,.bracket-player,.bracket-meta,.bracket-empty{font-size:14px!important}.detail-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;overflow:hidden!important;border:1px solid rgba(216,182,101,.22)!important;border-radius:12px!important;background:rgba(3,38,40,.24)!important;direction:rtl!important}.detail-grid>.detail-item{display:contents!important}.detail-grid>.detail-item>.detail-label,.detail-grid>.detail-item>.detail-value{min-width:0!important;min-height:36px!important;margin:0!important;padding:5px 4px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1.2!important;overflow-wrap:anywhere!important;border-left:1px solid rgba(216,182,101,.18)!important;border-bottom:1px solid rgba(216,182,101,.18)!important}.detail-grid>.detail-item>.detail-label{font-size:16px!important;font-weight:900!important;background:rgba(216,182,101,.045)!important;color:#d9c58f!important}.detail-grid>.detail-item>.detail-value{font-size:14px!important;font-weight:700!important;background:rgba(3,38,40,.18)!important;color:var(--hero-cream)!important}@media(max-width:700px){.detail-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.detail-grid>.detail-item>.detail-label,.detail-grid>.detail-item>.detail-value{min-height:34px!important;padding:4px 3px!important}}';
  document.head.appendChild(style);

  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='tournament-mobile-fonts.css?v=20260910-detail-scale3';
  document.head.appendChild(link);
}
