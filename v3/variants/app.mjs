import { Chess as Chess960, GAME_VARIANT } from 'https://cdn.jsdelivr.net/npm/cm-chess@4.0.0/+esm';
import { Chess as StandardChess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';
import { requirePlayer, rpc, supabase, escapeHtml } from '../../v2/platform/api.mjs';
import { loadBoardPreferences } from '../../v2/board/preferences.mjs';
import { getBoardTheme } from '../../v2/board/themes.mjs';

const $=id=>document.getElementById(id);
const {player}=await requirePlayer();
const board=$('variantBoard');

const variantLabel={
  chess960:'Chess960',threecheck:'Three-Check',kingofthehill:'King of the Hill',
  crazyhouse:'Crazyhouse',atomic:'Atomic',antichess:'Antichess',horde:'Horde',racingkings:'Racing Kings'
};
const ruleText={
  chess960:'Chess960: ترتيب البداية عشوائي قانوني، والملك بين الرخين.',
  threecheck:'Three-Check: أول لاعب يعطي الخصم ثلاث كشوف يفوز، مع بقاء كش مات فوزًا مباشرًا.',
  kingofthehill:'King of the Hill: تفوز عند وصول ملكك إلى d4 أو e4 أو d5 أو e5 بنقلة قانونية.',
  crazyhouse:'Crazyhouse: القطعة التي تأسرها تدخل جيبك ويمكن إسقاطها لاحقًا على مربع قانوني.',
  atomic:'Atomic: الأسر يفجّر قطعة الأسر والقطع المجاورة وفق قواعد Atomic، وتفجير الملك ينهي المباراة.',
  antichess:'Antichess: الأسر إجباري عند توفره، والهدف التخلص من جميع قطعك أو الوصول إلى وضع بلا نقلة.',
  horde:'Horde: الأبيض يبدأ بحشد من البيادق بلا ملك في مواجهة جيش الأسود؛ لكل طرف شرط فوز مختلف.',
  racingkings:'Racing Kings: سباق الملكين إلى الصف الثامن، وإعطاء الكش غير مسموح.'
};
const advancedModes=new Set(['crazyhouse','atomic','antichess','horde','racingkings']);
const centerSquares=new Set(['d4','e4','d5','e5']);
const pocketRoleCode={pawn:'P',knight:'N',bishop:'B',rook:'R',queen:'Q'};
const pocketRoles=['pawn','knight','bishop','rook','queen'];
const previewFen={
  crazyhouse:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1',
  atomic:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  antichess:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1',
  horde:'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1',
  racingkings:'8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1'
};

let current=null;
let chess=null;
let selected=null;
let selectedPocketRole=null;
let legal=[];
let legalMoves=[];
let pockets=null;
let poll=null,clockTimer=null,queueTimer=null;
let searching=false,searchVariant='chess960';

function theme(){const t=getBoardTheme(loadBoardPreferences().theme);board.style.setProperty('--board-light',t.light);board.style.setProperty('--board-dark',t.dark)}
function isAdvanced(mode=current?.variant||$('variantMode').value){return advancedModes.has(mode)}
function boardFen(){if(current?.fen)return current.fen;if(chess?.fen)return chess.fen();return previewFen[$('variantMode').value]||'8/8/8/8/8/8/8/8 w - - 0 1'}
function parse(fen){const m=new Map();const boardPart=String(fen||'').split(' ')[0].replace(/\[[^\]]*\]$/,'');boardPart.split('/').forEach((row,ri)=>{let f=0;for(const c of row){if(c==='~')continue;if(/\d/.test(c)){f+=Number(c);continue}if(!/[prnbqk]/i.test(c))continue;m.set(`${String.fromCharCode(97+f)}${8-ri}`,{color:c===c.toUpperCase()?'w':'b',type:c.toLowerCase()});f++}});return m}
function squares(){const color=current?.my_color||'w',files=color==='w'?['a','b','c','d','e','f','g','h']:['h','g','f','e','d','c','b','a'],ranks=color==='w'?[8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8];return ranks.flatMap(r=>files.map(f=>`${f}${r}`))}
function canMove(){return current?.status==='active'&&current.turn===current.my_color}
function pieceAt(square){if(isAdvanced())return parse(boardFen()).get(square)||null;if(!chess)return null;return current?.variant==='chess960'?chess.piece(square):chess.get(square)}
function localLegalFor(square){try{return chess?.moves({square,verbose:true})||[]}catch{return[]}}
function serverLegalFor(square){return legalMoves.filter(uci=>/^[a-h][1-8][a-h][1-8]/.test(uci)&&uci.slice(0,2)===square).map(uci=>({from:square,to:uci.slice(2,4),promotion:uci[4]||null,uci}))}
function legalFor(square){return isAdvanced()?serverLegalFor(square):localLegalFor(square)}
function createEngine(game){if(game?.variant==='chess960')return new Chess960({fen:game.fen,gameVariant:GAME_VARIANT.chess960});if(!isAdvanced(game?.variant))return new StandardChess(game?.fen);return null}
function previewEngine(){const mode=$('variantMode').value;if(mode==='chess960')return new Chess960({gameVariant:GAME_VARIANT.chess960});if(!advancedModes.has(mode))return new StandardChess();return null}

