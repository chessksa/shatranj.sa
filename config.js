window.SHATRANJ_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://zjxkxhsvltihucdacjrv.supabase.co",
    anonKey: "sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ"
  }
};

if (typeof document !== 'undefined' && typeof location !== 'undefined' && /(?:^|\/)play\.html$/.test(location.pathname)) {
  const pieceTheme = document.createElement('link');
  pieceTheme.rel = 'stylesheet';
  pieceTheme.href = 'dubrovnik-pieces.css?v=20260903-1';
  document.head.appendChild(pieceTheme);
}
