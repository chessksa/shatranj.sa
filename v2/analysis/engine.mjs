export class StockfishAnalyzer {
  constructor(workerUrl='vendor/stockfish/stockfish-18-lite-single.js'){
    this.workerUrl=workerUrl;this.worker=null;this.ready=false;this.initPromise=null;this.active=null;this.lastInfo=null;
  }
  async init(){
    if(this.ready)return;if(this.initPromise)return this.initPromise;
    this.initPromise=new Promise((resolve,reject)=>{
      if(typeof Worker!=='function'){reject(new Error('Web Worker غير مدعوم'));return}
      const worker=this.worker=new Worker(this.workerUrl);
      const timer=setTimeout(()=>reject(new Error('تعذر تشغيل Stockfish')),12000);
      let uci=false;
      worker.onerror=e=>{clearTimeout(timer);reject(new Error(e.message||'Stockfish error'))};
      worker.onmessage=e=>{
        const lines=String(e.data??'').split(/\r?\n/);
        for(const raw of lines){const line=raw.trim();if(!line)continue;
          if(line==='uciok'){uci=true;worker.postMessage('isready');continue}
          if(line==='readyok'&&uci){clearTimeout(timer);this.ready=true;resolve();continue}
          this.#handleLine(line);
        }
      };
      worker.postMessage('uci');
    });
    return this.initPromise;
  }
  #handleLine(line){
    if(line.startsWith('info ')){
      const depth=Number(line.match(/\bdepth (\d+)/)?.[1]||0);
      const cpMatch=line.match(/\bscore cp (-?\d+)/);const mateMatch=line.match(/\bscore mate (-?\d+)/);const pv=line.match(/\bpv (.+)$/)?.[1]||'';
      this.lastInfo={depth,cp:cpMatch?Number(cpMatch[1]):null,mate:mateMatch?Number(mateMatch[1]):null,pv,line};
      return;
    }
    if(line.startsWith('bestmove ')&&this.active){
      const bestMove=line.split(/\s+/)[1]||null;const done=this.active;this.active=null;done.resolve({...this.lastInfo,bestMove});
    }
  }
  async analyzeFen(fen,depth=14){
    await this.init();
    if(this.active){this.worker.postMessage('stop');await this.active.promise.catch(()=>{});}
    this.lastInfo=null;
    let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
    const timeout=setTimeout(()=>{if(this.active?.promise===promise){this.active=null;reject(new Error('انتهت مهلة التحليل'))}},20000);
    this.active={promise,resolve:value=>{clearTimeout(timeout);resolve(value)},reject};
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${Math.max(6,Math.min(22,Number(depth)||14))}`);
    return promise;
  }
  stop(){if(this.worker&&this.active)this.worker.postMessage('stop')}
  destroy(){try{this.worker?.terminate()}catch{}this.worker=null;this.ready=false;this.initPromise=null;this.active=null}
}

export function scoreToCp(result){
  if(Number.isFinite(result?.cp))return result.cp;
  if(Number.isFinite(result?.mate))return Math.sign(result.mate||1)*(100000-Math.min(99,Math.abs(result.mate))*1000);
  return 0;
}
