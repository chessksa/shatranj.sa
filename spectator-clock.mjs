const ACTIVE_STATUSES = new Set(['playing','active','in_progress','started']);

function defaultMonoNow(){
  return globalThis.performance?.now?.() ?? Date.now();
}

function turnFromFen(fen){
  const turn=String(fen||'').trim().split(/\s+/)[1];
  return turn==='b'?'b':'w';
}

export function createSpectatorClock({whiteField='white_time_ms',blackField='black_time_ms'}={}){
  let anchor=null;

  function read(monoNow=defaultMonoNow()){
    if(!anchor)return {white:0,black:0};
    let white=anchor.white;
    let black=anchor.black;
    if(anchor.active){
      const elapsed=Math.max(0,Number(monoNow)-anchor.monoAt);
      if(anchor.turn==='w')white=Math.max(0,white-elapsed);
      else black=Math.max(0,black-elapsed);
    }
    return {white,black};
  }

  function sync(snapshot,wallNow=Date.now(),monoNow=defaultMonoNow()){
    if(!snapshot){anchor=null;return read(monoNow);}

    const status=String(snapshot.status||'');
    const active=ACTIVE_STATUSES.has(status);
    const turn=turnFromFen(snapshot.fen);
    const turnStartedAt=snapshot.turn_started_at?String(snapshot.turn_started_at):'';
    let white=Math.max(0,Number(snapshot[whiteField]||0));
    let black=Math.max(0,Number(snapshot[blackField]||0));

    if(active&&turnStartedAt){
      const started=Date.parse(turnStartedAt);
      if(Number.isFinite(started)){
        const elapsed=Math.max(0,Number(wallNow)-started);
        if(turn==='w')white=Math.max(0,white-elapsed);
        else black=Math.max(0,black-elapsed);
      }
    }

    if(anchor&&active&&anchor.active&&anchor.turn===turn&&anchor.turnStartedAt===turnStartedAt){
      const previous=read(monoNow);
      white=Math.min(white,previous.white);
      black=Math.min(black,previous.black);
    }

    anchor={white,black,turn,active,turnStartedAt,monoAt:Number(monoNow)};
    return {white,black};
  }

  return {sync,read};
}
