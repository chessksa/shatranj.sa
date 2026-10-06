import { supabase, getSessionPlayer, rpc, escapeHtml } from '../platform/api.mjs';

const desktop=window.matchMedia('(min-width:901px)');
const PIECE_ROOT='assets/pieces/';
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const labels={basics:'الأساسيات',opening:'الافتتاح',middlegame:'وسط اللعب',endgame:'النهايات',tactics:'التكتيك'};
const levelLabels={beginner:'مبتدئ',intermediate:'متوسط',advanced:'متقدم'};

let active=false;
let host=null;
let preview=null;
let board=null;
let lessons=[];
let progress=new Map();
let currentLesson=null;
let category='all';
let player=null;

function ensureCss(){
  if(!document.getElementById('inlineLearnCss')){
    const link=document.createElement('link');
    link.id='inlineLearnCss';
    link.rel='stylesheet';
    link.href=new URL('./inline-learn.css?v=20261006-learn-board1',import.meta.url).href;
    document.head.appendChild(link);
  }
  if(!document.getElementById('inlineLearnBoardBaseCss')){
    const base=document.createElement('link');
    base.id='inlineLearnBoardBaseCss';
    base.rel='stylesheet';
    base.href=new URL('./inline-play.css?v=20260918-inline-play1',import.meta.url).href;
    document.head.appendChild(base);
  }
}

function parseFenPieces(fen){
  const [placement]=String(fen||START_FEN).split(/\s+/);
  const pieces=new Map();
  placement.split('/').forEach((row,rowIndex)=>{
    let file=0;
    for(const token of row){
      if(/\d/.test(token)){ file+=Number(token); continue; }
      const color=token===token.toUpperCase()?'w':'b';
      pieces.set(`${String.fromCharCode(97+file)}${8-rowIndex}`,{color,type:token.toLowerCase()});
      file+=1;
    }
  });
  return pieces;
}

function pieceAsset(color,type){
  return `${PIECE_ROOT}${color}${type}.png`;
}

function ensureMainBoard(){
  preview=document.getElementById('homeBoardPreview');
  if(!preview) return false;

  preview.removeAttribute('href');
  preview.classList.add('inline-play-active','inline-learn-active');
  preview.classList.remove('inline-computer-active','inline-puzzle-active');
  preview.replaceChildren();

  board=document.createElement('div');
  board.id='inlineLearnBoardGrid';
  board.className='desktop-board-grid inline-play-grid inline-learn-grid';
  board.setAttribute('role','grid');
  board.setAttribute('aria-label','رقعة التعلم الرئيسية');

  const pieces=parseFenPieces(START_FEN);
  const files=['a','b','c','d','e','f','g','h'];
  for(let rank=8;rank>=1;rank-=1){
    for(const file of files){
      const name=`${file}${rank}`;
      const fileIndex=files.indexOf(file);
      const square=document.createElement('button');
      square.type='button';
      const row=8-rank;
      square.className=`desktop-board-square inline-play-square inline-learn-square ${(row+fileIndex)%2?'dark':'light'}`;
      square.dataset.square=name;
      square.setAttribute('aria-label',name);

      const piece=pieces.get(name);
      if(piece){
        const img=document.createElement('img');
        img.className='inline-play-piece inline-learn-piece';
        img.src=pieceAsset(piece.color,piece.type);
        img.alt='';
        img.draggable=false;
        square.appendChild(img);
      }
      board.appendChild(square);
    }
  }

  board.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    const square=event.target.closest('.inline-learn-square');
    if(!square) return;
    board.querySelectorAll('.selected').forEach(node=>node.classList.remove('selected'));
    square.classList.add('selected');
  });

  preview.appendChild(board);
  return true;
}

function restoreStaticBoard(){
  const target=document.getElementById('homeBoardPreview');
  if(!target) return;
  target.classList.remove('inline-play-active','inline-learn-active','inline-puzzle-active','inline-computer-active');
  target.removeAttribute('href');
  target.replaceChildren();

  const grid=document.createElement('span');
  grid.className='desktop-board-grid';
  for(let i=0;i<64;i+=1){
    const row=Math.floor(i/8),col=i%8;
    const square=document.createElement('span');
    square.className=`desktop-board-square ${(row+col)%2?'dark':'light'}`;
    grid.appendChild(square);
  }
  const hint=document.createElement('span');
  hint.className='desktop-board-hint';
  hint.innerHTML='<span class="desktop-board-hint-icon">☝</span><span>اضغط على الرقعة للعب</span>';
  target.append(grid,hint);
}

