import './pull-to-refresh.js?v=20260910-pull-dots1';
import './site-presence-base.js?v=20260910-pull-dots1';

if(document.querySelector('.tournament-table')){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='tournament-mobile-fonts.css?v=20260910-font14';
  document.head.appendChild(link);
}
