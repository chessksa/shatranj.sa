const cleanupCss=document.createElement('link');
cleanupCss.rel='stylesheet';
cleanupCss.href='v2/home/desktop-sidebar-cleanup.css?v=20260918-sidebar-clean3';
document.head.appendChild(cleanupCss);

function cleanupDesktopSidebar(){
  if(!window.matchMedia('(min-width:901px)').matches)return;
  document.querySelector('.desktop-sidebar-footer')?.remove();
}

cleanupDesktopSidebar();
setTimeout(cleanupDesktopSidebar,100);
setTimeout(cleanupDesktopSidebar,500);
