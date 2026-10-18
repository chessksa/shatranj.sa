// Preload the same chess.js version used by the live-game server.
// The server remains authoritative; a preview is only a reversible visual hint.
let ChessClass = null;
let loading = null;
export function preloadChessEngine(){
  if (ChessClass) return Promise.resolve(ChessClass);
  if (!loading) {
    loading = import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm')
      .then(module => { ChessClass = module.Chess; return ChessClass; })
      .catch(() => { loading = null; return null; });
  }
  return loading;
}

export function previewMove({fen,from,to,promotion=null}){
  if (!ChessClass || !fen) return null;
  try {
    const chess = new ChessClass(fen);
    const move = chess.move({from,to,...(promotion ? {promotion} : {})});
    if (!move) return {legal:false};
    return {legal:true,fen:chess.fen(),turn:chess.turn(),san:move.san};
  } catch { return {legal:false}; }
}

export function legalDestinations(fen,from){
  if (!ChessClass || !fen || !from) return [];
  try {
    return new ChessClass(fen).moves({square:from,verbose:true}).map(move=>move.to);
  } catch { return []; }
}
