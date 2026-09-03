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

  const setup = document.getElementById('matchmakingSetup');
  if (setup) {
    const matchmakingStyle = document.createElement('style');
    matchmakingStyle.textContent = `
      .pre-search-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:20px}
      .pre-search-action{min-height:118px;border:1px solid rgba(224,181,103,.42);border-radius:17px;background:rgba(255,255,255,.035);color:var(--text);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;cursor:pointer;font:inherit;transition:.16s ease}
      .pre-search-action:hover,.pre-search-action:focus-visible{transform:translateY(-2px);border-color:var(--gold);background:rgba(224,181,103,.10);outline:none}
      .pre-search-action.primary{border-color:rgba(224,181,103,.78);background:rgba(224,181,103,.10)}
      .pre-search-icon{font-size:31px;line-height:1;color:var(--gold)}
      .pre-search-label{font-size:15px;font-weight:800;color:#fff}
      .pre-search-note{font-size:11px;color:var(--muted)}
      .pre-search-time-panel{margin-top:12px;padding-top:12px;border-top:1px solid rgba(224,181,103,.18)}
      .pre-search-time-panel .time-options{margin-top:0}
      @media(max-width:600px){
        .pre-search-actions{gap:7px}
        .pre-search-action{min-height:96px;border-radius:13px;padding:8px 4px}
        .pre-search-icon{font-size:25px}.pre-search-label{font-size:12px}.pre-search-note{font-size:9px}
      }
    `;
    document.head.appendChild(matchmakingStyle);

    setup.innerHTML = `
      <div class="matchmaking-piece" aria-hidden="true">♞</div>
      <h2>ابدأ مباراة</h2>
      <p>اختر الطريقة المناسبة، ثم نبدأ البحث عن الخصم.</p>
      <p class="matchmaking-profile" id="matchmakingProfile">جاري تحميل بياناتك...</p>

      <div class="pre-search-actions" aria-label="خيارات اللعب قبل البحث عن خصم">
        <button class="pre-search-action primary" type="button" data-minutes="15" aria-label="لعب الآن لمدة 15 دقيقة">
          <span class="pre-search-icon" aria-hidden="true">⚔️</span>
          <span class="pre-search-label">لعب الآن</span>
          <span class="pre-search-note">بحث مباشر</span>
        </button>

        <button class="pre-search-action" id="invitePlayerAction" type="button">
          <span class="pre-search-icon" aria-hidden="true">👥</span>
          <span class="pre-search-label">دعوة لاعب</span>
          <span class="pre-search-note">لاعب محدد</span>
        </button>

        <button class="pre-search-action" id="chooseTimeAction" type="button" aria-expanded="false" aria-controls="preSearchTimeOptions">
          <span class="pre-search-icon" aria-hidden="true">🕒</span>
          <span class="pre-search-label">اختيار الوقت</span>
          <span class="pre-search-note">5 / 10 / 15</span>
        </button>
      </div>

      <div class="pre-search-time-panel" id="preSearchTimeOptions" hidden>
        <div class="time-options" aria-label="اختيار زمن المباراة">
          <button class="time-option" type="button" data-minutes="5"><strong>5</strong><span>دقائق</span></button>
          <button class="time-option" type="button" data-minutes="10"><strong>10</strong><span>دقائق</span></button>
          <button class="time-option" type="button" data-minutes="15"><strong>15</strong><span>دقيقة</span></button>
        </div>
      </div>
      <p class="matchmaking-error" id="matchmakingError"></p>
    `;

    const chooseTimeAction = document.getElementById('chooseTimeAction');
    const timePanel = document.getElementById('preSearchTimeOptions');
    chooseTimeAction?.addEventListener('click', () => {
      const willOpen = timePanel.hidden;
      timePanel.hidden = !willOpen;
      chooseTimeAction.setAttribute('aria-expanded', String(willOpen));
    });

    document.getElementById('invitePlayerAction')?.addEventListener('click', () => {
      const error = document.getElementById('matchmakingError');
      if (error) error.textContent = 'دعوة لاعب محدد ستتاح من قائمة اللاعبين.';
    });
  }
}
