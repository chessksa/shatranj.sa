'use strict';
/* MAD HUNTER X compact monitor: read-only view of the existing local API. */
const $ = id => document.getElementById(id);
let snapshot=null, controlToken='', loading=false, pendingAction=null, dismissedWarning='';
const fmt=(n,d=2)=>n==null||!Number.isFinite(Number(n))?'—':new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(n));
const signed=(n,d=3)=>n==null?'—':(n>0?'+':'')+fmt(n,d);
const kind=n=>n==null?'':n>0?'positive':n<0?'negative':'';
const escapeHTML=x=>String(x==null?'—':x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const clock=x=>{const d=new Date(x);return !x||!Number.isFinite(d.getTime())?'—':new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d)};
const age=(start,end)=>{if(!start)return '—';const mins=Math.round((new Date(end||Date.now())-new Date(start))/60000);return !Number.isFinite(mins)||mins<0?'—':mins<60?mins+' د':Math.floor(mins/60)+' س '+mins%60+' د'};
const priceFmt=n=>{if(n==null||!Number.isFinite(Number(n)))return '—';const v=Number(n);return fmt(v,v<0.01?8:v<1?6:4)};
const freshPrice=(pair,s)=>{if(!s.prices?.updated)return null;const t=new Date(s.prices.updated).getTime();if(!Number.isFinite(t)||Date.now()-t>90000||t-Date.now()>30000)return null;const n=Number(s.prices.rates?.[pair]);return n>0&&Number.isFinite(n)?n:null};
function mark(t,s){const market=freshPrice(t.pair,s);if(market===null||t.open_rate==null||t.amount==null)return null;const pnl=(market-t.open_rate)*t.amount;const cost=Number(t.stake_amount)>0?Number(t.stake_amount):t.open_rate*t.amount;return {market,pnl,pct:cost>0?100*pnl/cost:null}}
function setValue(id,value,col=''){const el=$(id);el.textContent=value;el.classList.remove('positive','negative');if(col)el.classList.add(col)}
function setState(id,label,status){const el=$(id);el.classList.remove('good','bad','muted');el.classList.add(status);el.querySelector('.status-label').textContent=label}
function warn(message){if(!message){$('noticeBar').hidden=true;return}if(dismissedWarning===message)return;$('noticeText').textContent=message;$('noticeBar').hidden=false}
function blank(col,msg){return '<tr><td colspan="'+col+'" class="empty-cell">'+escapeHTML(msg)+'</td></tr>'}
function openRow(t,s){const m=mark(t,s);const result=m?'<div class="value-stack '+kind(m.pnl)+'"><b>'+escapeHTML(signed(m.pnl))+' USDT</b><small class="'+kind(m.pnl)+'">'+escapeHTML(m.pct==null?'—':signed(m.pct,2)+'%')+'</small></div>':'<span class="faint">بانتظار السعر</span>';
 return '<tr><td title="'+escapeHTML(t.pair)+'"><b class="pair">'+escapeHTML(t.pair)+'</b></td><td class="num">'+priceFmt(t.open_rate)+'</td><td class="num">'+(m?priceFmt(m.market):'—')+'</td><td class="num">'+fmt(t.stake_amount)+'</td><td>'+result+'</td><td class="num">'+priceFmt(t.stoploss)+'</td><td>'+escapeHTML(age(t.open_date))+'</td></tr>'}
