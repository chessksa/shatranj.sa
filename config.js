(() => {
  const version = '20260910-pull-refresh1';
  const baseSrc = `config-base.js?v=${version}`;
  const refreshSrc = `pull-to-refresh.js?v=${version}`;

  if (typeof document === 'undefined') return;

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
