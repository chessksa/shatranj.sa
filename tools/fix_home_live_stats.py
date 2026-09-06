from pathlib import Path

index_path = Path('index.html')
watch_path = Path('watch.html')
index = index_path.read_text(encoding='utf-8')
watch = watch_path.read_text(encoding='utf-8')

old_tiles = '''        <div class="hero-stat">
          <div><small>المتواجدين</small><strong id="headerMatchesCount">0</strong></div>
        </div>
        <a class="hero-stat hero-stat-watch" href="watch.html">
          <div><small>المباريات الآن</small><strong id="headerOnlineCount">0</strong></div>
        </a>'''
new_tiles = '''        <div class="hero-stat">
          <div><small>المتواجدين</small><strong id="headerOnlineCount">0</strong></div>
        </div>
        <a class="hero-stat hero-stat-watch" href="watch.html">
          <div><small>المباريات الآن</small><strong id="headerMatchesCount">0</strong></div>
        </a>'''
if old_tiles not in index:
    raise SystemExit('expected inverted home stat tiles not found')
index = index.replace(old_tiles, new_tiles, 1)

old_counter = '''async function loadCurrentMatchesCount(){
  const el=document.querySelector('#headerMatchesCount');
  if(!el) return;

  const attempts=['matches','games'];
  const liveStatuses=['playing','active','in_progress','started'];

  for(const table of attempts){
    try{
      const {count,error}=await supabase
        .from(table)
        .select('*',{count:'exact',head:true})
        .in('status',liveStatuses);

      if(!error && typeof count==='number'){
        el.textContent=count;
        return;
      }
    }catch(e){}
  }

  el.textContent='0';
}'''
new_counter = '''async function loadCurrentMatchesCount(){
  const el=document.querySelector('#headerMatchesCount');
  if(!el) return;

  const liveStatuses=['playing','active','in_progress','started'];

  try{
    const {count,error}=await supabase
      .from('live_games')
      .select('*',{count:'exact',head:true})
      .in('status',liveStatuses);

    if(error) throw error;
    el.textContent=String(typeof count==='number'?count:0);
  }catch(error){
    console.warn('تعذر تحميل عدد المباريات الجارية',error);
    el.textContent='0';
  }
}'''
if old_counter not in index:
    raise SystemExit('expected legacy home match counter not found')
index = index.replace(old_counter, new_counter, 1)

old_watch = '''async function fetchGames(){
  for(const table of ['matches','games']){
    try{
      const {data,error}=await supabase.from(table).select('*').in('status',liveStatuses).limit(50);
      if(!error) return data||[];
    }catch(e){}
  }
  return [];
}'''
new_watch = '''async function fetchGames(){
  try{
    const {data,error}=await supabase
      .from('live_games')
      .select('*')
      .in('status',liveStatuses)
      .limit(50);
    if(error) throw error;
    return data||[];
  }catch(error){
    console.warn('تعذر تحميل المباريات الجارية',error);
    return [];
  }
}'''
if old_watch not in watch:
    raise SystemExit('expected legacy watch match loader not found')
watch = watch.replace(old_watch, new_watch, 1)

index_path.write_text(index, encoding='utf-8')
watch_path.write_text(watch, encoding='utf-8')
print('live stats source repair applied')