function setStatus(text,error=false){
  const el=host?.querySelector('#inlineLearnStatus');
  if(!el) return;
  el.textContent=text;
  el.classList.toggle('error',error);
}

function lessonCard(lesson,index){
  const done=Boolean(progress.get(lesson.id)?.completed);
  return `<button class="inline-learn-lesson ${done?'completed':''}" type="button" data-inline-lesson="${escapeHtml(lesson.id)}">
    <span class="inline-learn-number">${done?'✓':index+1}</span>
    <span class="inline-learn-copy">
      <strong>${escapeHtml(lesson.title)}</strong>
      <small>${escapeHtml(lesson.summary||'')}</small>
    </span>
    <span class="inline-learn-badge">${escapeHtml(labels[lesson.category]||lesson.category||'')} · ${escapeHtml(levelLabels[lesson.level]||lesson.level||'')}</span>
  </button>`;
}

function updateProgress(){
  const el=host?.querySelector('#inlineLearnProgress');
  if(!el) return;
  const done=lessons.filter(lesson=>progress.get(lesson.id)?.completed).length;
  el.textContent=player
    ? `أكملت ${done} من ${lessons.length} دروس`
    : 'يمكنك قراءة الدروس، وسجّل الدخول لحفظ التقدم';
}

function renderLessonList(){
  if(!host) return;
  const list=host.querySelector('#inlineLearnList');
  if(!list) return;

  const ordered=[...lessons].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  const shown=category==='all'?ordered:ordered.filter(lesson=>lesson.category===category);
  list.innerHTML=shown.map(lessonCard).join('')||'<div class="inline-learn-empty">لا توجد دروس في هذا القسم.</div>';

  host.querySelectorAll('[data-inline-category]').forEach(button=>{
    button.classList.toggle('active',button.dataset.inlineCategory===category);
  });
  updateProgress();
}

function showLibrary(){
  currentLesson=null;
  host?.querySelector('#inlineLearnLibrary')?.removeAttribute('hidden');
  const viewer=host?.querySelector('#inlineLearnViewer');
  if(viewer) viewer.hidden=true;
}

function openLesson(id){
  currentLesson=lessons.find(lesson=>String(lesson.id)===String(id))||null;
  if(!currentLesson) return;

  const library=host?.querySelector('#inlineLearnLibrary');
  const viewer=host?.querySelector('#inlineLearnViewer');
  if(library) library.hidden=true;
  if(viewer) viewer.hidden=false;

  const meta=host?.querySelector('#inlineLearnLessonMeta');
  const title=host?.querySelector('#inlineLearnLessonTitle');
  const body=host?.querySelector('#inlineLearnLessonBody');
  const complete=host?.querySelector('#inlineLearnComplete');

  if(meta) meta.textContent=`${labels[currentLesson.category]||currentLesson.category||''} · ${levelLabels[currentLesson.level]||currentLesson.level||''}`;
  if(title) title.textContent=currentLesson.title||'الدرس';
  if(body) body.textContent=currentLesson.body_md||'';
  const done=Boolean(progress.get(currentLesson.id)?.completed);
  if(complete){
    complete.textContent=done?'مكتمل ✓':'إكمال الدرس';
    complete.disabled=done;
  }
  setStatus('استخدم الرقعة الأساسية أثناء قراءة الدرس.');
}

async function completeLesson(){
  if(!currentLesson) return;
  if(!player){
    setStatus('سجّل الدخول لحفظ تقدمك.',true);
    return;
  }
  const button=host?.querySelector('#inlineLearnComplete');
  if(button) button.disabled=true;
  try{
    await rpc('v2_complete_lesson',{p_lesson_id:currentLesson.id,p_score:100});
    progress.set(currentLesson.id,{completed:true,score:100});
    if(button) button.textContent='مكتمل ✓';
    renderLessonList();
    setStatus('تم حفظ إكمال الدرس.');
  }catch(error){
    console.error(error);
    if(button) button.disabled=false;
    setStatus('تعذر حفظ التقدم.',true);
  }
}

