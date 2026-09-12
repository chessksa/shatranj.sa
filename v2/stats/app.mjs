import { requirePlayer, rpc, escapeHtml, supabase } from '../platform/api.mjs';
const $=id=>document.getElementById(id);
const {player}=await requirePlayer();

export function winRate(wins,games){return games?Math.round((Number(wins||0)/Number(games))*100):0}
function bar(label,value,total){const pct=total?Math.round((Number(value||0)/Number(total))*100):0;return `<div class="bar-row"><span>${escapeHtml(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span><strong>${value} · ${pct}%</strong></div>`}
function timeLabel(seconds,increment){const min=seconds>=60?`${Math.round(seconds/60)} د`:`${seconds} ث`;return `${min}${increment?` +${increment}`:''}`}
function phaseRow(label,value){return `<div class="platform-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value??'—')}</strong></div>`}

async function phase3Stats(){
  const safe=async promise=>{try{return await promise}catch{return null}};
  const [activity,variantRows,battle,reviews]=await Promise.all([
    safe(rpc('v3_touch_activity')),
    safe(supabase.from('v3_variant_ratings').select('variant,rating,games_count').eq('player_id',player.id).then(({data,error})=>{if(error)throw error;return data||[]})),
    safe(supabase.from('v3_puzzle_battle_ratings').select('rating,games_count').eq('player_id',player.id).maybeSingle().then(({data,error})=>{if(error)throw error;return data})),
    safe(supabase.from('v3_game_reviews').select('id,accuracy_white,accuracy_black,critical_count,updated_at').eq('owner_player_id',player.id).order('updated_at',{ascending:false}).limit(20).then(({data,error})=>{if(error)throw error;return data||[]}))
  ]);
  const a=Array.isArray(activity)?activity[0]:activity;
  const variants=Object.fromEntries((Array.isArray(variantRows)?variantRows:[]).map(row=>[row.variant,row]));
  const reviewRows=Array.isArray(reviews)?reviews:[];
  const accuracyValues=reviewRows.flatMap(r=>[r.accuracy_white,r.accuracy_black]).map(Number).filter(Number.isFinite);
  const avgAccuracy=accuracyValues.length?Math.round(accuracyValues.reduce((x,y)=>x+y,0)/accuracyValues.length):null;
  return {activity:a||{},variants,battle:battle||{},reviewCount:reviewRows.length,avgAccuracy,critical:reviewRows.reduce((sum,r)=>sum+Number(r.critical_count||0),0)};
}

