window.SHATRANJ_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://zjxkxhsvltihucdacjrv.supabase.co",
    anonKey: "sb_publishable_bwFGOiJzT_Xv656pLPR8ww_oJxFzSGJ"
  }
};

(() => {
  const src = 'gender-feature.js?v=20260902-1';
  if (document.readyState === 'loading') {
    document.write('<script src="' + src + '"><\/script>');
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
})();
