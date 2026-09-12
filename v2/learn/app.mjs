import { supabase, getSessionPlayer, rpc, escapeHtml } from '../platform/api.mjs';
const $=id=>document.getElementById(id);
let lessons=[],progress=new Map(),active=null,category='all',player=null;
const labels={basics:'الأساسيات',opening:'الافتتاح',middlegame:'وسط اللعب',endgame:'النهايات',tactics:'التكتيك'};
const levelLabels={beginner:'مبتدئ',intermediate:'متوسط',advanced:'متقدم'};
function setStatus(text,error=false){$('learnStatus').className=`platform-card full ${error?'platform-error':'platform-muted'}`;$('learnStatus').textContent=text}
async function load(){
  try{
    const state=await getSessionPlayer();player=state.player;
    const {data,error}=await supabase.from('v2_lessons').select('id,slug,title,category,level,summary,body_md,sort_order').eq('is_published',true).order('sort_order');
    if(error)throw error;lessons=data||[];
    if(player){const {data:p}=await supabase.from('v2_lesson_progress').select('lesson_id,completed,score');for(const row of p||[])progress.set(row.lesson_id,row)}
    renderLessons();setStatus('');
  }catch(e){console.error(e);setStatus('تعذر تحميل الدروس.',true)}
}
function lessonCard(l,index){
  const done=progress.get(l.id)?.completed;
  return `<button class="lesson-card ${done?'completed':''}" type="button" data-lesson="${l.id}"><span class="lesson-number">${done?'✓':index+1}</span><span><span class="lesson-title">${escapeHtml(l.title)}</span><span class="lesson-summary">${escapeHtml(l.summary)}</span></span><span class="platform-badge">${labels[l.category]||l.category} · ${levelLabels[l.level]||l.level}</span></button>`;
}
export function renderLessons(){
  const ordered=[...lessons].sort((a,b)=>a.sort_order-b.sort_order);
  $('coursePath').innerHTML=ordered.map(lessonCard).join('')||'<div class="platform-empty">لا توجد دروس.</div>';
  const completed=ordered.filter(l=>progress.get(l.id)?.completed).length;
  $('courseProgress').textContent=player?`أكملت ${completed} من ${ordered.length} دروس.`:'يمكنك قراءة الدروس، وسجّل الدخول لحفظ التقدم.';
  const shown=category==='all'?ordered:ordered.filter(l=>l.category===category);
  $('lessonLibrary').innerHTML=shown.map(l=>`<button class="library-card" type="button" data-lesson="${l.id}"><span class="platform-badge">${labels[l.category]||l.category}</span><h3>${escapeHtml(l.title)}</h3><p class="platform-muted">${escapeHtml(l.summary)}</p></button>`).join('')||'<div class="platform-empty">لا توجد دروس في هذا القسم.</div>';
}
function openLesson(id){
  active=lessons.find(l=>l.id===id);if(!active)return;
  $('lessonLevel').textContent=`${labels[active.category]||active.category} · ${levelLabels[active.level]||active.level}`;
  $('lessonTitle').textContent=active.title;$('lessonBody').textContent=active.body_md;
  const done=Boolean(progress.get(active.id)?.completed);$('completeLesson').textContent=done?'مكتمل ✓':'إكمال الدرس';$('completeLesson').disabled=done;$('lessonViewer').hidden=false;
}
function close(){active=null;$('lessonViewer').hidden=true}
document.addEventListener('click',e=>{const lesson=e.target.closest('[data-lesson]');if(lesson)openLesson(lesson.dataset.lesson)});
$('closeLesson').addEventListener('click',close);$('lessonViewer').addEventListener('click',e=>{if(e.target===$('lessonViewer'))close()});
$('lessonFilters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('active',x===b));renderLessons()});
$('completeLesson').addEventListener('click',async()=>{
  if(!active)return;if(!player){setStatus('سجّل الدخول لحفظ تقدمك.',true);close();return}
  try{await rpc('v2_complete_lesson',{p_lesson_id:active.id,p_score:100});progress.set(active.id,{completed:true,score:100});renderLessons();$('completeLesson').textContent='مكتمل ✓';$('completeLesson').disabled=true;setStatus('تم حفظ إكمال الدرس.')}catch(e){console.error(e);setStatus('تعذر حفظ التقدم.',true)}
});
await load();