async function load(){
  try{
    await rpc('v3_refresh_achievements').catch(()=>{});
    const [summaryRows,times,history,achievements,p3]=await Promise.all([
      rpc('v2_stats_summary'),
      rpc('v2_stats_time_controls'),
      rpc('v2_stats_rating_history',{p_limit:120}),
      rpc('v2_list_achievements'),
      phase3Stats()
    ]);
    const s=Array.isArray(summaryRows)?summaryRows[0]:summaryRows;if(!s)throw new Error('stats unavailable');
    $('ratingStat').textContent=String(s.rating??1500);
    $('gamesStat').textContent=String(s.total_games||0);
    $('winRateStat').textContent=`${winRate(s.wins,s.total_games)}%`;
    $('puzzleRatingStat').textContent=String(s.puzzle_rating??1200);
    $('resultStats').innerHTML=bar('فوز',s.wins,s.total_games)+bar('تعادل',s.draws,s.total_games)+bar('خسارة',s.losses,s.total_games);
    $('colorStats').innerHTML=bar('فوز بالأبيض',s.white_wins,s.white_games)+bar('فوز بالأسود',s.black_wins,s.black_games)+`<div class="platform-row"><span>مباريات الأبيض</span><strong>${s.white_games}</strong></div><div class="platform-row"><span>مباريات الأسود</span><strong>${s.black_games}</strong></div>`;
    $('timeControlStats').innerHTML=(times||[]).map(t=>`<div class="platform-row"><div><strong>${timeLabel(t.base_seconds,t.increment_seconds)}</strong><div class="platform-muted" style="font-size:11px">${t.games} مباراة</div></div><div>${bar('فوز',t.wins,t.games)}</div></div>`).join('')||'<div class="platform-empty">لا توجد مباريات منتهية في V2 بعد.</div>';
    $('puzzleStats').innerHTML=
      phaseRow('محاولات الألغاز',s.puzzle_attempts)+
      phaseRow('ألغاز محلولة',s.puzzle_solves)+
      phaseRow('سلسلة الألغاز',s.puzzle_streak)+
      phaseRow('سلسلة اليومي',s.daily_puzzle_streak)+
      phaseRow('الدروس المكتملة',s.lessons_completed)+
      phaseRow('سلسلة النشاط',p3.activity.activity_streak||0)+
      phaseRow('أطول سلسلة',p3.activity.longest_activity_streak||0);
    renderHistory(history||[]);
    $('achievementList').innerHTML=(achievements||[]).map(a=>`<div class="achievement ${a.unlocked?'unlocked':''}"><span class="achievement-icon">${escapeHtml(a.icon)}</span><span><strong>${escapeHtml(a.title)}</strong><div class="platform-muted" style="font-size:11px">${escapeHtml(a.description)}</div></span><span class="platform-badge">${a.unlocked?'مفتوح':'مغلق'}</span></div>`).join('');

    const host=document.querySelector('.platform-grid');
    let phaseCard=$('phase3Stats');
    if(!phaseCard){
      phaseCard=document.createElement('article');phaseCard.id='phase3Stats';phaseCard.className='platform-card full';phaseCard.innerHTML='<h2>Phase 3</h2><div id="phase3StatsBody" class="platform-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"></div>';host?.insertBefore(phaseCard,$('statsStatus'));
    }
    const chess960=p3.variants.chess960||{};
    const threecheck=p3.variants.threecheck||{};
    const koth=p3.variants.kingofthehill||{};
    $('phase3StatsBody').innerHTML=
      `<div>${phaseRow('نقاط Chess960',chess960.rating??1500)}${phaseRow('مباريات Chess960',chess960.games_count??0)}</div>`+
      `<div>${phaseRow('نقاط Three-Check',threecheck.rating??1500)}${phaseRow('مباريات Three-Check',threecheck.games_count??0)}</div>`+
      `<div>${phaseRow('نقاط King of the Hill',koth.rating??1500)}${phaseRow('مباريات King of the Hill',koth.games_count??0)}</div>`+
      `<div>${phaseRow('نقاط Puzzle Battle',p3.battle.rating??1200)}${phaseRow('مباريات Battle',p3.battle.games_count??0)}</div>`+
      `<div>${phaseRow('مراجعات محفوظة',p3.reviewCount)}${phaseRow('متوسط الدقة',p3.avgAccuracy==null?'—':`${p3.avgAccuracy}%`)}</div>`+
      `<div>${phaseRow('لحظات حرجة راجعتها',p3.critical)}${phaseRow('إنجازات مفتوحة',s.achievements_unlocked||0)}</div>`;
    $('statsStatus').textContent=`${s.achievements_unlocked} إنجاز مفتوح · سلسلة النشاط ${p3.activity.activity_streak||0} يوم.`;
  }catch(e){
    console.error(e);$('statsStatus').className='platform-card full platform-error';$('statsStatus').textContent='تعذر تحميل الإحصائيات.';
  }
}
function renderHistory(rows){const host=$('ratingHistory');if(!rows.length){host.innerHTML='<div class="platform-empty">سيظهر تاريخ النقاط بعد المباريات المصنفة.</div>';$('ratingHistoryLabel').textContent='';return}const vals=rows.map(r=>Number(r.rating_after));const min=Math.min(...vals),max=Math.max(...vals),span=Math.max(1,max-min);host.innerHTML=rows.map(r=>{const h=20+((Number(r.rating_after)-min)/span)*150;return `<span class="history-bar" title="${r.rating_after} (${Number(r.delta)>=0?'+':''}${r.delta})" style="height:${h}px"></span>`}).join('');$('ratingHistoryLabel').textContent=`من ${vals[0]} إلى ${vals.at(-1)} · أعلى ${max} · أدنى ${min}`}
await load();
