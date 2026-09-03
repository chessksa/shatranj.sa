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

  const params = new URLSearchParams(location.search || '');
  const isLiveGame = params.has('game');

  if (!isLiveGame) {
    const matchmakingScreen = document.getElementById('matchmakingScreen');
    const setup = document.getElementById('matchmakingSetup');
    const waiting = document.getElementById('matchmakingWaiting');
    const found = document.getElementById('matchmakingFound');
    const gamePage = document.getElementById('gamePage');
    const board = document.getElementById('board');
    const coordsLeft = document.getElementById('coordsLeft');
    const coordsBottom = document.getElementById('coordsBottom');
    const topCard = document.querySelector('.panel-stack > .player-card:first-child');
    const bottomCard = document.querySelector('.panel-stack > .player-card:last-child');
    const actionsCard = document.querySelector('.actions-card');
    const bottomName = document.getElementById('bottomName');
    const bottomLocation = document.getElementById('bottomLocation');
    const bottomRating = document.getElementById('bottomRating');
    const bottomClock = document.getElementById('bottomClock');

    if (matchmakingScreen && setup && waiting && found && gamePage && topCard) {
      const inlineStyle = document.createElement('style');
      if (document.body?.classList) document.body.classList.add('prematch-inline');
      inlineStyle.textContent = `
        body.prematch-inline #matchmakingScreen{display:none!important}
        body.prematch-inline #gamePage{display:block!important}
        .prematch-card{display:block!important;text-align:center;padding:18px!important;overflow:hidden}
        .prematch-card>.avatar,.prematch-card>.player-info,.prematch-card>.clock-box{display:none!important}
        .prematch-card #matchmakingSetup,.prematch-card #matchmakingWaiting,.prematch-card #matchmakingFound{width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .prematch-card #matchmakingSetup[hidden],.prematch-card #matchmakingWaiting[hidden],.prematch-card #matchmakingFound[hidden]{display:none!important}
        .prematch-card h2{margin:0 0 7px;font-size:22px}
        .prematch-card p{margin:0;color:var(--muted);line-height:1.65;font-size:13px}
        .prematch-card .matchmaking-profile{display:none}
        .prematch-card .time-options{width:100%;margin-top:16px;gap:8px}
        .prematch-card .time-option{min-height:78px;border-radius:13px}
        .prematch-card .time-option strong{font-size:26px}
        .prematch-card .time-option span{font-size:12px}
        .prematch-card .search-spinner{width:54px;height:54px;margin-bottom:13px;border-width:4px}
        .prematch-card .search-meta{width:100%;margin-top:14px}
        .prematch-card .cancel-search{margin-top:13px;height:40px;min-width:135px}
        .prematch-card .match-found-icon{width:58px;height:58px;margin-bottom:12px;font-size:28px}
        .prematch-own-card{position:relative}
        .prematch-own-card .status{visibility:visible}
        @media(max-width:900px){
          .prematch-card{padding:10px!important;min-height:118px!important}
          .prematch-card h2{font-size:17px}.prematch-card p{font-size:11px}
          .prematch-card .time-options{margin-top:9px}.prematch-card .time-option{min-height:58px}.prematch-card .time-option strong{font-size:20px}.prematch-card .time-option span{font-size:10px}
          .prematch-card .search-meta{margin-top:8px}.prematch-card .search-spinner{width:42px;height:42px;margin-bottom:8px}
        }
      `;
      document.head.appendChild(inlineStyle);

      topCard.className = `${topCard.className || 'player-card'} prematch-card`;
      if (bottomCard) bottomCard.className = `${bottomCard.className || 'player-card'} prematch-own-card`;

      setup.innerHTML = `
        <h2>اختر وقت المباراة</h2>
        <p>سيظهر الخصم هنا فور العثور عليه.</p>
        <p class="matchmaking-profile" id="matchmakingProfile">جاري تحميل بياناتك...</p>
        <div class="time-options" aria-label="اختيار زمن المباراة">
          <button class="time-option" type="button" data-minutes="5"><strong>5</strong><span>دقائق</span></button>
          <button class="time-option" type="button" data-minutes="10"><strong>10</strong><span>دقائق</span></button>
          <button class="time-option" type="button" data-minutes="15"><strong>15</strong><span>دقيقة</span></button>
        </div>
        <p class="matchmaking-error" id="matchmakingError"></p>
      `;

      topCard.appendChild(setup);
      topCard.appendChild(waiting);
      topCard.appendChild(found);

      matchmakingScreen.hidden = true;
      gamePage.hidden = false;
      if (actionsCard) actionsCard.hidden = true;

      const keepBoardVisible = () => {
        if (gamePage.hidden) gamePage.hidden = false;
        if (!matchmakingScreen.hidden) matchmakingScreen.hidden = true;
      };
      keepBoardVisible();
      if (typeof MutationObserver !== 'undefined') {
        const visibilityGuard = new MutationObserver(keepBoardVisible);
        visibilityGuard.observe(gamePage, { attributes:true, attributeFilter:['hidden'] });
        visibilityGuard.observe(matchmakingScreen, { attributes:true, attributeFilter:['hidden'] });
      }

      const pieceSVG = (type,color) => {
        const cls = color === 'w' ? 'white' : 'black';
        const base = (inner) => `<div class="piece ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg></div>`;
        const sharedBase = `<ellipse class="fill-accent" cx="50" cy="88" rx="26" ry="7"></ellipse><rect class="fill-main" x="26" y="80" width="48" height="8" rx="4"></rect><path class="stroke-main" d="M25 80h50M30 88h40" stroke-width="2.6" fill="none" stroke-linecap="round"></path>`;
        if(type==='p') return base(`<circle class="fill-main" cx="50" cy="27" r="12"></circle><path class="fill-main" d="M50 39c10 0 18 8 18 18v2H32v-2c0-10 8-18 18-18z"></path><path class="fill-accent" d="M39 58h22c5 0 9 4 9 9v5H30v-5c0-5 4-9 9-9z"></path><path class="stroke-main" d="M38 58h24M35 71h30" stroke-width="2.4" fill="none" stroke-linecap="round"></path>${sharedBase}`);
        if(type==='r') return base(`<path class="fill-main" d="M30 22h8v8h6v-8h12v8h6v-8h8v15H30z"></path><path class="fill-main" d="M35 37h30v30H35z"></path><path class="fill-accent" d="M30 66h40v12H30z"></path><path class="stroke-main" d="M30 37h40M37 46h26M34 66h32" stroke-width="2.4" fill="none" stroke-linecap="round"></path>${sharedBase}`);
        if(type==='n') return base(`<path class="fill-main" d="M68 25c-7 0-13 3-18 8l-8 9-8 3 6 8-2 18h28c2-5 4-11 4-18 0-6-2-11-6-14l6-6c4-4 4-8-2-8z"></path><path class="fill-accent" d="M40 71h25c5 0 8 3 8 7H36c0-4 1-7 4-7z"></path><circle class="fill-accent" cx="59" cy="36" r="2.8"></circle><path class="stroke-main" d="M52 31c4 1 8 4 10 8M45 48c7 1 13 6 17 14M39 71h30" stroke-width="2.4" fill="none" stroke-linecap="round"></path>${sharedBase}`);
        if(type==='b') return base(`<path class="fill-main" d="M50 18c9 0 15 7 15 16 0 7-5 11-10 15 5 4 9 10 9 18v2H36v-2c0-8 4-14 9-18-5-4-10-8-10-15 0-9 6-16 15-16z"></path><path class="stroke-main" d="M56 27l-10 14M40 69h20" stroke-width="2.6" fill="none" stroke-linecap="round"></path><path class="fill-accent" d="M34 69h32c5 0 8 4 8 9H26c0-5 3-9 8-9z"></path>${sharedBase}`);
        if(type==='q') return base(`<circle class="fill-main" cx="28" cy="22" r="5"></circle><circle class="fill-main" cx="42" cy="16" r="5"></circle><circle class="fill-main" cx="58" cy="16" r="5"></circle><circle class="fill-main" cx="72" cy="22" r="5"></circle><path class="fill-main" d="M28 28l8 14 10-14 8 14 10-14 8 14-4 4H32l-4-4z"></path><path class="fill-accent" d="M35 46h30l4 23H31z"></path><path class="fill-accent" d="M31 69h38c5 0 8 4 8 9H23c0-5 3-9 8-9z"></path><path class="stroke-main" d="M35 46h30M38 57h24M38 69h24" stroke-width="2.3" fill="none" stroke-linecap="round"></path>${sharedBase}`);
        if(type==='k') return base(`<path class="fill-main" d="M35 26l8-8 7 10 7-10 8 8-4 6H39z"></path><path class="fill-accent" d="M38 32h24l5 15-6 5H39l-6-5z"></path><path class="fill-main" d="M42 52h16c7 0 13 7 13 16v1H29v-1c0-9 6-16 13-16z"></path><path class="fill-accent" d="M31 69h38c5 0 8 4 8 9H23c0-5 3-9 8-9z"></path><path class="stroke-main" d="M38 32h24M42 52h16M38 69h24" stroke-width="2.4" fill="none" stroke-linecap="round"></path>${sharedBase}`);
        return '';
      };

      if (board && board.children.length === 0) {
        const position = [
          ['r','n','b','q','k','b','n','r'],
          ['p','p','p','p','p','p','p','p'],
          [null,null,null,null,null,null,null,null],
          [null,null,null,null,null,null,null,null],
          [null,null,null,null,null,null,null,null],
          [null,null,null,null,null,null,null,null],
          ['P','P','P','P','P','P','P','P'],
          ['R','N','B','Q','K','B','N','R']
        ];
        position.forEach((row, r) => row.forEach((token, c) => {
          const square = document.createElement('div');
          square.className = `square ${(r+c)%2===0 ? 'light' : 'dark'}`;
          if (token) {
            const color = token === token.toUpperCase() ? 'w' : 'b';
            square.innerHTML = pieceSVG(token.toLowerCase(), color);
          }
          board.appendChild(square);
        }));
      }

      if (coordsLeft && coordsLeft.children.length === 0) {
        [8,7,6,5,4,3,2,1].forEach(rank => {
          const el = document.createElement('div'); el.textContent = rank; coordsLeft.appendChild(el);
        });
      }
      if (coordsBottom && coordsBottom.children.length === 0) {
        ['a','b','c','d','e','f','g','h'].forEach(file => {
          const el = document.createElement('div'); el.textContent = file; coordsBottom.appendChild(el);
        });
      }

      if (bottomName) bottomName.textContent = 'أنت';
      if (bottomLocation) bottomLocation.textContent = '—';
      if (bottomRating) bottomRating.textContent = '—';

      const profile = document.getElementById('matchmakingProfile');
      const syncProfile = () => {
        if (!profile) return;
        const text = (profile.textContent || '').trim();
        const match = text.match(/^(.*?)\s+—\s+تصنيف\s+(\d+)/);
        if (!match) return;
        if (bottomName) bottomName.textContent = match[1];
        if (bottomRating) bottomRating.textContent = match[2];
      };
      syncProfile();
      if (profile && typeof MutationObserver !== 'undefined') {
        new MutationObserver(syncProfile).observe(profile, { childList:true, characterData:true, subtree:true });
      }

      let selectedMinutes = null;
      const keepSelectedClock = () => {
        if (bottomClock && selectedMinutes) {
          const expected = `${String(selectedMinutes).padStart(2,'0')}:00`;
          if (bottomClock.textContent !== expected) bottomClock.textContent = expected;
        }
      };
      if (typeof setup.querySelectorAll === 'function') {
        setup.querySelectorAll('[data-minutes]').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedMinutes = Number(btn.dataset.minutes) || null;
            keepSelectedClock();
          });
        });
      }
      if (bottomClock && typeof MutationObserver !== 'undefined') {
        new MutationObserver(keepSelectedClock).observe(bottomClock, { childList:true, characterData:true, subtree:true });
      }
    }
  }
}