function closedRow(t){return '<tr><td><b class="pair">'+escapeHTML(t.pair)+'</b></td><td class="num">'+priceFmt(t.open_rate)+'</td><td class="num">'+priceFmt(t.close_rate)+'</td><td class="num '+kind(t.pnl)+'">'+(t.pnl==null?'—':escapeHTML(signed(t.pnl)))+'</td><td>'+escapeHTML(age(t.open_date,t.close_date))+'</td><td>'+escapeHTML(clock(t.close_date))+'</td></tr>'}
function eventRow(e){const icon={buy:'↗',sell:'↘',warning:'!',error:'×',info:'·'}[e.type]||'·';const type=['buy','sell','warning','error'].includes(e.type)?e.type:'info';return '<div class="event"><span class="event-icon '+type+'">'+icon+'</span><span class="event-text"><b>'+escapeHTML(e.title)+(e.pair?' · '+escapeHTML(e.pair):'')+'</b><small title="'+escapeHTML(e.details)+'">'+escapeHTML(e.details)+'</small></span><time>'+escapeHTML(clock(e.time))+'</time></div>'}
function render(s){
 const dbOK=s.trades?.db_status==='ok';const open=dbOK?(s.trades.open||[]):[];const closed=dbOK?(s.trades.closed||[]):[];const rt=s.runtime||{};const acc=s.account||{};const prices=s.prices||{};
 setState('engineStatus',rt.running?'البوت يعمل · PID '+rt.pid:'البوت متوقف',rt.running?'good':'bad');
 setState('apiStatus',acc.status==='ok'?'Binance متصل':'Binance غير متصل',acc.status==='ok'?'good':'bad');
 setState('dbStatus',dbOK?'قاعدة الصفقات: متاحة':'قاعدة الصفقات: غير متاحة',dbOK?'good':'bad');
 $('timeStatus').textContent='تحديث '+clock(s.generated_at);
 const ui=s.ui_update||{};$('uiVersion').textContent='الواجهة '+escapeHTML(ui.version||'محلية')+(ui.connected===false?' · دون اتصال بالتحديثات':'');$('uiVersion').title=ui.message||'';
 $('startBot').disabled=Boolean(rt.running||rt.session_exists);
 $('stopBot').disabled=!rt.running&&!rt.session_exists;

 const openMarks=open.map(t=>mark(t,s));const allMarked=openMarks.every(Boolean);const estimate=openMarks.reduce((a,m)=>a+(m?m.pnl:0),0);
 const estimateText=dbOK?(open.length?(allMarked?signed(estimate,3)+' USDT':'أسعار ناقصة'):'0.000 USDT'):'—';
 setValue('openPnl',estimateText,allMarked&&dbOK?kind(estimate):'');setValue('unrealizedPnl',estimateText,allMarked&&dbOK?kind(estimate):'');
 $('openCountChip').textContent=dbOK?open.length+' مفتوحة':'غير متاح';
 $('openTradesBody').innerHTML=dbOK?(open.length?open.map(t=>openRow(t,s)).join(''):blank(7,'لا توجد مراكز مفتوحة مسجلة')):blank(7,'قاعدة الصفقات غير متاحة — لا يمكن تأكيد المراكز');
 const latest=[...closed].sort((a,b)=>new Date(b.close_date||0)-new Date(a.close_date||0));
 $('closedBody').innerHTML=dbOK?(latest.length?latest.map(closedRow).join(''):blank(6,'لا توجد صفقات مغلقة بعد')):blank(6,'سجل الصفقات غير متاح');
 $('closedLabel').textContent=dbOK?'الأحدث أولًا · تمرير مستقل':'السجل غير متاح';
 const valid=closed.filter(t=>t.pnl!=null&&Number.isFinite(Number(t.pnl)));const sum=valid.reduce((a,t)=>a+Number(t.pnl),0);
 const now=new Date();const today=now.getFullYear()+'/'+now.getMonth()+'/'+now.getDate();const key=x=>{const d=new Date(x);return d.getFullYear()+'/'+d.getMonth()+'/'+d.getDate()};const doneToday=valid.filter(t=>t.close_date&&key(t.close_date)===today);const todayPnl=doneToday.reduce((a,t)=>a+Number(t.pnl),0);
 setValue('totalPnl',dbOK?signed(sum,3)+' USDT':'—',dbOK?kind(sum):'');setValue('todayPnl',dbOK?signed(todayPnl,3)+' USDT':'—',dbOK?kind(todayPnl):'');
 $('todayCount').textContent=dbOK?doneToday.length+' صفقات أُغلقت اليوم':'لا توجد بيانات';
 const balanceAvailable=acc.free_usdt!=null&&Number.isFinite(Number(acc.free_usdt));
 setValue('freeBalance',balanceAvailable?fmt(acc.free_usdt,4)+' USDT':'—');$('balanceSub').textContent=acc.status==='ok'?'رصيد متاح · تحديث '+clock(acc.updated):balanceAvailable?'آخر رصيد معروف · غير محدث':'تعذر جلب رصيد USDT';
 setValue('closedCount',dbOK?String(closed.length):'—');const wins=valid.filter(t=>t.pnl>0).length,losses=valid.filter(t=>t.pnl<0).length;
 setValue('winsCount',dbOK?String(wins):'—');setValue('lossesCount',dbOK?String(losses):'—');setValue('winRate',dbOK&&valid.length?fmt(100*wins/valid.length,1)+'%':dbOK?'—':'—');
 const events=(s.events||[]).slice(0,6);$('recentEvents').innerHTML=events.length?events.map(eventRow).join(''):'<div class="blank">لا توجد أحداث في سجل التشغيل</div>';
 let message='';if(rt.session_exists&&!rt.running)message='جلسة البوت موجودة لكن العملية الفعلية غير نشطة. تحقق من حالتها قبل إعادة التشغيل.';else if(!dbOK)message='تعذرت قراءة قاعدة الصفقات. لا تُفسّر غياب الصفقات على أنه عدم وجود مراكز في Binance.';else if(acc.status==='error')message='فشل تحديث رصيد Binance. قد يكون الرصيد المعروض قديمًا.';
 warn(message);
}
async function refresh(){if(loading)return;loading=true;$('refreshBtn').disabled=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6500);
 try{const response=await fetch('/api/state',{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('HTTP '+response.status);const s=await response.json();if(!s?.trades||!s?.runtime)throw Error('Invalid snapshot');snapshot=s;controlToken=s.control_token;render(s)}
 catch(e){$('timeStatus').textContent='انقطع الاتصال باللوحة';setState('engineStatus','الحالة غير مؤكدة','bad');$('startBot').disabled=true;$('stopBot').disabled=true;warn('تعذر تحديث البيانات من خادم اللوحة؛ الأرقام المعروضة آخر قراءة وليست مباشرة.')}
 finally{clearTimeout(timeout);loading=false;$('refreshBtn').disabled=false}}
function openDialog(action){if(!snapshot)return;pendingAction=action;const start=action==='start';$('modalTitle').textContent=start?'تشغيل البوت الحقيقي':'إيقاف البوت';
 $('modalDesc').textContent=start?'سيُستدعى ملف التشغيل الأصلي لـ V3 وقد ينفذ أوامر تداول حقيقية، بعد فحوصه الداخلية. لا يمكن ضمان خلو الحساب من مراكز وأوامر موجودة.':'سيُوقف برنامج التداول فقط. لن تُباع المراكز المفتوحة ولن تُلغى أوامر Binance تلقائيًا، وقد تبقى المراكز دون متابعة.';
 $('expectedPhrase').textContent=start?'START LIVE V3':'STOP V3';$('confirmPhrase').value='';$('modalResult').textContent='';$('modalSubmit').textContent=start?'تأكيد التشغيل':'تأكيد الإيقاف';$('modalSubmit').className='control-btn '+(start?'start':'stop');$('modalSubmit').disabled=false;$('confirmModal').hidden=false;$('confirmPhrase').focus();}
function closeDialog(){$('confirmModal').hidden=true;pendingAction=null}
async function submitControl(){const action=pendingAction;const required=action==='start'?'START LIVE V3':'STOP V3';if(!action)return;if($('confirmPhrase').value.trim()!==required){$('modalResult').textContent='عبارة التأكيد غير مطابقة';return}
 const b=$('modalSubmit');b.disabled=true;b.textContent='جارٍ إرسال الطلب...';try{const r=await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json','X-Mad-Token':controlToken},body:JSON.stringify({action,phrase:required})});const answer=await r.json();if(!r.ok){$('modalResult').textContent=answer.message||answer.error||'تعذر تنفيذ الطلب';return}closeDialog();dismissedWarning='';$('noticeText').textContent=answer.message||'أُرسل الطلب';$('noticeBar').hidden=false;await refresh()}catch(e){$('modalResult').textContent='تعذر الاتصال بخادم اللوحة'}finally{b.disabled=false;b.textContent=action==='start'?'تأكيد التشغيل':'تأكيد الإيقاف'}}
function toggleEvents(force){const panel=$('eventsPanel');const willShow=typeof force==='boolean'?force:panel.hidden;panel.hidden=!willShow;$('eventsToggle').setAttribute('aria-expanded',String(willShow));}
$('eventsToggle').addEventListener('click',()=>toggleEvents());
$('closeEvents').addEventListener('click',()=>toggleEvents(false));
document.addEventListener('click',e=>{if(!$('eventsPanel').hidden&&!$('eventsPanel').contains(e.target)&&!$('eventsToggle').contains(e.target))toggleEvents(false)});
$('refreshBtn').addEventListener('click',()=>window.location.reload());
$('dismissNotice').addEventListener('click',()=>{dismissedWarning=$('noticeText').textContent;$('noticeBar').hidden=true});
$('startBot').addEventListener('click',()=>openDialog('start'));$('stopBot').addEventListener('click',()=>openDialog('stop'));
$('modalClose').addEventListener('click',closeDialog);$('modalCancel').addEventListener('click',closeDialog);$('modalSubmit').addEventListener('click',submitControl);
$('confirmModal').addEventListener('click',e=>{if(e.target===$('confirmModal'))closeDialog()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDialog();toggleEvents(false)}});
refresh();setInterval(refresh,8000);