function renderBoard(){const pos=parse(boardFen()),frag=document.createDocumentFragment();for(const name of squares()){const file=name.charCodeAt(0)-97,rank=Number(name[1]),sq=document.createElement('button');sq.type='button';sq.dataset.square=name;sq.className=`variant-square ${(file+rank)%2===1?'light':'dark'}${selected===name?' selected':''}${current?.variant==='kingofthehill'&&centerSquares.has(name)?' center':''}`;const p=pos.get(name);if(p){const img=document.createElement('img');img.className='variant-piece';img.src=`assets/pieces/${p.color}${p.type}.png`;img.alt='';sq.appendChild(img)}frag.appendChild(sq)}board.replaceChildren(frag);for(const m of legal)board.querySelector(`[data-square="${m.to}"]`)?.classList.add('target');renderPockets()}
function renderPocket(hostId,color){const host=$(hostId);const show=(current?.variant||$('variantMode').value)==='crazyhouse';host.classList.toggle('show',show);if(!show){host.replaceChildren();return}const values=pockets?.[color]||{};const colorCode=color==='white'?'w':'b';const canUse=Boolean(current&&current.my_color===colorCode&&canMove());const frag=document.createDocumentFragment();for(const role of pocketRoles){const count=Number(values[role]||0);const button=document.createElement('button');button.type='button';button.className=`variant-pocket-piece ${selectedPocketRole===role&&current?.my_color===colorCode?'selected':''}`;button.dataset.role=role;button.disabled=!canUse||count<1;button.innerHTML=`<img src="assets/pieces/${colorCode}${role[0]==='k'?'n':role[0]}.png" alt=""><b>${count}</b>`;button.addEventListener('click',()=>selectPocket(role,colorCode));frag.appendChild(button)}const label=document.createElement('span');label.className='variant-pocket-label';label.textContent=color==='white'?'جيب الأبيض':'جيب الأسود';frag.appendChild(label);host.replaceChildren(frag)}
function renderPockets(){renderPocket('variantBlackPocket','black');renderPocket('variantWhitePocket','white')}
function selectPocket(role,colorCode){if(!current||current.variant!=='crazyhouse'||current.my_color!==colorCode||!canMove())return;selected=null;if(selectedPocketRole===role){selectedPocketRole=null;legal=[];renderBoard();return}selectedPocketRole=role;const prefix=`${pocketRoleCode[role]}@`;legal=legalMoves.filter(uci=>uci.startsWith(prefix)).map(uci=>({to:uci.slice(2,4),uci}));renderBoard()}

