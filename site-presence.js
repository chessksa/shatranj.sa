import './pull-to-refresh.js?v=20260910-pull-dots1';
import './site-presence-base.js?v=20260910-pull-dots1';

if(document.querySelector('.tournament-table')){
  const style=document.createElement('style');
  style.id='tournamentFont14Override';
  style.textContent='.tournament-table th,.tournament-table td,.tournament-name,.tournament-date,.status,.champion-name{font-size:14px!important}.detail-label,.detail-value{font-size:12px!important}';
  document.head.appendChild(style);

  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='tournament-mobile-fonts.css?v=20260910-font14-detail12';
  document.head.appendChild(link);
}