async function loadLessons(){
  setStatus('جارٍ تحميل الدروس…');
  try{
    const state=await getSessionPlayer();
    player=state.player;

    const {data,error}=await supabase
      .from('v2_lessons')
      .select('id,slug,title,category,level,summary,body_md,sort_order')
      .eq('is_published',true)
      .order('sort_order');

    if(error) throw error;
    lessons=data||[];

    progress=new Map();
    if(player){
      const {data:p,error:progressError}=await supabase
        .from('v2_lesson_progress')
        .select('lesson_id,completed,score');
      if(progressError) throw progressError;
      for(const row of p||[]) progress.set(row.lesson_id,row);
    }

    renderLessonList();
    setStatus('اختر درسًا، والرقعة الأساسية ستبقى أمامك للتعلم.');
  }catch(error){
    console.error(error);
    setStatus('تعذر تحميل الدروس.',true);
  }
}

function buildPanel(body){
  body.innerHTML=`
    <div class="inline-learn-panel">
      <header class="inline-learn-head">
        <div>
          <small>مسار التعلم</small>
          <h2>تعلّم الشطرنج</h2>
        </div>
        <span class="inline-learn-board-note">الرقعة الأساسية هي رقعة التعلم</span>
      </header>

      <div id="inlineLearnProgress" class="inline-learn-progress">جارٍ تحميل التقدم…</div>

      <section id="inlineLearnLibrary" class="inline-learn-library">
        <nav class="inline-learn-filters" aria-label="تصنيف الدروس">
          <button class="active" type="button" data-inline-category="all">الكل</button>
          <button type="button" data-inline-category="basics">الأساسيات</button>
          <button type="button" data-inline-category="opening">الافتتاح</button>
          <button type="button" data-inline-category="middlegame">وسط اللعب</button>
          <button type="button" data-inline-category="tactics">التكتيك</button>
          <button type="button" data-inline-category="endgame">النهايات</button>
        </nav>
        <div id="inlineLearnList" class="inline-learn-list"></div>
      </section>

      <section id="inlineLearnViewer" class="inline-learn-viewer" hidden>
        <div class="inline-learn-viewer-head">
          <button id="inlineLearnBack" type="button">العودة للدروس</button>
          <span id="inlineLearnLessonMeta" class="inline-learn-badge"></span>
        </div>
        <h3 id="inlineLearnLessonTitle"></h3>
        <div id="inlineLearnLessonBody" class="inline-learn-body"></div>
        <button id="inlineLearnComplete" class="inline-learn-complete" type="button">إكمال الدرس</button>
      </section>

      <div id="inlineLearnStatus" class="inline-learn-status"></div>
    </div>`;

  host=body.querySelector('.inline-learn-panel');

  host.querySelector('.inline-learn-filters')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-inline-category]');
    if(!button) return;
    category=button.dataset.inlineCategory;
    renderLessonList();
  });

  host.querySelector('#inlineLearnList')?.addEventListener('click',event=>{
    const lesson=event.target.closest('[data-inline-lesson]');
    if(!lesson) return;
    openLesson(lesson.dataset.inlineLesson);
  });

  host.querySelector('#inlineLearnBack')?.addEventListener('click',showLibrary);
  host.querySelector('#inlineLearnComplete')?.addEventListener('click',()=>void completeLesson());
}

export function mountInlineLearn(body){
  if(!desktop.matches||!body) return;
  if(active) stopInlineLearn({restoreBoard:false});
  ensureCss();
  window.dispatchEvent(new CustomEvent('desktop:inline-play-stop'));
  window.dispatchEvent(new CustomEvent('desktop:inline-computer-stop'));
  window.dispatchEvent(new CustomEvent('desktop:inline-puzzles-stop'));

  active=true;
  category='all';
  currentLesson=null;

  const home=document.getElementById('desktopDashboardHome');
  const view=document.getElementById('desktopDashboardView');
  if(home) home.hidden=true;
  if(view) view.hidden=false;

  buildPanel(body);
  if(!ensureMainBoard()){
    setStatus('تعذر تجهيز الرقعة الأساسية.',true);
    return;
  }

  void loadLessons();

  const url=new URL(location.href);
  url.hash='#learn';
  history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}

export function stopInlineLearn({restoreBoard=true}={}){
  if(!active) return;
  active=false;
  currentLesson=null;
  lessons=[];
  progress=new Map();
  player=null;

  if(preview) preview.classList.remove('inline-learn-active');
  if(restoreBoard) restoreStaticBoard();

  board=null;
  preview=null;
  host=null;
}

window.addEventListener('desktop:inline-learn-stop',()=>stopInlineLearn());