function fmt(ms){ms=Math.max(0,Math.ceil(ms/1000));const m=Math.floor(ms/60),s=ms%60;return `${m}:${String(s).padStart(2,'0')}`}
function clocks(){if(!current){const base=Number(($('variantTime').value||'600,0').split(',')[0])*1000;return{w:base,b:base}}let w=Number(current.white_ms),b=Number(current.black_ms);if(current.status==='active'&&current.clock_anchor_at){const e=Math.max(0,Date.now()-Date.parse(current.clock_anchor_at));if(current.turn==='w')w-=e;else b-=e}return{w:Math.max(0,w),b:Math.max(0,b)}}
function terminationLabel(value){if(String(value||'').startsWith('variant:'))return 'حسم بقواعد النمط';return({checkmate:'كش مات','third-check':'الكشف الثالث','king-of-the-hill':'ملك التل',stalemate:'بات',draw:'تعادل',agreement:'اتفاق',resign:'استسلام',timeout:'انتهاء الوقت'})[value]||value||''}
function renderMeta(){const c=clocks();$('whiteClock').textContent=fmt(c.w);$('blackClock').textContent=fmt(c.b);$('whiteName').textContent=current?.white_name||'الأبيض';$('blackName').textContent=current?.black_name||'الأسود';const checkMeta=current?.variant==='threecheck'?{w:` · كشوف ${Number(current.white_checks||0)}/3`,b:` · كشوف ${Number(current.black_checks||0)}/3`}:{w:'',b:''};$('whiteMeta').textContent=current?`${current.white_player_id===player.id?' · أنت':''}${checkMeta.w}`:'';$('blackMeta').textContent=current?`${current.black_player_id===player.id?' · أنت':''}${checkMeta.b}`:'';$('whitePlayer').classList.toggle('turn',current?.status==='active'&&current.turn==='w');$('blackPlayer').classList.toggle('turn',current?.status==='active'&&current.turn==='b');$('variantDraw').disabled=!current||current.status!=='active';$('variantResign').disabled=!current||current.status!=='active';$('variantMode').disabled=Boolean(current?.status==='active'||searching);if(!current){$('variantStatus').textContent='اختر النمط والزمن وابدأ البحث.';return}const opp=current.my_color==='w'?current.black_name:current.white_name;const mode=variantLabel[current.variant]||current.variant;let extra='';if(current.variant==='chess960')extra=` · البداية #${current.start_index}`;else if(current.variant==='threecheck')extra=` · الكشوف ${Number(current.white_checks||0)}-${Number(current.black_checks||0)}`;else if(current.variant==='kingofthehill')extra=' · المركز هو الهدف';else if(current.variant==='crazyhouse')extra=' · الأسر يدخل الجيب';if(current.status==='active')$('variantStatus').textContent=`${mode} · ${current.turn===current.my_color?'دورك':'دور الخصم'} · ضد ${opp}${extra} · ${current.rated?'نقاط':'ودي'}`;else $('variantStatus').textContent=`${mode} · انتهت ${current.result||''} · ${terminationLabel(current.termination)}`;if(current?.status==='active'&&c[current.turn]<=0)void invoke({action:'timeout',gameId:current.game_id},current.variant).then(()=>loadGame(current.game_id)).catch(()=>{})}

function edgeFor(mode){if(mode==='chess960')return'variant-game-v3';if(advancedModes.has(mode))return'advanced-variant-v4';return'standard-variant-v3'}
async function invoke(body,mode=current?.variant||searchVariant||$('variantMode').value){const {data,error}=await supabase.functions.invoke(edgeFor(mode),{body});if(error)throw error;if(data?.error)throw new Error(data.error);return data}
async function listGames(){try{const rows=await rpc('v3_list_my_variant_games',{p_limit:30});$('variantGames').innerHTML=(rows||[]).map(g=>{const opp=g.my_color==='w'?g.black_name:g.white_name;const meta=g.variant==='chess960'?`بداية #${g.start_index}`:(variantLabel[g.variant]||g.variant);return `<a class="variant-game-row" href="variants.html?game=${encodeURIComponent(g.game_id)}"><span><strong>${escapeHtml(opp)}</strong><small class="platform-muted"> · ${escapeHtml(meta)}</small></span><span class="platform-badge">${g.status==='active'?(g.turn===g.my_color?'دورك':'جارية'):(g.result||'منتهية')}</span></a>`}).join('')||'<div class="platform-empty">لا توجد مباريات في الأنماط بعد.</div>';return rows||[]}catch(e){console.error(e);return[]}}
async function loadGame(id){if(!id){current=null;legalMoves=[];pockets=null;chess=previewEngine();selected=null;selectedPocketRole=null;legal=[];$('variantMode').disabled=searching;renderBoard();renderMeta();return}try{const rows=await rpc('v3_get_variant_game',{p_game_id:id});const hint=Array.isArray(rows)?rows[0]:rows;if(!hint)throw new Error('not found');if(advancedModes.has(hint.variant)){const state=await invoke({action:'state',gameId:id},hint.variant);current=state.game;legalMoves=state.legalMoves||[];pockets=state.pockets||null;chess=null}else{current=hint;legalMoves=[];pockets=null;chess=createEngine(hint)}$('variantMode').value=current.variant;updateModeInfo(false);selected=null;selectedPocketRole=null;legal=[];renderBoard();renderMeta();await listGames();const u=new URL(location.href);if(u.searchParams.get('game')!==id){u.searchParams.set('game',id);history.replaceState({},'',u)}}catch(e){console.error(e);$('variantStatus').textContent='تعذر تحميل مباراة النمط.'}}
async function makeMove(move){if(!current||!canMove())return;try{board.style.pointerEvents='none';let payload;if(advancedModes.has(current.variant))payload={action:'move',gameId:current.game_id,expectedPly:current.ply,uci:move.uci};else if(current.variant==='chess960')payload={action:'move',gameId:current.game_id,expectedPly:current.ply,san:move.san};else payload={action:'move',gameId:current.game_id,expectedPly:current.ply,from:move.from,to:move.to,promotion:move.promotion||null};await invoke(payload,current.variant);await loadGame(current.game_id)}catch(e){console.error(e);$('variantStatus').textContent=e.message?.includes('Illegal')?'نقلة غير قانونية.':'تعذر تنفيذ النقلة.';await loadGame(current.game_id)}finally{board.style.pointerEvents=''}}

