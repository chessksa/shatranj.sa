from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Add the demo entry point to the tournaments page.
tournaments_path = ROOT / 'tournaments.html'
tournaments = tournaments_path.read_text(encoding='utf-8')

css_anchor = ".status{display:inline-flex;border-radius:999px;padding:6px 10px;border:1px solid var(--hero-line);font-size:13px;font-weight:900}"
css_insert = ".page-head-actions{display:flex;align-items:center;gap:10px}.demo-link{min-height:38px;padding:0 12px;border:1px solid rgba(216,182,101,.42);border-radius:11px;background:rgba(216,182,101,.08);color:var(--hero-gold-2);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;white-space:nowrap}.demo-link:hover{background:rgba(216,182,101,.14)}\n" + css_anchor
if 'class="demo-link"' not in tournaments:
    if css_anchor not in tournaments:
        raise SystemExit('tournaments CSS anchor not found')
    tournaments = tournaments.replace(css_anchor, css_insert, 1)

mobile_anchor = "@media(max-width:700px){.wrap{width:min(100% - 18px,1180px)}"
mobile_replace = "@media(max-width:700px){.wrap{width:min(100% - 18px,1180px)}.page-head-actions{width:100%;justify-content:space-between}.demo-link{min-height:36px;padding:0 10px;font-size:11px}"
if mobile_replace not in tournaments:
    if mobile_anchor not in tournaments:
        raise SystemExit('tournaments mobile CSS anchor not found')
    tournaments = tournaments.replace(mobile_anchor, mobile_replace, 1)

head_old = '  <div class="page-head"><div><h1>البطولات</h1><p>اختر البطولة لعرض تفاصيلها والتسجيل فيها.</p></div><div id="tournamentCount" class="count">0 بطولة</div></div>'
head_new = '  <div class="page-head"><div><h1>البطولات</h1><p>اختر البطولة لعرض تفاصيلها والتسجيل فيها.</p></div><div class="page-head-actions"><a class="demo-link" href="play-v10.html?demo_tournament=1">عرض مثال مباراة بطولة</a><div id="tournamentCount" class="count">0 بطولة</div></div></div>'
if head_new not in tournaments:
    if head_old not in tournaments:
        raise SystemExit('tournaments page-head anchor not found')
    tournaments = tournaments.replace(head_old, head_new, 1)

tournaments_path.write_text(tournaments, encoding='utf-8')

# Add an isolated demo route to the modern play page.
play_path = ROOT / 'play-v10.html'
play = play_path.read_text(encoding='utf-8')
route_old = """    const params = new URLSearchParams(location.search);\n    const computerMode = params.has('computer');\n    const hasGame = Boolean(params.get('game'));\n    if(computerMode){\n"""
route_new = """    const params = new URLSearchParams(location.search);\n    const demoTournament = params.get('demo_tournament')==='1';\n    const computerMode = params.has('computer');\n    const hasGame = Boolean(params.get('game'));\n    if(demoTournament){\n      document.body.classList.add('live-game','tournament-demo');\n      const s=document.createElement('script');\n      s.type='module';\n      s.src='play-tournament-demo.js?v=20260909-1';\n      document.body.appendChild(s);\n    }else if(computerMode){\n"""
if route_new not in play:
    if route_old not in play:
        raise SystemExit('play-v10 route anchor not found')
    play = play.replace(route_old, route_new, 1)
play_path.write_text(play, encoding='utf-8')

# Add the standalone visual demo. It intentionally has no Supabase client or RPC calls.
demo_path = ROOT / 'play-tournament-demo.js'
demo_path.write_text("""import { Chessboard, COLOR, BORDER_TYPE } from 'https://cdn.jsdelivr.net/npm/cm-chessboard@8/src/Chessboard.js';

const $ = (id) => document.getElementById(id);
const board = $('board');
const tournamentGameBadge = $('tournamentGameBadge');
const tournamentGameName = $('tournamentGameName');
const tournamentGameRound = $('tournamentGameRound');
const opponentSearchPanel = $('opponentSearchPanel');
const topPlayerLive = $('topPlayerLive');
const topName = $('topName');
const bottomName = $('bottomName');
const topLocation = $('topLocation');
const bottomLocation = $('bottomLocation');
const topRating = $('topRating');
const bottomRating = $('bottomRating');
const topClock = $('topClock');
const bottomClock = $('bottomClock');
const resignBtn = $('resignBtn');
const drawOffer = $('drawOffer');
const endGraceBtn = $('endGraceBtn');
const reportBtn = $('reportBtn');
const leaveBtn = $('leaveBtn');
const leaveText = $('leaveText');
const coordsLeft = $('coordsLeft');
const coordsBottom = $('coordsBottom');

function ensureCmStyles(){
  if(!document.querySelector('link[data-cm-chessboard-core]')){
    const core=document.createElement('link');
    core.rel='stylesheet';
    core.href='https://cdn.jsdelivr.net/npm/cm-chessboard@8/assets/chessboard.css';
    core.dataset.cmChessboardCore='1';
    document.head.appendChild(core);
  }
  if(!document.querySelector('link[data-cm-chessboard-shatranj]')){
    const theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='cm-chessboard-shatranj-v3.css?v=20260904-3';
    theme.dataset.cmChessboardShatranj='1';
    document.head.appendChild(theme);
  }
}

function renderCoords(){
  if(coordsLeft){
    coordsLeft.replaceChildren(...[8,7,6,5,4,3,2,1].map(value=>{
      const el=document.createElement('div');el.textContent=String(value);return el;
    }));
  }
  if(coordsBottom){
    coordsBottom.replaceChildren(...['a','b','c','d','e','f','g','h'].map(value=>{
      const el=document.createElement('div');el.textContent=value;return el;
    }));
  }
}

if(tournamentGameBadge) tournamentGameBadge.hidden = false;
if(tournamentGameName) tournamentGameName.textContent = 'البداية';
if(tournamentGameRound) tournamentGameRound.textContent = 'نصف النهائي';
if(opponentSearchPanel) opponentSearchPanel.hidden = true;
if(topPlayerLive) topPlayerLive.hidden = false;

if(topName) topName.textContent = 'اللاعب الأول';
if(bottomName) bottomName.textContent = 'اللاعب الثاني';
if(topLocation) topLocation.textContent = 'الرياض';
if(bottomLocation) bottomLocation.textContent = 'جدة';
if(topRating) topRating.textContent = '1540';
if(bottomRating) bottomRating.textContent = '1512';
if(topClock) topClock.textContent = '05:00';
if(bottomClock) bottomClock.textContent = '05:00';

[resignBtn,drawOffer,endGraceBtn].forEach(button=>{if(button) button.disabled=true;});
if(reportBtn) reportBtn.hidden=true;
if(leaveText) leaveText.textContent='العودة للبطولات';
if(leaveBtn) leaveBtn.addEventListener('click',()=>{location.href='tournaments.html';});

document.title='مثال مباراة بطولة | شطرنج العرب';
renderCoords();
ensureCmStyles();

if(board){
  board.className='cm-board-host';
  new Chessboard(board,{
    position:'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    orientation:COLOR.white,
    responsive:true,
    assetsUrl:'assets/',
    style:{
      cssClass:'shatranj',
      showCoordinates:false,
      borderType:BORDER_TYPE.none,
      pieces:{file:'pieces/shatranj-approved-20260904.svg?v=20260905-3',tileSize:40},
      animationDuration:0
    }
  });
}
""", encoding='utf-8')

print('tournament game demo implementation applied')
