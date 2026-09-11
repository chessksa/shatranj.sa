(() => {
  const version = '20260911-tournament-grid1';
  const baseSrc = `config-base.js?v=${version}`;
  const refreshSrc = `pull-to-refresh.js?v=${version}`;

  if (typeof document === 'undefined') return;

  if (/\/tournaments\.html$/.test(location.pathname)) {
    const style = document.createElement('style');
    style.id = 'tournament-detail-4x4';
    style.textContent = `
      .detail-grid{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:0!important;
        overflow:hidden!important;
        border:1px solid rgba(216,182,101,.22)!important;
        border-radius:12px!important;
        background:rgba(3,38,40,.24)!important;
      }
      .detail-grid>.detail-item{
        display:grid!important;
        grid-template-columns:minmax(66px,.9fr) minmax(0,1.35fr)!important;
        min-width:0!important;
        padding:0!important;
        border:0!important;
        border-bottom:1px solid rgba(216,182,101,.18)!important;
        border-radius:0!important;
        background:transparent!important;
      }
      .detail-grid>.detail-item:nth-child(odd){
        border-left:1px solid rgba(216,182,101,.18)!important;
      }
      .detail-grid>.detail-item>.detail-label,
      .detail-grid>.detail-item>.detail-value{
        min-width:0!important;
        min-height:36px!important;
        margin:0!important;
        padding:6px 5px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        line-height:1.25!important;
        overflow-wrap:anywhere!important;
      }
      .detail-grid>.detail-item>.detail-label{
        border-left:1px solid rgba(216,182,101,.18)!important;
        background:rgba(216,182,101,.045)!important;
        color:#d9c58f!important;
        font-size:12px!important;
        font-weight:900!important;
      }
      .detail-grid>.detail-item>.detail-value{
        background:rgba(3,38,40,.18)!important;
        color:var(--hero-cream)!important;
        font-size:10px!important;
        font-weight:700!important;
      }
      @media(max-width:700px){
        .detail-grid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
        }
        .detail-grid>.detail-item{
          grid-template-columns:minmax(62px,.9fr) minmax(0,1.25fr)!important;
        }
        .detail-grid>.detail-item>.detail-label,
        .detail-grid>.detail-item>.detail-value{
          min-height:34px!important;
          padding:5px 4px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading' && document.currentScript) {
    document.write(`<script src="${baseSrc}"><\/script><script src="${refreshSrc}"><\/script>`);
    return;
  }

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  loadScript(baseSrc).then(() => loadScript(refreshSrc)).catch((error) => {
    console.error('تعذر تحميل إعدادات شطرنج العرب', error);
  });
})();