board.addEventListener('click',async e=>{if(!canMove())return;const el=e.target.closest('.variant-square');if(!el)return;const sq=el.dataset.square;if(selectedPocketRole){const drop=legal.find(m=>m.to===sq);if(drop){selectedPocketRole=null;legal=[];await makeMove(drop)}else{selectedPocketRole=null;legal=[];renderBoard()}return}const p=pieceAt(sq);if(!selected){if(p?.color===current.my_color){selected=sq;legal=legalFor(sq);renderBoard()}return}if(sq===selected){selected=null;legal=[];renderBoard();return}const move=legal.find(m=>m.to===sq);if(move){selected=null;legal=[];await makeMove(move);return}if(p?.color===current.my_color){selected=sq;legal=legalFor(sq);renderBoard()}else{selected=null;legal=[];renderBoard()}});

async function queue(){if(searching)return;searching=true;searchVariant=$('variantMode').value;$('variantQueue').disabled=true;$('variantCancel').disabled=false;$('variantMode').disabled=true;$('variantQueueState').innerHTML=`جارٍ البحث عن ${escapeHtml(variantLabel[searchVariant])} <span class="variant-searching"><i></i><i></i><i></i></span>`;const [base,inc]=$('variantTime').value.split(',').map(Number);const rated=$('variantRated').value==='1';const body={action:'queue',variant:searchVariant,baseSeconds:base,incrementSeconds:inc,rated};const acceptGame=async result=>{const g=result?.game;if(!g)return false;searching=false;clearInterval(queueTimer);$('variantCancel').disabled=true;await loadGame(g.game_id||g.id);return true};try{const result=await invoke(body,searchVariant);if(await acceptGame(result))return;queueTimer=setInterval(async()=>{if(!searching)return;try{const r=await invoke(body,searchVariant);await acceptGame(r)}catch(e){console.error(e)}},2500)}catch(e){console.error(e);searching=false;$('variantQueueState').textContent='تعذر بدء البحث.'}finally{$('variantQueue').disabled=searching;$('variantMode').disabled=searching||Boolean(current?.status==='active')}}
function updateModeInfo(refresh=true){$('variantModeInfo').textContent=ruleText[$('variantMode').value]||'';if(refresh&&!current){chess=previewEngine();legalMoves=[];pockets=null;selected=null;selectedPocketRole=null;legal=[];renderBoard();renderMeta()}else renderPockets()}
$('variantMode').addEventListener('change',()=>updateModeInfo(true));
$('variantQueue').addEventListener('click',queue);
$('variantCancel').addEventListener('click',async()=>{searching=false;clearInterval(queueTimer);try{await invoke({action:'cancel_queue'},searchVariant)}catch{}$('variantQueue').disabled=false;$('variantCancel').disabled=true;$('variantMode').disabled=Boolean(current?.status==='active');$('variantQueueState').textContent='تم إلغاء البحث.'});
$('variantResign').addEventListener('click',async()=>{if(!current||!confirm('هل تريد الاستسلام؟'))return;try{await invoke({action:'resign',gameId:current.game_id},current.variant);await loadGame(current.game_id)}catch(e){console.error(e)}});
$('variantDraw').addEventListener('click',async()=>{if(!current)return;try{if(current.draw_offered_by&&current.draw_offered_by!==player.id){const accept=confirm('الخصم يعرض التعادل. قبول؟');await invoke({action:'respond_draw',gameId:current.game_id,accept},current.variant)}else await invoke({action:'offer_draw',gameId:current.game_id},current.variant);await loadGame(current.game_id)}catch(e){console.error(e)}});

theme();updateModeInfo(true);const games=await listGames();const requested=new URLSearchParams(location.search).get('game');await loadGame(requested||(games.find(g=>g.status==='active')?.game_id||''));clockTimer=setInterval(renderMeta,250);poll=setInterval(()=>{if(current?.game_id)void loadGame(current.game_id);else void listGames()},5000);window.addEventListener('pagehide',()=>{clearInterval(clockTimer);clearInterval(poll);clearInterval(queueTimer)});
