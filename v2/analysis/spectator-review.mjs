/* Post-game, read-only spectator review. The report is an explicitly
   approximate Stockfish sample, never a fabricated full-game accuracy grade. */
const reviewed=new WeakMap();
const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const uci=move=>{
  if(typeof move==='string')return /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move)?move.toLowerCase():'';
  const direct=String(move?.uci||'');
  const candidate=direct||String(move?.from_square||move?.from||'')+String(move?.to_square||move?.to||'')+String(move?.promotion||'');
  return /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(candidate)?candidate.toLowerCase():'';
};
async function buildPositions(records){
  const {Chess}=await import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm');
  const chess=new Chess(START);
  const rows=[];
  for(const row of records){
    const code=uci(row);
    const options=code?{from:code.slice(0,2),to:code.slice(2,4),...(code[4]?{promotion:code[4]}:{})}:String(row?.san||row||'');
    const before=chess.fen();
    let move;
    try{move=chess.move(options);}catch{throw new Error('سجل النقلات غير مكتمل، لا يمكن إعطاء تحليل موثوق.')}
    if(!move)throw new Error('تعذر إعادة بناء إحدى النقلات.');
    rows.push({before,after:chess.fen(),san:move.san,color:move.color});
  }
  return rows;
}
function put(host,value){if(host)host.textContent=value;}
export function analyzeFinishedSpectator({host,gameId,moves,status}){
  if(!host||status!=='finished')return;
  const key=String(gameId||'')+':'+(Array.isArray(moves)?moves.length:0);
  if(reviewed.get(host)===key)return;
  reviewed.set(host,key);
  host.hidden=false;
  host.replaceChildren();
  const heading=document.createElement('strong');
  heading.textContent='تحليل المباراة · Stockfish';
  const progress=document.createElement('div');
  progress.className='spectator-review-progress';
  progress.textContent='تهيئة التحليل بعد انتهاء المباراة…';
  host.append(heading,progress);
  const records=Array.isArray(moves)?moves:[];
  if(!records.length){put(progress,'انتهت المباراة دون نقلات قابلة للتحليل.');return;}
  void (async()=>{
    let engine;
    try{
      const sequence=await buildPositions(records);
      if(reviewed.get(host)!==key)return;
      const {StockfishAnalyzer,scoreToCp}=await import('./engine.mjs');
      engine=new StockfishAnalyzer();
      // Sample up to 14 plies evenly across the match: avoid pretending all
      // plies were evaluated. Results are estimates at Stockfish depth 8.
      const n=Math.min(14,sequence.length);
      const indices=[...new Set(Array.from({length:n},(_,i)=>Math.round((i+.5)*sequence.length/n-.5)).map(i=>Math.max(0,Math.min(sequence.length-1,i))))];
      const highlights=[];let errors=0,blunders=0;
      for(let i=0;i<indices.length;i++){
        if(reviewed.get(host)!==key)return;
        const pos=sequence[indices[i]];
        put(progress,'تحليل عينة النقلات… '+(i+1)+' / '+indices.length);
        const before=scoreToCp(await engine.analyzeFen(pos.before,8));
        const after=-scoreToCp(await engine.analyzeFen(pos.after,8));
        const loss=Math.max(0,Math.round(before-after));
        if(loss>180)errors++;
        if(loss>350)blunders++;
        if(loss>180)highlights.push({ply:indices[i]+1,san:pos.san,loss});
      }
      if(reviewed.get(host)!==key)return;
      host.replaceChildren(heading);
      const summary=document.createElement('p');
      summary.textContent='عينة من '+indices.length+' نقلة نصفية من أصل '+sequence.length+
        ' · أخطاء: '+errors+' · أخطاء فادحة: '+blunders+'.';
      host.append(summary);
      const explanation=document.createElement('small');
      explanation.textContent='تقييم تقريبي بعمق 8. لم تُحلل جميع النقلات ولا يُعدّ نسبة دقة نهائية.';
      host.append(explanation);
      for(const item of highlights.sort((a,b)=>b.loss-a.loss).slice(0,4)){
        const div=document.createElement('div');
        div.className='spectator-review-highlight';
        div.textContent='النقلة '+Math.ceil(item.ply/2)+(item.ply%2?' للأبيض':' للأسود')+
          ' ('+item.san+'): '+(item.loss>350?'خطأ فادح':'خطأ');
        host.append(div);
      }
    }catch(error){
      if(reviewed.get(host)===key)put(progress,error?.message?.includes('تعذر')||error?.message?.includes('سجل')?
        error.message:'تعذر تشغيل التحليل على هذا الجهاز. تبقى النقلات متاحة للمراجعة.');
    }finally{engine?.destroy();}
  })();
}
